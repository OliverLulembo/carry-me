"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bus,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Route,
  Smartphone,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/stops", label: "Stops", icon: MapPin },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/devices", label: "Devices", icon: Smartphone },
  { href: "/admin/trips", label: "Trips", icon: Bus },
  { href: "/admin/credits", label: "Credits", icon: CreditCard },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login/admin");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="card p-4 lg:sticky lg:top-6 flex flex-col">
        <div className="flex items-center gap-2 mb-5 px-1">
          <BrandLogo height={32} className="h-8 w-auto" />
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Admin
          </span>
        </div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-brand-primary text-white"
                    : "text-ink-700 hover:bg-surface-subtle"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/dashboard"
          className="mt-4 flex items-center gap-2 px-3 py-2 text-xs text-ink-500 hover:text-brand-primary transition"
        >
          <Bus className="w-3.5 h-3.5" />
          Passenger view
        </Link>

        <div className="mt-4 pt-4 border-t border-ink-100">
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-700 hover:bg-surface-subtle transition disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </div>
    </aside>
  );
}
