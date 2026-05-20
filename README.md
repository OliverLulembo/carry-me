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

Then open <http://localhost:3000> and sign in with a seeded account (see below), or click **Register** to create a new passenger or owner account.

The seed creates demo users for every role, one route with 6 stops, a fare matrix, and one demo bus — enough for the dashboards to render real data. Start a live trip from the driver dashboard when testing tap-on/tap-off.

## Demo accounts (after seed)

Run `npx prisma db seed` from `apps/web` if you have not already. All seeded users share the same password:

| Role | Name | Email | Phone | Password | Sign in |
|------|------|-------|-------|----------|---------|
| Passenger | Chanda Mwila | `passenger@carryme.dev` | `+260977000001` | `carryme123` | [/login/passenger](http://localhost:3000/login/passenger) |
| Driver | Mwila Phiri | `driver@carryme.dev` | `+260977000002` | `carryme123` | [/login/driver](http://localhost:3000/login/driver) |
| Bus owner | Mr. Banda | `owner@carryme.dev` | `+260977000003` | `carryme123` | [/login/owner](http://localhost:3000/login/owner) |
| Admin | CarryMe Ops | `admin@carryme.dev` | `+260977000004` | `carryme123` | [/login/admin](http://localhost:3000/login/admin) |

You can sign in with either **email** or **phone** plus the password above. In development, one-click dev-login shortcuts are also available on the landing page.

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
