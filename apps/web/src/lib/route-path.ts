import { db } from "./db";

export type RouteWaypoint = {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
};

/**
 * Finds an active route that serves both stops and returns the ordered slice of
 * stops between them (inclusive), following the route's `order` field.
 * If the passenger is travelling "backwards" on the ordered list, the slice is
 * reversed so waypoints run origin → destination.
 */
export async function getRouteWaypointsBetween(
  fromStopId: string,
  toStopId: string,
): Promise<{
  routeId: string;
  routeName: string;
  waypoints: RouteWaypoint[];
} | null> {
  if (fromStopId === toStopId) return null;

  const route = await db.route.findFirst({
    where: {
      active: true,
      AND: [
        { stops: { some: { stopId: fromStopId } } },
        { stops: { some: { stopId: toStopId } } },
      ],
    },
    include: {
      stops: {
        include: {
          stop: { select: { id: true, name: true, lat: true, lng: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!route) return null;

  const ordered = route.stops.map((rs) => rs.stop);
  const fromIdx = ordered.findIndex((s) => s.id === fromStopId);
  const toIdx = ordered.findIndex((s) => s.id === toStopId);
  if (fromIdx === -1 || toIdx === -1) return null;

  const slice =
    fromIdx <= toIdx
      ? ordered.slice(fromIdx, toIdx + 1)
      : ordered.slice(toIdx, fromIdx + 1).reverse();

  return {
    routeId: route.id,
    routeName: route.name,
    waypoints: slice.map((s) => ({
      stopId: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
    })),
  };
}
