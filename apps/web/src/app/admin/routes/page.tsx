import { db } from "@/lib/db";
import { RoutesPanel } from "../components/RoutesPanel";

export const dynamic = "force-dynamic";

export default async function AdminRoutesPage() {
  const [routes, allStops] = await Promise.all([
    db.route.findMany({
      orderBy: { name: "asc" },
      include: {
        stops: {
          orderBy: { order: "asc" },
          include: { stop: { select: { id: true, name: true, lat: true, lng: true } } },
        },
      },
    }),
    db.busStop.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const initialRoutes = routes.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    active: r.active,
    stops: r.stops.map((rs) => ({
      order: rs.order,
      id: rs.stop.id,
      name: rs.stop.name,
      lat: rs.stop.lat,
      lng: rs.stop.lng,
    })),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-deep">Routes</h2>
        <p className="text-sm text-ink-500 mt-1">
          Configure stop order per route. The fare matrix rebuilds automatically when stops change.
        </p>
      </div>
      <RoutesPanel initialRoutes={initialRoutes} allStops={allStops} />
    </div>
  );
}
