import {
  PrismaClient,
  UserRole,
  TripStatus,
  WalletEntryKind,
  DeviceType,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();
const DEMO_PASSWORD = "carryme123";

async function main() {
  console.log("Seeding CarryMe demo data...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // ── Users ────────────────────────────────────────────────────────────────
  const passenger = await db.user.upsert({
    where: { phone: "+260977000001" },
    update: {
      email: "passenger@carryme.dev",
      passwordHash,
    },
    create: {
      phone: "+260977000001",
      email: "passenger@carryme.dev",
      passwordHash,
      fullName: "Chanda Mwila",
      role: UserRole.PASSENGER,
      wallet: { create: { balance: 0 } },
    },
    include: { wallet: true },
  });

  const owner = await db.user.upsert({
    where: { phone: "+260977000003" },
    update: {
      email: "owner@carryme.dev",
      passwordHash,
    },
    create: {
      phone: "+260977000003",
      email: "owner@carryme.dev",
      passwordHash,
      fullName: "Mr. Banda",
      role: UserRole.OWNER,
      wallet: { create: { balance: 0 } },
    },
  });

  const driver = await db.user.upsert({
    where: { phone: "+260977000002" },
    update: {
      email: "driver@carryme.dev",
      passwordHash,
      invitedByOwnerId: owner.id,
    },
    create: {
      phone: "+260977000002",
      email: "driver@carryme.dev",
      passwordHash,
      fullName: "Mwila Phiri",
      role: UserRole.DRIVER,
      invitedByOwnerId: owner.id,
    },
  });

  const admin = await db.user.upsert({
    where: { phone: "+260977000004" },
    update: {
      role: UserRole.ADMIN,
      email: "admin@carryme.dev",
      passwordHash,
    },
    create: {
      phone: "+260977000004",
      email: "admin@carryme.dev",
      passwordHash,
      fullName: "CarryMe Ops",
      role: UserRole.ADMIN,
    },
  });

  // ── Stops (Lusaka-ish coordinates; centred near Cairo Road) ──────────────
  const stopSpec: Array<{ name: string; lat: number; lng: number }> = [
    { name: "Kabwata Market",   lat: -15.4423, lng: 28.3168 },
    { name: "Burma Road",       lat: -15.4365, lng: 28.3142 },
    { name: "Manda Hill",       lat: -15.4072, lng: 28.3083 },
    { name: "Northmead",        lat: -15.4001, lng: 28.3196 },
    { name: "Cairo Road North", lat: -15.4159, lng: 28.2833 },
    { name: "Town Bus Station", lat: -15.4180, lng: 28.2820 },
  ];

  const stops = [];
  for (const s of stopSpec) {
    const stop = await db.busStop.upsert({
      where: { id: `seed-stop-${s.name.replace(/\W+/g, "-").toLowerCase()}` },
      update: { name: s.name, lat: s.lat, lng: s.lng },
      create: {
        id: `seed-stop-${s.name.replace(/\W+/g, "-").toLowerCase()}`,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
      },
    });
    stops.push(stop);
  }

  // ── Route ────────────────────────────────────────────────────────────────
  const route = await db.route.upsert({
    where: { id: "seed-route-kabwata-town" },
    update: { active: true },
    create: {
      id: "seed-route-kabwata-town",
      name: "Kabwata ↔ Town",
      description: "Main commuter spine from Kabwata Market to Town Bus Station",
      active: true,
    },
  });

  // Wipe and re-insert ordered stops + fare matrix for idempotency
  await db.routeStop.deleteMany({ where: { routeId: route.id } });
  for (let i = 0; i < stops.length; i++) {
    await db.routeStop.create({
      data: { routeId: route.id, stopId: stops[i].id, order: i },
    });
  }

  await db.fareSegment.deleteMany({ where: { routeId: route.id } });
  // Simple fare matrix: 4 credits per stop-stretch travelled, both directions.
  for (let i = 0; i < stops.length; i++) {
    for (let j = 0; j < stops.length; j++) {
      if (i === j) continue;
      const distance = Math.abs(j - i);
      await db.fareSegment.create({
        data: {
          routeId: route.id,
          startStopId: stops[i].id,
          endStopId: stops[j].id,
          credits: 4 * distance,
        },
      });
    }
  }

  // ── Bus + Driver Device ──────────────────────────────────────────────────
  const bus = await db.bus.upsert({
    where: { plate: "ALD-1234" },
    update: { ownerId: owner.id, defaultRouteId: route.id, capacity: 22 },
    create: {
      plate: "ALD-1234",
      capacity: 22,
      ownerId: owner.id,
      defaultRouteId: route.id,
    },
  });

  // No active trip in seed — drivers start trips from the dashboard.
  await db.trip.updateMany({
    where: { busId: bus.id, status: TripStatus.ACTIVE },
    data: { status: TripStatus.COMPLETED, endedAt: new Date() },
  });

  await db.device.upsert({
    where: { serial: "seed-device-driver-pad" },
    update: {
      userId: driver.id,
      busId: bus.id,
      type: DeviceType.DRIVER_PAD,
      label: "Bus reader — ALD-1234",
      active: true,
      lastSeenAt: new Date(),
    },
    create: {
      serial: "seed-device-driver-pad",
      userId: driver.id,
      busId: bus.id,
      type: DeviceType.DRIVER_PAD,
      label: "Bus reader — ALD-1234",
      active: true,
      lastSeenAt: new Date(),
    },
  });

  // ── Linked devices for the demo passenger ────────────────────────────────
  // v1 ships single-device; we seed a few here so the dashboard's "Linked
  // devices" section is visually meaningful for the v1.1 multi-device preview.
  const now = Date.now();
  const passengerDevices: Array<{
    serial: string;
    type: DeviceType;
    label: string;
    active: boolean;
    lastSeenMinutesAgo: number | null;
  }> = [
    {
      serial: "seed-device-chanda-phone",
      type: DeviceType.PHONE,
      label: "Chanda's Tecno",
      active: true,
      lastSeenMinutesAgo: 3,
    },
    {
      serial: "seed-device-chanda-card",
      type: DeviceType.CARD,
      label: "Blue NFC card",
      active: true,
      lastSeenMinutesAgo: 60 * 26,
    },
    {
      serial: "seed-device-chanda-wristband",
      type: DeviceType.WRISTBAND,
      label: "Festival wristband",
      active: false,
      lastSeenMinutesAgo: 60 * 24 * 9,
    },
  ];

  for (const d of passengerDevices) {
    const lastSeenAt =
      d.lastSeenMinutesAgo === null
        ? null
        : new Date(now - d.lastSeenMinutesAgo * 60 * 1000);
    await db.device.upsert({
      where: { serial: d.serial },
      update: {
        userId: passenger.id,
        type: d.type,
        label: d.label,
        active: d.active,
        lastSeenAt,
      },
      create: {
        serial: d.serial,
        userId: passenger.id,
        type: d.type,
        label: d.label,
        active: d.active,
        lastSeenAt,
      },
    });
  }

  // ── Top up the demo passenger with 120 credits ───────────────────────────
  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: passenger.id } });
  const seedAmount = 120;
  if (wallet.balance < seedAmount) {
    const delta = seedAmount - wallet.balance;
    await db.walletEntry.create({
      data: {
        walletId: wallet.id,
        amount: delta,
        kind: WalletEntryKind.TOPUP,
        balanceAfter: seedAmount,
        reference: "seed-topup",
        note: "Seed top-up via Demo Mobile Money",
      },
    });
    await db.wallet.update({ where: { id: wallet.id }, data: { balance: seedAmount } });
  }

  // ── Past trips (trip history page) ───────────────────────────────────────
  const historyNow = Date.now();
  const pastTripSpecs = [
    { daysAgo: 2, on: 0, off: 3, credits: 12 },
    { daysAgo: 5, on: 2, off: 5, credits: 12 },
    { daysAgo: 9, on: 1, off: 4, credits: 12 },
  ];
  for (const spec of pastTripSpecs) {
    const startedAt = new Date(historyNow - spec.daysAgo * 24 * 60 * 60 * 1000);
    const endedAt = new Date(startedAt.getTime() + 45 * 60 * 1000);
    const tappedOnAt = new Date(startedAt.getTime() + 5 * 60 * 1000);
    const tappedOffAt = new Date(startedAt.getTime() + 35 * 60 * 1000);
    const pastTrip = await db.trip.create({
      data: {
        busId: bus.id,
        driverId: driver.id,
        routeId: route.id,
        status: TripStatus.COMPLETED,
        startedAt,
        endedAt,
      },
    });
    await db.tap.create({
      data: {
        tripId: pastTrip.id,
        passengerId: passenger.id,
        onStopId: stops[spec.on].id,
        offStopId: stops[spec.off].id,
        groupSize: 1,
        reservedCredits: spec.credits,
        finalCredits: spec.credits,
        status: "SETTLED",
        tappedOnAt,
        tappedOffAt,
      },
    });
  }

  // ── Backfill owner earnings from settled taps (demo wallet balance) ─────
  const ownerWallet = await db.wallet.findUnique({ where: { userId: owner.id } });
  if (ownerWallet) {
    const settledOnFleet = await db.tap.aggregate({
      where: {
        status: "SETTLED",
        finalCredits: { not: null },
        trip: { bus: { ownerId: owner.id } },
      },
      _sum: { finalCredits: true },
    });
    const earned = settledOnFleet._sum.finalCredits ?? 0;
    if (earned > 0 && ownerWallet.balance < earned) {
      const delta = earned - ownerWallet.balance;
      await db.walletEntry.create({
        data: {
          walletId: ownerWallet.id,
          amount: delta,
          kind: WalletEntryKind.TRIP_EARNINGS,
          balanceAfter: earned,
          reference: "seed-owner-earnings",
          note: "Seed backfill from settled passenger trips",
        },
      });
      await db.wallet.update({
        where: { id: ownerWallet.id },
        data: { balance: earned },
      });
    }
  }

  console.log("✓ Seed complete.");
  console.log(`  Demo login password for all seeded users: ${DEMO_PASSWORD}`);
  console.log(`  Demo passenger: ${passenger.email} (${passenger.phone})`);
  console.log(`  Demo driver: ${driver.email} (${driver.phone})`);
  console.log(`  Demo owner: ${owner.email} (${owner.phone})`);
  console.log(`  Demo admin: ${admin.email} (${admin.phone})`);
  console.log(`  Wallet balance: ${seedAmount} credits`);
  console.log(`  Route: ${route.name} with ${stops.length} stops`);
  console.log(`  Demo bus: ${bus.plate} (no active trip — start one from the driver dashboard)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
