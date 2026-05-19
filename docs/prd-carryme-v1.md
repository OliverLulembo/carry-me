# PRD: CarryMe — Public Transport Credits & Tap-to-Ride Platform (v1)

**Status**: Draft
**Author**: Alex (Product Manager)
**Last Updated**: 2026-05-18
**Version**: 0.1
**Stakeholders**: Engineering Lead, Mobile Lead, Hardware/NFC Lead, Design Lead, Payments/Compliance Lead, Operations (Lusaka launch), Legal
**Region of Launch**: Lusaka, Zambia
**Currency**: Zambian Kwacha (ZMW)

---

## 0. TL;DR

CarryMe is a multi-sided platform that lets Lusaka commuters pay for public bus trips with pre-loaded credits via web app, mobile app, or a physical NFC card/wristband — and lets bus drivers, bus owners, and CarryMe administrators run the operational and financial side of those trips. v1 ships the full primary loop for **all four user types** (Passenger, Driver, Bus Owner, Admin) on a fare model where the **CarryMe Admin configures credits per stretch** (start stop → end stop) per route, with **full offline tolerance** so buses keep operating in low-coverage zones and reconcile when reconnected.

---

## 1. Problem Statement

Public transport in Lusaka (predominantly mini-buses) runs on **cash**. This creates a chain of compounding problems for every party in the system:

- **Passengers** carry cash for fares, deal with shortages of change, are exposed to theft, and have no visibility into which bus is coming, when it arrives, or whether it has seats. There is no way to ride together as a group on shared funds, and no way to top up remotely.
- **Drivers** spend a meaningful share of trip time managing fare collection and change, dispute amounts, and operate without a clean record of who is on board or what segment they paid for.
- **Bus owners** (the people who actually fund and own the vehicles) have **no real-time visibility into earnings**. They depend on driver-reported, end-of-day cash reconciliations, with high leakage and zero per-route or per-bus analytics.
- **Regulators and the broader transit system** have no structured data on demand, routes, occupancy, or stops — making service planning impossible.

> The cost of not solving this: continued revenue leakage for bus owners (estimated industry-wide at double-digit percentages of gross fares), persistent friction for passengers, and zero data foundation on which to improve Lusaka's transit network.

**Evidence we need to gather pre-launch (Open):**
- 5–10 passenger problem interviews per income segment in Lusaka
- 5+ driver interviews across at least 2 routes
- 3–5 bus owner / SACCO interviews on cash reconciliation pain
- Baseline cash leakage estimate from at least 2 willing owner partners
- Mobile money penetration baseline among target passenger segment (MTN MoMo, Airtel Money, Zamtel Kwacha)

---

## 2. Goals & Success Metrics

These are v1 targets. Baselines marked **TBD** must be set during the discovery phase before GA.

| Goal | Metric | Current Baseline | v1 Target | Measurement Window |
|---|---|---|---|---|
| Prove the tap-to-ride core loop works in the wild | Successful tap-on → tap-off rate (no manual intervention) | n/a | ≥ 97% | First 30 days post-pilot launch |
| Move passengers from cash to credits | % of trips on a CarryMe-equipped bus paid via credits | 0% | ≥ 40% | 90 days post-launch on pilot routes |
| Reduce revenue leakage for bus owners | Variance between system-recorded revenue and owner-reported expected revenue | TBD (baseline w/ partner) | < 5% | 60 days post-launch |
| Onboard pilot supply | Buses live on platform | 0 | ≥ 20 buses across ≥ 2 routes | Launch + 8 weeks |
| Passenger growth | Monthly active passengers (≥1 trip in 30d) | 0 | ≥ 5,000 | 90 days post-launch |
| Wallet load throughput | % of top-up attempts that succeed end-to-end | n/a | ≥ 95% | Ongoing |
| Offline resilience | % of taps captured offline that successfully reconcile within 24h of bus reconnecting | n/a | ≥ 99.5% | Ongoing |
| Owner withdrawal trust | Median time from withdrawal request to payout completion | n/a | < 24h business hours | Ongoing |

**North Star metric (proposed)**: *Weekly tap-paid trips on the CarryMe network.* It captures supply (buses live), demand (passengers riding), monetization (credits actually used), and product health (taps working) in a single number.

---

## 3. Non-Goals (v1)

Stated explicitly so we don't silently absorb them later:

- **No driver-side fare overrides or cash collection management.** Drivers do not manually edit fares. Cash remains out-of-band in v1 (we do not handle physical cash).
- **No route planning / multi-leg journey planning.** Passengers can find the nearest stop and view inbound buses — they cannot plan a transfer or route across multiple buses in v1.
- **No dynamic pricing / surge.** All fare amounts are configured by the CarryMe Admin per route stretch and are static until changed.
- **No third-party developer API.** Public/partner APIs are post-v1.
- **No insurance, loyalty rewards, or referral programs in v1.** Open to follow-up once core loop is validated.
- **No support for international cards as the primary top-up rail.** Local Visa/Mastercard from Zambian issuers + Mobile Money only.
- **No iOS NFC card emulation in v1.** Apple's restrictions on host card emulation make this infeasible at this scope. iOS users tap with a paired CarryMe card/wristband or use an Android device.
- **Attach Devices (P2)** ships in **v1.1**, not v1 (single device per account at launch; multi-device follows).
- **No driver payroll or driver-side withdrawals.** Drivers are paid by bus owners off-platform in v1.

---

## 4. User Personas

### 4.1 Passenger — "Chanda"
Daily commuter, ages 18–55, owns an Android phone, may or may not have a bank account, almost certainly has a Mobile Money wallet. Wants to get to work/school cheaply and reliably without carrying cash or worrying about change. May ride with family/colleagues and share fare costs.

### 4.2 Driver — "Mwila"
Operates a specific bus on assigned routes. Wants to focus on driving safely, not collecting cash. Needs a simple, glanceable device (CarryMe-issued NFC-enabled Android phone or tablet) that tells him who's on, who got off, and where to go.

### 4.3 Bus Owner — "Mr. Banda"
Owns one or more buses, employs drivers. Cares about **money in vs. money out per bus per day**, and trusts very little — needs hard, real-time numbers, not driver reports. Wants cash in his bank/MoMo account on demand.

### 4.4 CarryMe Admin — "Ops Team Member"
CarryMe employee. Configures routes, stops, and fares. Manages KYC, devices, disputes, refunds, and platform-wide credit issuance. Needs elevated tooling, audit trails, and the ability to act on behalf of any user when justified.

---

## 5. Solution Overview

CarryMe v1 is a single backend platform with four distinct front-end experiences and one shared hardware story:

1. **Passenger app (Android + iOS + Web)** — wallet, top-up, sharing, group boarding, bus stop discovery, ETA, tap-on/tap-off via NFC (Android HCE) or paired CarryMe card/wristband.
2. **Driver app (CarryMe-issued Android device)** — route + trip lifecycle, NFC reader for passenger taps, live passenger manifest, offline-first.
3. **Bus Owner dashboard (Web, mobile-responsive)** — real-time earnings, filters by route/bus/driver/date, withdrawal flow.
4. **Admin console (Web)** — user, device, route, fare, and credit management with audit logs.
5. **Physical credentials** — NFC card and wristband, each linked to exactly one passenger account, usable when the phone is dead or not present.

### 5.1 Key cross-cutting design decisions

| Decision | What we chose | What we rejected | Why |
|---|---|---|---|
| **Fare model** | Admin-configurable credits per **stretch** (start stop → end stop) per route | Flat fare; distance-API-based fare | Matches existing mini-bus mental model in Lusaka (fixed prices per segment); gives Admin full control and predictability; doesn't require GPS accuracy mid-trip |
| **Tap direction** | Passenger taps **their** device against the **driver's** reader | Driver tapping passenger; peer-to-peer | One reader per bus is cheaper; passenger holds the credential; driver's hands stay free |
| **Connectivity** | **Full offline mode** — driver device and physical cards both store enough state to operate when offline; reconcile on reconnect | Online-only; queue-and-sync only | Lusaka has dead zones; buses cannot stop earning revenue when offline; physical cards must work standalone |
| **v1 device strategy** | One device per account in v1 (no multi-device); cards/wristbands are P2 in v1.1 | Multi-device at launch | Multi-device adds significant edge cases around credit sync and fraud; not worth blocking launch |
| **Identity** | Phone number is the primary identity; OTP-based login | Email/password | Matches Zambian user behavior; works with MoMo accounts |
| **Money out** | Bus owner withdrawals to local bank or Mobile Money wallet, processed via licensed PSP partner | CarryMe holds its own e-money license at launch | Faster to market; defers regulatory complexity (see Open Questions) |

### 5.2 The core tap loop (passenger journey, happy path)

1. Chanda loads ZMW 50 via MTN MoMo → wallet now has 50 credits (1 credit = ZMW 1 in v1 for simplicity).
2. She walks to her nearest stop, taps **"I'm here"** in the app → her presence is broadcast to drivers of buses whose routes include this stop.
3. A bus shows up. She taps her phone against the driver's NFC reader. Driver's app sees: *"Chanda, traveling to stop X, fare = 8 credits, balance OK."* Driver confirms.
4. The 8 credits are **provisionally reserved** on her account.
5. On arrival, she taps off. The fare is finalized. If she rode further than declared, the system charges the additional stretch (if balance permits). If short, balance is refunded.
6. The bus owner sees the credits land in his real-time earnings dashboard within seconds (or when the bus reconnects, if offline).

### 5.3 Offline behavior (the part we cannot get wrong)

- **Driver device** stores the active trip's route, fare matrix, and a local ledger of taps. It can process taps using cached credentials and known balances.
- **Physical cards/wristbands** carry a signed, time-bounded **balance attestation** issued at last sync. When offline, the driver device trusts the attestation up to that limit. Stale attestations (>72h) are rejected.
- **Phone (Android HCE)** holds the same attestation in the secure app storage and behaves identically to a card when offline.
- **Reconciliation**: when driver device reconnects, all queued taps sync to the backend. Credits are decremented, owner earnings updated, and any anomalies (e.g. double-spend across two buses while offline) are flagged to Admin for resolution.
- **Anti-abuse**: maximum offline spend per credential per 24h is capped (configurable by Admin). Cards/wristbands have a hard floor — if the offline-trusted balance is exhausted, ride is rejected until next sync.

---

## 6. Functional Requirements

Each story uses the format *As a [persona], I want to [action], so that [outcome]*, followed by acceptance criteria. **All items below are v1 scope** unless explicitly tagged `[v1.1]`.

### 6.1 Passenger

#### P-1. Purchase / load credits (P1)
*As a passenger, I want to load funds into my CarryMe wallet via mobile money or local card, so that I have credits to ride.*
- [ ] Given a logged-in passenger, when they choose an amount (min ZMW 10, max ZMW 2000 per top-up in v1) and a payment method, then the payment flow completes and credits are reflected within 60 seconds for ≥ 95% of successful transactions.
- [ ] Supported rails at launch: **MTN Mobile Money, Airtel Money, Zamtel Kwacha, Visa/Mastercard issued by Zambian banks.**
- [ ] Failed top-ups never deduct credits and surface a human-readable error.
- [ ] Every top-up generates an immutable wallet ledger entry visible in the passenger's transaction history.

#### P-2. Manage credits / share credits by phone number (P1)
*As a passenger, I want to see my balance and transaction history, and send credits to another passenger by phone number, so that I can fund my child's or friend's trip.*
- [ ] Dashboard shows: current balance, last 30 days of credits/debits, pending offline taps not yet reconciled.
- [ ] Sharing requires: recipient phone number, amount, optional note, and OTP confirmation.
- [ ] If recipient is not yet a CarryMe user, credits are held for 7 days pending their signup, then auto-refunded.
- [ ] Daily share cap configurable by Admin (default ZMW 500/day per passenger in v1).

#### P-3. Attach devices (cards, wristbands, other phones) `[v1.1]`
*As a passenger, I want to attach physical cards, wristbands, or family members' phones to my account, so that I can ride without my primary phone.*
- [ ] **Deferred from v1.** v1 supports exactly **one device per account.**
- [ ] v1.1 acceptance criteria to be written; design exploration begins in v1 Sprint 4.

#### P-4. Board a bus — solo or group (P1)
*As a passenger, I want to tap on to board a bus alone or with a group, so that one of us can pay for everyone.*
- [ ] Solo: passenger taps phone/card against driver reader → driver app shows passenger name, destination (if pre-declared) or default end-of-route, fare → driver confirms → balance reserved.
- [ ] Group: passenger first selects passenger count (2–10) on **their own app** within 60 seconds before tapping, then taps once; driver app shows "Chanda + 3 others, fare 4×8 = 32 credits". Driver confirms total or rejects.
- [ ] If the passenger has insufficient balance for the declared trip, tap is rejected with an audible/visible cue on the driver device.

#### P-5. Disembark (P1)
*As a passenger, I want to tap off when I leave the bus, so that I'm only charged for the stretch I rode.*
- [ ] Tap-off at any stop along the route finalizes the fare to that stop.
- [ ] If passenger fails to tap off, fare defaults to the end of the trip's route (charged in full).
- [ ] Group: when the group leader taps off, the entire group is treated as disembarking together. (Mixed group exits are not supported in v1; documented limitation.)

#### P-6. Find closest bus stop (P1)
*As a passenger, I want to find the nearest stop given my current location and destination, so that I know where to walk.*
- [ ] Uses device GPS + Google Maps API.
- [ ] Returns: nearest 3 stops sorted by walking distance + walking directions.
- [ ] Filters: only stops served by routes that can take the passenger toward their destination.

#### P-7. Log arrival at bus stop (P1)
*As a passenger, I want to tell the system I've arrived at a stop, so that approaching buses know someone is waiting.*
- [ ] One-tap "I'm here" action; auto-expires after 30 minutes or on first tap-on, whichever first.
- [ ] Broadcasts to driver apps of buses inbound to that stop within the next 30 minutes (based on active trip GPS).
- [ ] Passenger can optionally set a destination at this step to enable seat reservation in P-8.

#### P-8. View inbound buses, available seats, and route (P1)
*As a waiting passenger, I want to see which buses are arriving, how many seats are open, and where they're going, so that I can decide which to board.*
- [ ] Lists active buses inbound to the logged stop with: ETA, route, current passenger count vs. seat capacity, fare to passenger's declared destination.
- [ ] Updates every 30 seconds while view is open.
- [ ] If a bus is offline, last known position and a "Last seen X min ago" label are shown.

#### P-9. View estimated arrival time at destination (P1)
*As a passenger on a bus, I want to see when I'll arrive at my destination, so that I can plan.*
- [ ] Uses Google Maps API ETA based on the bus's live GPS location and active route.
- [ ] Refreshes every 60 seconds.
- [ ] Degrades gracefully when GPS/network is unavailable (shows last known ETA + timestamp).

### 6.2 Driver

#### D-1. Log a route for each trip (P1)
*As a driver, I want to select my route at the start of a shift/trip, so that the system knows the stops, fare matrix, and direction.*
- [ ] Driver selects from routes assigned to their bus by Admin.
- [ ] Direction (forward/reverse) selectable.
- [ ] Route, stops, and fare matrix are cached to the device immediately so the trip works offline.

#### D-2. Start a trip (P1)
*As a driver, I want to start a trip explicitly, so that the system begins recording passengers, GPS, and earnings against it.*
- [ ] Trip start records: timestamp, GPS, route, direction, driver ID, bus ID.
- [ ] Only one trip can be active per bus at a time.
- [ ] Trip end is triggered manually by driver, or auto-ended after 4h of inactivity or arrival at the route's terminal stop (configurable by Admin).

#### D-3. Confirm passengers boarding (P1)
*As a driver, I want to confirm each tap-on, so that I have control over who is on my bus and disputes are minimized.*
- [ ] Driver device shows tap details (name, group size, fare) for ≤ 5 seconds; default is auto-confirm; driver can reject within that window.
- [ ] Rejected taps are logged for Admin review; the passenger's credits are not reserved.

#### D-4. Confirm passengers disembarking (P1)
*As a driver, I want to confirm each tap-off, so that I can correct erroneous disembarks (e.g. tap mistake at a stop).*
- [ ] Same flow as D-3: brief confirmation window with audio/visual cue; auto-confirm if no action.

#### D-5. View passengers waiting at upcoming stops (P1)
*As a driver, I want to see how many passengers have logged arrival at each upcoming stop on my route, so that I know whether to stop.*
- [ ] Driver app lists the next 5 stops on the active route with: stop name, ETA from current GPS, count of waiting passengers (from P-7).
- [ ] Updates every 30 seconds when online; shows last-known data with timestamp when offline.

### 6.3 Bus Owner

#### O-1. View trips and credits earned in real time (P1)
*As a bus owner, I want to see trips and credits flowing in as they happen, so that I can trust the system and run my business.*
- [ ] Dashboard refreshes at least every 60 seconds.
- [ ] Per-bus and aggregate views: trips today, credits today, average per trip, occupancy, completed vs. cancelled trips.
- [ ] Drill-down to any trip shows: route, driver, start/end times, passenger count, total credits, individual taps.

#### O-2. Filter stats by route and bus (P1)
*As a bus owner, I want to filter and compare performance across routes and buses, so that I can spot underperforming routes or vehicles.*
- [ ] Filters: bus, route, driver, date range (preset: today, 7d, 30d, custom).
- [ ] Comparison view: side-by-side metrics for up to 3 selections.
- [ ] CSV export available on every filtered view.

#### O-3. Convert credits to cash — withdraw to wallet (P1)
*As a bus owner, I want to convert earned credits into ZMW in my bank account or Mobile Money wallet, so that I can actually use the money.*
- [ ] Minimum withdrawal: ZMW 100. Maximum per transaction: TBD pending PSP partner agreement (see Open Questions).
- [ ] Withdrawal methods at launch: bank transfer (Zanaco, Stanbic, FNB, Absa, Indo Zambia at minimum); MTN MoMo; Airtel Money.
- [ ] Transparent fee disclosure **before** confirmation.
- [ ] SLA: payout completes within 24 business hours; status visible in dashboard at every stage.
- [ ] All withdrawals require OTP confirmation and are logged in an immutable owner ledger.

### 6.4 CarryMe Admin

#### A-1. Manage all users (P1)
*As an Admin, I want to view, search, suspend, restore, and adjust any user account across all four roles.*
- [ ] Searchable directory of passengers, drivers, owners, admins.
- [ ] Actions: suspend, restore, reset OTP, view full activity timeline, view linked devices, view wallet history.
- [ ] All actions are logged in an audit trail (who, what, when, why — reason required).

#### A-2. Manage all devices (P1)
*As an Admin, I want to register, assign, retire, and remotely deactivate cards, wristbands, driver devices, and bus-mounted readers.*
- [ ] Device registry with: device type, serial, current assignment (account / bus), status (active / lost / retired), last sync timestamp.
- [ ] Deactivation propagates to all driver devices within the next sync window; lost cards are blacklisted offline as soon as driver devices receive the next attestation refresh.

#### A-3. Manage all credits (P1)
*As an Admin, I want to issue, revoke, refund, or transfer credits with full audit trail, so that I can resolve disputes and run promotions.*
- [ ] Any credit movement requires a reason code and free-text note.
- [ ] Daily and per-action caps; actions above caps require dual approval from a second Admin.
- [ ] All movements are visible to the affected user(s) in their wallet ledger.

#### A-4. Elevated privileges (P1)
*As an Admin, I want platform-wide configuration access (routes, stops, fare matrices, system parameters) and impersonation tooling for support.*
- [ ] Configure routes: stops, ordering, geofence, fare matrix per stretch per direction.
- [ ] Configure system parameters: offline spend caps, attestation TTL, top-up min/max, sharing caps, withdrawal min/max.
- [ ] Impersonation mode for support: log in **as** any user; banner clearly indicates impersonation; every action attributed to the Admin in the audit log.

---

## 7. Technical Considerations

### 7.1 Major components
- **Identity service**: phone number + OTP, role-based access (passenger / driver / owner / admin).
- **Wallet service**: double-entry ledger, ZMW-denominated, idempotent, replayable.
- **Fare engine**: per-route fare matrix; computes fare from (route, start_stop, end_stop, passenger_count).
- **Trip service**: trip lifecycle, GPS tracking, passenger manifest.
- **NFC / device service**: card/wristband provisioning, attestation issuance, blacklist propagation.
- **Sync engine**: handles offline queues, conflict resolution, reconciliation reporting.
- **Payments adapter**: pluggable PSP integration for top-ups and withdrawals.
- **Maps integration**: Google Maps Platform (Directions, Distance Matrix, Places).

### 7.2 Dependencies
| Dependency | Needed for | Owner | Timeline risk |
|---|---|---|---|
| PSP / aggregator with MTN MoMo, Airtel, Zamtel, and card acquiring | Top-ups & withdrawals | Payments Lead | **High** — long sales/integration cycles |
| Google Maps Platform contract & quota | Stops, ETA, distance | Eng Lead | Medium |
| NFC reader hardware (or Android device with HCE) for drivers | Tap collection | Hardware Lead | Medium — supply chain into Zambia |
| Physical cards/wristbands (NFC Type 2/4, printed/encoded) | Cardless ride for v1.1; pilot units for v1 testing | Hardware Lead | Medium |
| SMS gateway with Zambian short-code | OTP, sharing notifications | Eng Lead | Low |
| Cloud hosting with low-latency presence in Southern Africa (or CDN-fronted) | Performance for Lusaka users | Eng Lead | Low |

### 7.3 Known risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Offline reconciliation produces double-spend across two buses | Medium | High | Attestation TTL ≤ 72h; per-credential daily offline cap; flag anomalies to Admin; insurance pool for losses |
| PSP integration delays the entire launch | High | High | Sign LOI with PSP **before** Sprint 1; build with mocked PSP in parallel; have backup PSP shortlist |
| Regulatory ambiguity (e-money, transport licensing) blocks launch | Medium | Critical | Engage Zambian legal counsel in Week 1; structure as PSP agent in v1 (we don't hold e-money) |
| Drivers reject the system if it adds friction | High | High | Driver UX prototype tested with 5+ real drivers in Sprint 2; auto-confirm taps; loud audio cues |
| NFC misreads in dusty/bright/cold conditions cause customer trust loss | Medium | Medium | Reader hardware selected for harsh-environment use; clear retry UX; fallback to scan-passenger-QR if NFC fails twice |
| Bus owners distrust the dashboard and revert to cash | Medium | Critical | Run a 2-week parallel cash + CarryMe pilot per owner; produce reconciliation report comparing both |
| iOS users can't host NFC credentials | Certain | Medium | Documented: iOS users use a paired card/wristband (post-v1.1) or an Android device; messaged clearly at signup |
| Mobile data costs deter passenger app usage | Medium | Medium | Aggressively optimize payload sizes; offline-capable passenger app; consider zero-rating partnership with MTN/Airtel post-launch |
| Cash flow / float management for owner withdrawals | Medium | High | Maintain operational float per Admin policy; cap daily withdrawal velocity in v1; partner with PSP for liquidity |

### 7.4 Open Questions (MUST resolve before dev start or before GA, as noted)
- [ ] **Regulatory structure** (e-money license vs. PSP agent vs. partnership). — Owner: Legal + Payments Lead — **Deadline: end of Discovery (before Sprint 1)**.
- [ ] **PSP partner selection** for top-ups and withdrawals. — Owner: Payments Lead — Deadline: end of Sprint 1.
- [ ] **Driver device decision**: CarryMe-issued Android with HCE, or dedicated NFC reader peripheral? — Owner: Hardware Lead — Deadline: end of Sprint 1.
- [ ] **Card/wristband supplier** and unit economics. — Owner: Hardware Lead — Deadline: end of Sprint 2 (acceptable to slip since cards land in v1.1).
- [ ] **Data residency requirements** under Zambian Data Protection Act (2021). — Owner: Legal — Deadline: end of Discovery.
- [ ] **Pilot route(s) and pilot bus owner partner(s)** selected. — Owner: Ops/Launch Lead — Deadline: end of Sprint 2.
- [ ] **Fee structure**: do we take a % of fares? A flat fee per trip? Withdrawal fees? — Owner: PM + Finance — Deadline: end of Sprint 2.
- [ ] **Baselines for success metrics** (passenger problem interviews, owner leakage benchmark). — Owner: PM — Deadline: end of Discovery.
- [ ] **Brand and trust strategy** for owners (most skeptical persona). — Owner: PM + Marketing — Deadline: before pilot launch.
- [ ] **Dispute resolution SLA and workflow** between passenger ↔ driver ↔ owner ↔ admin. — Owner: PM + Ops — Deadline: before pilot launch.
- [ ] **What happens to unspent credits on dormant accounts** (refund policy, escheatment under Zambian law). — Owner: Legal + PM — Deadline: before GA.

---

## 8. Launch Plan

| Phase | Date | Audience | Success Gate |
|---|---|---|---|
| **Internal alpha** | End of Sprint 5 | CarryMe team + 1 friendly bus owner + 5 drivers + 50 staff passengers | No P0 bugs; core tap loop completes ≥ 95% online; offline mode tested in lab; full reconciliation produces zero ledger discrepancies |
| **Closed pilot** | End of Sprint 8 | 1 route, 5–10 buses, opt-in passengers (target: 500 active) | Tap success ≥ 95%; passenger CSAT ≥ 4/5; owner sees their numbers daily; zero unresolved credit disputes > 48h |
| **Expanded pilot** | End of Sprint 10 | 2 routes, 20 buses, public launch on those routes | Tap success ≥ 97%; ≥ 30% of trips on equipped buses paid via credits; owner withdrawals processed within SLA |
| **Lusaka soft launch** | TBD post-pilot review | All willing operators on additional routes; passenger-side public marketing | Per-bus break-even on platform fees; week-over-week active passenger growth |

**Rollback criteria** (pilot and after):
- Tap success rate falls below 90% for any 24h period → halt new bus onboarding, escalate.
- Wallet ledger discrepancy > 0.5% of credit movements in any day → freeze withdrawals, full audit.
- Critical security incident (credential compromise, payments breach) → kill switch on affected component; comms plan in security runbook.
- PSP outage > 4 hours → top-ups and withdrawals paused with in-app banner; rides continue against existing balances.

---

## 9. Appendix

- **Glossary**
  - **Stretch**: a contiguous segment of a route between two stops, used as the fare-calculation unit.
  - **Attestation**: a signed, time-bounded statement of a credential's balance, used to authorize offline rides.
  - **Reader**: the NFC-receiving device on the bus (driver phone or dedicated terminal).
  - **Credential**: any device that identifies a passenger — phone (HCE), card, or wristband.
- **Related documents (to be created)**
  - Opportunity Assessment: CarryMe — Lusaka Market Entry
  - Technical Design Doc: Wallet Ledger & Offline Reconciliation
  - Technical Design Doc: NFC Credential & Attestation Lifecycle
  - GTM Brief: CarryMe Lusaka Pilot
  - Security & Privacy Review: CarryMe v1
  - Regulatory Memo: CarryMe Operating Structure in Zambia
- **Stakeholder sign-off required before dev start**: Eng Lead, Mobile Lead, Hardware Lead, Design Lead, Payments/Compliance Lead, Legal, Ops Lead.
