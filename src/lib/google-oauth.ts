import type { NextRequest } from "next/server";

function callbackPath(origin: string) {
  return `${origin.replace(/\/$/, "")}/auth/google/callback`;
}

function isUniqueDeployHost(host: string) {
  return host.includes("--") && host.endsWith(".netlify.app");
}

export function googleRedirectUri(request: NextRequest) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim().replace(/\/$/, "");
  if (configured) {
    return configured.endsWith("/auth/google/callback")
      ? configured
      : callbackPath(configured);
  }

  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();
  const proto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "http")
    .split(",")[0]
    .trim();

  if (host && !isUniqueDeployHost(host)) {
    const scheme = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : proto || "https";
    return callbackPath(`${scheme}://${host}`);
  }

  const site = (process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://axiomprepedu.netlify.app").replace(
    /\/$/,
    "",
  );
  return callbackPath(site);
}
