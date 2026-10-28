import { NextResponse } from "next/server";
import { getApiOrigin, SUPABASE_ANON_KEY } from "@/lib/api-origin";

export function catalogResponse<T>(data: T, ttl = 60) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 5}`,
    },
  });
}

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
    const method = init?.method || "GET";
    const anonymousGet = method === "GET" && !auth && !cookie;
    const res = await fetch(`${API_ORIGIN}${path}`, {
      method,
      headers,
      credentials: "omit",
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      ...(anonymousGet
        ? { cache: "force-cache" as RequestCache, next: { revalidate: 60 } }
        : { cache: "no-store" as RequestCache }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
