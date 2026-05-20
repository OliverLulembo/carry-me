import { Clock, MapPin, Users } from "lucide-react";

export type UpcomingStop = {
  id: string;
  name: string;
  order: number;
  etaMinutes: number | null;
  waitingCount: number;
  isCurrent: boolean;
};

export function UpcomingStops({ stops }: { stops: UpcomingStop[] }) {
  return (
    <div id="upcoming-stops" className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-deep flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-primary" size={16} />
            Upcoming stops
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Passengers who tapped &quot;I&apos;m here&quot; on your route
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          Live
        </span>
      </div>

      {stops.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="w-8 h-8 text-ink-300 mx-auto mb-2" size={32} />
          <p className="text-sm text-ink-500">No upcoming stops on this route.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {stops.map((s, i) => (
            <li
              key={s.id}
              className="p-4 rounded-xl border border-ink-100 hover:border-brand-primary/30 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand-deep text-white text-xs font-bold grid place-items-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-brand-deep truncate">
                      {s.name}
                      {s.isCurrent ? (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
                          · Boarding
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-ink-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ink-500" size={14} />
                      {s.isCurrent ? "Boarding now" : s.etaMinutes != null ? `${s.etaMinutes} min` : "ETA—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-ink-500" size={14} />
                      {s.waitingCount} waiting
                    </span>
                  </div>
                </div>
                {s.waitingCount > 0 && (
                  <div className="shrink-0 text-right pl-2">
                    <div className="text-3xl font-bold text-brand-primary leading-none tabular-nums">
                      {s.waitingCount}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      {s.waitingCount === 1 ? "passenger" : "passengers"}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
