import { NextResponse, type NextRequest } from "next/server";
import { TripStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/owner";

const UpdateSchema = z
  .object({
    plate: z
      .string()
      .min(3)
      .max(12)
      .transform((s) => s.trim().toUpperCase())
      .optional(),
    capacity: z.number().int().min(8).max(80).optional(),
    defaultRouteId: z.string().cuid().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.plate !== undefined ||
      d.capacity !== undefined ||
      d.defaultRouteId !== undefined ||
      d.active !== undefined,
    { message: "At least one field required" },
  );

async function getOwnedBus(ownerId: string, busId: string) {
  return db.bus.findFirst({
    where: { id: busId, ownerId },
    include: {
      defaultRoute: { select: { id: true, name: true } },
      _count: { select: { trips: true } },
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getOwnedBus(auth.session.sub, id);
  if (!existing) return NextResponse.json({ error: "Bus not found" }, { status: 404 });

  if (parsed.data.defaultRouteId) {
    const route = await db.route.findFirst({
      where: { id: parsed.data.defaultRouteId, active: true },
    });
    if (!route) {
      return NextResponse.json({ error: "Route not found or inactive" }, { status: 400 });
    }
  }

  if (parsed.data.plate && parsed.data.plate !== existing.plate) {
    const clash = await db.bus.findUnique({ where: { plate: parsed.data.plate } });
    if (clash) {
      return NextResponse.json({ error: "Plate already registered" }, { status: 409 });
    }
  }

  const bus = await db.bus.update({
    where: { id },
    data: parsed.data,
    include: {
      defaultRoute: { select: { id: true, name: true } },
      _count: { select: { trips: true } },
    },
  });

  return NextResponse.json({
    bus: {
      id: bus.id,
      plate: bus.plate,
      capacity: bus.capacity,
      active: bus.active,
      defaultRouteId: bus.defaultRouteId,
      defaultRouteName: bus.defaultRoute?.name ?? null,
      createdAt: bus.createdAt.toISOString(),
      tripCount: bus._count.trips,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await getOwnedBus(auth.session.sub, id);
  if (!existing) return NextResponse.json({ error: "Bus not found" }, { status: 404 });

  const activeTrip = await db.trip.findFirst({
    where: { busId: id, status: TripStatus.ACTIVE },
  });
  if (activeTrip) {
    return NextResponse.json(
      { error: "Cannot delete a bus with an active trip. End the trip first." },
      { status: 409 },
    );
  }

  if (existing._count.trips > 0) {
    await db.bus.update({ where: { id }, data: { active: false } });
    return NextResponse.json({
      ok: true,
      deactivated: true,
      message: "Bus has trip history and was marked inactive instead of deleted.",
    });
  }

  await db.device.updateMany({ where: { busId: id }, data: { busId: null } });
  await db.bus.delete({ where: { id } });
  return NextResponse.json({ ok: true, deactivated: false });
}
