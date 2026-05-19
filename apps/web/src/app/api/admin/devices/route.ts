import { NextResponse, type NextRequest } from "next/server";
import { DeviceType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const CreateSchema = z.object({
  serial: z.string().min(3).max(64),
  type: z.nativeEnum(DeviceType),
  label: z.string().max(80).optional(),
  userId: z.string().optional(),
  busId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const devices = await db.device.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, fullName: true, phone: true } },
      bus: { select: { id: true, plate: true } },
    },
    take: 200,
  });

  return NextResponse.json({
    devices: devices.map((d) => ({
      id: d.id,
      serial: d.serial,
      type: d.type,
      label: d.label,
      active: d.active,
      lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
      user: d.user,
      bus: d.bus,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const device = await db.device.create({
    data: {
      serial: parsed.data.serial,
      type: parsed.data.type,
      label: parsed.data.label,
      userId: parsed.data.userId,
      busId: parsed.data.busId,
    },
    include: {
      user: { select: { id: true, fullName: true, phone: true } },
      bus: { select: { id: true, plate: true } },
    },
  });

  return NextResponse.json({ device });
}
