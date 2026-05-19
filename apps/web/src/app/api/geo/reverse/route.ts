import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

// Thin proxy over OSM Nominatim's reverse-geocode endpoint. We do this on the
// server (not the client) for three reasons:
//   1. Nominatim's usage policy requires a meaningful, identifying User-Agent.
//      Browsers send a generic UA and Nominatim is within its rights to block
//      anonymous bursts. See https://operations.osmfoundation.org/policies/nominatim/
//   2. We can cache responses at the edge (revalidate below) so we don't
//      hammer the public instance — the same five-decimal coordinate will
//      resolve to the same neighbourhood for hours.
//   3. Keeps the public-facing surface stable: the client just asks our route
//      for a label and doesn't care which provider we use today vs tomorrow.

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const NominatimSchema = z.object({
  display_name: z.string().optional(),
  address: z
    .object({
      neighbourhood: z.string().optional(),
      suburb: z.string().optional(),
      quarter: z.string().optional(),
      city_district: z.string().optional(),
      village: z.string().optional(),
      town: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

const USER_AGENT =
  "CarryMe/0.1 (transit prototype; https://github.com/carryme — contact: hello@carryme.zm)";

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { lat, lng } = parsed.data;

  // Round to 5 decimals (~1 m precision) so cache keys collapse for callers
  // who jitter slightly between geolocation updates.
  const qLat = lat.toFixed(5);
  const qLng = lng.toFixed(5);

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", qLat);
  url.searchParams.set("lon", qLng);
  url.searchParams.set("zoom", "16"); // neighbourhood-level granularity
  url.searchParams.set("addressdetails", "1");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en",
      },
      // Cache aggressively — neighbourhood names don't change on the scale of
      // a user session, and Nominatim explicitly asks consumers to cache.
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { label: null, source: "nominatim", upstreamStatus: res.status },
        { status: 200 },
      );
    }
    const raw = await res.json();
    const json = NominatimSchema.safeParse(raw);
    if (!json.success) {
      return NextResponse.json({ label: null, source: "nominatim" });
    }

    const a = json.data.address ?? {};
    // Prefer the most specific human-meaningful field that Nominatim returned.
    const place =
      a.neighbourhood ??
      a.suburb ??
      a.quarter ??
      a.city_district ??
      a.village ??
      a.town ??
      null;
    const city = a.city ?? a.town ?? null;

    let label: string | null = null;
    if (place && city && place !== city) label = `${place}, ${city}`;
    else if (place) label = place;
    else if (city) label = city;
    else if (json.data.display_name)
      label = json.data.display_name.split(",").slice(0, 2).join(", ").trim();

    return NextResponse.json({ label, source: "nominatim" });
  } catch (err) {
    return NextResponse.json(
      { label: null, source: "nominatim", error: (err as Error).message },
      { status: 200 },
    );
  }
}
