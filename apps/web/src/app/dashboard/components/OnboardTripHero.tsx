"use client";

import { Bus, Loader2, Nfc, Route } from "lucide-react";
import type { ActiveTap } from "./RideProvider";

export function OnboardTripHero(props: {
  activeTap: ActiveTap;
  rideLoading: boolean;
  rideBusy: boolean;
  isDestinationNext: boolean;
}) {
  const { activeTap, rideLoading, rideBusy, isDestinationNext } = props;
  const progressPct =
    activeTap.distanceToDestinationMeters == null
      ? 34
      : Math.max(8, Math.min(92, 100 - (activeTap.distanceToDestinationMeters / 8000) * 100));

  return (
    <div className="card relative overflow-hidden p-6 sm:p-8 h-full bg-deep-gradient text-ink-700 min-h-[420px]">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-primary/30 blur-3xl pointer-events-none" />
      <div className="absolute -right-8 -bottom-12 w-56 h-56 rounded-full bg-brand-secondary/20 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          ON BOARD
        </span>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-deep text-white text-xs font-bold tracking-wider">
            {activeTap.busPlate}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium">
            <Route className="w-3.5 h-3.5 text-brand-primary" size={14} />
            {activeTap.route.name}
          </span>
        </div>

        {rideLoading ? (
          <p className="mt-4 text-sm text-ink-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" size={16} />
            Updating your ride…
          </p>
        ) : activeTap.nextStop ? (
          <div className="mt-4">
            {isDestinationNext ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
                  Your stop is next
                </p>
                <h2 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-brand-primary">
                  {activeTap.nextStop.name}
                </h2>
              </>
            ) : (
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-ink-700">
                Next stop:{" "}
                <span className="text-brand-primary">{activeTap.nextStop.name}</span>
              </h2>
            )}
          </div>
        ) : (
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-ink-700">
            On route — enjoy the ride
          </h2>
        )}

        <p className="mt-2 text-ink-500 text-sm max-w-md">
          Boarded at <span className="font-medium text-ink-700">{activeTap.onStop.name}</span>
          {activeTap.groupSize > 1 ? ` · ${activeTap.groupSize} passengers` : ""}. Payment is
          completed when boarding.
        </p>

        <div className="mt-6 rounded-2xl border border-ink-100 bg-white/70 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-ink-700">
            <span>{activeTap.onStop.name}</span>
            <span>{activeTap.offStop?.name ?? "Destination"}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-semibold text-brand-deep">
            {activeTap.etaToDestinationMinutes != null
              ? `${activeTap.etaToDestinationMinutes} min`
              : "On route"}
            {activeTap.distanceToDestinationMeters != null
              ? ` · ${(activeTap.distanceToDestinationMeters / 1000).toFixed(1)} km remaining`
              : ""}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium text-ink-700">
            <Bus className="w-3.5 h-3.5 text-brand-primary" size={14} />
            Ride in progress
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-100 bg-white/60 backdrop-blur text-xs font-medium text-ink-700">
            <Nfc className="w-3.5 h-3.5" size={14} /> Paid at boarding
          </span>
        </div>

        {rideBusy && (
          <p className="mt-4 text-xs text-ink-500 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" size={14} />
            Updating payment status...
          </p>
        )}
      </div>
    </div>
  );
}
