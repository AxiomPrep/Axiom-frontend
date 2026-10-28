import { api } from "@/lib/api";
import { getApiOrigin, SUPABASE_ANON_KEY } from "@/lib/api-origin";
import { hasAccessToken } from "@/lib/session";

let warmed = false;

export function warmupLiveApi() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const origin = getApiOrigin();
  void fetch(`${origin}/api/health`, {
    cache: "no-store",
    headers: origin.includes("supabase.co") ? { apikey: SUPABASE_ANON_KEY } : undefined,
  }).catch(() => {});
  if (!hasAccessToken()) return;
  void api("/api/practice/subjects").catch(() => {});
  void api("/api/pyq/subjects").catch(() => {});
  void api("/api/plans").catch(() => {});
}
