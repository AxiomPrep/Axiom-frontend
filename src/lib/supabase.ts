import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Supabase client is only created when the project has been configured with
 * the required environment variables. When they are missing (e.g. local demo
 * without a live backend), the auth layer falls back to a browser-only session
 * so the full funnel remains usable end-to-end.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
