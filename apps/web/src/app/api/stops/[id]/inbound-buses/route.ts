import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { TripStatus } from "@prisma/client";
import { distanceMeters, walkingMinutes } from "@/lib/format";

// List active trips whose route includes this stop, with crude ETA + seat availability.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: stopId } = await context.params;
  const stop = await db.busStop.findUnique({ where: { id: stopId } });
  if (!stop) return NextResponse.json({ error: "Stop not found" }, { status: 404 });

  // Trips whose route serves this stop and are still active.
  const trips = await db.trip.findMany({
    where: {
      status: TripStatus.ACTIVE,
      route: { stops: { some: { stopId } } },
    },
    include: {
      bus: { select: { plate: true, capacity: true } },
      route: {
        select: {
          id: true,
          name: true,
          stops: {
            include: { stop: { select: { id: true, name: true, lat: true, lng: true } } },
            orderBy: { order: "asc" },
          },
        },
      },
      taps: {
        where: { status: "HELD" },
        select: { groupSize: true },
      },
    },
  });

  const result = trips.map((trip) => {
    const onboard = trip.taps.reduce((sum, t) => sum + t.groupSize, 0);
    const stopOnRoute = trip.route.stops.find((rs) => rs.stopId === stopId);

    // Crude ETA: straight-line distance / 25 km/h average urban bus speed.
    let etaMinutes: number | null = null;
    if (trip.lastLat != null && trip.lastLng != null && stopOnRoute) {
      const meters = distanceMeters(
        { lat: trip.lastLat, lng: trip.lastLng },
        { lat: stopOnRoute.stop.lat, lng: stopOnRoute.stop.lng },
      );
      etaMinutes = Math.max(1, Math.round((meters / 1000 / 25) * 60));
    }

    return {
      tripId: trip.id,
      busPlate: trip.bus.plate,
      route: { id: trip.route.id, name: trip.route.name },
      seatsAvailable: Math.max(0, trip.bus.capacity - onboard),
      capacity: trip.bus.capacity,
      etaMinutes,
      arrivedAtStop: trip.currentStopId === stopId,
      lastSeenAt: trip.lastSeenAt,
      lastSeenAgoMinutes:
        trip.lastSeenAt != null
          ? Math.max(0, Math.round((Date.now() - trip.lastSeenAt.getTime()) / 60_000))
          : null,
      walkingMinutesFromHere:
        stopOnRoute != null
          ? walkingMinutes(
              distanceMeters(
                { lat: stop.lat, lng: stop.lng },
                { lat: stopOnRoute.stop.lat, lng: stopOnRoute.stop.lng },
              ),
            )
          : null,
    };
  });

  return NextResponse.json({ buses: result });
}
