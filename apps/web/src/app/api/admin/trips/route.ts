import { NextResponse, type NextRequest } from "next/server";
import { TripStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const StatusSchema = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]);

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const statusParam = req.nextUrl.searchParams.get("status");
  const statusParsed = statusParam ? StatusSchema.safeParse(statusParam) : null;
  if (statusParam && !statusParsed?.success) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  const plate = req.nextUrl.searchParams.get("plate")?.trim() ?? "";

  const trips = await db.trip.findMany({
    where: {
      ...(statusParsed?.success ? { status: statusParsed.data as TripStatus } : {}),
      ...(plate ? { bus: { plate: { contains: plate } } } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      bus: { select: { plate: true } },
      driver: { select: { fullName: true, phone: true } },
      route: { select: { name: true } },
      _count: { select: { taps: true } },
    },
  });

  return NextResponse.json({
    trips: trips.map((t) => ({
      id: t.id,
      status: t.status,
      direction: t.direction,
      startedAt: t.startedAt.toISOString(),
      endedAt: t.endedAt?.toISOString() ?? null,
      busPlate: t.bus.plate,
      driverName: t.driver.fullName,
      driverPhone: t.driver.phone,
      routeName: t.route.name,
      tapCount: t._count.taps,
    })),
  });
}
