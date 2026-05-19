import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Flag,
  Users,
  XCircle,
} from "lucide-react";
import { formatZmw, timeAgo } from "@/lib/format";
import type { PassengerTripRow } from "@/lib/passenger-trips";

const TAP_STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  SETTLED: {
    label: "Completed",
    className: "bg-success/15 text-success",
    icon: CheckCircle2,
  },
  HELD: {
    label: "On board",
    className: "bg-brand-primary/10 text-brand-primary",
    icon: Bus,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-ink-100 text-ink-500",
    icon: XCircle,
  },
  FLAGGED: {
    label: "Under review",
    className: "bg-amber-100 text-amber-800",
    icon: Flag,
  },
};

function formatTripDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function tripDurationMinutes(onAt: string, offAt: string | null): number | null {
  if (!offAt) return null;
  const mins = Math.round((new Date(offAt).getTime() - new Date(onAt).getTime()) / 60_000);
  return Math.max(1, mins);
}

function fareLabel(trip: PassengerTripRow): { amount: number; label: string } {
  if (trip.status === "SETTLED" && trip.finalCredits != null) {
    return { amount: trip.finalCredits, label: "Charged" };
  }
  if (trip.status === "HELD") {
    return {
      amount: trip.reservedCredits,
      label: trip.reservedCredits > 0 ? "Reserved" : "Pending",
    };
  }
  return { amount: trip.finalCredits ?? trip.reservedCredits, label: "Fare" };
}

export function TripsList({ trips }: { trips: PassengerTripRow[] }) {
  if (trips.length === 0) {
    return <TripsEmptyState />;
  }

  return (
    <ul className="divide-y divide-ink-100">
      {trips.map((trip) => (
        <TripRow key={trip.id} trip={trip} />
      ))}
    </ul>
  );
}

function TripRow({ trip }: { trip: PassengerTripRow }) {
  const meta = TAP_STATUS_META[trip.status] ?? TAP_STATUS_META.HELD;
  const StatusIcon = meta.icon;
  const fare = fareLabel(trip);
  const duration = tripDurationMinutes(trip.tappedOnAt, trip.tappedOffAt);
  const destination = trip.offStop?.name ?? (trip.status === "HELD" ? "In progress" : "—");

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <article className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 min-w-0 flex-1">
          <span
            className={`w-10 h-10 grid place-items-center rounded-xl shrink-0 ${meta.className}`}
          >
            <StatusIcon className="w-5 h-5" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-brand-deep">{trip.trip.routeName}</h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-sm text-brand-deep flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{trip.onStop.name}</span>
              <ArrowRight className="w-3.5 h-3.5 text-ink-300 shrink-0" size={14} />
              <span className={trip.offStop ? "font-medium" : "text-ink-500 italic"}>
                {destination}
              </span>
            </p>
            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-500">
              <DetailRow icon={Bus} label={`Bus ${trip.trip.busPlate}`} />
              <DetailRow
                icon={Clock}
                label={`Boarded ${timeAgo(trip.tappedOnAt)}`}
                title={formatTripDate(trip.tappedOnAt)}
              />
              {trip.groupSize > 1 && (
                <DetailRow icon={Users} label={`${trip.groupSize} passengers`} />
              )}
              <div className="sm:col-span-2 text-[11px] text-ink-300">
                {formatTripDate(trip.tappedOnAt)}
              </div>
            </dl>
          </div>
        </div>
        <div className="sm:text-right shrink-0 sm:pl-4 border-t sm:border-t-0 border-ink-100 pt-3 sm:pt-0">
          <p className="text-lg font-semibold text-brand-deep">{formatZmw(fare.amount)}</p>
          <p className="text-xs text-ink-500">{fare.label}</p>
          {duration != null && (
            <p className="text-xs text-ink-500 mt-1">{duration} min ride</p>
          )}
        </div>
      </article>
    </li>
  );
}

function DetailRow({
  icon: Icon,
  label,
  title,
}: {
  icon: typeof Bus;
  label: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={title}>
      <Icon className="w-3.5 h-3.5 shrink-0" size={14} />
      <span>{label}</span>
    </div>
  );
}

function TripsEmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-primary/10 grid place-items-center">
        <Bus className="w-7 h-7 text-brand-primary" size={28} />
      </div>
      <p className="text-sm font-semibold text-brand-deep">No trips yet</p>
      <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
        When you tap on a bus, your ride history will appear here with route, fare, and stop details.
      </p>
    </div>
  );
}
