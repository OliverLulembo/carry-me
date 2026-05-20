"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export type AdminTrip = {
  id: string;
  status: string;
  direction: string;
  startedAt: string;
  endedAt: string | null;
  busPlate: string;
  driverName: string;
  driverPhone: string;
  routeName: string;
  tapCount: number;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-warn/10 text-warn",
  COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-ink-100 text-ink-500",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TripsPanel({ initialTrips }: { initialTrips: AdminTrip[] }) {
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState(initialTrips);
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlStatus = searchParams.get("status") ?? "";
    if (urlStatus && urlStatus !== status) {
      setStatus(urlStatus);
    }
  }, [searchParams, status]);

  async function search() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (plate.trim()) params.set("plate", plate.trim());
    const res = await fetch(`/api/admin/trips?${params}`);
    const data = await res.json();
    if (res.ok) {
      setTrips(data.trips);
    } else {
      setError(data.error ?? "Could not load trips.");
    }
    setLoading(false);
  }

  async function deleteTrip(trip: AdminTrip) {
    const label = `${trip.busPlate} · ${trip.routeName} · ${formatWhen(trip.startedAt)}`;
    if (
      !confirm(
        `Delete this trip permanently?\n\n${label}\n\nAll ${trip.tapCount} tap record(s) on this trip will also be removed.`,
      )
    ) {
      return;
    }

    setDeletingId(trip.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
      setMessage("Trip deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <label>
          <span className="text-xs text-ink-500">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block px-3 py-2 rounded-xl border border-ink-100"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label className="flex-1 min-w-[160px]">
          <span className="text-xs text-ink-500">Bus plate</span>
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
            placeholder="e.g. ALD-1234"
          />
        </label>
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Filter"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {message}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        {trips.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink-500 text-center">No trips match your filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-subtle text-left text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Trip</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">Taps</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-t border-ink-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{trip.busPlate}</p>
                    <p className="text-xs text-ink-500">{trip.routeName}</p>
                    <p className="text-xs text-ink-300 font-mono mt-0.5">{trip.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[trip.status] ?? "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p>{trip.driverName}</p>
                    <p className="text-xs text-ink-500">{trip.driverPhone}</p>
                  </td>
                  <td className="px-4 py-3">{trip.tapCount}</td>
                  <td className="px-4 py-3">
                    <p>{formatWhen(trip.startedAt)}</p>
                    {trip.endedAt ? (
                      <p className="text-xs text-ink-500">Ended {formatWhen(trip.endedAt)}</p>
                    ) : (
                      <p className="text-xs text-ink-300">No end time</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void deleteTrip(trip)}
                      disabled={deletingId === trip.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-danger hover:bg-danger/5 disabled:opacity-60"
                    >
                      {deletingId === trip.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
