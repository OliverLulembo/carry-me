import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CarryMe — Tap. Ride. Done.",
  description:
    "CarryMe makes Lusaka public transport tap-and-ride. Load credits, find your bus, and skip the cash.",
  icons: {
    // SVG is the primary browser favicon; PNG is the fallback for Safari/iOS
    // home-screen and any legacy crawler that doesn't read SVG.
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon.png", type: "image/png", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png" }],
    shortcut: ["/icon.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
