import Constants from "expo-constants";
import { Platform } from "react-native";

// ── Base URL resolution ─────────────────────────────────────────────────────
// Priority: EXPO_PUBLIC_API_BASE_URL → debugger host (LAN dev) → platform default.
function resolveBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // When running `expo start` Metro reports the laptop's LAN host. That's the
  // most reliable URL for a physical device on the same network.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoGo?: { developer?: { host?: string } } } } })
      .manifest2?.extra?.expoGo?.developer?.host ??
    null;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3000`;
  }

  // Last-ditch platform fallbacks.
  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000";
}

export const API_BASE_URL = resolveBaseUrl();

// ── Shared types — mirror apps/web API responses ────────────────────────────
export type Role = "PASSENGER" | "DRIVER" | "OWNER" | "ADMIN";

export type AuthUser = {
  id: string;
  phone: string;
  fullName: string;
  role: Role;
};

export type WalletEntryKind =
  | "TOPUP"
  | "TRIP_DEBIT"
  | "TRIP_HOLD"
  | "TRIP_RELEASE"
  | "SHARE_OUT"
  | "SHARE_IN"
  | "REFUND"
  | "ADJUSTMENT"
  | "WITHDRAWAL_OUT";

export type WalletEntry = {
  id: string;
  amount: number;
  kind: WalletEntryKind;
  balanceAfter: number;
  reference: string | null;
  note: string | null;
  createdAt: string;
};

export type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  walkingMinutes: number;
};

export type InboundBus = {
  tripId: string;
  busPlate: string;
  route: { id: string; name: string };
  seatsAvailable: number;
  capacity: number;
  etaMinutes: number | null;
  lastSeenAt: string | null;
  lastSeenAgoMinutes: number | null;
};

export type StopArrival = {
  id: string;
  stopId: string;
  destinationStopId: string | null;
  expiresAt: string;
};

export type LinkedDeviceType = "PHONE" | "CARD" | "WRISTBAND";

export type LinkedDevice = {
  id: string;
  type: LinkedDeviceType;
  label: string | null;
  active: boolean;
  lastSeenAt: string | null;
};

export type ReverseGeocode = {
  label: string | null;
  source: string;
};

// ── Errors ──────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Low-level fetch ─────────────────────────────────────────────────────────
type RequestInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | undefined | null>;
};

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = new URL(path, API_BASE_URL + "/");
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v == null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers["Authorization"] = `Bearer ${init.token}`;

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      `Network error reaching ${url.toString()}. Is the API running?`,
      0,
      err,
    );
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!res.ok) {
    const message =
      (json && typeof json === "object" && "error" in json && typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json);
  }

  return json as T;
}
