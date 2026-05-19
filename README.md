# CarryMe

Public-transport credits & tap-to-ride platform for Lusaka. See [`docs/prd-carryme-v1.md`](./docs/prd-carryme-v1.md) for the product spec.

## Repo layout

```
.
├── apps/
│   ├── web/          # Next.js 15 (App Router, TS) + Prisma + SQLite. Hosts the web app and the API.
│   └── mobile/       # Expo (React Native, TS) passenger app. Talks to apps/web over the same JSON API.
├── docs/
│   └── prd-carryme-v1.md
└── .cursor/          # Agents, skills, brand guidelines
```

## Quick start (web + API)

From the repo root:

```bash
cd apps/web
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Then open <http://localhost:3000/dashboard>.

The seed creates one demo passenger (`+260977000001`), one route with 6 stops, a fare matrix, and one live bus on a trip — enough for the dashboard to render real data.

## Quick start (mobile)

With the web API running (above), in a second terminal:

```bash
cd apps/mobile
npm install
npm start
```

Then:

- **Android emulator** → press `a` (uses `http://10.0.2.2:3000` by default)
- **iOS simulator** → press `i` (uses `http://localhost:3000` by default)
- **Physical phone** → scan the Expo Go QR; set `EXPO_PUBLIC_API_BASE_URL=http://<laptop-LAN-ip>:3000` in `apps/mobile/.env`

The landing screen auto-signs in as the same demo passenger as the web app and drops you on the dashboard. See [`apps/mobile/README.md`](./apps/mobile/README.md) for the full layout, design tokens, and PRD-to-screen mapping. CORS on the API is permissive in dev (`ALLOWED_ORIGINS=*`).
