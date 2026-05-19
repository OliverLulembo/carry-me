import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { fetchOsrmRoute } from "@/lib/osrm";
import { getRouteWaypointsBetween } from "@/lib/route-path";

// Server-side proxy over OSRM. Two modes:
//   1. fromStopId + toStopId — resolves the CarryMe route's ordered stops
//      between the two endpoints, then asks OSRM to trace the road network
//      through every intermediate stop (the actual minibus path).
//   2. fromLat/fromLng + toLat/toLng — direct A→B driving fallback when stop
//      IDs aren't known (should be rare once the map is wired with stop IDs).

const StopPairSchema = z.object({
  fromStopId: z.string().min(1),
  toStopId: z.string().min(1),
  profile: z.enum(["driving", "walking", "cycling"]).default("driving"),
});

const CoordPairSchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180),
  profile: z.enum(["driving", "walking", "cycling"]).default("driving"),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);

  const stopPair = StopPairSchema.safeParse(params);
  if (stopPair.success) {
    return handleStopPair(stopPair.data);
  }

  const coordPair = CoordPairSchema.safeParse(params);
  if (coordPair.success) {
    return handleCoordPair(coordPair.data);
  }

  return NextResponse.json(
    {
      error: "Invalid query",
      hint: "Provide fromStopId+toStopId or fromLat+fromLng+toLat+toLng",
    },
    { status: 400 },
  );
}

async function handleStopPair({
  fromStopId,
  toStopId,
  profile,
}: z.infer<typeof StopPairSchema>) {
  const path = await getRouteWaypointsBetween(fromStopId, toStopId);
  if (!path || path.waypoints.length < 2) {
    return NextResponse.json({
      route: null,
      source: "osrm",
      reason: "no_route_between_stops",
    });
  }

  try {
    const osrm = await fetchOsrmRoute(path.waypoints, profile);
    if (!osrm) {
      return NextResponse.json({ route: null, source: "osrm" });
    }

    return NextResponse.json({
      route: {
        geometry: osrm.geometry,
        distanceMeters: osrm.distanceMeters,
        durationSeconds: osrm.durationSeconds,
        routeId: path.routeId,
        routeName: path.routeName,
        stopIds: path.waypoints.map((w) => w.stopId),
        viaStops: path.waypoints.map((w) => ({ id: w.stopId, name: w.name })),
      },
      source: "osrm",
    });
  } catch (err) {
    return NextResponse.json(
      { route: null, source: "osrm", error: (err as Error).message },
      { status: 200 },
    );
  }
}

async function handleCoordPair({
  fromLat,
  fromLng,
  toLat,
  toLng,
  profile,
}: z.infer<typeof CoordPairSchema>) {
  try {
    const osrm = await fetchOsrmRoute(
      [
        { lat: fromLat, lng: fromLng },
        { lat: toLat, lng: toLng },
      ],
      profile,
    );
    if (!osrm) {
      return NextResponse.json({ route: null, source: "osrm" });
    }

    return NextResponse.json({
      route: {
        geometry: osrm.geometry,
        distanceMeters: osrm.distanceMeters,
        durationSeconds: osrm.durationSeconds,
      },
      source: "osrm",
    });
  } catch (err) {
    return NextResponse.json(
      { route: null, source: "osrm", error: (err as Error).message },
      { status: 200 },
    );
  }
}
