import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function Home() {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-screen bg-app flex items-center justify-center px-6 py-12">
      <div className="card max-w-2xl w-full p-8">
        <div className="flex justify-center mb-5">
          <BrandLogo height={56} priority className="h-14 w-auto" />
        </div>
        <p className="text-center text-ink-500 mb-8 text-balance">
          Tap. Ride. Done. Pre-load credits, find your bus, and skip the cash on Lusaka public transport.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/register/passenger"
            className="rounded-2xl border border-ink-100 p-5 transition hover:border-brand-primary hover:shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Passengers</p>
            <p className="mt-2 text-lg font-bold text-ink-900">Create account</p>
            <p className="mt-1 text-sm text-ink-500">Load credits, tap to ride, share with family.</p>
          </Link>
          <Link
            href="/login/passenger"
            className="rounded-2xl border border-ink-100 p-5 transition hover:border-brand-primary hover:shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Passengers</p>
            <p className="mt-2 text-lg font-bold text-ink-900">Sign in</p>
            <p className="mt-1 text-sm text-ink-500">Open your wallet and trip dashboard.</p>
          </Link>
          <Link
            href="/register/owner"
            className="rounded-2xl border border-ink-100 p-5 transition hover:border-brand-primary hover:shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">Bus owners</p>
            <p className="mt-2 text-lg font-bold text-ink-900">Register fleet</p>
            <p className="mt-1 text-sm text-ink-500">Add buses, invite drivers by email, track earnings.</p>
          </Link>
          <Link
            href="/login/owner"
            className="rounded-2xl border border-ink-100 p-5 transition hover:border-brand-primary hover:shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">Bus owners</p>
            <p className="mt-2 text-lg font-bold text-ink-900">Owner sign in</p>
            <p className="mt-1 text-sm text-ink-500">Manage fleet, drivers, and withdrawals.</p>
          </Link>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login/driver"
            className="px-5 py-3 rounded-xl bg-brand-deep text-white font-semibold hover:opacity-90 transition text-center"
          >
            Driver sign in
          </Link>
          <Link
            href="/login"
            className="px-5 py-3 rounded-xl border border-ink-100 text-brand-deep font-semibold hover:bg-surface-subtle transition text-center"
          >
            All login options
          </Link>
        </div>

        {isDev ? (
          <p className="text-xs text-ink-300 mt-8 text-center">
            Dev shortcuts —{" "}
            <Link href="/api/auth/dev-login" className="text-ink-500 underline">
              passenger
            </Link>
            ,{" "}
            <Link href="/api/auth/dev-login?phone=%2B260977000002" className="text-ink-500 underline">
              driver
            </Link>
            ,{" "}
            <Link href="/api/auth/dev-login?phone=%2B260977000003" className="text-ink-500 underline">
              owner
            </Link>
            ,{" "}
            <Link href="/api/auth/dev-login?phone=%2B260977000004" className="text-ink-500 underline">
              admin
            </Link>
            . Demo password after seed: <code className="text-ink-500">carryme123</code>
          </p>
        ) : null}
      </div>
    </main>
  );
}
