import { AuthShell, GuidePanel, MobileGuide } from "@/components/auth/AuthLayout";
import { OwnerRegisterForm } from "@/components/auth/RegisterForms";
import { Bus, Mail, TrendingUp, Users, Wallet } from "lucide-react";

const mobileSteps = [
  { title: "Tell us about your fleet", description: "Your name, business name, phone, and email." },
  { title: "Add your buses", description: "Register plates, seat counts, and default routes." },
  { title: "Invite drivers", description: "Enter their details — we email login credentials for you." },
  { title: "Withdraw earnings", description: "Move trip revenue to MTN, Airtel, Zamtel, or bank." },
];

export default function OwnerRegisterPage() {
  return (
    <AuthShell
      guide={
        <GuidePanel
          eyebrow="Bus owner registration"
          heading="Run your fleet like a modern operator."
          steps={[
            {
              icon: <Bus className="h-5 w-5" />,
              title: "Digitise every bus",
              description: "Track which vehicles are active and assigned to which routes.",
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "Onboard drivers in one click",
              description: "Add name, phone, and email — CarryMe sends their password by email.",
            },
            {
              icon: <TrendingUp className="h-5 w-5" />,
              title: "See income in real time",
              description: "Today, this week, and this month — broken down per bus.",
            },
            {
              icon: <Wallet className="h-5 w-5" />,
              title: "Cash out when you're ready",
              description: "Request withdrawals to mobile money or your bank account.",
            },
          ]}
        />
      }
    >
      <MobileGuide steps={mobileSteps} />
      <div className="mb-6 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 lg:hidden">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
          <div>
            <p className="font-medium text-ink-900">Driver credentials by email</p>
            <p className="mt-1 text-sm text-ink-500">
              After you register, open <strong>Drivers</strong> on your dashboard to invite staff.
              Each driver receives a temporary password by email.
            </p>
          </div>
        </div>
      </div>
      <OwnerRegisterForm />
    </AuthShell>
  );
}
