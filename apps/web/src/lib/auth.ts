import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifySession, type SessionClaims } from "./jwt";

export const SESSION_COOKIE = "carryme_session";

// Read session from either the cookie (web) OR `Authorization: Bearer` header (mobile).
export async function getSessionFromRequest(req: NextRequest): Promise<SessionClaims | null> {
  const authz = req.headers.get("authorization");
  if (authz?.toLowerCase().startsWith("bearer ")) {
    return verifySession(authz.slice(7).trim());
  }
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) return verifySession(cookie);
  return null;
}

// For Server Components / Route Handlers via the `cookies()` API.
export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
