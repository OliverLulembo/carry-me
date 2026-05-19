import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const stops = await db.busStop.findMany({
    orderBy: { name: "asc" },
    include: {
      routeStops: { include: { route: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({
    stops: stops.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      createdAt: s.createdAt.toISOString(),
      routes: s.routeStops.map((rs) => ({ id: rs.route.id, name: rs.route.name, order: rs.order })),
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

  const stop = await db.busStop.create({ data: parsed.data });
  return NextResponse.json({
    stop: {
      id: stop.id,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      createdAt: stop.createdAt.toISOString(),
      routes: [],
    },
  });
}
