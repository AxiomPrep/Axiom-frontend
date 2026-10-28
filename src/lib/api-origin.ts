/** Live Axiom API: Supabase Edge Function `api` (not Render). */
export const SUPABASE_FUNCTIONS_ORIGIN = "https://afkjjeskssmtnzvmnkoe.supabase.co/functions/v1";

export function getApiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN || SUPABASE_FUNCTIONS_ORIGIN;
  return raw.replace(/\/$/, "");
}
