"use client";

import { Bell, Bus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { UserMenuDropdown } from "@/components/UserMenuDropdown";
import { useRideOptional } from "./RideProvider";

type NavKey = "dashboard" | "trips" | "wallet" | "support";

export function DashboardHeader({
  user,
  activeNav = "dashboard",
}: {
  user: { fullName: string; phone: string };
  activeNav?: NavKey;
}) {
  const ride = useRideOptional();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const notifications = ride?.notifications ?? [];
  const unreadCount = ride?.unreadNotificationCount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-surface/80 border-b border-ink-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/dashboard"
          aria-label="CarryMe — back to dashboard"
          className="flex items-center gap-3 group"
        >
          <BrandLogo height={28} priority className="h-7 w-auto" />
          <span className="hidden sm:inline-block text-[11px] uppercase tracking-[0.18em] text-ink-500 border-l border-ink-100 pl-3">
            Lusaka
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-500">
          <Link
            href="/dashboard"
            className={activeNav === "dashboard" ? "text-brand-deep" : "hover:text-brand-deep transition"}
          >
            Dashboard
          </Link>
          <Link
            href="/trips"
            className={activeNav === "trips" ? "text-brand-deep" : "hover:text-brand-deep transition"}
          >
            Trips
          </Link>
          <Link
            href="/wallet"
            className={activeNav === "wallet" ? "text-brand-deep" : "hover:text-brand-deep transition"}
          >
            Wallet
          </Link>
          <a className="hover:text-brand-deep transition" href="#">Support</a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => {
                setOpen((v) => !v);
                if (!open) ride?.markAllNotificationsRead();
              }}
              className="w-9 h-9 grid place-items-center rounded-full text-ink-700 hover:bg-surface-subtle transition relative"
            >
              <Bell className="w-4.5 h-4.5" size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold grid place-items-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && ride && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-80 max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border border-ink-100 bg-white shadow-pop py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-ink-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-700">Notifications</p>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => ride.clearNotifications()}
                      className="text-xs text-ink-500 hover:text-brand-deep"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-ink-500 text-center">
                    No notifications yet. When your bus starts boarding at your stop, you&apos;ll
                    see an alert here.
                  </p>
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => ride.markNotificationRead(n.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-surface-subtle transition flex gap-3 ${
                            n.read ? "opacity-70" : ""
                          }`}
                        >
                          <span className="shrink-0 w-8 h-8 rounded-lg bg-brand-primary/10 grid place-items-center text-brand-primary">
                            <Bus className="w-4 h-4" size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink-700">{n.title}</span>
                            <span className="block text-xs text-ink-500 mt-0.5 leading-relaxed">
                              {n.message}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <UserMenuDropdown
            user={user}
            initials={initials}
            loginHref="/login/passenger"
          />
        </div>
      </div>
    </header>
  );
}
