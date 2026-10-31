import { NextResponse } from "next/server";
import { getApiOrigin, SUPABASE_ANON_KEY } from "@/lib/api-origin";

export type RequestAdmin = {
  email: string;
  name: string;
  token: string;
};

function readCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie") || "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export async function requireRequestAdmin(req: Request): Promise<
  { admin: RequestAdmin; error: null } | { admin: null; error: NextResponse }
> {
  const header = req.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const token = bearer || readCookie(req, "axiom_access_token");
  if (!token || token.startsWith("google.") || token.length < 20) {
    return {
      admin: null,
      error: NextResponse.json({ error: "unauthorized", message: "Sign in with the admin account." }, { status: 401 }),
    };
  }

  try {
    const res = await fetch(`${getApiOrigin()}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      is_admin?: boolean;
      profile?: { role?: string; email?: string | null; full_name?: string | null };
    };
    const role = data.profile?.role;
    if (!res.ok || (data.is_admin !== true && role !== "admin")) {
      return {
        admin: null,
        error: NextResponse.json({ error: "forbidden", message: "This account is not an admin." }, { status: 403 }),
      };
    }
    return {
      admin: {
        email: data.profile?.email || "",
        name: data.profile?.full_name || "Admin",
        token,
      },
      error: null,
    };
  } catch {
    return {
      admin: null,
      error: NextResponse.json({ error: "live_unavailable", message: "Could not check the admin role." }, { status: 502 }),
    };
  }
}

export function adminLiveHeaders(token: string, json = true) {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("apikey", SUPABASE_ANON_KEY);
  if (json) headers.set("Content-Type", "application/json");
  return headers;
}
