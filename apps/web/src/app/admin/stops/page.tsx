import { db } from "@/lib/db";
import { StopsManager } from "../components/StopsManager";

export const dynamic = "force-dynamic";

export default async function AdminStopsPage() {
  const stops = await db.busStop.findMany({
    orderBy: { name: "asc" },
    include: {
      routeStops: { include: { route: { select: { id: true, name: true } } } },
    },
  });

  const initialStops = stops.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    createdAt: s.createdAt.toISOString(),
    routes: s.routeStops.map((rs) => ({
      id: rs.route.id,
      name: rs.route.name,
      order: rs.order,
    })),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-deep">Bus stops</h2>
        <p className="text-sm text-ink-500 mt-1">
          Create stops and pin their locations on the map for passengers and fare configuration.
        </p>
      </div>
      <StopsManager initialStops={initialStops} />
    </div>
  );
}
