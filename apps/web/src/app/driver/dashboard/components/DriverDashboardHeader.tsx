import { Bell } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { UserMenuDropdown } from "@/components/UserMenuDropdown";

export function DriverDashboardHeader({
  user,
}: {
  user: { fullName: string; phone: string };
}) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-surface/80 border-b border-ink-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/driver/dashboard"
          aria-label="CarryMe — driver dashboard"
          className="flex items-center gap-3 group"
        >
          <BrandLogo height={28} priority className="h-7 w-auto" />
          <span className="hidden sm:inline-block text-[11px] uppercase tracking-[0.18em] text-ink-500 border-l border-ink-100 pl-3">
            Driver
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-500">
          <a className="text-brand-deep" href="/driver/dashboard">
            Dashboard
          </a>
          <a className="hover:text-brand-deep transition" href="#manifest">
            Manifest
          </a>
          <a className="hover:text-brand-deep transition" href="#upcoming-stops">
            Stops
          </a>
          <a className="hover:text-brand-deep transition" href="#">
            Support
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="w-9 h-9 grid place-items-center rounded-full text-ink-700 hover:bg-surface-subtle transition relative"
          >
            <Bell className="w-4.5 h-4.5" size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-primary" />
          </button>
          <UserMenuDropdown
            user={user}
            initials={initials}
            loginHref="/login/driver"
          />
        </div>
      </div>
    </header>
  );
}
