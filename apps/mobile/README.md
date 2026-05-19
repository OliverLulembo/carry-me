# CarryMe — Mobile (Passenger App)

Expo (React Native, TypeScript) passenger app. Talks to the JSON API hosted by
`apps/web` (Next.js 15) via `Authorization: Bearer <jwt>`.

## Quick start

In one terminal, get the API up:

```bash
cd ../web
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev          # listens on http://localhost:3000
```

In another terminal, run the mobile app:

```bash
cd apps/mobile
npm install
npm start            # opens Metro / Expo dev server
```

Then pick a target:

- **Android emulator** → press `a` (uses `http://10.0.2.2:3000` by default).
- **iOS simulator**    → press `i` (uses `http://localhost:3000` by default).
- **Physical device**  → scan the QR with Expo Go; set
  `EXPO_PUBLIC_API_BASE_URL=http://<laptop-LAN-ip>:3000` in
  `apps/mobile/.env` so the device can reach the API on your Wi-Fi.

The landing screen auto-issues a session for the seeded demo passenger
(`+260 977 000 001`, 120 credits) — the same one-click experience as the
web app's `/api/auth/dev-login`.

## Project layout

```
apps/mobile/
├── app/                   # Expo Router (file-based routes)
│   ├── _layout.tsx        # Root <Stack> + <AuthProvider>
│   ├── index.tsx          # Splash / dev sign-in gate
│   ├── topup.tsx          # Modal sheet
│   ├── share.tsx          # Modal sheet
│   └── (tabs)/
│       ├── _layout.tsx    # Tab bar
│       ├── index.tsx      # Home — TripHero, Balance, Quick actions, Inbound, Recent
│       ├── wallet.tsx     # Wallet hero + week stats + full ledger
│       ├── stops.tsx      # Nearest stops + log arrival + inbound buses
│       └── profile.tsx    # Account info, env, sign-out
├── src/
│   ├── api/               # Typed fetch client + endpoint helpers
│   ├── auth/session.tsx   # SecureStore-backed AuthProvider
│   ├── components/        # Card, Pill, Button, Header + dashboard pieces
│   ├── hooks/useDashboard.ts
│   ├── lib/format.ts      # Mirrors apps/web/src/lib/format.ts
│   └── theme/tokens.ts    # 60/30/10 brand palette + radii/spacing/shadow
└── app.json / package.json / tsconfig.json / babel.config.js
```

## Design system

Colours, ratios, and rules come from `.cursor/reference/Brand guidelines.md`.

| Role        | Hex       | Share | Where it shows                                                   |
|-------------|-----------|-------|------------------------------------------------------------------|
| Primary     | `#715AFF` | 60%   | Balance card, hero gradients, primary buttons, "I'm here" CTA    |
| Secondary   | `#5887FF` | 30%   | Card gradient pair, tab accents, link/secondary buttons          |
| Accent      | `#55C1FF` | 10%   | Live pills, "Waiting at stop" hero highlight, success cues       |
| Deep        | `#102E4A` | 10%   | Body text, dark "Waiting" hero, plate badges                     |

Tokens live in [`src/theme/tokens.ts`](src/theme/tokens.ts).

## What's implemented (mapped to the PRD)

| PRD story | Where in the app                                                  |
|-----------|-------------------------------------------------------------------|
| P-1 Top-up via mobile money or card  | `app/topup.tsx` → `POST /api/topup`         |
| P-2 Balance, transactions, share credits | Wallet tab + `app/share.tsx` → `/api/share-credits` |
| P-6 Find closest bus stop            | Stops tab + Home `NearestStops` (uses `expo-location` + `/api/stops/nearby`) |
| P-7 Log arrival at a stop            | `TripHero` "I'm here" CTA → `/api/stops/:id/arrivals` |
| P-8 View inbound buses & seats       | `InboundBuses` on Home + Stops tab           |
| P-9 ETA at destination               | ETA minutes column on each inbound bus row   |
| P-4 Tap to board (NFC)               | `QuickActions` placeholder — actual HCE/reader integration is hardware work in v1.1 |

## Notable v1 simplifications

- **Auth**: dev sign-in only. Real phone+OTP needs an SMS provider (PRD §6.1).
- **Location**: best-effort permission, falls back to Lusaka centre (`-15.4167, 28.2833`) so the app is always usable.
- **NFC tap-to-board**: surfaced as a quick action only. Android HCE / paired
  card/wristband flows ship in v1.1 once the hardware track lands.
- **Offline**: the app keeps a cached user profile in `expo-secure-store` so
  the UI still renders when the API is unreachable, but does not yet queue
  taps locally — the offline ledger work is driver-device-side (PRD §5.3).

## Calling the API

Every request goes through `src/api/client.ts`, which:

- Resolves the base URL in this order:
  1. `EXPO_PUBLIC_API_BASE_URL` (recommended for physical devices),
  2. The Metro debugger host (`Constants.expoConfig.hostUri`) — picks up the
     laptop's LAN IP automatically when you run `expo start`,
  3. `http://10.0.2.2:3000` on Android / `http://localhost:3000` elsewhere.
- Attaches `Authorization: Bearer <jwt>` from the auth context.
- Surfaces structured `ApiError` (with status + payload) and a 401 trips
  `signOut()` automatically.

## Scripts

```bash
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run typecheck  # tsc --noEmit
```
