import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { TripStatus } from "@prisma/client";
import { distanceMeters, walkingMinutes } from "@/lib/format";
import { BalanceCard, type LinkedDevice } from "./components/BalanceCard";
import { TripHero } from "./components/TripHero";
import { TapActions } from "./components/TapActions";
import { RideProvider } from "./components/RideProvider";
import { NearestStops } from "./components/NearestStops";
import { InboundBuses } from "./components/InboundBuses";
import { RecentActivity } from "./components/RecentActivity";
import { DashboardHeader } from "./components/DashboardHeader";

export const dynamic = "force-dynamic";

// Lusaka centre — used as a default "you are here" until the browser geolocation
// resolves on the client. In v1 we'd ask for permission and update reactively.
const DEFAULT_LOCATION = { lat: -15.4167, lng: 28.2833 };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    // Redirect to the dev-login shortcut so anyone clicking the link gets in instantly.
    redirect("/api/auth/dev-login");
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: {
      wallet: true,
      devices: {
        where: { type: { in: ["PHONE", "CARD", "WRISTBAND"] } },
        orderBy: [{ active: "desc" }, { lastSeenAt: "desc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!user) redirect("/api/auth/dev-login");
  if (user.role === "DRIVER") redirect("/driver/dashboard");
  if (user.role === "ADMIN") redirect("/admin");
  if (!user.wallet) redirect("/api/auth/dev-login");

  const linkedDevices: LinkedDevice[] = user.devices.map((d) => ({
    id: d.id,
    type: d.type as LinkedDevice["type"],
    label: d.label,
    active: d.active,
    lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
  }));

  // Latest live arrival (if any) — destination is optional
  const liveArrival = await db.stopArrival.findFirst({
    where: { userId: user.id, cancelledAt: null, expiresAt: { gt: new Date() } },
    orderBy: { loggedAt: "desc" },
    include: { stop: true },
  });

  const liveDestination = liveArrival?.destinationStopId
    ? await db.busStop.findUnique({
        where: { id: liveArrival.destinationStopId },
        select: { id: true, name: true, lat: true, lng: true },
      })
    : null;

  // All stops (for the destination autocomplete) + nearest stops (for the "from" picker).
  // We include lat/lng so the trip-hero map backdrop can render the selected trip.
  const allStops = await db.busStop.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, lat: true, lng: true },
  });

  const nearest = allStops
    .map((s) => {
      const d = distanceMeters(DEFAULT_LOCATION, { lat: s.lat, lng: s.lng });
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
    .slice(0, 3);

  // Inbound buses at the logged stop (or at the closest stop if no live arrival)
  const focusStopId = liveArrival?.stopId ?? nearest[0]?.id;
  let inboundBuses: Awaited<ReturnType<typeof loadInboundBuses>> = [];
  if (focusStopId) {
    inboundBuses = await loadInboundBuses(focusStopId);
  }

  // Soonest bus ETA — used by the hero countdown. We pass an absolute ISO
  // timestamp so the client can tick down smoothly between server refreshes.
  const soonestEtaMinutes = inboundBuses
    .map((b) => b.etaMinutes)
    .filter((m): m is number => m != null)
    .reduce<number | null>((min, m) => (min == null || m < min ? m : min), null);
  const nextBusArrivalAt =
    soonestEtaMinutes != null
      ? new Date(Date.now() + soonestEtaMinutes * 60_000).toISOString()
      : null;

  // Recent wallet activity
  const recent = await db.walletEntry.findMany({
    where: { walletId: user.wallet.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  // Trips this week (for the quick stat in the hero)
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tripsThisWeek = await db.tap.count({
    where: { passengerId: user.id, tappedOnAt: { gte: weekStart } },
  });

  return (
    <div className="min-h-screen bg-app">
      <DashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        <RideProvider
          boardingStopId={focusStopId ?? null}
          boardingStopName={
            liveArrival?.stop.name ?? nearest[0]?.name ?? "Nearest stop"
          }
          inboundBuses={inboundBuses}
          destinationStopId={liveDestination?.id ?? null}
        >
        <div className="grid grid-cols-12 gap-5">
          {/* HERO — The single most important action on this page */}
          <section className="col-span-12 lg:col-span-8">
            <TripHero
              liveArrival={
                liveArrival
                  ? {
                      stopId: liveArrival.stopId,
                      stopName: liveArrival.stop.name,
                      stopLat: liveArrival.stop.lat,
                      stopLng: liveArrival.stop.lng,
                      expiresAt: liveArrival.expiresAt.toISOString(),
                      destination: liveDestination,
                      nextBusArrivalAt,
                    }
                  : null
              }
              nearestStops={nearest}
              allStops={allStops}
              inboundBuses={inboundBuses}
            />
          </section>

          {/* BALANCE */}
          <section className="col-span-12 lg:col-span-4">
            <BalanceCard
              balance={user.wallet.balance}
              tripsThisWeek={tripsThisWeek}
              devices={linkedDevices}
            />
          </section>

          {/* QUICK ACTIONS — tap on / group (on-board UI lives in TripHero) */}
          <section className="col-span-12">
            <TapActions />
          </section>

          {/* INBOUND BUSES at the closest stop — only shown pre-arrival. Once
             the passenger logs an arrival, the same list is rendered inline
             inside TripHero, so a separate card here would just duplicate it. */}
          {!liveArrival && (
            <section className="col-span-12 lg:col-span-7">
              <InboundBuses
                stopName={nearest[0]?.name ?? "Nearest stop"}
                isLiveArrival={false}
                buses={inboundBuses}
              />
            </section>
          )}

          {/* NEAREST STOPS — client-side: upgrades to real geolocation on mount.
             Expands to full width when the standalone Inbound Buses card is
             hidden, so we don't leave a dead column. */}
          <section
            className={`col-span-12 ${liveArrival ? "" : "lg:col-span-5"}`}
          >
            <NearestStops
              initialStops={nearest}
              allStops={allStops}
              defaultOrigin={DEFAULT_LOCATION}
              liveStopId={liveArrival?.stopId ?? null}
            />
          </section>

          {/* RECENT ACTIVITY */}
          <section className="col-span-12">
            <RecentActivity
              entries={recent.map((e) => ({
                id: e.id,
                amount: e.amount,
                kind: e.kind,
                note: e.note,
                createdAt: e.createdAt.toISOString(),
                balanceAfter: e.balanceAfter,
              }))}
            />
          </section>
        </div>
        </RideProvider>
      </main>
    </div>
  );
}

async function loadInboundBuses(stopId: string) {
  const stop = await db.busStop.findUnique({ where: { id: stopId } });
  if (!stop) return [];

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
      taps: { where: { status: "HELD" }, select: { groupSize: true } },
    },
  });

  return trips.map((trip) => {
    const onboard = trip.taps.reduce((sum, t) => sum + t.groupSize, 0);
    const stopOnRoute = trip.route.stops.find((rs) => rs.stopId === stopId);
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
      routeName: trip.route.name,
      seatsAvailable: Math.max(0, trip.bus.capacity - onboard),
      capacity: trip.bus.capacity,
      etaMinutes,
    };
  });
}
