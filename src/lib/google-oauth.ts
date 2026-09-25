import type { NextRequest } from "next/server";

function isUniqueDeployHost(host: string) {
  return host.includes("--") && host.endsWith(".netlify.app");
}

export function publicSiteOrigin(request: NextRequest) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim().replace(/\/$/, "");
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }

  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();
  const proto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "http")
    .split(",")[0]
    .trim();

  if (host && !isUniqueDeployHost(host)) {
    const scheme = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : proto || "https";
    return `${scheme}://${host}`;
  }

  return (process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://axiomprepedu.netlify.app").replace(
    /\/$/,
    "",
  );
}

export function googleRedirectUri(request: NextRequest) {
  const origin = publicSiteOrigin(request);
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim().replace(/\/$/, "");
  if (configured?.includes("/auth/google/callback")) return configured;
  return `${origin}/auth/google/callback`;
}
