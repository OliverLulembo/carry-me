import { redirect } from "next/navigation";
import { TripStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { distanceMeters } from "@/lib/format";
import { DriverDashboardHeader } from "./components/DriverDashboardHeader";
import { ActiveTripHero } from "./components/ActiveTripHero";
import { TripStatsCard } from "./components/TripStatsCard";
import { DriverQuickActions } from "./components/DriverQuickActions";
import { UpcomingStops, type UpcomingStop } from "./components/UpcomingStops";
import { PassengerManifest } from "./components/PassengerManifest";

export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/api/auth/dev-login?phone=%2B260977000002");
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, fullName: true, phone: true, role: true },
  });
  if (!user) redirect("/api/auth/dev-login?phone=%2B260977000002");
  if (user.role === "PASSENGER") redirect("/dashboard");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role !== "DRIVER") redirect("/api/auth/dev-login?phone=%2B260977000002");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const activeTrip = await db.trip.findFirst({
    where: { driverId: user.id, status: TripStatus.ACTIVE },
    include: {
      bus: { select: { plate: true, capacity: true, defaultRouteId: true } },
      route: {
        include: {
          stops: {
            include: { stop: { select: { id: true, name: true, lat: true, lng: true } } },
            orderBy: { order: "asc" },
          },
        },
      },
      taps: {
        include: {
          passenger: { select: { fullName: true } },
          onStop: { select: { name: true } },
          offStop: { select: { name: true } },
        },
        orderBy: { tappedOnAt: "desc" },
        take: 12,
      },
    },
  });

  const tripsToday = await db.trip.count({
    where: { driverId: user.id, startedAt: { gte: todayStart } },
  });

  const creditsAgg = await db.tap.aggregate({
    where: {
      trip: { driverId: user.id },
      status: "SETTLED",
      tappedOnAt: { gte: todayStart },
    },
    _sum: { finalCredits: true },
  });
  const heldAgg = await db.tap.aggregate({
    where: {
      trip: { driverId: user.id, status: TripStatus.ACTIVE },
      status: "HELD",
    },
    _sum: { reservedCredits: true },
  });
  const creditsToday =
    (creditsAgg._sum.finalCredits ?? 0) + (heldAgg._sum.reservedCredits ?? 0);

  const onboard = activeTrip
    ? activeTrip.taps
        .filter((t) => t.status === "HELD")
        .reduce((sum, t) => sum + t.groupSize, 0)
    : 0;
  const capacity = activeTrip?.bus.capacity ?? 22;

  let upcomingStops: UpcomingStop[] = [];
  let nextStopName: string | null = null;

  if (activeTrip) {
    const routeStops = activeTrip.route.stops;
    const position =
      activeTrip.lastLat != null && activeTrip.lastLng != null
        ? { lat: activeTrip.lastLat, lng: activeTrip.lastLng }
        : null;

    let currentIdx = 0;
    if (position) {
      let bestDist = Infinity;
      for (let i = 0; i < routeStops.length; i++) {
        const d = distanceMeters(position, routeStops[i].stop);
        if (d < bestDist) {
          bestDist = d;
          currentIdx = i;
        }
      }
    }

    const upcoming = routeStops.slice(currentIdx + 1, currentIdx + 6);
    nextStopName = upcoming[0]?.stop.name ?? null;

    const stopIds = upcoming.map((rs) => rs.stopId);
    const waitingByStop =
      stopIds.length > 0
        ? await db.stopArrival.groupBy({
            by: ["stopId"],
            where: {
              stopId: { in: stopIds },
              cancelledAt: null,
              expiresAt: { gt: new Date() },
            },
            _count: { _all: true },
          })
        : [];
    const waitingMap = new Map(
      waitingByStop.map((w) => [w.stopId, w._count._all]),
    );

    upcomingStops = upcoming.map((rs) => {
      let etaMinutes: number | null = null;
      if (position) {
        const meters = distanceMeters(position, rs.stop);
        etaMinutes = Math.max(1, Math.round((meters / 1000 / 25) * 60));
      }
      return {
        id: rs.stopId,
        name: rs.stop.name,
        order: rs.order,
        etaMinutes,
        waitingCount: waitingMap.get(rs.stopId) ?? 0,
      };
    });
  }

  const assignableRoutes = await db.route.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const activeTripView = activeTrip
    ? {
        id: activeTrip.id,
        busPlate: activeTrip.bus.plate,
        routeName: activeTrip.route.name,
        direction: activeTrip.direction,
        lastLat: activeTrip.lastLat,
        lastLng: activeTrip.lastLng,
        lastSeenAt: activeTrip.lastSeenAt?.toISOString() ?? null,
        startedAt: activeTrip.startedAt.toISOString(),
        nextStopName,
      }
    : null;

  const manifestEntries = (activeTrip?.taps ?? []).map((t) => ({
    id: t.id,
    passengerName: t.passenger.fullName,
    onStopName: t.onStop.name,
    offStopName: t.offStop?.name ?? null,
    groupSize: t.groupSize,
    reservedCredits: t.reservedCredits,
    status: t.status,
    tappedOnAt: t.tappedOnAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-app">
      <DriverDashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-12 lg:col-span-8">
            <ActiveTripHero
              activeTrip={activeTripView}
              assignableRoutes={assignableRoutes}
            />
          </section>

          <section className="col-span-12 lg:col-span-4">
            <TripStatsCard
              busPlate={activeTrip?.bus.plate ?? null}
              onboard={onboard}
              capacity={capacity}
              creditsToday={creditsToday}
              tripsToday={tripsToday}
            />
          </section>

          <section className="col-span-12">
            <DriverQuickActions />
          </section>

          {activeTrip && (
            <section className="col-span-12 lg:col-span-5">
              <UpcomingStops stops={upcomingStops} />
            </section>
          )}

          <section className={`col-span-12 ${activeTrip ? "lg:col-span-7" : ""}`}>
            <PassengerManifest entries={manifestEntries} />
          </section>
        </div>
      </main>
    </div>
  );
}
