import { Suspense } from "react";
import { AuthShell, GuidePanel, MobileGuide, RoleLoginLinks } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { CreditCard, MapPin, Smartphone, Zap } from "lucide-react";

const mobileSteps = [
  { title: "Load credits", description: "Top up once via mobile money and ride without cash." },
  { title: "Find your bus", description: "See live arrivals and log when you reach your stop." },
  { title: "Tap to ride", description: "Board, tap your phone or NFC tag, and go." },
];

export default function PassengerLoginPage() {
  return (
    <AuthShell
      guide={
        <GuidePanel
          eyebrow="Passenger login"
          heading="Tap. Ride. Done."
          steps={[
            {
              icon: <CreditCard className="h-5 w-5" />,
              title: "Pre-load your wallet",
              description: "Add credits before you board so boarding is a single tap.",
            },
            {
              icon: <MapPin className="h-5 w-5" />,
              title: "Know when the bus is near",
              description: "Log your stop and watch route activity from the dashboard.",
            },
            {
              icon: <Zap className="h-5 w-5" />,
              title: "Skip the queue",
              description: "No fumbling for change — tap on, tap off, fare settles automatically.",
            },
          ]}
        />
      }
    >
      <MobileGuide steps={mobileSteps} />
      <div className="mb-4">
        <RoleLoginLinks current="/login/passenger" />
      </div>
      <Suspense fallback={<div className="card p-8 text-sm text-ink-500">Loading…</div>}>
        <LoginForm
          role="PASSENGER"
          title="Passenger sign in"
          subtitle="Access your wallet, trips, and live bus tools."
          identifierLabel="Email or phone"
          identifierPlaceholder="you@example.com or +260…"
          identifierHint="Use the contact details you registered with."
          registerHref="/register/passenger"
          registerLabel="New passenger?"
        />
      </Suspense>
      <p className="mt-4 flex items-center gap-2 text-xs text-ink-300">
        <Smartphone className="h-4 w-4" />
        Tip: link your phone in the dashboard to tap with Android HCE.
      </p>
    </AuthShell>
  );
}
