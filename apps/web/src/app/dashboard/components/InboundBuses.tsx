import { Bus, Clock, Nfc, Users } from "lucide-react";

export type InboundBus = {
  tripId: string;
  busPlate: string;
  routeName: string;
  seatsAvailable: number;
  capacity: number;
  etaMinutes: number | null;
  arrivedAtStop: boolean;
};

export function InboundBuses({
  stopName,
  isLiveArrival,
  buses,
  variant = "card",
  onBoard,
  boardingBusy,
}: {
  stopName: string;
  isLiveArrival: boolean;
  buses: InboundBus[];
  variant?: "card" | "embedded";
  onBoard?: (tripId: string) => void;
  boardingBusy?: boolean;
}) {
  const isEmbedded = variant === "embedded";
  const readyBuses = buses.filter((b) => b.arrivedAtStop);
  const pendingBuses = buses.filter((b) => !b.arrivedAtStop);

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
          {[...readyBuses, ...pendingBuses].map((b) => (
            <BusRow
              key={b.tripId}
              bus={b}
              isEmbedded={isEmbedded}
              onBoard={onBoard}
              boardingBusy={boardingBusy}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BusRow({
  bus: b,
  isEmbedded,
  onBoard,
  boardingBusy,
}: {
  bus: InboundBus;
  isEmbedded: boolean;
  onBoard?: (tripId: string) => void;
  boardingBusy?: boolean;
}) {
  const fillPct = Math.min(100, ((b.capacity - b.seatsAvailable) / b.capacity) * 100);
  const fillTone = fillPct < 50 ? "bg-success" : fillPct < 80 ? "bg-warn" : "bg-danger";
  const arrived = b.arrivedAtStop;

  if (arrived && onBoard) {
    return (
      <li>
        <button
          type="button"
          disabled={boardingBusy || b.seatsAvailable === 0}
          onClick={() => onBoard(b.tripId)}
          className={`w-full text-left p-5 rounded-2xl border-2 border-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 transition shadow-pop disabled:opacity-60 ${
            isEmbedded ? "backdrop-blur" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                Bus is here — tap to board
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-brand-deep text-white text-sm font-bold tracking-wider">
                  {b.busPlate}
                </span>
                <span className="text-sm text-ink-500 truncate">{b.routeName}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-deep">
                Tap your phone to board · {b.seatsAvailable} seat{b.seatsAvailable === 1 ? "" : "s"} left
              </p>
            </div>
            <span className="shrink-0 w-12 h-12 rounded-2xl bg-brand-primary text-white grid place-items-center">
              <Nfc className="w-6 h-6" size={24} />
            </span>
          </div>
        </button>
      </li>
    );
  }

  return (
    <li
      className={`p-4 rounded-xl border border-ink-100 hover:border-brand-primary/30 transition ${
        isEmbedded ? "bg-white/80 backdrop-blur" : ""
      } ${arrived ? "border-brand-primary/40 bg-brand-primary/5" : ""}`}
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
            {arrived ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-brand-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                At your stop — tap to board
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-ink-500" size={14} />
                {b.etaMinutes != null ? `${b.etaMinutes} min` : "ETA—"}
              </span>
            )}
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
        </div>
      </div>
    </li>
  );
}
