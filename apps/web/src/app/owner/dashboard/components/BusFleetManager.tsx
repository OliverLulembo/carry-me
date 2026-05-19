"use client";

import { useState } from "react";
import { Bus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

export type OwnerBus = {
  id: string;
  plate: string;
  capacity: number;
  active: boolean;
  defaultRouteId: string | null;
  defaultRouteName: string | null;
  createdAt: string;
  tripCount: number;
};

type RouteOption = { id: string; name: string };

export function BusFleetManager({
  initialBuses,
  routes,
}: {
  initialBuses: OwnerBus[];
  routes: RouteOption[];
}) {
  const [buses, setBuses] = useState(initialBuses);
  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState(22);
  const [defaultRouteId, setDefaultRouteId] = useState<string>("");
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setPlate("");
    setCapacity(22);
    setDefaultRouteId("");
    setActive(true);
    setError(null);
  }

  function startEdit(bus: OwnerBus) {
    setEditingId(bus.id);
    setPlate(bus.plate);
    setCapacity(bus.capacity);
    setDefaultRouteId(bus.defaultRouteId ?? "");
    setActive(bus.active);
    setError(null);
    setMessage(null);
  }

  async function refreshList() {
    const res = await fetch("/api/owner/buses");
    const data = await res.json();
    if (res.ok) setBuses(data.buses);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const body = {
        plate: plate.trim(),
        capacity,
        defaultRouteId: defaultRouteId || null,
        active,
      };
      const res = await fetch(
        editingId ? `/api/owner/buses/${editingId}` : "/api/owner/buses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      await refreshList();
      setMessage(editingId ? "Bus updated." : "Bus added to your fleet.");
      if (!editingId) resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this bus from your fleet? Buses with trip history are deactivated."))
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/owner/buses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await refreshList();
      if (editingId === id) resetForm();
      setMessage(data.message ?? (data.deactivated ? "Bus deactivated." : "Bus removed."));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="fleet" className="card p-5 space-y-4 scroll-mt-24">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-brand-deep flex items-center gap-2">
            <Bus className="w-5 h-5 text-brand-primary" size={20} />
            Your fleet
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Register plates, capacity, and default routes for your buses.
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="text-sm text-brand-primary font-medium hover:underline"
          >
            Cancel edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block sm:col-span-1">
          <span className="text-xs font-medium text-ink-500">Plate</span>
          <input
            className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm uppercase"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="ALD-1234"
            required
            maxLength={12}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink-500">Capacity</span>
          <input
            type="number"
            min={8}
            max={80}
            className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            required
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-ink-500">Default route</span>
          <select
            className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm bg-white"
            value={defaultRouteId}
            onChange={(e) => setDefaultRouteId(e.target.value)}
          >
            <option value="">None</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            id="bus-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-ink-200"
          />
          <span className="text-sm text-ink-700">Active</span>
        </label>
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-deep text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" size={16} />
            ) : editingId ? (
              <Pencil className="w-4 h-4" size={16} />
            ) : (
              <Plus className="w-4 h-4" size={16} />
            )}
            {editingId ? "Save bus" : "Add bus"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      <ul className="divide-y divide-ink-100 border border-ink-100 rounded-xl overflow-hidden">
        {buses.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-ink-500">
            No buses yet. Add your first plate above.
          </li>
        )}
        {buses.map((bus) => (
          <li
            key={bus.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface hover:bg-surface-subtle/50"
          >
            <div>
              <p className="font-semibold text-brand-deep">{bus.plate}</p>
              <p className="text-xs text-ink-500">
                {bus.capacity} seats
                {bus.defaultRouteName ? ` · ${bus.defaultRouteName}` : ""}
                {!bus.active && " · inactive"}
                {bus.tripCount > 0 ? ` · ${bus.tripCount} trips` : ""}
              </p>
            </div>
            <FleetListActions bus={bus} onEdit={startEdit} onDelete={handleDelete} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FleetListActions({
  bus,
  onEdit,
  onDelete,
}: {
  bus: OwnerBus;
  onEdit: (bus: OwnerBus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(bus)}
        className="p-2 rounded-lg hover:bg-ink-100 text-ink-600"
        aria-label={`Edit ${bus.plate}`}
      >
        <Pencil className="w-4 h-4" size={16} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(bus.id)}
        className="p-2 rounded-lg hover:bg-danger/10 text-danger"
        aria-label={`Remove ${bus.plate}`}
      >
        <Trash2 className="w-4 h-4" size={16} />
      </button>
    </div>
  );
}
