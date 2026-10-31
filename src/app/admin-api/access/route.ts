import { NextResponse } from "next/server";
import { requireRequestAdmin } from "@/lib/admin-request";

const COOKIE = "axiom_admin_email";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function GET(req: Request) {
  const { admin, error } = await requireRequestAdmin(req);
  if (error || !admin) return NextResponse.json({ email: null });
  return NextResponse.json({ email: admin.email, name: admin.name });
}

export async function POST() {
  return NextResponse.json(
    { error: "forbidden", message: "Sign in with the admin email and password." },
    { status: 403 },
  );
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", cookieOptions());
  return res;
}
