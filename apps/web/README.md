# CarryMe — Web + API

Next.js 15 (App Router, TypeScript) + Prisma + SQLite. Hosts the **passenger web app** and the **JSON API** that the React Native mobile app will consume.

## Setup

```bash
cd apps/web

# 1. Install deps
npm install

# 2. Create the local SQLite DB + run the initial migration
npx prisma migrate dev --name init

# 3. Seed demo data (1 passenger, 1 driver, 1 owner, 1 bus on a live trip, 6 stops, fare matrix)
npx prisma db seed

# 4. Run
npm run dev
```

Open <http://localhost:3000>. The landing page has a one-click **"Open passenger dashboard (dev)"** button that auto-creates a session for the seeded demo passenger and drops you on `/dashboard`.

## What the dashboard shows

Built strictly off the Brand guidelines (`.cursor/reference/Brand guidelines.md`). The primary `#715AFF` carries the dominant 60% share via the balance card + hero gradients; the secondary `#5887FF` is reserved for CTAs, links, and active states (30%); both accents (`#55C1FF` deep cyan and `#102E4A` deep navy) appear in small but high-impact moments — live-status pills, badges, dark heroes (10% combined).

The dashboard intentionally puts the **single most important action** front and centre:

- **TripHero** — *"I'm here — show me my bus"* (P-7 in the PRD). When a live arrival exists it flips to a dark, animated "Waiting at stop" hero.
- **BalanceCard** — large ZMW balance, trips-this-week chip, inline Top up / Share flows.
- **QuickActions** — tap-to-board, group boarding, scan card, plan route.
- **InboundBuses** — live list of active trips serving the focus stop (ETA, plate, seat availability with a fill bar).
- **NearestStops** — three closest stops with walking time.
- **RecentActivity** — wallet ledger feed.

## API surface (mobile-friendly)

All endpoints are under `/api/*`. CORS is permissive in dev (controlled by `ALLOWED_ORIGINS` in `.env`). Auth works two ways:

- **Web**: HTTP-only cookie `carryme_session` set by `/api/auth/dev-login`.
- **Mobile / external**: `Authorization: Bearer <jwt>` — get a token by POSTing to `/api/auth/dev-login` (returns `{ token, user }`).

| Method | Path | What it does |
|---|---|---|
| `GET\|POST` | `/api/auth/dev-login` | Dev-only. Issues a JWT + sets the cookie for the seeded demo passenger. (Replace with phone+OTP in prod.) |
| `GET` | `/api/me` | Current user. |
| `GET` | `/api/me/wallet` | Current balance + wallet id. |
| `GET` | `/api/me/transactions?limit=10` | Wallet ledger entries (newest first). |
| `POST` | `/api/topup` | Body: `{ amount, method }`. Dev: credits immediately. Prod: only fires after PSP webhook. |
| `POST` | `/api/share-credits` | Body: `{ recipientPhone, amount, note? }`. Holds for 7d if recipient not on platform. |
| `GET` | `/api/stops/nearby?lat=&lng=&limit=3` | Closest bus stops with walking time. |
| `POST` | `/api/stops/:id/arrivals` | Body: `{ destinationStopId? }`. Logs "I'm here" for 30 min. |
| `GET` | `/api/stops/:id/inbound-buses` | Active buses serving the stop, with ETA + seat availability. |

### Calling the API from React Native

```ts
const base = "http://<your-laptop-LAN-ip>:3000"; // e.g. 192.168.1.42
const { token } = await fetch(`${base}/api/auth/dev-login`, { method: "POST" }).then(r => r.json());

const wallet = await fetch(`${base}/api/me/wallet`, {
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json());
```

For Android emulator use `http://10.0.2.2:3000`; for iOS simulator `http://localhost:3000` works directly.

## Database

- **Local**: SQLite at `prisma/dev.db`. Inspect with `npm run db:studio`.
- **Reset**: `npm run db:reset` (wipes DB + re-runs seed).
- **Switching to Postgres later**: change `provider = "postgresql"` in `prisma/schema.prisma`, point `DATABASE_URL` at your Postgres URL, then `npx prisma migrate dev`. The schema uses portable types (no SQLite-specific columns).

## Notable v1 simplifications (track these as tech debt)

- **Auth**: dev-login only. Real phone+OTP needs an SMS provider (see PRD Open Question).
- **Top-up**: credits land immediately. Production wires the PSP webhook before crediting.
- **Geo**: stops are ranked in-memory using Haversine. Move to PostGIS / `ST_Distance` after switching to Postgres.
- **Offline**: not modelled yet. Will require driver-device queue + attestation refresh (PRD §5.3).
