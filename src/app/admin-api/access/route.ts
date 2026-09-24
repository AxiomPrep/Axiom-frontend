import { NextResponse } from "next/server";
import { findSeededAdmin, normalizeAdminEmail } from "@/data/admin-seed";

const COOKIE = "axiom_admin_email";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

export async function GET(req: Request) {
  const email = req.headers.get("cookie")?.match(/(?:^|;\s*)axiom_admin_email=([^;]+)/)?.[1];
  const decoded = email ? decodeURIComponent(email) : "";
  const admin = decoded ? findSeededAdmin(decoded) : null;
  if (!admin) return NextResponse.json({ email: null });
  return NextResponse.json(admin);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = normalizeAdminEmail(String(body.email || ""));
  const admin = findSeededAdmin(email);
  if (!admin) {
    return NextResponse.json(
      { error: "forbidden", message: "This email is not on the admin seed list." },
      { status: 403 },
    );
  }
  const res = NextResponse.json(admin);
  res.cookies.set(COOKIE, admin.email, cookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return res;
}
