import { TapStatus, TripStatus, WalletEntryKind } from "@prisma/client";
import { db } from "./db";
import { FareNotConfiguredError, lookupFareCredits, stopOnRoute } from "./fare";
import { computeNextRouteStop } from "./route-position";

export class TapError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "TapError";
  }
}

export async function getActivePassengerTap(passengerId: string) {
  // Orphaned HELD taps can remain when a driver ends a trip before passengers tap off.
  // Clear them so the dashboard does not show a stale "on board" state.
  await db.tap.updateMany({
    where: {
      passengerId,
      status: TapStatus.HELD,
      trip: { status: { not: TripStatus.ACTIVE } },
    },
    data: { status: TapStatus.CANCELLED },
  });

  return db.tap.findFirst({
    where: {
      passengerId,
      status: TapStatus.HELD,
      trip: { status: TripStatus.ACTIVE },
    },
    include: {
      onStop: { select: { id: true, name: true } },
      offStop: { select: { id: true, name: true } },
      trip: {
        select: {
          id: true,
          routeId: true,
          lastLat: true,
          lastLng: true,
          currentStopId: true,
          lastDepartedStopId: true,
          currentStop: { select: { id: true, name: true } },
          bus: { select: { plate: true } },
          route: {
            select: {
              id: true,
              name: true,
              stops: {
                orderBy: { order: "asc" },
                include: {
                  stop: { select: { id: true, name: true, lat: true, lng: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { tappedOnAt: "desc" },
  });
}

export async function tapOn(params: {
  passengerId: string;
  tripId: string;
  stopId: string;
  groupSize?: number;
}) {
  const groupSize = params.groupSize ?? 1;
  if (groupSize < 1 || groupSize > 10) {
    throw new TapError("Group size must be between 1 and 10", "INVALID_GROUP_SIZE");
  }

  const existing = await getActivePassengerTap(params.passengerId);
  if (existing) {
    throw new TapError(
      "You already have an active ride. Tap off before boarding again.",
      "ACTIVE_TAP_EXISTS",
      409,
    );
  }

  const trip = await db.trip.findFirst({
    where: { id: params.tripId, status: TripStatus.ACTIVE },
    include: {
      route: {
        include: {
          stops: {
            orderBy: { order: "asc" },
            include: { stop: { select: { id: true, name: true } } },
          },
        },
      },
      bus: { select: { plate: true, capacity: true } },
      taps: { where: { status: TapStatus.HELD }, select: { groupSize: true } },
    },
  });

  if (!trip) {
    throw new TapError("Trip not found or no longer active", "TRIP_NOT_ACTIVE", 404);
  }

  if (trip.currentStopId !== params.stopId) {
    throw new TapError(
      "The bus has not arrived at this stop yet. Wait for the driver to mark arrival.",
      "BUS_NOT_AT_STOP",
      409,
    );
  }

  if (!(await stopOnRoute(trip.routeId, params.stopId))) {
    throw new TapError("This stop is not on the bus route", "STOP_NOT_ON_ROUTE");
  }

  const onboard = trip.taps.reduce((sum, t) => sum + t.groupSize, 0);
  if (onboard + groupSize > trip.bus.capacity) {
    throw new TapError("Not enough seats on this bus", "BUS_FULL", 409);
  }

  const tap = await db.tap.create({
    data: {
      tripId: trip.id,
      passengerId: params.passengerId,
      onStopId: params.stopId,
      groupSize,
      reservedCredits: 0,
      status: TapStatus.HELD,
    },
    include: {
      onStop: { select: { id: true, name: true } },
      trip: {
        include: {
          bus: { select: { plate: true } },
          route: { select: { id: true, name: true } },
        },
      },
    },
  });

  return { tap, trip };
}

export async function tapOff(params: {
  passengerId: string;
  tapId?: string;
  stopId: string;
}) {
  const tap = params.tapId
    ? await db.tap.findFirst({
        where: {
          id: params.tapId,
          passengerId: params.passengerId,
          status: TapStatus.HELD,
        },
        include: {
          onStop: { select: { id: true, name: true } },
          trip: {
            select: {
              id: true,
              routeId: true,
              status: true,
              currentStopId: true,
              bus: { select: { ownerId: true } },
            },
          },
        },
      })
    : await db.tap.findFirst({
        where: {
          passengerId: params.passengerId,
          status: TapStatus.HELD,
        },
        include: {
          onStop: { select: { id: true, name: true } },
          trip: {
            select: {
              id: true,
              routeId: true,
              status: true,
              currentStopId: true,
              bus: { select: { ownerId: true } },
            },
          },
        },
        orderBy: { tappedOnAt: "desc" },
      });

  if (!tap) {
    throw new TapError("No active ride to end", "NO_ACTIVE_TAP", 404);
  }

  if (tap.trip.status !== TripStatus.ACTIVE) {
    throw new TapError("Trip is no longer active", "TRIP_NOT_ACTIVE", 409);
  }

  if (tap.trip.currentStopId !== params.stopId) {
    throw new TapError(
      "The bus has not arrived at this stop yet. Wait for the driver to mark arrival.",
      "BUS_NOT_AT_STOP",
      409,
    );
  }

  if (params.stopId === tap.onStopId) {
    throw new TapError("Disembark stop must differ from where you boarded", "SAME_STOP");
  }

  if (!(await stopOnRoute(tap.trip.routeId, params.stopId))) {
    throw new TapError("This stop is not on the bus route", "STOP_NOT_ON_ROUTE");
  }

  let creditsPerPassenger: number;
  try {
    creditsPerPassenger = await lookupFareCredits(
      tap.trip.routeId,
      tap.onStopId,
      params.stopId,
    );
  } catch (e) {
    if (e instanceof FareNotConfiguredError) {
      throw new TapError(
        "Fare not configured for this stretch. Contact support.",
        "FARE_NOT_CONFIGURED",
        422,
      );
    }
    throw e;
  }

  const finalCredits = creditsPerPassenger * tap.groupSize;

  const wallet = await db.wallet.findUnique({ where: { userId: params.passengerId } });
  if (!wallet) {
    throw new TapError("Wallet not found", "NO_WALLET", 404);
  }

  if (wallet.balance < finalCredits) {
    throw new TapError(
      `Insufficient balance. This trip costs ${finalCredits} credits; you have ${wallet.balance}.`,
      "INSUFFICIENT_BALANCE",
      402,
    );
  }

  const offStop = await db.busStop.findUnique({
    where: { id: params.stopId },
    select: { id: true, name: true },
  });
  if (!offStop) {
    throw new TapError("Stop not found", "STOP_NOT_FOUND", 404);
  }

  const ownerId = tap.trip.bus.ownerId;

  const { updated, tripEnded } = await db.$transaction(async (tx) => {
    const newBalance = wallet.balance - finalCredits;
    await tx.walletEntry.create({
      data: {
        walletId: wallet.id,
        amount: -finalCredits,
        kind: WalletEntryKind.TRIP_DEBIT,
        balanceAfter: newBalance,
        reference: tap.id,
        note: `Trip ${tap.onStop.name} → ${offStop.name}`,
      },
    });
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const ownerWallet = await tx.wallet.findUnique({ where: { userId: ownerId } });
    if (ownerWallet) {
      const ownerBalance = ownerWallet.balance + finalCredits;
      await tx.walletEntry.create({
        data: {
          walletId: ownerWallet.id,
          amount: finalCredits,
          kind: WalletEntryKind.TRIP_EARNINGS,
          balanceAfter: ownerBalance,
          reference: tap.id,
          note: `Fare ${tap.onStop.name} → ${offStop.name}`,
        },
      });
      await tx.wallet.update({
        where: { id: ownerWallet.id },
        data: { balance: ownerBalance },
      });
    }

    const settledTap = await tx.tap.update({
      where: { id: tap.id },
      data: {
        offStopId: params.stopId,
        finalCredits,
        status: TapStatus.SETTLED,
        tappedOffAt: new Date(),
        syncedAt: new Date(),
      },
      include: {
        onStop: { select: { id: true, name: true } },
        offStop: { select: { id: true, name: true } },
        trip: {
          include: {
            bus: { select: { plate: true } },
            route: { select: { id: true, name: true } },
          },
        },
      },
    });

    const remainingHeld = await tx.tap.count({
      where: { tripId: tap.trip.id, status: TapStatus.HELD },
    });

    let ended = false;
    if (remainingHeld === 0) {
      await tx.trip.update({
        where: { id: tap.trip.id },
        data: { status: TripStatus.COMPLETED, endedAt: new Date() },
      });
      ended = true;
    }

    return { updated: settledTap, tripEnded: ended };
  });

  return {
    tap: updated,
    fare: {
      creditsPerPassenger,
      groupSize: tap.groupSize,
      totalCredits: finalCredits,
    },
    balance: wallet.balance - finalCredits,
    tripEnded,
  };
}

/** Shape returned to clients for an in-progress ride. */
export function serializeActiveTap(
  tap: NonNullable<Awaited<ReturnType<typeof getActivePassengerTap>>>,
) {
  const routeStops = tap.trip.route.stops.map((rs) => ({
    id: rs.stop.id,
    name: rs.stop.name,
    lat: rs.stop.lat,
    lng: rs.stop.lng,
    order: rs.order,
  }));

  const busPosition =
    tap.trip.lastLat != null && tap.trip.lastLng != null
      ? { lat: tap.trip.lastLat, lng: tap.trip.lastLng }
      : null;

  const nextStop = computeNextRouteStop(routeStops, busPosition, {
    currentStopId: tap.trip.currentStopId,
    lastDepartedStopId: tap.trip.lastDepartedStopId,
  });

  return {
    id: tap.id,
    tripId: tap.tripId,
    status: tap.status,
    groupSize: tap.groupSize,
    tappedOnAt: tap.tappedOnAt.toISOString(),
    onStop: tap.onStop,
    offStop: tap.offStop,
    busPlate: tap.trip.bus.plate,
    currentStop: tap.trip.currentStop,
    nextStop: nextStop ? { id: nextStop.id, name: nextStop.name } : null,
    route: {
      id: tap.trip.route.id,
      name: tap.trip.route.name,
      stops: routeStops.map(({ id, name, order }) => ({ id, name, order })),
    },
  };
}
