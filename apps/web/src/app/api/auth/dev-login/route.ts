import { NextResponse, type NextRequest } from "next/server";
import { TapStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { signSession } from "@/lib/jwt";
import { SESSION_COOKIE } from "@/lib/auth";

// Dev-only shortcut. Logs in as the seeded demo passenger (or any phone passed in).
// Issues a JWT for mobile clients AND sets the session cookie for the web app.
// Replace with phone+OTP for production (see PRD §6.1 and Open Question on SMS provider).
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }
  let phone = process.env.DEMO_PASSENGER_PHONE ?? "+260977000001";
  try {
    const body = (await req.json()) as { phone?: string };
    if (body?.phone) phone = body.phone;
  } catch {
    // body is optional
  }

  const user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json(
      { error: `No user found for ${phone}. Run \`npx prisma db seed\` first.` },
      { status: 404 },
    );
  }

  await resetPassengerDemoState(user.id, user.role);

  const token = await signSession({
    sub: user.id,
    phone: user.phone,
    role: user.role,
  });

  const res = NextResponse.json({
    token,
    user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // local dev
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

// Convenience: hitting this with GET in a browser logs you in as the demo passenger
// and redirects to the dashboard. Saves you from running curl during the hackathon.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }
  const phone =
    req.nextUrl.searchParams.get("phone") ??
    process.env.DEMO_PASSENGER_PHONE ??
    "+260977000001";
  const user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json(
      { error: `No user found for ${phone}. Run \`npx prisma db seed\` first.` },
      { status: 404 },
    );
  }
  await resetPassengerDemoState(user.id, user.role);

  const token = await signSession({
    sub: user.id,
    phone: user.phone,
    role: user.role,
  });
  const defaultPath =
    user.role === "ADMIN"
      ? "/admin"
      : user.role === "DRIVER"
        ? "/driver/dashboard"
        : "/dashboard";
  const redirectParam = req.nextUrl.searchParams.get("redirect");
  const path = redirectParam?.startsWith("/") ? redirectParam : defaultPath;
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const url = new URL(path, `${proto}://${host}`);
  const res = NextResponse.redirect(url);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

async function resetPassengerDemoState(userId: string, role: string) {
  if (role !== "PASSENGER") return;

  await db.$transaction([
    db.tap.updateMany({
      where: { passengerId: userId, status: TapStatus.HELD },
      data: {
        status: TapStatus.CANCELLED,
        syncedAt: new Date(),
      },
    }),
    db.stopArrival.updateMany({
      where: {
        userId,
        cancelledAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { cancelledAt: new Date() },
    }),
  ]);
}
