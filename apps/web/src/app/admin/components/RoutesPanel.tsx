"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type RouteStop = { id: string; name: string; lat: number; lng: number; order: number };
type AdminRoute = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  stops: RouteStop[];
};

type StopOption = { id: string; name: string };

export function RoutesPanel({
  initialRoutes,
  allStops,
}: {
  initialRoutes: AdminRoute[];
  allStops: StopOption[];
}) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [expandedId, setExpandedId] = useState<string | null>(initialRoutes[0]?.id ?? null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createRoute(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      const list = await fetch("/api/admin/routes");
      const data = await list.json();
      if (list.ok) setRoutes(data.routes);
      setNewName("");
      setMessage("Route created.");
    }
    setLoading(false);
  }

  async function saveStops(routeId: string, stopIds: string[]) {
    setLoading(true);
    const res = await fetch(`/api/admin/routes/${routeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stopIds }),
    });
    if (res.ok) {
      const list = await fetch("/api/admin/routes");
      const data = await list.json();
      if (list.ok) setRoutes(data.routes);
      setMessage("Route stops and fare matrix updated.");
    }
    setLoading(false);
  }

  function moveStop(route: AdminRoute, index: number, dir: -1 | 1) {
    const ids = route.stops.map((s) => s.id);
    const next = index + dir;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void saveStops(route.id, ids);
  }

  function toggleStopOnRoute(route: AdminRoute, stopId: string) {
    const ids = route.stops.map((s) => s.id);
    const idx = ids.indexOf(stopId);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(stopId);
    void saveStops(route.id, ids);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createRoute} className="card p-4 flex gap-3 items-end">
        <label className="flex-1">
          <span className="text-xs text-ink-500">New route name</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
            placeholder="e.g. Kalingalinga ↔ Town"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm"
        >
          Add route
        </button>
      </form>
      {message && <p className="text-sm text-green-700">{message}</p>}

      {routes.map((route) => {
        const expanded = expandedId === route.id;
        const onRoute = new Set(route.stops.map((s) => s.id));
        return (
          <div key={route.id} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : route.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-subtle"
            >
              <div>
                <p className="font-semibold text-brand-deep">{route.name}</p>
                <p className="text-xs text-ink-500">
                  {route.stops.length} stops · {route.active ? "Active" : "Inactive"}
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-ink-500 transition ${expanded ? "rotate-180" : ""}`}
              />
            </button>
            {expanded && (
              <div className="px-5 pb-5 border-t border-ink-100 space-y-4">
                {loading && (
                  <p className="text-xs text-ink-500 flex items-center gap-1 pt-3">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                  </p>
                )}
                <div>
                  <p className="text-xs font-medium text-ink-500 uppercase mb-2">
                    Stop order (fare matrix auto-rebuilds)
                  </p>
                  <ol className="space-y-1">
                    {route.stops.map((s, i) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface-subtle text-sm"
                      >
                        <span className="w-6 text-ink-500">{i + 1}.</span>
                        <span className="flex-1">{s.name}</span>
                        <button
                          type="button"
                          onClick={() => moveStop(route, i, -1)}
                          disabled={i === 0}
                          className="p-1 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(route, i, 1)}
                          disabled={i === route.stops.length - 1}
                          className="p-1 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-500 uppercase mb-2">
                    Add or remove stops
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allStops.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStopOnRoute(route, s.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          onRoute.has(s.id)
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "border-ink-100 text-ink-700 hover:border-brand-primary"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
