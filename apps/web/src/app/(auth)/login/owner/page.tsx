import { Suspense } from "react";
import { AuthShell, GuidePanel, MobileGuide, RoleLoginLinks } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Bus, Mail, TrendingUp, Users } from "lucide-react";

const mobileSteps = [
  { title: "Register your fleet", description: "Create an owner account with your business details." },
  { title: "Add buses & drivers", description: "List plates, assign routes, and invite drivers by email." },
  { title: "Track earnings", description: "Withdraw trip revenue to mobile money or bank." },
];

export default function OwnerLoginPage() {
  return (
    <AuthShell
      guide={
        <GuidePanel
          eyebrow="Bus owner login"
          heading="Grow your fleet without the paperwork."
          steps={[
            {
              icon: <Bus className="h-5 w-5" />,
              title: "Register every bus",
              description: "Plate, capacity, and default route — all in one fleet table.",
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "Invite drivers by email",
              description: "Add a driver once; CarryMe sends their login credentials automatically.",
            },
            {
              icon: <TrendingUp className="h-5 w-5" />,
              title: "Watch revenue roll in",
              description: "Daily, weekly, and monthly earnings with per-bus breakdowns.",
            },
          ]}
        />
      }
    >
      <MobileGuide steps={mobileSteps} />
      <div className="mb-4">
        <RoleLoginLinks current="/login/owner" />
      </div>
      <Suspense fallback={<div className="card p-8 text-sm text-ink-500">Loading…</div>}>
        <LoginForm
          role="OWNER"
          title="Bus owner sign in"
          subtitle="Manage buses, drivers, withdrawals, and fleet performance."
          identifierLabel="Email or phone"
          identifierPlaceholder="fleet@example.com or +260…"
          registerHref="/register/owner"
          registerLabel="New fleet operator?"
        />
      </Suspense>
      <p className="mt-4 flex items-center gap-2 text-xs text-ink-300">
        <Mail className="h-4 w-4" />
        After sign-in, open Drivers on your dashboard to email credentials to new staff.
      </p>
    </AuthShell>
  );
}
