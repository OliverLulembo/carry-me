import { SignJWT, jwtVerify } from "jose";

const ISSUER = "carryme-web";
const AUDIENCE = "carryme-clients";

function key() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type SessionClaims = {
  sub: string;        // user id
  phone: string;
  role: "PASSENGER" | "DRIVER" | "OWNER" | "ADMIN";
};

export async function signSession(claims: SessionClaims, ttl = "30d") {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}
