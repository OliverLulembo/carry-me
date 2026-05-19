import { Bus, Coins, Users } from "lucide-react";
import { formatZmw } from "@/lib/format";

export function TripStatsCard({
  busPlate,
  onboard,
  capacity,
  creditsToday,
  tripsToday,
}: {
  busPlate: string | null;
  onboard: number;
  capacity: number;
  creditsToday: number;
  tripsToday: number;
}) {
  const fillPct = capacity > 0 ? Math.min(100, (onboard / capacity) * 100) : 0;
  const fillTone =
    fillPct < 50 ? "bg-success" : fillPct < 80 ? "bg-warn" : "bg-danger";

  return (
    <div className="card p-6 h-full flex flex-col text-ink-700 relative overflow-hidden shadow-pop">
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-primary/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-44 h-44 rounded-full bg-brand-secondary/20 blur-2xl pointer-events-none" />

      <div className="relative">
        <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
          Today&apos;s shift
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-brand-deep">{formatZmw(creditsToday)}</span>
        </div>
        <p className="text-xs text-ink-500 mt-1">Credits collected on your trips</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          {busPlate && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-ink-100 bg-surface-subtle text-ink-700">
              <Bus className="w-3 h-3 text-brand-primary" size={12} />
              {busPlate}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full border border-ink-100 bg-surface-subtle text-ink-700">
            {tripsToday} {tripsToday === 1 ? "trip" : "trips"} today
          </span>
        </div>

        <div className="mt-6 pt-5 border-t border-ink-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" size={14} />
              On board now
            </p>
            <span className="text-sm font-bold text-brand-deep tabular-nums">
              {onboard}/{capacity}
            </span>
          </div>
          <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${fillTone} transition-all`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="text-[11px] text-ink-500 mt-2 flex items-center gap-1">
            <Coins className="w-3 h-3" size={12} />
            {capacity - onboard} seats available
          </p>
        </div>
      </div>
    </div>
  );
}
