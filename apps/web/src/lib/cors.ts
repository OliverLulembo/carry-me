import { NextResponse, type NextRequest } from "next/server";

function allowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? "*";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function resolveCorsOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  const allow = allowedOrigins();
  if (allow.includes("*")) return origin ?? "*";
  if (origin && allow.includes(origin)) return origin;
  return null;
}

export function applyCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = resolveCorsOrigin(req);
  if (!origin) return res;
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  return res;
}

export function preflight(req: NextRequest): NextResponse | null {
  if (req.method !== "OPTIONS") return null;
  const res = new NextResponse(null, { status: 204 });
  return applyCors(req, res);
}
