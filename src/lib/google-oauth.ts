export function googleRedirectUri(requestUrl: string) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return `${new URL(requestUrl).origin}/auth/google/callback`;
}
