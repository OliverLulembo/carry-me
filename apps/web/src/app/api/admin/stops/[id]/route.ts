import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const UpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .refine((d) => d.name !== undefined || d.lat !== undefined || d.lng !== undefined, {
    message: "At least one field required",
  });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.busStop.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Stop not found" }, { status: 404 });

  const stop = await db.busStop.update({ where: { id }, data: parsed.data });
  return NextResponse.json({
    stop: {
      id: stop.id,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      createdAt: stop.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await db.busStop.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          routeStops: true,
          tapsOn: true,
          tapsOff: true,
          arrivals: true,
        },
      },
    },
  });
  if (!existing) return NextResponse.json({ error: "Stop not found" }, { status: 404 });

  const refs =
    existing._count.routeStops +
    existing._count.tapsOn +
    existing._count.tapsOff +
    existing._count.arrivals;
  if (refs > 0) {
    return NextResponse.json(
      {
        error:
          "Stop is in use on routes, trips, or passenger activity. Remove it from routes first.",
        usage: existing._count,
      },
      { status: 409 },
    );
  }

  await db.fareSegment.deleteMany({
    where: { OR: [{ startStopId: id }, { endStopId: id }] },
  });
  await db.busStop.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
