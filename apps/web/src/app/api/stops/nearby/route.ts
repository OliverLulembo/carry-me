import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { distanceMeters, walkingMinutes } from "@/lib/format";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  limit: z.coerce.number().int().min(1).max(20).default(3),
});

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { lat, lng, limit } = parsed.data;

  // For the v1 SQLite build we just compute distances in memory. With Postgres+PostGIS
  // this would become an ST_Distance query with a spatial index — see PRD §7.1.
  const stops = await db.busStop.findMany();
  const scored = stops
    .map((s) => {
      const d = distanceMeters({ lat, lng }, { lat: s.lat, lng: s.lng });
      return {
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        distanceMeters: Math.round(d),
        walkingMinutes: walkingMinutes(d),
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);

  return NextResponse.json({ stops: scored });
}
