import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Location from "expo-location";
import {
  ApiError,
  type InboundBus,
  type LinkedDevice,
  type Stop,
  type WalletEntry,
} from "@/api/client";
import {
  cancelArrival,
  getActiveTap,
  getDevices,
  getInboundBuses,
  getNearbyStops,
  getTransactions,
  getWallet,
  logArrival,
  reverseGeocode,
  type ActiveTap,
} from "@/api/endpoints";
import { useAuth } from "@/auth/session";
import type { GeoStatus, OriginInfo } from "@/components/NearestStops";

// Lusaka centre — fallback when the device hasn't granted location yet. Same
// coordinate the web dashboard server-renders against so the two stay aligned.
const DEFAULT_LOCATION = { lat: -15.4167, lng: 28.2833 };

type LiveArrivalState = {
  stopId: string;
  stopName: string;
  destinationStopId?: string | null;
  destinationName?: string | null;
  expiresAt: string;
};

type DashboardState = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  balance: number;
  tripsThisWeek: number;
  stops: Stop[];
  inboundBuses: InboundBus[];
  focusStop: Stop | null;
  liveArrival: LiveArrivalState | null;
  recent: WalletEntry[];
  devices: LinkedDevice[];
  geoStatus: GeoStatus;
  origin: OriginInfo;
  areaLabel: string | null;
  // Soonest inbound bus arrival as an absolute ISO timestamp. We pre-compute
  // this server-tick so the hero countdown ticks smoothly between refreshes.
  nextBusArrivalAt: string | null;
  activeTap: ActiveTap | null;
};

const initial: DashboardState = {
  loading: true,
  refreshing: false,
  error: null,
  balance: 0,
  tripsThisWeek: 0,
  stops: [],
  inboundBuses: [],
  focusStop: null,
  liveArrival: null,
  recent: [],
  devices: [],
  geoStatus: { kind: "idle" },
  origin: { source: "default" },
  areaLabel: null,
  nextBusArrivalAt: null,
  activeTap: null,
};

export function useDashboard() {
  const { token, signOut } = useAuth();
  const [state, setState] = useState<DashboardState>(initial);
  const [busyAction, setBusyAction] = useState<null | "arrive" | "cancel">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reverseAbort = useRef<AbortController | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!token) return;
      setState((s) => ({
        ...s,
        loading: mode === "initial" ? true : s.loading,
        refreshing: mode === "refresh",
        error: null,
      }));

      // ── Geolocation (best-effort) ──────────────────────────────────────
      let loc = DEFAULT_LOCATION;
      let geoStatus: GeoStatus = { kind: "idle" };
      let origin: OriginInfo = { source: "default" };
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        // Trigger the OS prompt the first time so the next refresh can read
        // GPS without user intervention. We pass through the result the same
        // way as "already granted" so the rest of the flow is identical.
        if (perm.status === "undetermined") {
          setState((s) => ({ ...s, geoStatus: { kind: "locating" } }));
          perm = await Location.requestForegroundPermissionsAsync();
        }
        if (perm.status === "granted") {
          setState((s) => ({ ...s, geoStatus: { kind: "locating" } }));
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          origin = {
            source: "user",
            accuracyMeters: pos.coords.accuracy ?? undefined,
          };
          geoStatus = {
            kind: "located",
            accuracyMeters: pos.coords.accuracy ?? undefined,
          };
        } else if (perm.status === "denied") {
          geoStatus = { kind: "denied" };
        } else {
          geoStatus = { kind: "unavailable" };
        }
      } catch (err) {
        geoStatus = {
          kind: "error",
          message: err instanceof Error ? err.message : "Location error",
        };
      }

      try {
        const [walletRes, txRes, stopsRes, devicesRes, activeRes] = await Promise.all([
          getWallet(token),
          getTransactions(token, 10),
          getNearbyStops(token, loc.lat, loc.lng, 20),
          getDevices(token).catch(() => ({ devices: [] as LinkedDevice[] })),
          getActiveTap(token).catch(() => ({ tap: null as ActiveTap | null })),
        ]);

        const focusStop = stopsRes.stops[0] ?? null;
        const inboundRes = focusStop
          ? await getInboundBuses(token, focusStop.id).catch(() => ({
              buses: [] as InboundBus[],
            }))
          : { buses: [] as InboundBus[] };

        const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const tripsThisWeek = txRes.entries.filter(
          (e) =>
            (e.kind === "TRIP_DEBIT" || e.kind === "TRIP_HOLD") &&
            new Date(e.createdAt).getTime() >= weekStart,
        ).length;

        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: null,
          balance: walletRes.wallet.balance,
          tripsThisWeek,
          stops: stopsRes.stops,
          inboundBuses: inboundRes.buses,
          focusStop,
          recent: txRes.entries,
          devices: devicesRes.devices,
          geoStatus,
          origin,
          nextBusArrivalAt: computeNextBusArrivalAt(inboundRes.buses),
          activeTap: activeRes.tap,
          liveArrival: activeRes.tap ? null : s.liveArrival,
        }));
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        if (apiErr?.status === 401) {
          await signOut();
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load";
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: message,
          geoStatus,
          origin,
        }));
      }
    },
    [token, signOut],
  );

  // Initial load + refresh whenever the app foregrounds. Foreground refresh
  // matters because users often switch to maps / mobile money mid-flow and
  // come back expecting the list to be current.
  useEffect(() => {
    load("initial");
    const sub = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (status === "active") load("refresh");
    });
    return () => sub.remove();
  }, [load]);

  // Reverse-geocode the current origin into a human-friendly area label
  // (e.g. "Near Kabwata"). Best-effort — failures are silent so the primary
  // nearest-stops flow stays unaffected. We trigger on every change to the
  // focus stop because it's the nearest match to wherever the user actually
  // is; the API proxy caches aggressively so repeated calls are cheap.
  useEffect(() => {
    if (state.origin.source !== "user") {
      setState((s) => (s.areaLabel == null ? s : { ...s, areaLabel: null }));
      return;
    }
    const focus = state.focusStop;
    if (!focus) return;
    reverseAbort.current?.abort();
    const ctrl = new AbortController();
    reverseAbort.current = ctrl;
    reverseGeocode(focus.lat, focus.lng)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        if (res && typeof res.label === "string") {
          setState((s) => ({ ...s, areaLabel: res.label }));
        }
      })
      .catch(() => {
        /* swallow — best-effort */
      });
    return () => ctrl.abort();
  }, [state.origin.source, state.focusStop]);

  // Light polling of inbound buses while there's a focus stop or live
  // arrival. Mirrors the PRD's "updates every 30 seconds" requirement.
  useEffect(() => {
    if (!token || (!state.focusStop && !state.liveArrival)) return;
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(async () => {
      try {
        const stopId = state.liveArrival?.stopId ?? state.focusStop?.id;
        if (!stopId) return;
        const res = await getInboundBuses(token, stopId);
        setState((s) => ({
          ...s,
          inboundBuses: res.buses,
          nextBusArrivalAt: computeNextBusArrivalAt(res.buses),
        }));
      } catch {
        /* swallow — next tick will retry */
      }
    }, 30_000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [token, state.focusStop, state.liveArrival]);

  const locate = useCallback(async () => {
    setState((s) => ({ ...s, geoStatus: { kind: "locating" } }));
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setState((s) => ({
          ...s,
          geoStatus:
            perm.status === "denied"
              ? { kind: "denied" }
              : { kind: "unavailable" },
        }));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState((s) => ({
        ...s,
        origin: {
          source: "user",
          accuracyMeters: pos.coords.accuracy ?? undefined,
        },
        geoStatus: {
          kind: "located",
          accuracyMeters: pos.coords.accuracy ?? undefined,
        },
      }));
      // Re-fetch stops centred on the fresh coordinates.
      if (token) {
        const res = await getNearbyStops(
          token,
          pos.coords.latitude,
          pos.coords.longitude,
          20,
        );
        setState((s) => ({
          ...s,
          stops: res.stops,
          focusStop: res.stops[0] ?? s.focusStop,
        }));
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        geoStatus: {
          kind: "error",
          message: err instanceof Error ? err.message : "Location error",
        },
      }));
    }
  }, [token]);

  const onLogArrival = useCallback(
    async (stopId: string, destinationStopId?: string) => {
      if (!token) return;
      setBusyAction("arrive");
      setActionError(null);
      try {
        const stop = state.stops.find((s) => s.id === stopId);
        const destination = destinationStopId
          ? state.stops.find((s) => s.id === destinationStopId)
          : null;
        const res = await logArrival(token, stopId, destinationStopId);
        setState((s) => ({
          ...s,
          liveArrival: {
            stopId,
            stopName: stop?.name ?? "Your stop",
            destinationStopId: destinationStopId ?? null,
            destinationName: destination?.name ?? null,
            expiresAt: res.arrival.expiresAt,
          },
        }));
        try {
          const r = await getInboundBuses(token, stopId);
          setState((s) => ({
            ...s,
            inboundBuses: r.buses,
            nextBusArrivalAt: computeNextBusArrivalAt(r.buses),
          }));
        } catch {
          /* noop */
        }
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Could not log arrival",
        );
      } finally {
        setBusyAction(null);
      }
    },
    [token, state.stops],
  );

  const onCancelArrival = useCallback(async () => {
    if (!token || !state.liveArrival) return;
    setBusyAction("cancel");
    try {
      await cancelArrival(token, state.liveArrival.stopId);
      setState((s) => ({ ...s, liveArrival: null }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setBusyAction(null);
    }
  }, [token, state.liveArrival]);

  return {
    ...state,
    busyAction,
    actionError,
    refresh: () => load("refresh"),
    locate,
    onLogArrival,
    onCancelArrival,
  };
}

// Convert an inbound-buses payload into the soonest absolute arrival
// timestamp. Filters out unknown ETAs and chooses the minimum. Returning an
// absolute ISO string (not a relative minute count) lets the client tick
// down smoothly between server refreshes without drifting.
function computeNextBusArrivalAt(buses: InboundBus[]): string | null {
  const eta = buses
    .map((b) => b.etaMinutes)
    .filter((m): m is number => m != null)
    .reduce<number | null>((min, m) => (min == null || m < min ? m : min), null);
  if (eta == null) return null;
  return new Date(Date.now() + eta * 60_000).toISOString();
}
