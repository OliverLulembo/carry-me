"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Bus,
  Loader2,
  Map as MapIcon,
  MapPin,
  Nfc,
  Route,
  Square,
  Users,
  X,
} from "lucide-react";
import { timeAgo } from "@/lib/format";

const LiveTripMap = dynamic(
  () => import("@/app/dashboard/components/LiveTripMap"),
  { ssr: false },
);

export type ActiveTripView = {
  id: string;
  busPlate: string;
  routeName: string;
  direction: string;
  lastLat: number | null;
  lastLng: number | null;
  lastSeenAt: string | null;
  startedAt: string;
  nextStopId: string | null;
  nextStopName: string | null;
  currentStopId: string | null;
  currentStopName: string | null;
  isBoarding: boolean;
  waitingAtStop: number;
};

export function ActiveTripHero({
  activeTrip,
  assignableRoutes,
}: {
  activeTrip: ActiveTripView | null;
  assignableRoutes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapFocused, setMapFocused] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(assignableRoutes[0]?.id ?? "");

  async function departStop() {
    if (!activeTrip?.isBoarding) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/driver/trips/${activeTrip.id}/depart`, {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not continue trip");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue trip");
    } finally {
      setBusy(false);
    }
  }

  async function arriveAtStop() {
    if (!activeTrip?.nextStopId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/driver/trips/${activeTrip.id}/arrive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId: activeTrip.nextStopId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not mark arrival");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark arrival");
    } finally {
      setBusy(false);
    }
  }

  async function endTrip() {
    if (!activeTrip) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/driver/trips/${activeTrip.id}/end`, {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not end trip");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not end trip");
    } finally {
      setBusy(false);
    }
  }

  async function startTrip() {
    if (!selectedRouteId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/driver/trips/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId: selectedRouteId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not start trip");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start trip");
    } finally {
      setBusy(false);
    }
  }

  if (activeTrip) {
    const busPosition =
      activeTrip.lastLat != null && activeTrip.lastLng != null
        ? {
            lat: activeTrip.lastLat,
            lng: activeTrip.lastLng,
            label: activeTrip.busPlate,
          }
        : undefined;

    const { isBoarding } = activeTrip;

    return (
      <div className="card relative overflow-hidden p-6 sm:p-8 h-full bg-deep-gradient text-ink-700 min-h-[420px]">
        <DriverTripMapLayer
          focused={mapFocused}
          busPosition={busPosition}
        />

        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -right-8 -bottom-12 w-56 h-56 rounded-full bg-brand-secondary/20 blur-3xl pointer-events-none" />

        <div
          className={`relative z-10 transition-opacity duration-300 ${
            mapFocused ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            {isBoarding ? "BOARDING" : "EN ROUTE"}
          </span>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-deep text-white text-xs font-bold tracking-wider">
              {activeTrip.busPlate}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium">
              <Route className="w-3.5 h-3.5 text-brand-primary" size={14} />
              {activeTrip.routeName}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium text-ink-500 capitalize">
              {activeTrip.direction.toLowerCase()}
            </span>
          </div>

          {isBoarding ? (
            <>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-ink-700">
                Boarding at{" "}
                <span className="text-brand-primary">{activeTrip.currentStopName}</span>
              </h2>
              <p className="mt-2 text-ink-500 text-sm max-w-md">
                Passengers can tap on or off. When everyone is settled, continue to
                {activeTrip.nextStopName ? (
                  <> <span className="font-medium text-ink-700">{activeTrip.nextStopName}</span>.</>
                ) : (
                  <> the next leg of your route.</>
                )}
              </p>
              {activeTrip.waitingAtStop > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                  <Users className="w-4 h-4 text-brand-primary" size={16} />
                  <span className="text-sm font-semibold text-brand-deep">
                    {activeTrip.waitingAtStop} passenger
                    {activeTrip.waitingAtStop === 1 ? "" : "s"} waiting to board
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-ink-700">
                {activeTrip.nextStopName ? (
                  <>
                    Next stop:{" "}
                    <span className="text-brand-primary">{activeTrip.nextStopName}</span>
                  </>
                ) : (
                  <>On route — ready for passengers</>
                )}
              </h2>
              <p className="mt-2 text-ink-500 text-sm max-w-md">
                Trip started {timeAgo(activeTrip.startedAt)}.
                {activeTrip.lastSeenAt
                  ? ` GPS updated ${timeAgo(activeTrip.lastSeenAt)}.`
                  : " Waiting for GPS fix."}{" "}
                Mark arrival when you reach the stop to open boarding.
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium text-ink-700">
              <Nfc className="w-3.5 h-3.5" size={14} /> Reader ready
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium text-ink-700">
              <Bus className="w-3.5 h-3.5 text-brand-primary" size={14} />
              {isBoarding ? "Collecting taps" : "Driving to stop"}
            </span>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isBoarding ? (
              <button
                type="button"
                onClick={departStop}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-brand-primary text-white font-semibold hover:bg-brand-primary-600 transition disabled:opacity-50 sm:col-span-2"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" size={16} />
                ) : (
                  <ArrowRight className="w-4 h-4" size={16} />
                )}
                {activeTrip.nextStopName
                  ? `Continue to ${activeTrip.nextStopName}`
                  : "Continue trip"}
              </button>
            ) : activeTrip.nextStopId ? (
              <button
                type="button"
                onClick={arriveAtStop}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-brand-primary text-white font-semibold hover:bg-brand-primary-600 transition disabled:opacity-50 sm:col-span-2"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" size={16} />
                ) : (
                  <MapPin className="w-4 h-4" size={16} />
                )}
                Arrived at {activeTrip.nextStopName ?? "stop"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setMapFocused(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-ink-100 bg-white/80 backdrop-blur hover:bg-white transition font-semibold text-ink-700"
            >
              <MapIcon className="w-4 h-4" size={16} />
              View route map
            </button>
            <button
              type="button"
              onClick={endTrip}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-ink-100 bg-white/80 backdrop-blur hover:bg-white transition font-semibold text-ink-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" size={16} />
              ) : (
                <Square className="w-4 h-4" size={16} />
              )}
              End trip
            </button>
          </div>
        </div>

        {mapFocused && (
          <DriverTripMapOverlay
            activeTrip={activeTrip}
            onClose={() => setMapFocused(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="card relative overflow-hidden p-6 sm:p-8 h-full min-h-[420px]">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-primary/20 blur-3xl pointer-events-none" />

      <div className="relative">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider">
          Start your shift
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-brand-deep leading-tight">
          No active trip
        </h2>
        <p className="mt-2 text-ink-500 text-sm max-w-md">
          Select your route and start a trip to begin collecting passenger taps and
          broadcasting your location to waiting riders.
        </p>

        {assignableRoutes.length > 0 ? (
          <div className="mt-6 max-w-md">
            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
              Route
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-ink-100 bg-white text-brand-deep font-medium focus:outline-none focus:border-brand-primary"
            >
              {assignableRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink-500">
            No routes assigned to your bus yet. Ask your operator to configure a default
            route in admin.
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg max-w-md">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={startTrip}
          disabled={busy || !selectedRouteId}
          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand-primary text-white font-semibold hover:bg-brand-primary-600 transition disabled:opacity-50 shadow-pop"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" size={16} />}
          Start trip
        </button>
      </div>
    </div>
  );
}

type BusPosition = { lat: number; lng: number; label: string };

// Map backdrop matching the passenger live-arrival hero: muted by a diagonal
// gradient scrim and non-interactive until the driver opens the full map.
function DriverTripMapLayer({
  focused,
  busPosition,
}: {
  focused: boolean;
  busPosition?: BusPosition;
}) {
  return (
    <>
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          focused ? "z-30 opacity-100" : "z-0 opacity-100"
        }`}
      >
        <LiveTripMap origin={busPosition} interactive={focused} />
      </div>

      {!focused && (
        <div
          aria-hidden
          className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-tr from-white from-30% via-white/80 via-65% to-transparent"
        />
      )}
    </>
  );
}

function DriverTripMapOverlay({
  activeTrip,
  onClose,
}: {
  activeTrip: ActiveTripView;
  onClose: () => void;
}) {
  const stopLabel = activeTrip.isBoarding
    ? `Boarding at ${activeTrip.currentStopName}`
    : activeTrip.nextStopName
      ? `Next: ${activeTrip.nextStopName}`
      : "On route";

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Hide map"
        className="absolute top-4 right-4 z-40 w-9 h-9 grid place-items-center rounded-full bg-white shadow-card text-brand-deep hover:bg-surface-subtle transition"
      >
        <X className="w-4 h-4" size={16} />
      </button>

      <div className="absolute bottom-4 left-4 right-4 z-40 rounded-2xl bg-white/95 backdrop-blur shadow-card border border-ink-100 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 grid place-items-center shrink-0">
          <Route className="w-4 h-4 text-brand-primary" size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
            Trip in progress
          </p>
          <p className="text-sm font-semibold text-brand-deep truncate">
            {activeTrip.routeName} · {activeTrip.busPlate}
          </p>
          <p className="text-xs text-ink-500 truncate">{stopLabel}</p>
        </div>
      </div>
    </>
  );
}
