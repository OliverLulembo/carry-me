import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { signSession } from "@/lib/jwt";
import { hashPassword } from "@/lib/password";
import { attachSessionCookie, dashboardPathForRole, normalizePhone } from "@/lib/session";

const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  const email = parsed.data.email.toLowerCase();

  const existing = await db.user.findFirst({
    where: { OR: [{ phone }, { email }] },
    select: { phone: true, email: true },
  });
  if (existing?.phone === phone) {
    return NextResponse.json({ error: "That phone number is already registered." }, { status: 409 });
  }
  if (existing?.email === email) {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: {
      fullName: parsed.data.fullName,
      phone,
      email,
      passwordHash,
      role: "PASSENGER",
      wallet: { create: { balance: 0 } },
    },
    select: { id: true, phone: true, fullName: true, role: true, email: true },
  });

  const token = await signSession({
    sub: user.id,
    phone: user.phone,
    role: user.role,
  });

  const res = NextResponse.json({
    user,
    redirect: dashboardPathForRole(user.role),
  });
  return attachSessionCookie(res, token);
}
