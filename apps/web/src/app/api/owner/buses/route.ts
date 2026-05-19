import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/owner";

const CreateSchema = z.object({
  plate: z
    .string()
    .min(3)
    .max(12)
    .transform((s) => s.trim().toUpperCase()),
  capacity: z.number().int().min(8).max(80),
  defaultRouteId: z.string().cuid().nullable().optional(),
  active: z.boolean().optional(),
});

function serializeBus(
  bus: {
    id: string;
    plate: string;
    capacity: number;
    active: boolean;
    defaultRouteId: string | null;
    createdAt: Date;
    defaultRoute: { id: string; name: string } | null;
    _count?: { trips: number };
  },
) {
  return {
    id: bus.id,
    plate: bus.plate,
    capacity: bus.capacity,
    active: bus.active,
    defaultRouteId: bus.defaultRouteId,
    defaultRouteName: bus.defaultRoute?.name ?? null,
    createdAt: bus.createdAt.toISOString(),
    tripCount: bus._count?.trips ?? 0,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const buses = await db.bus.findMany({
    where: { ownerId: auth.session.sub },
    orderBy: { plate: "asc" },
    include: {
      defaultRoute: { select: { id: true, name: true } },
      _count: { select: { trips: true } },
    },
  });

  return NextResponse.json({ buses: buses.map(serializeBus) });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { plate, capacity, defaultRouteId, active } = parsed.data;

  if (defaultRouteId) {
    const route = await db.route.findFirst({
      where: { id: defaultRouteId, active: true },
    });
    if (!route) {
      return NextResponse.json({ error: "Route not found or inactive" }, { status: 400 });
    }
  }

  const existing = await db.bus.findUnique({ where: { plate } });
  if (existing) {
    return NextResponse.json({ error: "Plate already registered" }, { status: 409 });
  }

  const bus = await db.bus.create({
    data: {
      plate,
      capacity,
      ownerId: auth.session.sub,
      defaultRouteId: defaultRouteId ?? null,
      active: active ?? true,
    },
    include: {
      defaultRoute: { select: { id: true, name: true } },
      _count: { select: { trips: true } },
    },
  });

  return NextResponse.json({ bus: serializeBus(bus) });
}
