import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { SESSION_COOKIE } from "./auth";

export function attachSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export function dashboardPathForRole(role: UserRole, redirect?: string | null): string {
  if (redirect?.startsWith("/")) return redirect;
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "DRIVER":
      return "/driver/dashboard";
    case "OWNER":
      return "/owner/dashboard";
    default:
      return "/dashboard";
  }
}

export function loginPathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/login/admin";
    case "DRIVER":
      return "/login/driver";
    case "OWNER":
      return "/login/owner";
    default:
      return "/login/passenger";
  }
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) return `+260${trimmed.slice(1)}`;
  if (trimmed.startsWith("260")) return `+${trimmed}`;
  return trimmed;
}
