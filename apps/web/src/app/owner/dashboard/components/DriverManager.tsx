"use client";

import { useState } from "react";
import { Loader2, Mail, Plus, UserRound, Users } from "lucide-react";
import { AuthError, AuthSuccess } from "@/components/auth/AuthLayout";

export type OwnerDriver = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  suspendedAt: string | null;
};

export function DriverManager({ initialDrivers }: { initialDrivers: OwnerDriver[] }) {
  const [drivers, setDrivers] = useState(initialDrivers);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devPassword, setDevPassword] = useState<string | null>(null);

  async function refreshDrivers() {
    const res = await fetch("/api/owner/drivers");
    const data = await res.json();
    if (res.ok) setDrivers(data.drivers);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevPassword(null);
    try {
      const res = await fetch("/api/owner/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not add driver.");
      await refreshDrivers();
      setMessage(data.message ?? "Driver added.");
      if (data.devTemporaryPassword) setDevPassword(data.devTemporaryPassword);
      setFullName("");
      setPhone("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add driver.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-ink-900">Drivers</h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Add a driver and CarryMe emails their login credentials automatically.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-4">
        <div className="flex gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
          <div className="text-sm text-ink-700">
            <p className="font-medium text-ink-900">How it works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-ink-500">
              <li>Enter the driver&apos;s name, phone, and email below.</li>
              <li>We create their account and send a temporary password by email.</li>
              <li>They sign in at <span className="font-medium text-ink-700">/login/driver</span>.</li>
            </ol>
          </div>
        </div>
      </div>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2 space-y-3">
          <AuthError message={error} />
          <AuthSuccess message={message} />
          {devPassword ? (
            <div className="rounded-xl border border-warn/25 bg-warn/5 px-4 py-3 text-sm text-ink-700">
              <p className="font-medium text-ink-900">Dev mode — temporary password</p>
              <p className="mt-1 font-mono text-brand-primary">{devPassword}</p>
              <p className="mt-1 text-xs text-ink-500">Also logged to the server console as the email body.</p>
            </div>
          ) : null}
        </div>
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-sm font-medium text-ink-700">Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Mwila Phiri"
            className="w-full rounded-xl border border-ink-100 bg-surface-subtle px-4 py-2.5 text-sm"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-sm font-medium text-ink-700">Phone</span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+260 97 700 0002"
            className="w-full rounded-xl border border-ink-100 bg-surface-subtle px-4 py-2.5 text-sm"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink-700">Email for login credentials</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="driver@example.com"
            className="w-full rounded-xl border border-ink-100 bg-surface-subtle px-4 py-2.5 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-600 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add driver & send credentials
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-ink-100 pt-5">
        <p className="text-sm font-medium text-ink-700">{drivers.length} driver{drivers.length === 1 ? "" : "s"}</p>
        {drivers.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">No drivers yet — add your first driver above.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {drivers.map((driver) => (
              <li
                key={driver.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-surface-subtle px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                    <UserRound className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{driver.fullName}</p>
                    <p className="truncate text-xs text-ink-500">
                      {driver.email ?? "No email"} · {driver.phone}
                    </p>
                  </div>
                </div>
                {driver.suspendedAt ? (
                  <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                    Suspended
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    Active
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
