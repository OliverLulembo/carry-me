import { distanceMeters } from "./format";

export type RouteStopPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
};

/** Next stop ahead on the route from the bus (or device) position. */
export function computeNextRouteStop(
  stops: RouteStopPoint[],
  position: { lat: number; lng: number } | null,
): RouteStopPoint | null {
  if (stops.length === 0) return null;

  let currentIdx = 0;
  if (position) {
    let bestDist = Infinity;
    for (let i = 0; i < stops.length; i++) {
      const d = distanceMeters(position, { lat: stops[i].lat, lng: stops[i].lng });
      if (d < bestDist) {
        bestDist = d;
        currentIdx = i;
      }
    }
  }

  return stops[currentIdx + 1] ?? null;
}
