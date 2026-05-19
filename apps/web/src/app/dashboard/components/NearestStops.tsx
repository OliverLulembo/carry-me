"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Footprints,
  Loader2,
  LocateFixed,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { distanceMeters, walkingMinutes } from "@/lib/format";

export type StopWithCoords = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type DerivedStop = StopWithCoords & {
  distanceMeters: number;
  walkingMinutes: number;
};

type Origin = {
  lat: number;
  lng: number;
  // "default" = server-rendered Lusaka centre (SSR fallback).
  // "user"    = browser geolocation result (real position).
  source: "default" | "user";
  accuracyMeters?: number;
};

type GeoStatus =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "located"; accuracyMeters: number }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "error"; message: string };

const HOW_MANY = 3;

export function NearestStops({
  initialStops,
  allStops,
  defaultOrigin,
  liveStopId,
}: {
  initialStops: DerivedStop[];
  allStops: StopWithCoords[];
  defaultOrigin: { lat: number; lng: number };
  liveStopId: string | null;
}) {
  const router = useRouter();

  const [origin, setOrigin] = useState<Origin>({
    lat: defaultOrigin.lat,
    lng: defaultOrigin.lng,
    source: "default",
  });
  const [status, setStatus] = useState<GeoStatus>({ kind: "idle" });
  const [areaLabel, setAreaLabel] = useState<string | null>(null);

  const [pendingArrivalId, setPendingArrivalId] = useState<string | null>(null);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  // Re-sort the master list against whichever origin is currently in play.
  // Memoised so we don't redo the haversine work on every render.
  const stops: DerivedStop[] = useMemo(() => {
    if (origin.source === "default") return initialStops;
    return allStops
      .map((s) => {
        const meters = distanceMeters(origin, { lat: s.lat, lng: s.lng });
        return {
          ...s,
          distanceMeters: Math.round(meters),
          walkingMinutes: walkingMinutes(meters),
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, HOW_MANY);
  }, [origin, allStops, initialStops]);

  // Reverse-geocode the user's coordinates so we can show a friendly area
  // label ("Near Kabwata"). Only fires for real geolocation hits — there's
  // nothing useful to say about the fallback centre. AbortController makes
  // sure a rapid re-locate cancels the in-flight request.
  const reverseAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (origin.source !== "user") {
      setAreaLabel(null);
      return;
    }
    reverseAbortRef.current?.abort();
    const ctrl = new AbortController();
    reverseAbortRef.current = ctrl;
    const params = new URLSearchParams({
      lat: origin.lat.toString(),
      lng: origin.lng.toString(),
    });
    fetch(`/api/geo/reverse?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!ctrl.signal.aborted && data && typeof data.label === "string") {
          setAreaLabel(data.label);
        }
      })
      .catch(() => {
        // Reverse-geocoding is best-effort; failures are silent so the
        // primary nearest-stops flow stays unaffected.
      });
    return () => ctrl.abort();
  }, [origin]);

  const locate = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus({ kind: "unavailable" });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "user",
          accuracyMeters: pos.coords.accuracy,
        });
        setStatus({
          kind: "located",
          accuracyMeters: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus({ kind: "denied" });
        else setStatus({ kind: "error", message: err.message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  }, []);

  // Ask for location once on mount. If the user has already granted permission
  // for this origin, this resolves silently and seamlessly upgrades the list.
  // If they haven't, the browser shows the permission prompt — we just let the
  // user say no and fall back gracefully.
  useEffect(() => {
    locate();
  }, [locate]);

  async function logArrival(stopId: string) {
    setPendingArrivalId(stopId);
    setArrivalError(null);
    try {
      const res = await fetch(`/api/stops/${stopId}/arrivals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not log arrival");
      }
      router.refresh();
    } catch (e) {
      setArrivalError(e instanceof Error ? e.message : "Could not log arrival");
    } finally {
      setPendingArrivalId(null);
    }
  }

  return (
    <div className="card p-5 h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-brand-deep flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-primary" size={16} /> Nearest stops
          </h3>
          <LocationCaption
            status={status}
            origin={origin}
            areaLabel={areaLabel}
          />
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={status.kind === "locating"}
          aria-label="Update my location"
          title="Update my location"
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-ink-100 bg-white text-xs font-semibold text-brand-deep hover:bg-surface-subtle hover:border-ink-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.kind === "locating" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" size={14} />
          ) : origin.source === "user" ? (
            <RefreshCw className="w-3.5 h-3.5" size={14} />
          ) : (
            <LocateFixed className="w-3.5 h-3.5" size={14} />
          )}
          {status.kind === "locating"
            ? "Locating"
            : origin.source === "user"
              ? "Refresh"
              : "Use my location"}
        </button>
      </div>

      {arrivalError && (
        <p className="mb-3 text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" size={14} />
          {arrivalError}
        </p>
      )}

      <ul className="space-y-2">
        {stops.map((s, i) => {
          const isLive = s.id === liveStopId;
          const isPending = pendingArrivalId === s.id;
          return (
            <li
              key={s.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition ${
                isLive
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-ink-100 hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-7 h-7 grid place-items-center rounded-full text-xs font-bold shrink-0 ${
                    i === 0
                      ? "bg-brand-primary text-white"
                      : "bg-surface-subtle text-brand-deep border border-ink-100"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-deep truncate">
                    {s.name}
                  </p>
                  <p className="text-xs text-ink-500 flex items-center gap-1">
                    <Footprints className="w-3 h-3" size={12} />
                    {s.walkingMinutes} min · {formatDistance(s.distanceMeters)}
                  </p>
                </div>
              </div>
              {isLive ? (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full">
                  Waiting
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => logArrival(s.id)}
                  disabled={pendingArrivalId != null}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primary-600 px-2 py-1 rounded-md hover:bg-brand-primary/10 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {isPending && (
                    <Loader2 className="w-3 h-3 animate-spin" size={12} />
                  )}
                  I&apos;m here →
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Status caption under the heading — communicates *why* the list looks the
// way it does. Honesty here matters: a user looking at "stops near you" needs
// to know whether "you" is their actual GPS or a city-centre fallback.
function LocationCaption({
  status,
  origin,
  areaLabel,
}: {
  status: GeoStatus;
  origin: Origin;
  areaLabel: string | null;
}) {
  if (status.kind === "locating") {
    return (
      <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" size={12} />
        Finding your location…
      </p>
    );
  }
  if (status.kind === "denied") {
    return (
      <p className="text-xs text-ink-500 mt-0.5">
        Location permission denied — showing stops near Lusaka centre.
      </p>
    );
  }
  if (status.kind === "unavailable") {
    return (
      <p className="text-xs text-ink-500 mt-0.5">
        Geolocation isn&apos;t available here — showing stops near Lusaka centre.
      </p>
    );
  }
  if (status.kind === "error") {
    return (
      <p className="text-xs text-ink-500 mt-0.5">
        Couldn&apos;t read your location ({status.message}). Showing the default
        area.
      </p>
    );
  }
  if (origin.source === "user") {
    return (
      <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-brand-primary ring-2 ring-brand-primary/30 shrink-0"
          aria-hidden
        />
        <span className="truncate">
          {areaLabel ? <>Near {areaLabel}</> : <>From your current location</>}
          {origin.accuracyMeters != null && origin.accuracyMeters > 0 && (
            <span className="text-ink-300">
              {" "}
              · ±{Math.round(origin.accuracyMeters)} m
            </span>
          )}
        </span>
      </p>
    );
  }
  return (
    <p className="text-xs text-ink-500 mt-0.5">
      Showing stops near Lusaka centre — tap{" "}
      <span className="font-semibold text-brand-deep">Use my location</span> for
      a personalised list.
    </p>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
