import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { signSession } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import { attachSessionCookie, dashboardPathForRole, normalizePhone } from "@/lib/session";

const bodySchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(72),
  role: z.enum(["PASSENGER", "DRIVER", "OWNER", "ADMIN"]).optional(),
  redirect: z.string().optional(),
});

function isEmail(value: string): boolean {
  return value.includes("@");
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const { identifier, password, role, redirect } = parsed.data;
  const where = isEmail(identifier)
    ? { email: identifier.toLowerCase() }
    : { phone: normalizePhone(identifier) };

  const user = await db.user.findUnique({
    where,
    select: {
      id: true,
      phone: true,
      fullName: true,
      role: true,
      email: true,
      passwordHash: true,
      suspendedAt: true,
    },
  });

  if (!user || !user.passwordHash || user.suspendedAt) {
    return NextResponse.json({ error: "Invalid email/phone or password." }, { status: 401 });
  }

  if (role && user.role !== role) {
    return NextResponse.json(
      { error: `This account is not registered as a ${role.toLowerCase()}.` },
      { status: 403 },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email/phone or password." }, { status: 401 });
  }

  const token = await signSession({
    sub: user.id,
    phone: user.phone,
    role: user.role as UserRole,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
    },
    redirect: dashboardPathForRole(user.role, redirect ?? null),
  });
  return attachSessionCookie(res, token);
}
