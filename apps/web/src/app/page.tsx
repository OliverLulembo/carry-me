import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function Home() {
  return (
    <main className="min-h-screen bg-app flex items-center justify-center px-6">
      <div className="card max-w-xl w-full p-8 text-center">
        <div className="flex justify-center mb-5">
          <BrandLogo height={56} priority className="h-14 w-auto" />
        </div>
        <p className="text-ink-500 mb-6 text-balance">
          Tap. Ride. Done. Pre-load credits, find your bus, and skip the cash on Lusaka public transport.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/api/auth/dev-login"
            className="px-5 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary-600 transition"
          >
            Passenger dashboard (dev)
          </Link>
          <Link
            href="/api/auth/dev-login?phone=%2B260977000002"
            className="px-5 py-3 rounded-xl bg-brand-deep text-white font-semibold hover:opacity-90 transition"
          >
            Driver dashboard (dev)
          </Link>
          <Link
            href="/api/auth/dev-login?phone=%2B260977000004"
            className="px-5 py-3 rounded-xl border border-ink-100 text-brand-deep font-semibold hover:bg-surface-subtle transition"
          >
            Admin console (dev)
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-3 rounded-xl border border-ink-100 text-brand-deep font-semibold hover:bg-surface-subtle transition"
          >
            I'm already signed in
          </Link>
        </div>
        <p className="text-xs text-ink-300 mt-6">
          Dev mode — passenger (+260 977 000 001), driver (+260 977 000 002), or admin
          (+260 977 000 004). Run{" "}
          <code className="text-ink-500">npx prisma db seed</code> first.
        </p>
      </div>
    </main>
  );
}
