import { TapStatus, TripStatus } from "@prisma/client";
import { db } from "./db";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getOwnerIncomeStats(ownerId: string) {
  const buses = await db.bus.findMany({
    where: { ownerId },
    select: { id: true, plate: true, active: true },
  });
  const busIds = buses.map((b) => b.id);
  if (busIds.length === 0) {
    return {
      todayCredits: 0,
      weekCredits: 0,
      monthCredits: 0,
      todayTrips: 0,
      weekTrips: 0,
      activeBuses: 0,
      totalBuses: 0,
      byBus: [] as Array<{
        busId: string;
        plate: string;
        active: boolean;
        todayCredits: number;
        weekCredits: number;
      }>,
    };
  }

  const todayStart = startOfDay();
  const weekStart = daysAgo(7);
  const monthStart = daysAgo(30);

  const settledWhere = {
    status: TapStatus.SETTLED,
    trip: { busId: { in: busIds } },
  };

  const [todayAgg, weekAgg, monthAgg, todayTrips, weekTrips, activeTripCount] =
    await Promise.all([
      db.tap.aggregate({
        where: { ...settledWhere, tappedOffAt: { gte: todayStart } },
        _sum: { finalCredits: true },
      }),
      db.tap.aggregate({
        where: { ...settledWhere, tappedOffAt: { gte: weekStart } },
        _sum: { finalCredits: true },
      }),
      db.tap.aggregate({
        where: { ...settledWhere, tappedOffAt: { gte: monthStart } },
        _sum: { finalCredits: true },
      }),
      db.tap.count({
        where: { ...settledWhere, tappedOffAt: { gte: todayStart } },
      }),
      db.trip.count({
        where: { busId: { in: busIds }, startedAt: { gte: weekStart } },
      }),
      db.trip.count({
        where: { busId: { in: busIds }, status: TripStatus.ACTIVE },
      }),
    ]);

  const byBus = await Promise.all(
    buses.map(async (bus) => {
      const [today, week] = await Promise.all([
        db.tap.aggregate({
          where: {
            ...settledWhere,
            trip: { busId: bus.id },
            tappedOffAt: { gte: todayStart },
          },
          _sum: { finalCredits: true },
        }),
        db.tap.aggregate({
          where: {
            ...settledWhere,
            trip: { busId: bus.id },
            tappedOffAt: { gte: weekStart },
          },
          _sum: { finalCredits: true },
        }),
      ]);
      return {
        busId: bus.id,
        plate: bus.plate,
        active: bus.active,
        todayCredits: today._sum.finalCredits ?? 0,
        weekCredits: week._sum.finalCredits ?? 0,
      };
    }),
  );

  return {
    todayCredits: todayAgg._sum.finalCredits ?? 0,
    weekCredits: weekAgg._sum.finalCredits ?? 0,
    monthCredits: monthAgg._sum.finalCredits ?? 0,
    todayTrips,
    weekTrips,
    activeBuses: activeTripCount,
    totalBuses: buses.length,
    byBus,
  };
}
