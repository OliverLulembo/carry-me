import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendDriverCredentialsEmail } from "@/lib/email";
import { requireOwner } from "@/lib/owner";
import { generateTemporaryPassword, hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/session";

const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20),
  email: z.string().trim().email().max(120),
});

export async function GET(req: NextRequest) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const drivers = await db.user.findMany({
    where: { invitedByOwnerId: auth.session.sub, role: "DRIVER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      createdAt: true,
      suspendedAt: true,
    },
  });

  return NextResponse.json({
    drivers: drivers.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  const email = parsed.data.email.toLowerCase();

  const existing = await db.user.findFirst({
    where: { OR: [{ phone }, { email }] },
    select: { id: true, phone: true, email: true, role: true },
  });
  if (existing) {
    if (existing.phone === phone) {
      return NextResponse.json({ error: "A user with that phone already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const owner = await db.user.findUnique({
    where: { id: auth.session.sub },
    select: { fullName: true },
  });
  if (!owner) {
    return NextResponse.json({ error: "Owner not found." }, { status: 404 });
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const driver = await db.user.create({
    data: {
      fullName: parsed.data.fullName,
      phone,
      email,
      passwordHash,
      role: "DRIVER",
      invitedByOwnerId: auth.session.sub,
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      createdAt: true,
    },
  });

  const origin = new URL(req.url).origin;
  await sendDriverCredentialsEmail({
    to: email,
    driverName: driver.fullName,
    ownerName: owner.fullName,
    email,
    temporaryPassword,
    loginUrl: `${origin}/login/driver`,
  });

  return NextResponse.json({
    driver: {
      ...driver,
      createdAt: driver.createdAt.toISOString(),
    },
    message: "Driver added. Login credentials were sent by email.",
    ...(process.env.NODE_ENV !== "production" ? { devTemporaryPassword: temporaryPassword } : {}),
  });
}
