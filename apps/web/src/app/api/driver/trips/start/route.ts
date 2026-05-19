import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { TripStatus } from "@prisma/client";
import { requireDriver } from "@/lib/driver";
import { db } from "@/lib/db";

const BodySchema = z.object({
  routeId: z.string().min(1),
  direction: z.enum(["FORWARD", "REVERSE"]).optional(),
});

// Start a new trip for the driver's assigned bus (demo: first bus with default route).
export async function POST(req: NextRequest) {
  const auth = await requireDriver(req);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = await db.trip.findFirst({
    where: { driverId: session.sub, status: TripStatus.ACTIVE },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have an active trip" }, { status: 409 });
  }

  const bus = await db.bus.findFirst({
    where: {
      active: true,
      OR: [{ defaultRouteId: body.routeId }, { trips: { some: { driverId: session.sub } } }],
    },
    orderBy: { createdAt: "asc" },
  });
  if (!bus) {
    return NextResponse.json(
      { error: "No bus assigned for this route. Contact your operator." },
      { status: 404 },
    );
  }

  const otherActive = await db.trip.findFirst({
    where: { busId: bus.id, status: TripStatus.ACTIVE },
  });
  if (otherActive) {
    return NextResponse.json(
      { error: "This bus already has an active trip" },
      { status: 409 },
    );
  }

  const route = await db.route.findFirst({
    where: { id: body.routeId, active: true },
    include: {
      stops: { orderBy: { order: "asc" }, take: 1, include: { stop: true } },
    },
  });
  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  const firstStop = route.stops[0]?.stop;

  const trip = await db.trip.create({
    data: {
      busId: bus.id,
      driverId: session.sub,
      routeId: body.routeId,
      direction: body.direction ?? "FORWARD",
      status: TripStatus.ACTIVE,
      lastLat: firstStop?.lat,
      lastLng: firstStop?.lng,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ tripId: trip.id });
}
