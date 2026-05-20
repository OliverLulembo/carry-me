import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function Home() {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-screen bg-brand-primary flex items-center justify-center px-6 py-10">
      <div className="max-w-2xl w-full text-center">
        <Image
          src="/onboarding/vertical-all-white-logo.png"
          alt="CarryMe"
          width={210}
          height={210}
          priority
          className="mx-auto h-52 w-52 object-contain"
        />
        <p className="mt-5 text-white font-semibold text-lg">Tap. Ride. Done.</p>
        <p className="mt-3 text-sm leading-6 text-white/90 max-w-md mx-auto">
          Pre-load credits, find your bus, and skip the cash on Lusaka public transport.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 text-left">
          <Link
            href="/register/passenger"
            className="rounded-xl bg-white px-5 py-4 font-bold text-brand-primary hover:bg-brand-accent transition"
          >
            Create passenger account
          </Link>
          <Link
            href="/login/passenger"
            className="rounded-xl border border-white/50 px-5 py-4 font-semibold text-white hover:bg-white/10 transition"
          >
            Passenger sign in
          </Link>
          <Link
            href="/register/owner"
            className="rounded-xl border border-white/50 px-5 py-3 font-semibold text-white hover:bg-white/10 transition"
          >
            Register fleet
          </Link>
          <Link
            href="/login/owner"
            className="rounded-xl border border-white/50 px-5 py-3 font-semibold text-white hover:bg-white/10 transition"
          >
            Owner sign in
          </Link>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login/driver"
            className="rounded-xl bg-brand-deep/40 px-5 py-3 font-semibold text-white hover:bg-brand-deep/60 transition"
          >
            Driver sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/30 px-5 py-3 font-semibold text-white/90 hover:bg-white/10 transition"
          >
            All login options
          </Link>
        </div>

        {isDev ? (
          <p className="text-xs text-white/70 mt-8">
            Dev shortcuts —{" "}
            <Link href="/api/auth/dev-login" className="underline hover:text-white">
              passenger
            </Link>
            ,{" "}
            <Link
              href="/api/auth/dev-login?phone=%2B260977000002"
              className="underline hover:text-white"
            >
              driver
            </Link>
            ,{" "}
            <Link
              href="/api/auth/dev-login?phone=%2B260977000003"
              className="underline hover:text-white"
            >
              owner
            </Link>
            ,{" "}
            <Link
              href="/api/auth/dev-login?phone=%2B260977000004"
              className="underline hover:text-white"
            >
              admin
            </Link>
            . Demo password after seed:{" "}
            <code className="text-white/80">carryme123</code>
          </p>
        ) : null}

        <div className="mt-6 flex justify-center opacity-60">
          <BrandLogo height={24} className="h-6 w-auto brightness-0 invert" />
        </div>
      </div>
    </main>
  );
}
