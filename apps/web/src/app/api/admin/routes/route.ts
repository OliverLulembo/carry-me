import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { rebuildFareMatrix } from "@/lib/fare-matrix";

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  stopIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const routes = await db.route.findMany({
    orderBy: { name: "asc" },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: { stop: { select: { id: true, name: true, lat: true, lng: true } } },
      },
      _count: { select: { fares: true, buses: true, trips: true } },
    },
  });

  return NextResponse.json({
    routes: routes.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      active: r.active,
      stops: r.stops.map((rs) => ({
        order: rs.order,
        ...rs.stop,
      })),
      fareSegmentCount: r._count.fares,
      busCount: r._count.buses,
      tripCount: r._count.trips,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, description, stopIds = [] } = parsed.data;

  const route = await db.$transaction(async (tx) => {
    const created = await tx.route.create({
      data: { name, description, active: true },
    });
    for (let i = 0; i < stopIds.length; i++) {
      await tx.routeStop.create({
        data: { routeId: created.id, stopId: stopIds[i], order: i },
      });
    }
    return created;
  });

  if (stopIds.length > 1) {
    await rebuildFareMatrix(route.id, stopIds);
  }

  return NextResponse.json({ route: { id: route.id, name: route.name } });
}
