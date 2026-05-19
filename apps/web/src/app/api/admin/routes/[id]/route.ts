import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { rebuildFareMatrix } from "@/lib/fare-matrix";

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

const StopsSchema = z.object({
  stopIds: z.array(z.string()).min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const route = await db.route.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ route });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = StopsSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.route.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Route not found" }, { status: 404 });

  const { stopIds } = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.routeStop.deleteMany({ where: { routeId: id } });
    for (let i = 0; i < stopIds.length; i++) {
      await tx.routeStop.create({
        data: { routeId: id, stopId: stopIds[i], order: i },
      });
    }
  });

  if (stopIds.length > 1) {
    await rebuildFareMatrix(id, stopIds);
  } else {
    await db.fareSegment.deleteMany({ where: { routeId: id } });
  }

  const stops = await db.routeStop.findMany({
    where: { routeId: id },
    orderBy: { order: "asc" },
    include: { stop: { select: { id: true, name: true, lat: true, lng: true } } },
  });

  return NextResponse.json({
    stops: stops.map((rs) => ({ order: rs.order, ...rs.stop })),
  });
}
