import { NextRequest, NextResponse } from "next/server";
import { googleRedirectUri } from "@/lib/google-oauth";

const EXCHANGE_PATHS = [
  "/api/auth/google",
  "/api/google",
  "/api/oauth/google",
  "/api/auth/oauth/google",
  "/api/auth/google/callback",
  "/api/login/google",
  "/api/auth/social",
  "/api/auth/signin",
  "/api/signin",
  "/api/auth/login",
];

function readToken(payload: Record<string, unknown>): string | null {
  const session = payload.session && typeof payload.session === "object" ? (payload.session as Record<string, unknown>) : null;
  const nested = payload.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : null;
  const candidates = [payload.access_token, payload.token, payload.jwt, session?.access_token, session?.token, nested?.access_token, nested?.token];
  for (const value of candidates) {
    if (typeof value === "string" && value && !value.startsWith("google.")) return value;
  }
  return null;
}

async function verifyToken(apiOrigin: string, token: string) {
  const res = await fetch(`${apiOrigin}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? token : null;
}

function fail(request: NextRequest, code: "google" | "google_api") {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
  response.cookies.set("axiom_access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("axiom_google_user", "", { path: "/", maxAge: 0 });
  response.cookies.set("axiom_google_oauth_state", "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stored = request.cookies.get("axiom_google_oauth_state")?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleError = request.nextUrl.searchParams.get("error");

  if (googleError === "redirect_uri_mismatch" || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_redirect", request.url));
  }
  if (!code || !state || !stored || state !== stored) {
    return fail(request, "google");
  }

  const redirectUri = googleRedirectUri(request.url);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return NextResponse.redirect(
      new URL(body.includes("redirect_uri_mismatch") ? "/login?error=google_redirect" : "/login?error=google", request.url),
    );
  }

  const tokens = (await tokenRes.json()) as { access_token?: string; id_token?: string };
  if (!tokens.access_token) return fail(request, "google");

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) return fail(request, "google");

  const profile = (await profileRes.json()) as { sub?: string; email?: string; name?: string };
  if (!profile.sub || !profile.email) return fail(request, "google");

  const user = {
    id: profile.sub,
    email: profile.email,
    name: profile.name || profile.email.split("@")[0],
  };

  const apiOrigin = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";
  const bodies = [
    {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      email: profile.email,
      name: user.name,
      sub: profile.sub,
      provider: "google",
    },
    { id_token: tokens.id_token, provider: "google" },
    { credential: tokens.id_token, provider: "google" },
    { token: tokens.id_token, provider: "google" },
    { email: profile.email, id_token: tokens.id_token, provider: "google" },
  ];

  let backendToken: string | null = null;
  for (const path of EXCHANGE_PATHS) {
    for (const body of bodies) {
      if (!body.id_token && !("access_token" in body)) continue;
      const exchange = await fetch(`${apiOrigin}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (exchange.status === 404) break;
      if (!exchange.ok) continue;
      const payload = (await exchange.json().catch(() => ({}))) as Record<string, unknown>;
      const candidate = readToken(payload);
      if (candidate && (await verifyToken(apiOrigin, candidate))) {
        backendToken = candidate;
        break;
      }
    }
    if (backendToken) break;
  }

  if (!backendToken && tokens.id_token) {
    backendToken = await verifyToken(apiOrigin, tokens.id_token);
  }

  if (!backendToken) return fail(request, "google_api");

  const response = NextResponse.redirect(new URL("/login?google=ok", request.url));
  response.cookies.set("axiom_access_token", backendToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set("axiom_google_user", JSON.stringify(user), {
    httpOnly: false,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set("axiom_google_oauth_state", "", { path: "/", maxAge: 0 });
  return response;
}
