const TOKEN_KEY = "axiom_access_token";

function isUsableToken(token: string | null): token is string {
  if (!token) return false;
  if (token.startsWith("google.")) return false;
  return token.length > 20;
}

function readCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )axiom_access_token=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "axiom_access_token=; path=/; max-age=0";
  document.cookie = "axiom_google_user=; path=/; max-age=0";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(TOKEN_KEY);
  if (isUsableToken(stored)) return stored;
  if (stored) window.localStorage.removeItem(TOKEN_KEY);

  const cookieToken = readCookieToken();
  if (!isUsableToken(cookieToken)) {
    if (cookieToken) clearTokenCookie();
    return null;
  }
  window.localStorage.setItem(TOKEN_KEY, cookieToken);
  return cookieToken;
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  if (!isUsableToken(token)) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=2592000; samesite=lax`;
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  clearTokenCookie();
}
