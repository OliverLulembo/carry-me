import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import type { ReactNode } from "react";

export function AuthShell({
  children,
  guide,
}: {
  children: ReactNode;
  guide: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-brand-gradient px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-block">
              <BrandLogo variant="dark" height={40} priority />
            </Link>
          </div>
          <div className="my-10">{guide}</div>
          <p className="text-sm text-white/70">
            CarryMe — Tap. Ride. Done. Built for Lusaka public transport.
          </p>
        </aside>

        <main className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-block">
              <BrandLogo height={36} priority />
            </Link>
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-ink-500">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-ink-100 pt-6 text-sm text-ink-500">{footer}</div> : null}
    </div>
  );
}

export function AuthField({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-300">{hint}</span> : null}
    </label>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-ink-100 bg-surface-subtle px-4 py-3 text-ink-900 placeholder:text-ink-300 focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20";

export function AuthSubmitButton({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 font-semibold text-white transition hover:bg-brand-primary-600 disabled:opacity-60"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
      {message}
    </div>
  );
}

export function GuideStep({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-white/80">{description}</p>
      </div>
    </div>
  );
}

export function GuidePanel({
  eyebrow,
  heading,
  steps,
}: {
  eyebrow: string;
  heading: string;
  steps: Array<{ icon: ReactNode; title: string; description: string }>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-white/70">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold leading-tight">{heading}</h2>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <GuideStep key={step.title} {...step} />
        ))}
      </div>
    </div>
  );
}

export function MobileGuide({ steps }: { steps: Array<{ title: string; description: string }> }) {
  return (
    <div className="mb-6 space-y-3 lg:hidden">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-xl border border-ink-100 bg-surface-subtle px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
            Step {index + 1}
          </p>
          <p className="mt-1 font-medium text-ink-900">{step.title}</p>
          <p className="mt-0.5 text-sm text-ink-500">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

export function RoleLoginLinks({ current }: { current?: string }) {
  const roles = [
    { href: "/login/passenger", label: "Passenger" },
    { href: "/login/driver", label: "Driver" },
    { href: "/login/owner", label: "Bus owner" },
    { href: "/login/admin", label: "Admin" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <Link
          key={role.href}
          href={role.href}
          className={
            current === role.href
              ? "rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white"
              : "rounded-full border border-ink-100 px-3 py-1 text-xs font-medium text-ink-500 hover:bg-surface-subtle"
          }
        >
          {role.label}
        </Link>
      ))}
    </div>
  );
}
