import {
  api,
  type AuthUser,
  type InboundBus,
  type LinkedDevice,
  type ReverseGeocode,
  type Stop,
  type StopArrival,
  type WalletEntry,
} from "./client";

// ── Auth ────────────────────────────────────────────────────────────────────
export function devLogin(phone?: string) {
  return api<{ token: string; user: AuthUser }>("/api/auth/dev-login", {
    method: "POST",
    body: phone ? { phone } : {},
  });
}

// ── Me / wallet ─────────────────────────────────────────────────────────────
export function getMe(token: string) {
  return api<{ user: AuthUser }>("/api/me", { token });
}

export function getWallet(token: string) {
  return api<{ wallet: { id: string; balance: number; updatedAt: string } }>(
    "/api/me/wallet",
    { token },
  );
}

export function getTransactions(token: string, limit = 20) {
  return api<{ entries: WalletEntry[] }>("/api/me/transactions", {
    token,
    query: { limit },
  });
}

export function getDevices(token: string) {
  return api<{ devices: LinkedDevice[] }>("/api/me/devices", { token });
}

// ── Top-up & share ──────────────────────────────────────────────────────────
export type TopUpMethod =
  | "MTN_MOMO"
  | "AIRTEL_MONEY"
  | "ZAMTEL_KWACHA"
  | "ZEDMOBILE_WALLET"
  | "CARD";

export function topUp(token: string, amount: number, method: TopUpMethod) {
  return api<{ balance: number; addedCredits: number }>("/api/topup", {
    method: "POST",
    token,
    body: { amount, method },
  });
}

export function shareCredits(
  token: string,
  recipientPhone: string,
  amount: number,
  note?: string,
) {
  return api<{ share: unknown; balance: number }>("/api/share-credits", {
    method: "POST",
    token,
    body: { recipientPhone, amount, note },
  });
}

// ── Stops ───────────────────────────────────────────────────────────────────
export function getNearbyStops(
  token: string,
  lat: number,
  lng: number,
  limit = 3,
) {
  return api<{ stops: Stop[] }>("/api/stops/nearby", {
    token,
    query: { lat, lng, limit },
  });
}

export function getInboundBuses(token: string, stopId: string) {
  return api<{ buses: InboundBus[] }>(`/api/stops/${stopId}/inbound-buses`, {
    token,
  });
}

export function logArrival(
  token: string,
  stopId: string,
  destinationStopId?: string,
) {
  return api<{ arrival: StopArrival }>(`/api/stops/${stopId}/arrivals`, {
    method: "POST",
    token,
    body: destinationStopId ? { destinationStopId } : {},
  });
}

export function cancelArrival(token: string, stopId: string) {
  return api<{ cancelled: number }>(
    `/api/stops/${stopId}/arrivals/cancel`,
    { method: "POST", token },
  );
}

// ── Geo ─────────────────────────────────────────────────────────────────────
// Reverse-geocode a coordinate via the web app's Nominatim proxy. Returns
// `{ label: null }` (not an error) when no human-meaningful name resolves —
// callers should treat the label as a best-effort enhancement.
export function reverseGeocode(lat: number, lng: number) {
  return api<ReverseGeocode>("/api/geo/reverse", {
    query: { lat, lng },
  });
}

// ── Tap on / tap off (API-based boarding) ───────────────────────────────────
export type ActiveTap = {
  id: string;
  tripId: string;
  status: string;
  groupSize: number;
  tappedOnAt: string;
  onStop: { id: string; name: string };
  offStop: { id: string; name: string } | null;
  busPlate: string;
  route: {
    id: string;
    name: string;
    stops: Array<{ id: string; name: string; order: number }>;
  };
};

export type FareHint = {
  stopId: string;
  creditsPerPassenger: number;
  totalCredits: number;
};

export function getActiveTap(token: string) {
  return api<{ tap: ActiveTap | null; fareHints?: FareHint[] }>(
    "/api/me/taps/active",
    { token },
  );
}

export function tapOn(
  token: string,
  body: { tripId: string; stopId: string; groupSize?: number },
) {
  return api<{
    tap: {
      id: string;
      onStop: { id: string; name: string };
      busPlate: string;
    };
    message: string;
  }>("/api/taps/on", { method: "POST", token, body });
}

export function tapOff(token: string, body: { stopId: string; tapId?: string }) {
  return api<{
    tap: { finalCredits: number | null };
    fare: { totalCredits: number };
    balance: number;
    message: string;
  }>("/api/taps/off", { method: "POST", token, body });
}
