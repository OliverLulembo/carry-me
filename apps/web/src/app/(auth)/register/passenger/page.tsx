import { AuthShell, GuidePanel, MobileGuide } from "@/components/auth/AuthLayout";
import { PassengerRegisterForm } from "@/components/auth/RegisterForms";
import { CreditCard, MapPin, Share2, Smartphone, Zap } from "lucide-react";

const mobileSteps = [
  { title: "Create your account", description: "Name, phone, email, and a password — takes under a minute." },
  { title: "Top up credits", description: "Add ZMW via mobile money from your new wallet screen." },
  { title: "Tap to board", description: "Link your phone or NFC tag and ride without cash." },
];

export default function PassengerRegisterPage() {
  return (
    <AuthShell
      guide={
        <GuidePanel
          eyebrow="Passenger registration"
          heading="Your pocket-sized ticket for Lusaka buses."
          steps={[
            {
              icon: <CreditCard className="h-5 w-5" />,
              title: "Load once, ride many times",
              description: "Credits sit in your wallet until you tap on a bus.",
            },
            {
              icon: <MapPin className="h-5 w-5" />,
              title: "See what's coming",
              description: "Log your stop so drivers know passengers are waiting.",
            },
            {
              icon: <Share2 className="h-5 w-5" />,
              title: "Share with family",
              description: "Send credits to another phone number in seconds.",
            },
            {
              icon: <Zap className="h-5 w-5" />,
              title: "Tap. Ride. Done.",
              description: "Board faster with phone HCE, a card, or wristband.",
            },
          ]}
        />
      }
    >
      <MobileGuide steps={mobileSteps} />
      <div className="mb-6 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 lg:hidden">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
          <div>
            <p className="font-medium text-ink-900">What you'll need</p>
            <p className="mt-1 text-sm text-ink-500">
              A Zambian mobile number, an email address, and a password you&apos;ll use to sign in.
            </p>
          </div>
        </div>
      </div>
      <PassengerRegisterForm />
    </AuthShell>
  );
}
