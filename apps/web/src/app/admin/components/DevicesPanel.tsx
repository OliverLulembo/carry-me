"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { DeviceType } from "@prisma/client";

type AdminDevice = {
  id: string;
  serial: string;
  type: string;
  label: string | null;
  active: boolean;
  user: { id: string; fullName: string; phone: string } | null;
  bus: { id: string; plate: string } | null;
};

export function DevicesPanel({ initialDevices }: { initialDevices: AdminDevice[] }) {
  const [devices, setDevices] = useState(initialDevices);
  const [serial, setSerial] = useState("");
  const [type, setType] = useState<DeviceType>(DeviceType.CARD);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serial, type, label: label || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      const list = await fetch("/api/admin/devices");
      const listData = await list.json();
      if (list.ok) setDevices(listData.devices);
      setSerial("");
      setLabel("");
    }
    setLoading(false);
  }

  async function setActive(id: string, active: boolean) {
    const res = await fetch(`/api/admin/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, active } : d)));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={register} className="card p-4 flex flex-wrap gap-3 items-end">
        <label className="flex-1 min-w-[140px]">
          <span className="text-xs text-ink-500">Serial</span>
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            required
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
          />
        </label>
        <label>
          <span className="text-xs text-ink-500">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DeviceType)}
            className="mt-1 block px-3 py-2 rounded-xl border border-ink-100"
          >
            {Object.values(DeviceType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-[120px]">
          <span className="text-xs text-ink-500">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Register
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Assigned to</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-t border-ink-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{d.label ?? d.serial}</p>
                  <p className="text-xs text-ink-500 font-mono">
                    {d.type} · {d.serial}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {d.user
                    ? `${d.user.fullName} (${d.user.phone})`
                    : d.bus
                      ? `Bus ${d.bus.plate}`
                      : "Unassigned"}
                </td>
                <td className="px-4 py-3">
                  {d.active ? (
                    <span className="text-green-700 text-xs font-medium">Active</span>
                  ) : (
                    <span className="text-ink-500 text-xs">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void setActive(d.id, !d.active)}
                    className="text-xs font-medium text-brand-primary hover:underline"
                  >
                    {d.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
