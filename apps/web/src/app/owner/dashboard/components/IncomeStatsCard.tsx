import { CalendarDays, Coins, Route } from "lucide-react";
import { formatZmw } from "@/lib/format";

export type BusIncomeRow = {
  busId: string;
  plate: string;
  active: boolean;
  todayCredits: number;
  weekCredits: number;
};

export function IncomeStatsCard({
  todayCredits,
  weekCredits,
  monthCredits,
  todayTrips,
  weekTrips,
  byBus,
}: {
  todayCredits: number;
  weekCredits: number;
  monthCredits: number;
  todayTrips: number;
  weekTrips: number;
  byBus: BusIncomeRow[];
}) {
  return (
    <div className="card p-6 h-full">
      <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
        <Coins className="w-3.5 h-3.5 text-brand-primary" size={14} />
        Income overview
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatPill label="Today" value={formatZmw(todayCredits)} sub={`${todayTrips} fares`} />
        <StatPill label="7 days" value={formatZmw(weekCredits)} sub={`${weekTrips} trips`} />
        <StatPill label="30 days" value={formatZmw(monthCredits)} sub="settled" />
      </div>

      {byBus.length > 0 ? (
        <ByBusList byBus={byBus} />
      ) : (
        <p className="text-sm text-ink-500 mt-6 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 shrink-0" size={16} />
          Add a bus to start tracking route earnings.
        </p>
      )}
    </div>
  );
}

function StatPill({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <StatPillInner label={label} value={value} sub={sub} />;
}

function StatPillInner({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-surface-subtle p-3">
      <p className="text-[10px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className="text-lg font-bold text-brand-deep mt-0.5 tabular-nums">{value}</p>
      <p className="text-[10px] text-ink-500 mt-0.5">{sub}</p>
    </div>
  );
}

function ByBusList({ byBus }: { byBus: BusIncomeRow[] }) {
  return (
    <div className="mt-6 pt-5 border-t border-ink-100">
      <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5 mb-3">
        <Route className="w-3.5 h-3.5" size={14} />
        By bus (7 days)
      </p>
      <ul className="space-y-2">
        {byBus.map((b) => (
          <li
            key={b.busId}
            className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-surface-subtle"
          >
            <span className="font-medium text-brand-deep">
              {b.plate}
              {!b.active && (
                <span className="ml-2 text-[10px] uppercase text-ink-500 font-normal">
                  inactive
                </span>
              )}
            </span>
            <span className="tabular-nums text-ink-700">{formatZmw(b.weekCredits)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
