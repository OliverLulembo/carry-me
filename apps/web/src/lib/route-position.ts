import { distanceMeters } from "./format";

export type RouteStopPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
};

type RouteProgressStop = {
  stopId: string;
  stop: { id: string; name: string; lat: number; lng: number };
};

/** Resolve the next stop and upcoming list anchor for an active trip. */
export function resolveRouteProgress(params: {
  routeStops: RouteProgressStop[];
  currentStopId: string | null;
  lastDepartedStopId: string | null;
  position: { lat: number; lng: number } | null;
}): {
  currentIdx: number;
  upcomingStartIdx: number;
  nextStop: { id: string; name: string } | null;
} {
  const { routeStops, currentStopId, lastDepartedStopId, position } = params;

  if (currentStopId) {
    const atIdx = routeStops.findIndex((rs) => rs.stopId === currentStopId);
    const idx = atIdx >= 0 ? atIdx : 0;
    const next = routeStops[idx + 1];
    return {
      currentIdx: idx,
      upcomingStartIdx: idx + 1,
      nextStop: next ? { id: next.stopId, name: next.stop.name } : null,
    };
  }

  if (lastDepartedStopId) {
    const departedIdx = routeStops.findIndex((rs) => rs.stopId === lastDepartedStopId);
    const idx = departedIdx >= 0 ? departedIdx : 0;
    const next = routeStops[idx + 1];
    return {
      currentIdx: idx,
      upcomingStartIdx: idx + 1,
      nextStop: next ? { id: next.stopId, name: next.stop.name } : null,
    };
  }

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

  const next = routeStops[currentIdx];
  return {
    currentIdx,
    upcomingStartIdx: currentIdx,
    nextStop: next ? { id: next.stopId, name: next.stop.name } : null,
  };
}

/** Next stop ahead on the route from the bus (or device) position. */
export function computeNextRouteStop(
  stops: RouteStopPoint[],
  position: { lat: number; lng: number } | null,
  options?: {
    currentStopId?: string | null;
    lastDepartedStopId?: string | null;
  },
): RouteStopPoint | null {
  if (stops.length === 0) return null;

  const routeStops = stops.map((stop) => ({
    stopId: stop.id,
    stop: { id: stop.id, name: stop.name, lat: stop.lat, lng: stop.lng },
  }));

  const progress = resolveRouteProgress({
    routeStops,
    currentStopId: options?.currentStopId ?? null,
    lastDepartedStopId: options?.lastDepartedStopId ?? null,
    position,
  });

  if (!progress.nextStop) return null;
  const match = stops.find((stop) => stop.id === progress.nextStop!.id);
  return match ?? null;
}
