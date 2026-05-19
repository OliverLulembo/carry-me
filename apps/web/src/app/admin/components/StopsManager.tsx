"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

const AdminStopMap = dynamic(() => import("./AdminStopMap"), { ssr: false });

type AdminStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt: string;
  routes: { id: string; name: string; order: number }[];
};

const DEFAULT_LAT = -15.4167;
const DEFAULT_LNG = 28.2833;

export function StopsManager({ initialStops }: { initialStops: AdminStop[] }) {
  const [stops, setStops] = useState(initialStops);
  const [name, setName] = useState("");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [geoLabel, setGeoLabel] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refreshLabel = useCallback(async (latitude: number, longitude: number) => {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
    });
    const res = await fetch(`/api/geo/reverse?${params}`);
    const data = await res.json();
    setGeoLabel(data.label ?? null);
    if (!name && data.label) setName(data.label);
  }, [name]);

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshLabel(lat, lng);
    }, 400);
    return () => clearTimeout(t);
  }, [lat, lng, refreshLabel]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setLat(DEFAULT_LAT);
    setLng(DEFAULT_LNG);
    setGeoLabel(null);
    setError(null);
  }

  function startEdit(stop: AdminStop) {
    setEditingId(stop.id);
    setName(stop.name);
    setLat(stop.lat);
    setLng(stop.lng);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const body = { name: name.trim(), lat, lng };
      const res = await fetch(
        editingId ? `/api/admin/stops/${editingId}` : "/api/admin/stops",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      const listRes = await fetch("/api/admin/stops");
      const listData = await listRes.json();
      if (listRes.ok) setStops(listData.stops);

      setMessage(editingId ? "Stop updated." : "Stop created.");
      if (!editingId) resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this stop? It must not be on any route or have trip history.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stops/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setStops((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
      setMessage("Stop deleted.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-brand-deep">
            {editingId ? "Edit stop" : "Create stop"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-ink-500 hover:text-brand-primary"
            >
              Cancel edit
            </button>
          )}
        </div>
        <p className="text-sm text-ink-500">
          Click the map or drag the pin to set coordinates. Reverse geocoding suggests a name.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-ink-100 focus:border-brand-primary"
              placeholder="e.g. Kabwata Market"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-ink-500">Latitude</span>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100 font-mono text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-500">Longitude</span>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100 font-mono text-sm"
              />
            </label>
          </div>
          {geoLabel && (
            <p className="text-xs text-ink-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Near: {geoLabel}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary-600 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editingId ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {editingId ? "Save changes" : "Create stop"}
          </button>
        </form>
        <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-ink-100">
          <AdminStopMap lat={lat} lng={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-brand-deep mb-4">
          All stops ({stops.length})
        </h2>
        <ul className="space-y-2 max-h-[640px] overflow-y-auto">
          {stops.map((stop) => (
            <li
              key={stop.id}
              className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
                editingId === stop.id
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-ink-100"
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-deep truncate">{stop.name}</p>
                <p className="text-xs text-ink-500 font-mono">
                  {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                </p>
                {stop.routes.length > 0 && (
                  <p className="text-xs text-ink-500 mt-1">
                    Routes: {stop.routes.map((r) => r.name).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(stop)}
                  className="p-2 rounded-lg hover:bg-surface-subtle text-ink-500"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(stop.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
