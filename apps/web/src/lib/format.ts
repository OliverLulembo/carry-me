// 1 credit == 1 ZMW in v1. Centralise so the rule changes in one place if needed.
export function creditsToZmw(credits: number): number {
  return credits;
}

export function formatZmw(credits: number): string {
  const value = creditsToZmw(credits);
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCredits(credits: number): string {
  return `${credits.toLocaleString("en-ZM")} cr`;
}

// Haversine distance in metres between two lat/lng points.
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function walkingMinutes(meters: number): number {
  // 80 m/min ≈ 4.8 km/h
  return Math.max(1, Math.round(meters / 80));
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
