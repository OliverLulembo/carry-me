import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-primary flex items-center justify-center px-6 py-10">
      <div className="max-w-md w-full text-center">
        <Image
          src="/onboarding/vertical-all-white-logo.png"
          alt="CarryMe"
          width={210}
          height={210}
          priority
          className="mx-auto h-52 w-52 object-contain"
        />
        <p className="mt-5 text-white font-semibold">Tap. Ride. Done.</p>
        <p className="mt-3 text-sm leading-6 text-white">
          Pre-load credits, find your bus, and skip the cash on Lusaka public transport.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/api/auth/dev-login"
            className="rounded-xl bg-white px-5 py-4 font-bold text-brand-primary"
          >
            Log in as Passenger
          </a>
          <a
            href="/api/auth/dev-login?phone=%2B260977000002"
            className="rounded-xl border border-white/50 px-5 py-3 font-semibold text-white"
          >
            Log in as Driver
          </a>
          <a
            href="/api/auth/dev-login?phone=%2B260977000004"
            className="rounded-xl border border-white/50 px-5 py-3 font-semibold text-white"
          >
            Log in as Admin
          </a>
          <a
            href="/api/auth/dev-login"
            className="rounded-xl bg-brand-deep/20 px-5 py-3 font-semibold text-white"
          >
            Sign up
          </a>
        </div>
      </div>
    </main>
  );
}
