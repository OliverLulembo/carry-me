import { Suspense } from "react";
import { AuthShell, GuidePanel, MobileGuide, RoleLoginLinks } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Lock, Map, Settings, Shield } from "lucide-react";

const mobileSteps = [
  { title: "Operations access only", description: "Admin accounts are created by CarryMe operations." },
  { title: "Sign in with provisioned credentials", description: "Use your assigned email or ops phone number." },
  { title: "Manage the network", description: "Stops, routes, devices, credits, and user support." },
];

export default function AdminLoginPage() {
  return (
    <AuthShell
      guide={
        <GuidePanel
          eyebrow="Admin login"
          heading="Keep the network running smoothly."
          steps={[
            {
              icon: <Map className="h-5 w-5" />,
              title: "Routes & stops",
              description: "Configure fare segments and maintain stop data city-wide.",
            },
            {
              icon: <Settings className="h-5 w-5" />,
              title: "Devices & users",
              description: "Register NFC hardware and resolve passenger or driver issues.",
            },
            {
              icon: <Shield className="h-5 w-5" />,
              title: "Audit & credits",
              description: "Issue refunds, adjustments, and monitor platform health.",
            },
          ]}
        />
      }
    >
      <MobileGuide steps={mobileSteps} />
      <div className="mb-4">
        <RoleLoginLinks current="/login/admin" />
      </div>
      <Suspense fallback={<div className="card p-8 text-sm text-ink-500">Loading…</div>}>
        <LoginForm
          role="ADMIN"
          title="Admin sign in"
          subtitle="Restricted console for CarryMe operations staff."
          identifierLabel="Email or phone"
          identifierPlaceholder="ops@carryme.app or +260…"
        />
      </Suspense>
      <p className="mt-4 flex items-center gap-2 text-xs text-ink-300">
        <Lock className="h-4 w-4" />
        Need access? Contact CarryMe operations — admins cannot self-register.
      </p>
    </AuthShell>
  );
}
