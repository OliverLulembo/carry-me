import type { TapStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type PassengerTripRow = {
  id: string;
  status: TapStatus;
  groupSize: number;
  reservedCredits: number;
  finalCredits: number | null;
  tappedOnAt: string;
  tappedOffAt: string | null;
  trip: {
    id: string;
    status: TripStatus;
    direction: string;
    startedAt: string;
    endedAt: string | null;
    busPlate: string;
    routeName: string;
  };
  onStop: { id: string; name: string };
  offStop: { id: string; name: string } | null;
};

export async function loadPassengerTrips(
  passengerId: string,
  limit = 50,
): Promise<PassengerTripRow[]> {
  const taps = await db.tap.findMany({
    where: { passengerId },
    orderBy: { tappedOnAt: "desc" },
    take: limit,
    include: {
      onStop: { select: { id: true, name: true } },
      offStop: { select: { id: true, name: true } },
      trip: {
        select: {
          id: true,
          status: true,
          direction: true,
          startedAt: true,
          endedAt: true,
          bus: { select: { plate: true } },
          route: { select: { name: true } },
        },
      },
    },
  });

  return taps.map((tap) => ({
    id: tap.id,
    status: tap.status,
    groupSize: tap.groupSize,
    reservedCredits: tap.reservedCredits,
    finalCredits: tap.finalCredits,
    tappedOnAt: tap.tappedOnAt.toISOString(),
    tappedOffAt: tap.tappedOffAt?.toISOString() ?? null,
    trip: {
      id: tap.trip.id,
      status: tap.trip.status,
      direction: tap.trip.direction,
      startedAt: tap.trip.startedAt.toISOString(),
      endedAt: tap.trip.endedAt?.toISOString() ?? null,
      busPlate: tap.trip.bus.plate,
      routeName: tap.trip.route.name,
    },
    onStop: tap.onStop,
    offStop: tap.offStop,
  }));
}
