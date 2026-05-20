"use client";

import { useState } from "react";
import { Bus, Clock, Users } from "lucide-react";

export type InboundBus = {
  tripId: string;
  busPlate: string;
  routeName: string;
  seatsAvailable: number;
  capacity: number;
  etaMinutes: number | null;
};

export function InboundBuses({
  stopName,
  isLiveArrival,
  buses,
  variant = "card",
  onPayNow,
  payingTripId,
}: {
  stopName: string;
  isLiveArrival: boolean;
  buses: InboundBus[];
  // "card"     — standalone surface on the dashboard grid (default).
  // "embedded" — rendered inside another card (e.g. TripHero); drops the
  //              outer card wrapper and the now-redundant stop subtitle.
  variant?: "card" | "embedded";
  onPayNow?: (tripId: string) => void;
  payingTripId?: string | null;
}) {
  const isEmbedded = variant === "embedded";
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  return (
    <div
      id={isEmbedded ? undefined : "inbound-buses"}
      className={isEmbedded ? "" : "card p-5 h-full"}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-deep flex items-center gap-2">
            <Bus className="w-4 h-4 text-brand-primary" size={16} /> Inbound buses
          </h3>
          {!isEmbedded && (
            <p className="text-xs text-ink-500 mt-0.5">
              {isLiveArrival ? "Heading to your stop:" : "Closest stop:"}{" "}
              <span className="font-medium text-brand-deep">{stopName}</span>
            </p>
          )}
        </div>
        {isLiveArrival && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            Live
          </span>
        )}
      </div>

      {buses.length === 0 ? (
        <div
          className={`text-center ${
            isEmbedded
              ? "py-6 rounded-xl border border-ink-100 bg-white/70 backdrop-blur"
              : "py-8"
          }`}
        >
          <Bus className="w-8 h-8 text-ink-300 mx-auto mb-2" size={32} />
          <p className="text-sm text-ink-500">No active buses on this route right now.</p>
          <p className="text-xs text-ink-300 mt-1">Check back in a couple of minutes.</p>
        </div>
      ) : (
        <ul
          className={`space-y-2.5 ${
            isEmbedded ? "max-h-[280px] overflow-y-auto pr-1" : ""
          }`}
        >
          {buses.map((b) => {
            const fillPct = Math.min(100, ((b.capacity - b.seatsAvailable) / b.capacity) * 100);
            const fillTone =
              fillPct < 50 ? "bg-success" : fillPct < 80 ? "bg-warn" : "bg-danger";
            const selected = selectedTripId === b.tripId;
            return (
              <li
                key={b.tripId}
                className={`p-4 rounded-xl border transition ${
                  selected
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-ink-100 hover:border-brand-primary/30"
                } ${
                  isEmbedded && !selected ? "bg-white/80 backdrop-blur" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-brand-deep text-white text-xs font-bold tracking-wider">
                        {b.busPlate}
                      </span>
                      <span className="text-xs text-ink-500 truncate">{b.routeName}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-ink-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink-500" size={14} />
                        {b.etaMinutes != null ? `${b.etaMinutes} min` : "ETA—"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-ink-500" size={14} />
                        {b.seatsAvailable}/{b.capacity} seats
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${fillTone} transition-all`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right pl-2" aria-label={`${b.seatsAvailable} seats available`}>
                    <div className="text-3xl font-bold text-brand-primary leading-none tabular-nums">
                      {b.seatsAvailable}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      {b.seatsAvailable === 1 ? "seat free" : "seats free"}
                    </div>
                    {onPayNow && !selected && (
                      <button
                        type="button"
                        onClick={() => setSelectedTripId(b.tripId)}
                        disabled={payingTripId != null}
                        className="mt-3 inline-flex items-center justify-center rounded-lg border border-brand-primary px-3 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 disabled:opacity-60"
                      >
                        Pick bus
                      </button>
                    )}
                    {onPayNow && selected && (
                      <button
                        type="button"
                        onClick={() => onPayNow(b.tripId)}
                        disabled={payingTripId != null}
                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white hover:bg-brand-primary-600 disabled:opacity-60"
                      >
                        {payingTripId === b.tripId ? "Paying..." : "Pay now"}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
