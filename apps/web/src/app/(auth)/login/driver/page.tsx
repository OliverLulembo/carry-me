import { Suspense } from "react";
import { AuthShell, GuidePanel, MobileGuide, RoleLoginLinks } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Bus, ClipboardList, Mail, Users } from "lucide-react";

const mobileSteps = [
  { title: "Check your email", description: "Your owner sends login details when you're added as a driver." },
  { title: "Sign in here", description: "Use your email and the temporary password from that message." },
  { title: "Start your trip", description: "Pick your bus, route, and direction from the driver dashboard." },
];

export default function DriverLoginPage() {
  return (
    <AuthShell
      guide={
        <GuidePanel
          eyebrow="Driver login"
          heading="Credentials sent by your fleet owner."
          steps={[
            {
              icon: <Mail className="h-5 w-5" />,
              title: "Check your inbox",
              description: "When an owner adds you, CarryMe emails a temporary password.",
            },
            {
              icon: <Bus className="h-5 w-5" />,
              title: "Open the driver dashboard",
              description: "Start trips, view passenger taps, and end shifts from one screen.",
            },
            {
              icon: <ClipboardList className="h-5 w-5" />,
              title: "Run the route",
              description: "Passenger manifest and quick actions stay on the trip view.",
            },
          ]}
        />
      }
    >
      <MobileGuide steps={mobileSteps} />
      <div className="mb-4">
        <RoleLoginLinks current="/login/driver" />
      </div>
      <Suspense fallback={<div className="card p-8 text-sm text-ink-500">Loading…</div>}>
        <LoginForm
          role="DRIVER"
          title="Driver sign in"
          subtitle="Use the email and password your bus owner sent you."
          identifierLabel="Email"
          identifierPlaceholder="driver@example.com"
          identifierHint="Drivers are invited by fleet owners — no self-registration."
        />
      </Suspense>
      <p className="mt-4 flex items-center gap-2 text-xs text-ink-300">
        <Users className="h-4 w-4" />
        Fleet owner? Add drivers from your dashboard after signing in.
      </p>
    </AuthShell>
  );
}
