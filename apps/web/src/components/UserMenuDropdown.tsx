"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";

type UserMenuDropdownProps = {
  user: { fullName: string; phone: string };
  initials: string;
  profileHref?: string;
  loginHref?: string;
};

export function UserMenuDropdown({
  user,
  initials,
  profileHref = "/profile",
  loginHref = "/login/passenger",
}: UserMenuDropdownProps) {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(loginHref);
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-surface-subtle transition"
      >
        <div className="w-8 h-8 rounded-full bg-brand-deep text-white grid place-items-center text-xs font-bold">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-brand-deep leading-tight">
            {user.fullName.split(" ")[0]}
          </p>
          <p className="text-[10px] text-ink-500 leading-tight">{user.phone}</p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
          size={14}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-ink-100 bg-surface shadow-pop py-1 z-50"
        >
          <div className="px-3 py-2.5 border-b border-ink-100 sm:hidden">
            <p className="text-xs font-semibold text-brand-deep">{user.fullName}</p>
            <p className="text-[10px] text-ink-500">{user.phone}</p>
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink-700 hover:bg-surface-subtle transition"
          >
            <User className="w-4 h-4 text-ink-500" size={16} />
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => {
              setOpen(false);
              void handleLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink-700 hover:bg-surface-subtle transition disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 text-ink-500" size={16} />
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
