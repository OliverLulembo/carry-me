import { TripStatus } from "@prisma/client";
import { db } from "./db";
import { stopOnRoute } from "./fare";

export class TripArrivalError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "TripArrivalError";
  }
}

/** Driver marks the bus as arrived at a stop — enables tap-on/off for passengers. */
export async function driverArriveAtStop(params: {
  driverId: string;
  tripId: string;
  stopId: string;
}) {
  const trip = await db.trip.findFirst({
    where: {
      id: params.tripId,
      driverId: params.driverId,
      status: TripStatus.ACTIVE,
    },
    include: {
      currentStop: { select: { id: true, name: true } },
      route: {
        include: {
          stops: { orderBy: { order: "asc" }, select: { stopId: true, order: true } },
        },
      },
    },
  });

  if (!trip) {
    throw new TripArrivalError("Trip not found or no longer active", "TRIP_NOT_ACTIVE", 404);
  }

  if (!(await stopOnRoute(trip.routeId, params.stopId))) {
    throw new TripArrivalError("This stop is not on the trip route", "STOP_NOT_ON_ROUTE");
  }

  const stop = await db.busStop.findUnique({
    where: { id: params.stopId },
    select: { id: true, name: true, lat: true, lng: true },
  });
  if (!stop) {
    throw new TripArrivalError("Stop not found", "STOP_NOT_FOUND", 404);
  }

  const now = new Date();
  const updated = await db.trip.update({
    where: { id: trip.id },
    data: {
      currentStopId: stop.id,
      currentStopAt: now,
      lastDepartedStopId: null,
      lastLat: stop.lat,
      lastLng: stop.lng,
      lastSeenAt: now,
    },
    include: {
      currentStop: { select: { id: true, name: true } },
    },
  });

  return {
    tripId: updated.id,
    stop: updated.currentStop!,
    arrivedAt: now.toISOString(),
  };
}

/** Driver leaves the current stop — closes boarding and shows the next stop. */
export async function driverDepartStop(params: {
  driverId: string;
  tripId: string;
}) {
  const trip = await db.trip.findFirst({
    where: {
      id: params.tripId,
      driverId: params.driverId,
      status: TripStatus.ACTIVE,
    },
    include: {
      route: {
        include: {
          stops: {
            orderBy: { order: "asc" },
            include: { stop: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new TripArrivalError("Trip not found or no longer active", "TRIP_NOT_ACTIVE", 404);
  }

  if (!trip.currentStopId) {
    throw new TripArrivalError("Not currently boarding at a stop", "NOT_AT_STOP", 409);
  }

  const routeStops = trip.route.stops;
  const atIdx = routeStops.findIndex((rs) => rs.stopId === trip.currentStopId);
  const nextStop = atIdx >= 0 ? routeStops[atIdx + 1]?.stop : null;

  const now = new Date();
  await db.trip.update({
    where: { id: trip.id },
    data: {
      currentStopId: null,
      currentStopAt: null,
      lastDepartedStopId: trip.currentStopId,
      lastSeenAt: now,
    },
  });

  return {
    tripId: trip.id,
    departedFrom: routeStops[atIdx]?.stop ?? null,
    nextStop: nextStop ?? null,
  };
}
