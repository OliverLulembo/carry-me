import Link from "next/link";
import { Suspense } from "react";
import {
  AuthCard,
  AuthShell,
  GuidePanel,
  RoleLoginLinks,
} from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  Bus,
  Shield,
  Smartphone,
  UserRound,
  Wallet,
} from "lucide-react";

function LoginHubContent() {
  return (
    <AuthCard
      title="Sign in to CarryMe"
      subtitle="Choose your account type to open the right dashboard."
    >
      <RoleLoginLinks />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/login/passenger"
          className="rounded-xl border border-ink-100 p-4 transition hover:border-brand-primary hover:bg-surface-subtle"
        >
          <Smartphone className="h-5 w-5 text-brand-primary" />
          <p className="mt-2 font-semibold text-ink-900">Passenger</p>
          <p className="text-sm text-ink-500">Tap, ride, and manage credits.</p>
        </Link>
        <Link
          href="/login/driver"
          className="rounded-xl border border-ink-100 p-4 transition hover:border-brand-primary hover:bg-surface-subtle"
        >
          <Bus className="h-5 w-5 text-brand-primary" />
          <p className="mt-2 font-semibold text-ink-900">Driver</p>
          <p className="text-sm text-ink-500">Start trips and check passengers.</p>
        </Link>
        <Link
          href="/login/owner"
          className="rounded-xl border border-ink-100 p-4 transition hover:border-brand-primary hover:bg-surface-subtle"
        >
          <Wallet className="h-5 w-5 text-brand-primary" />
          <p className="mt-2 font-semibold text-ink-900">Bus owner</p>
          <p className="text-sm text-ink-500">Manage fleet, drivers, and payouts.</p>
        </Link>
        <Link
          href="/login/admin"
          className="rounded-xl border border-ink-100 p-4 transition hover:border-brand-primary hover:bg-surface-subtle"
        >
          <Shield className="h-5 w-5 text-brand-primary" />
          <p className="mt-2 font-semibold text-ink-900">Admin</p>
          <p className="text-sm text-ink-500">Operations console access.</p>
        </Link>
      </div>
      <p className="mt-6 text-sm text-ink-500">
        New here?{" "}
        <Link href="/register/passenger" className="font-semibold text-brand-primary hover:underline">
          Register as a passenger
        </Link>{" "}
        or{" "}
        <Link href="/register/owner" className="font-semibold text-brand-primary hover:underline">
          register your fleet
        </Link>
        .
      </p>
    </AuthCard>
  );
}

export default function LoginHubPage() {
  return (
    <AuthShell
      guide={
        <GuidePanel
          eyebrow="Welcome back"
          heading="One platform for every seat on the bus."
          steps={[
            {
              icon: <UserRound className="h-5 w-5" />,
              title: "Pick your role",
              description: "Passengers, drivers, owners, and admins each get a focused workspace.",
            },
            {
              icon: <Smartphone className="h-5 w-5" />,
              title: "Sign in securely",
              description: "Use the email or phone number linked to your CarryMe account.",
            },
            {
              icon: <Bus className="h-5 w-5" />,
              title: "Get moving",
              description: "Jump straight into credits, trips, fleet tools, or admin controls.",
            },
          ]}
        />
      }
    >
      <Suspense fallback={<div className="card p-8 text-sm text-ink-500">Loading…</div>}>
        <LoginHubContent />
      </Suspense>
    </AuthShell>
  );
}
