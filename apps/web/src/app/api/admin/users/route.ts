import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const RoleSchema = z.enum(["PASSENGER", "DRIVER", "OWNER", "ADMIN"]);

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const roleParam = req.nextUrl.searchParams.get("role");
  const roleParsed = roleParam ? RoleSchema.safeParse(roleParam) : null;
  if (roleParam && !roleParsed?.success) {
    return NextResponse.json({ error: "Invalid role filter" }, { status: 400 });
  }

  const users = await db.user.findMany({
    where: {
      ...(roleParsed?.success ? { role: roleParsed.data as UserRole } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      wallet: { select: { balance: true } },
      _count: { select: { devices: true, taps: true } },
    },
    take: 100,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      suspendedAt: u.suspendedAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      balance: u.wallet?.balance ?? null,
      deviceCount: u._count.devices,
      tripCount: u._count.taps,
    })),
  });
}
