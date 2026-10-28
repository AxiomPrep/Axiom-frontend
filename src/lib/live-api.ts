import { getApiOrigin, SUPABASE_ANON_KEY } from "@/lib/api-origin";

const API_ORIGIN = getApiOrigin();

export async function proxyLiveJson<T>(
  req: Request,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T | null> {
  const headers = new Headers();
  const auth = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  if (auth) headers.set("authorization", auth);
  if (cookie) headers.set("cookie", cookie);
  if (init?.body !== undefined) headers.set("content-type", "application/json");
  if (API_ORIGIN.includes("supabase.co")) headers.set("apikey", SUPABASE_ANON_KEY);
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, {
      method: init?.method || "GET",
      headers,
      credentials: "omit",
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
