import { Suspense } from "react";
import type { TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { TripsPanel } from "../components/TripsPanel";

export const dynamic = "force-dynamic";

const STATUSES: TripStatus[] = ["ACTIVE", "COMPLETED", "CANCELLED"];

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const statusFilter =
    statusParam && STATUSES.includes(statusParam as TripStatus)
      ? (statusParam as TripStatus)
      : undefined;

  const trips = await db.trip.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      bus: { select: { plate: true } },
      driver: { select: { fullName: true, phone: true } },
      route: { select: { name: true } },
      _count: { select: { taps: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-deep">Trips</h2>
        <p className="text-sm text-ink-500 mt-1">
          Review and permanently delete trips from the database — active, completed, or cancelled.
          Associated tap records are removed with each trip.
        </p>
      </div>
      <Suspense fallback={<div className="card p-8 text-sm text-ink-500">Loading trips…</div>}>
        <TripsPanel
          initialTrips={trips.map((t) => ({
            id: t.id,
            status: t.status,
            direction: t.direction,
            startedAt: t.startedAt.toISOString(),
            endedAt: t.endedAt?.toISOString() ?? null,
            busPlate: t.bus.plate,
            driverName: t.driver.fullName,
            driverPhone: t.driver.phone,
            routeName: t.route.name,
            tapCount: t._count.taps,
          }))}
        />
      </Suspense>
    </div>
  );
}
