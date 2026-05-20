"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Nfc,
  Search,
  X,
} from "lucide-react";
import { InboundBuses, type InboundBus } from "./InboundBuses";
import { OnboardTripHero } from "./OnboardTripHero";
import { useRide } from "./RideProvider";

// Live map needs DOM access (Leaflet), so it must be client-only. Importing
// it dynamically with ssr:false keeps it out of the server bundle.
const LiveTripMap = dynamic(() => import("./LiveTripMap"), { ssr: false });

type NearestStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  walkingMinutes: number;
  distanceMeters: number;
};

type StopOption = { id: string; name: string; lat: number; lng: number };

type LiveArrival = {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLng: number;
  expiresAt: string;
  destination: { id: string; name: string; lat: number; lng: number } | null;
  nextBusArrivalAt: string | null;
};

// Endpoints describing the live trip — used to caption the focused map view.
type MapPoint = { lat: number; lng: number; label: string };
type TripForMap = {
  origin?: MapPoint;
  destination?: MapPoint;
  fromStopId?: string;
  toStopId?: string;
};

export function TripHero({
  liveArrival,
  nearestStops,
  allStops,
  inboundBuses,
}: {
  liveArrival: LiveArrival | null;
  nearestStops: NearestStop[];
  allStops: StopOption[];
  // Inbound buses for the live arrival stop. Embedded inline in the live-arrival
  // view (replacing the old "See inbound buses" scroll anchor) so passengers
  // don't have to leave the hero to see what's coming. Pre-arrival, this is
  // empty / ignored — the standalone <InboundBuses> card on the dashboard
  // handles the "closest stop" preview.
  inboundBuses: InboundBus[];
}) {
  const router = useRouter();
  const {
    activeTap,
    loading: rideLoading,
    busy: rideBusy,
    error: rideError,
    destinationStopId,
    tapOn,
  } = useRide();

  const [destination, setDestination] = useState<StopOption | null>(
    liveArrival?.destination ?? null,
  );
  const [arrivalStopId, setArrivalStopId] = useState<string | undefined>(
    liveArrival?.stopId ?? nearestStops[0]?.id,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapFocused, setMapFocused] = useState(false);

  const nextBusCountdown = useCountdown(liveArrival?.nextBusArrivalAt);

  // Resolve the "trip" the user has selected so the map backdrop has something
  // to render. In the live-arrival branch this is current-stop → destination;
  // pre-arrival it's selected-from → selected-destination.
  const trip: TripForMap = useMemo(() => {
    if (liveArrival) {
      return {
        origin: {
          lat: liveArrival.stopLat,
          lng: liveArrival.stopLng,
          label: liveArrival.stopName,
        },
        destination: liveArrival.destination
          ? {
              lat: liveArrival.destination.lat,
              lng: liveArrival.destination.lng,
              label: liveArrival.destination.name,
            }
          : undefined,
        fromStopId: liveArrival.stopId,
        toStopId: liveArrival.destination?.id,
      };
    }
    const fromStop = nearestStops.find((s) => s.id === arrivalStopId);
    return {
      origin: fromStop
        ? { lat: fromStop.lat, lng: fromStop.lng, label: fromStop.name }
        : undefined,
      destination: destination
        ? { lat: destination.lat, lng: destination.lng, label: destination.name }
        : undefined,
      fromStopId: fromStop?.id,
      toStopId: destination?.id,
    };
  }, [liveArrival, nearestStops, arrivalStopId, destination]);

  // Once the soonest bus is "due", pull fresh data so the next one slides in.
  useEffect(() => {
    if (
      liveArrival?.nextBusArrivalAt &&
      nextBusCountdown != null &&
      nextBusCountdown <= 0
    ) {
      const id = setTimeout(() => router.refresh(), 1_000);
      return () => clearTimeout(id);
    }
  }, [liveArrival?.nextBusArrivalAt, nextBusCountdown, router]);

  async function logArrival() {
    if (!arrivalStopId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stops/${arrivalStopId}/arrivals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationStopId: destination?.id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not log arrival");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log arrival");
    } finally {
      setBusy(false);
    }
  }

  // ── On board (tapped on) — trip context lives in the hero ─────────────────
  if (activeTap) {
    const isDestinationNext =
      !!activeTap.nextStop &&
      !!(destinationStopId ?? activeTap.offStop?.id) &&
      activeTap.nextStop.id === (destinationStopId ?? activeTap.offStop?.id);

    return (
      <OnboardTripHero
        activeTap={activeTap}
        rideLoading={rideLoading}
        rideBusy={rideBusy}
        isDestinationNext={isDestinationNext}
      />
    );
  }

  // ── Live arrival view ────────────────────────────────────────────────────
  if (liveArrival) {
    return (
      <div className="card relative overflow-hidden p-6 sm:p-8 h-full bg-deep-gradient text-ink-700 min-h-[420px]">
        <TripMapLayer
          focused={mapFocused}
          onOpen={() => setMapFocused(true)}
          variant="dark"
          trip={trip}
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
            WAITING AT STOP
          </span>

          {liveArrival.destination && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium">
              <Navigation className="w-3.5 h-3.5 text-brand-primary" size={14} />
              <span className="text-ink-500">Heading to</span>
              <span className="font-semibold text-ink-700">{liveArrival.destination.name}</span>
            </div>
          )}

          <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-ink-700">
            You&apos;re at{" "}
            <span className="text-brand-primary">{liveArrival.stopName}</span>
          </h2>
          <p className="mt-2 text-ink-500 text-sm max-w-md">
            Drivers heading here know you&apos;re waiting. Hold your phone to the
            driver&apos;s reader to board.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium text-ink-700">
              <Nfc className="w-3.5 h-3.5" size={14} /> Tap-to-ride ready
            </span>
            {liveArrival.nextBusArrivalAt && nextBusCountdown != null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-brand-primary" size={14} />
                <span className="text-ink-500">Next bus in</span>
                <span
                  className="font-bold text-brand-primary tabular-nums"
                  aria-live="polite"
                >
                  {formatCountdown(nextBusCountdown)}
                </span>
              </span>
            )}
            {liveArrival.nextBusArrivalAt == null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium text-ink-500">
                <Clock className="w-3.5 h-3.5" size={14} />
                <span>No buses inbound yet</span>
              </span>
            )}
          </div>

          {/* Inbound buses, inline. Replaces the old scroll-anchor button — the
             list is what the passenger came here for, so we just show it. */}
          <div className="mt-6">
            <InboundBuses
              stopName={liveArrival.stopName}
              isLiveArrival
              buses={inboundBuses}
              variant="embedded"
              onPayNow={(tripId) => void tapOn(tripId)}
              payingTripId={rideBusy ? "__busy__" : null}
            />
          </div>

          {rideError && (
            <p className="mt-3 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">
              {rideError}
            </p>
          )}

          <button
            onClick={async () => {
              setBusy(true);
              try {
                await fetch(
                  `/api/stops/${liveArrival.stopId}/arrivals/cancel`,
                  { method: "POST" },
                ).catch(() => null);
                router.refresh();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-ink-100 bg-white/80 backdrop-blur hover:bg-white hover:border-ink-300 transition text-ink-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" size={16} />}
            I&apos;m no longer waiting
          </button>
        </div>

        {mapFocused && (
          <TripFocusedOverlay
            trip={trip}
            mode="live"
            onClose={() => setMapFocused(false)}
          />
        )}
      </div>
    );
  }

  // ── Pre-arrival view: destination first, then "from" ─────────────────────
  // No map here yet — the map appears only after the user logs their arrival
  // ("I'm here — find my bus to…"), which moves them into the live-arrival
  // branch above. Showing the map before that would be premature, since the
  // trip isn't really "selected" until they've committed to a stop.
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 h-full bg-brand-primary text-white shadow-pop">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/15 blur-3xl pointer-events-none" />

      <div className="relative">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wider">
          <Navigation className="w-3.5 h-3.5" size={14} />
          Plan your ride
        </span>

        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white leading-tight">
          Where are you headed?
        </h2>
        <p className="mt-2 text-white/80 text-sm max-w-md">
          Pick your destination and we&apos;ll show you the right bus to catch.
        </p>

        {/* DESTINATION AUTOCOMPLETE — top of the hero */}
        <div className="mt-5">
          <DestinationAutocomplete
            stops={allStops}
            selected={destination}
            onSelect={setDestination}
            excludeStopId={arrivalStopId}
          />
        </div>

        {/* WHERE YOU ARE — only meaningful once a destination is picked */}
        <div
          className={`mt-6 transition-opacity ${
            destination ? "opacity-100" : "opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/80 font-medium uppercase tracking-wider">
              {destination ? "Where are you now?" : "Then tell us where you are"}
            </p>
            {destination && (
              <p className="text-xs text-white/70">
                Nearest stops to your location
              </p>
            )}
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {nearestStops.map((s) => {
              const active = s.id === arrivalStopId;
              const disabled = !destination || s.id === destination.id;
              return (
                <button
                  key={s.id}
                  onClick={() => !disabled && setArrivalStopId(s.id)}
                  disabled={disabled}
                  className={`text-left px-4 py-3 rounded-xl border transition ${
                    disabled
                      ? "border-ink-100 bg-surface-subtle cursor-not-allowed opacity-50"
                      : active
                        ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20"
                        : "border-ink-100 hover:border-brand-primary/30 hover:bg-surface-subtle"
                  }`}
                  title={
                    destination && s.id === destination.id
                      ? "This is your destination"
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-deep">
                      {s.name}
                    </span>
                    {active && !disabled && (
                      <CheckCircle2
                        className="w-4 h-4 text-brand-primary"
                        size={16}
                      />
                    )}
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {s.walkingMinutes} min walk · {Math.round(s.distanceMeters)} m
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          onClick={logArrival}
          disabled={busy || !arrivalStopId || !destination}
          className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white text-brand-primary font-semibold hover:bg-brand-accent transition shadow-pop disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" size={16} />}
          {destination
            ? `I'm here — find my bus to ${destination.name}`
            : "Pick a destination to continue"}
          {destination && <ArrowRight className="w-4 h-4" size={16} />}
        </button>
        <p className="mt-2 text-xs text-white/70">
          Logs your arrival for 30 min. Drivers on inbound routes will see you.
        </p>
      </div>
    </div>
  );
}

// ─── Map backdrop + "View map" affordance ──────────────────────────────────
// Live OpenStreetMap layer sitting behind the live-arrival hero. While
// unfocused, the map is muted by the diagonal gradient scrim and is
// non-interactive (pointer-events: none from LiveTripMap). Clicking "View
// map" promotes the layer to `z-30`, drops the scrim, and enables full
// interaction. The gradient stays at `z-[1]` so it always sits between map
// and text content per the design.
function TripMapLayer({
  focused,
  onOpen,
  variant,
  trip,
}: {
  focused: boolean;
  onOpen: () => void;
  variant: "light" | "dark";
  trip: TripForMap;
}) {
  return (
    <>
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          focused ? "z-30 opacity-100" : "z-0 opacity-100"
        }`}
      >
        <LiveTripMap
          origin={trip.origin}
          destination={trip.destination}
          fromStopId={trip.fromStopId}
          toStopId={trip.toStopId}
          interactive={focused}
        />
      </div>

      {!focused && (
        <div
          aria-hidden
          className={`absolute inset-0 z-[1] pointer-events-none ${
            variant === "dark"
              ? "bg-gradient-to-tr from-white from-30% via-white/80 via-65% to-transparent"
              : "bg-gradient-to-br from-white/92 via-white/88 to-white/80"
          }`}
        />
      )}

      {!focused && (
        <button
          type="button"
          onClick={onOpen}
          className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-card backdrop-blur transition bg-brand-deep text-brand-accent hover:bg-brand-deep/90"
          aria-label="View map"
        >
          <MapIcon className="w-3.5 h-3.5" size={14} />
          View map
        </button>
      )}
    </>
  );
}

// Fullscreen-within-card overlay shown while the map is focused. Renders a
// compact trip summary so the user keeps context, plus a close affordance.
function TripFocusedOverlay({
  trip,
  mode,
  onClose,
}: {
  trip: TripForMap;
  mode: "planning" | "live";
  onClose: () => void;
}) {
  const { origin, destination } = trip;

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
          <Navigation className="w-4 h-4 text-brand-primary" size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
            {mode === "live" ? "Waiting at" : "Selected trip"}
          </p>
          <p className="text-sm font-semibold text-brand-deep truncate">
            {origin?.label ?? "—"}
            {destination && (
              <>
                <ArrowRight
                  className="inline w-3.5 h-3.5 mx-1.5 text-ink-300 align-middle"
                  size={14}
                />
                {destination.label}
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Destination autocomplete (combobox) ───────────────────────────────────
function DestinationAutocomplete({
  stops,
  selected,
  onSelect,
  excludeStopId,
}: {
  stops: StopOption[];
  selected: StopOption | null;
  onSelect: (s: StopOption | null) => void;
  excludeStopId?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = stops.filter((s) => s.id !== excludeStopId);
    if (!q) return base.slice(0, 6);
    return base
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [stops, query, excludeStopId]);

  // Reset highlight when filter shrinks
  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered.length, highlight]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(s: StopOption) {
    onSelect(s);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clear() {
    onSelect(null);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const next = filtered[highlight];
      if (next) pick(next);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition bg-white ${
          open
            ? "border-brand-primary ring-4 ring-brand-primary/15"
            : selected
              ? "border-brand-primary/40"
              : "border-ink-100 hover:border-ink-300"
        }`}
      >
        <Search
          className={`w-5 h-5 shrink-0 ${
            open || selected ? "text-brand-primary" : "text-ink-300"
          }`}
          size={20}
        />
        {selected ? (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider shrink-0">
              To
            </span>
            <span className="text-base font-semibold text-brand-deep truncate">
              {selected.name}
            </span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search a destination (e.g. Town, Manda Hill)"
            className="flex-1 bg-transparent outline-none text-base text-brand-deep placeholder-ink-300"
            role="combobox"
            aria-expanded={open}
            aria-controls="destination-listbox"
            aria-autocomplete="list"
          />
        )}
        {(selected || query) && (
          <button
            onClick={clear}
            aria-label="Clear destination"
            className="shrink-0 w-7 h-7 grid place-items-center rounded-full hover:bg-surface-subtle text-ink-500 hover:text-brand-deep transition"
          >
            <X className="w-4 h-4" size={16} />
          </button>
        )}
      </div>

      {open && !selected && filtered.length > 0 && (
        <ul
          id="destination-listbox"
          role="listbox"
          className="absolute z-20 mt-2 left-0 right-0 bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden max-h-80 overflow-y-auto"
        >
          {!query && (
            <li className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Suggested destinations
            </li>
          )}
          {filtered.map((s, i) => {
            const active = i === highlight;
            return (
              <li key={s.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    active
                      ? "bg-brand-primary/10 text-brand-deep"
                      : "hover:bg-surface-subtle text-brand-deep"
                  }`}
                >
                  <span
                    className={`w-8 h-8 grid place-items-center rounded-lg shrink-0 ${
                      active
                        ? "bg-brand-primary text-white"
                        : "bg-surface-subtle text-ink-500"
                    }`}
                  >
                    <MapPin className="w-4 h-4" size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate block">
                      {s.name}
                    </span>
                  </span>
                  {active && (
                    <ArrowRight
                      className="w-4 h-4 text-brand-primary shrink-0"
                      size={16}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && !selected && query && filtered.length === 0 && (
        <div className="absolute z-20 mt-2 left-0 right-0 bg-white rounded-2xl border border-ink-100 shadow-card p-6 text-center">
          <p className="text-sm text-ink-500">
            No stop matches{" "}
            <span className="font-semibold text-brand-deep">
              &ldquo;{query}&rdquo;
            </span>
          </p>
          <p className="text-xs text-ink-300 mt-1">
            Try a shorter name (e.g. &ldquo;Town&rdquo; instead of
            &ldquo;Town Bus Station&rdquo;)
          </p>
        </div>
      )}
    </div>
  );
}

// Returns seconds remaining until `target`, ticking every second on the client.
// Null when no target. Clamped at 0 so the UI can show "Arriving now".
function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [target]);
  return useMemo(() => {
    if (!target) return null;
    const diffMs = new Date(target).getTime() - now;
    return Math.max(0, Math.round(diffMs / 1_000));
  }, [target, now]);
}

function formatCountdown(totalSeconds: number) {
  if (totalSeconds <= 0) return "Arriving";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
