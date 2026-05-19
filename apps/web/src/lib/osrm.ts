import { z } from "zod";

export type LatLngTuple = [number, number];

const OsrmRouteSchema = z.object({
  code: z.string(),
  routes: z
    .array(
      z.object({
        distance: z.number(),
        duration: z.number(),
        geometry: z.object({
          type: z.literal("LineString"),
          coordinates: z.array(z.tuple([z.number(), z.number()])),
        }),
      }),
    )
    .min(1)
    .optional(),
});

const USER_AGENT =
  "CarryMe/0.1 (transit prototype; https://github.com/carryme — contact: hello@carryme.zm)";

/**
 * Request a road-following path through an ordered list of waypoints via OSRM.
 * Waypoints are { lat, lng }; OSRM expects lng,lat in the URL.
 * A single OSRM call routes through every consecutive pair on the road network.
 */
export async function fetchOsrmRoute(
  waypoints: Array<{ lat: number; lng: number }>,
  profile: "driving" | "walking" | "cycling" = "driving",
): Promise<{
  geometry: LatLngTuple[];
  distanceMeters: number;
  durationSeconds: number;
} | null> {
  if (waypoints.length < 2) return null;

  const round = (n: number) => n.toFixed(6);
  const coordPath = waypoints
    .map((w) => `${round(w.lng)},${round(w.lat)}`)
    .join(";");

  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${coordPath}?overview=full&geometries=geojson&alternatives=false&steps=false`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) return null;

  const raw = await res.json();
  const json = OsrmRouteSchema.safeParse(raw);
  if (!json.success || json.data.code !== "Ok" || !json.data.routes?.[0]) {
    return null;
  }

  const r = json.data.routes[0];
  const geometry = r.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng] as LatLngTuple,
  );

  return {
    geometry,
    distanceMeters: Math.round(r.distance),
    durationSeconds: Math.round(r.duration),
  };
}
