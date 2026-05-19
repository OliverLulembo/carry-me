"use client";

import { useState } from "react";
import { Loader2, UserX, UserCheck } from "lucide-react";

type AdminUser = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  suspendedAt: string | null;
  balance: number | null;
  deviceCount: number;
};

export function UsersPanel({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (res.ok) setUsers(data.users);
    setLoading(false);
  }

  async function toggleSuspend(user: AdminUser) {
    const suspended = !user.suspendedAt;
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, suspendedAt: data.user.suspendedAt } : u,
        ),
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <label className="flex-1 min-w-[160px]">
          <span className="text-xs text-ink-500">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
            placeholder="Name or phone"
          />
        </label>
        <label>
          <span className="text-xs text-ink-500">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block px-3 py-2 rounded-xl border border-ink-100"
          >
            <option value="">All</option>
            <option value="PASSENGER">Passenger</option>
            <option value="DRIVER">Driver</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle text-left text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Devices</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ink-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-xs text-ink-500">{u.phone}</p>
                </td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">
                  {u.balance !== null ? `${u.balance} cr` : "—"}
                </td>
                <td className="px-4 py-3">{u.deviceCount}</td>
                <td className="px-4 py-3">
                  {u.suspendedAt ? (
                    <span className="text-red-600 text-xs font-medium">Suspended</span>
                  ) : (
                    <span className="text-green-700 text-xs font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void toggleSuspend(u)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium hover:bg-surface-subtle"
                  >
                    {u.suspendedAt ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Restore
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" /> Suspend
                      </>
                    )}
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
