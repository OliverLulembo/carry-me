"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const ONBOARDING_KEY = "carrymeWebOnboardingSeen";
const LANGUAGE_KEY = "carrymeWebLanguage";
const SPLASHES = [
  "/onboarding/splash-1.jpg",
  "/onboarding/splash-2.jpg",
  "/onboarding/splash-3.jpg",
];

const LANGUAGES = [
  { code: "en", name: "English", status: "Available now", available: true },
  { code: "bem", name: "Bemba", status: "Unavailable", available: false },
  { code: "nya", name: "Nyanja", status: "Unavailable", available: false },
  { code: "loz", name: "Lozi", status: "Unavailable", available: false },
  { code: "toi", name: "Tonga", status: "Unavailable", available: false },
  { code: "lun", name: "Lunda", status: "Unavailable", available: false },
  { code: "lue", name: "Luvale", status: "Unavailable", available: false },
  { code: "kao", name: "Kaonde", status: "Unavailable", available: false },
  { code: "fr", name: "French", status: "Unavailable", available: false },
  { code: "pt", name: "Portuguese", status: "Unavailable", available: false },
  { code: "es", name: "Spanish", status: "Unavailable", available: false },
  { code: "zh", name: "Mandarin", status: "Unavailable", available: false },
  { code: "ar", name: "Arabic", status: "Unavailable", available: false },
];

export default function Home() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    setShowOnboarding(window.localStorage.getItem(ONBOARDING_KEY) !== "1");
    setShowLanguage(!window.localStorage.getItem(LANGUAGE_KEY));
    setReady(true);
  }, []);

  function next() {
    if (slide < SPLASHES.length - 1) {
      setSlide((current) => current + 1);
      return;
    }
    window.localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }

  function chooseEnglish() {
    window.localStorage.setItem(LANGUAGE_KEY, "en");
    setShowLanguage(false);
  }

  if (!ready || showOnboarding) {
    return (
      <main className="min-h-screen bg-brand-primary px-6 py-8 flex flex-col">
        <div className="relative flex-1 min-h-[420px]">
          <Image
            src={SPLASHES[slide]}
            alt=""
            fill
            priority
            className="object-contain"
            sizes="100vw"
          />
        </div>
        <div className="mx-auto flex items-center gap-2 py-5">
          {SPLASHES.map((_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full bg-white transition-all ${
                index === slide ? "w-6" : "w-2 opacity-40"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          className="mx-auto w-full max-w-md rounded-xl bg-white px-5 py-4 font-bold text-brand-primary"
        >
          {slide === SPLASHES.length - 1 ? "Get started" : "Next"}
        </button>
      </main>
    );
  }

  if (showLanguage) {
    return (
      <main className="min-h-screen bg-brand-primary px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <Image
            src="/onboarding/vertical-logo-white.png"
            alt="CarryMe"
            width={180}
            height={180}
            priority
            className="mx-auto h-44 w-44 object-contain"
          />
          <h1 className="mt-6 text-3xl font-bold text-white">Choose your language</h1>
          <p className="mt-3 text-sm leading-6 text-white">
            English is available now. Other Zambian and world languages are listed but unavailable until fully integrated.
          </p>
          <div className="mt-8 max-h-[48vh] space-y-2 overflow-y-auto pr-1 text-left">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={language.available ? chooseEnglish : undefined}
                disabled={!language.available}
                className={`flex w-full items-center justify-between rounded-xl bg-white px-4 py-4 text-left ${
                  language.available ? "" : "cursor-not-allowed opacity-60"
                }`}
              >
                <span>
                  <span className="block font-bold text-brand-deep">{language.name}</span>
                  <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {language.status}
                  </span>
                </span>
                <span className="text-sm font-bold text-brand-primary">
                  {language.available ? "->" : "Locked"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-primary flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Image
          src="/onboarding/vertical-logo-white.png"
          alt="CarryMe"
          width={190}
          height={190}
          priority
          className="mx-auto h-48 w-48 object-contain"
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
            Open passenger dashboard
          </a>
          <a
            href="/api/auth/dev-login?phone=%2B260977000002"
            className="rounded-xl border border-white/40 px-5 py-3 font-semibold text-white"
          >
            Driver dashboard
          </a>
          <a
            href="/api/auth/dev-login?phone=%2B260977000004"
            className="rounded-xl border border-white/40 px-5 py-3 font-semibold text-white"
          >
            Admin console
          </a>
        </div>
      </div>
    </main>
  );
}
