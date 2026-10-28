/** Live Axiom API: Supabase Edge Function `api` (not Render). */
export const SUPABASE_FUNCTIONS_ORIGIN = "https://afkjjeskssmtnzvmnkoe.supabase.co/functions/v1";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2pqZXNrc3NtdG56dm1ua29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MTA3MDUsImV4cCI6MjEwMzA4NjcwNX0.hiiGVZRuCSj2Wk78TkZiTgOdiQhBh1yAeO1-MM84R-Y";

export function getApiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN || SUPABASE_FUNCTIONS_ORIGIN;
  return raw.replace(/\/$/, "");
}
