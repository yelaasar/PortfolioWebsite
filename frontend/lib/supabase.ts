import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The aim-trainer leaderboard's only way to reach Postgres. Always the
 * service_role key — the browser never talks to Supabase directly, so there
 * are no RLS policies to write; the migration enables RLS with none, which
 * locks the table to everything except this key.
 *
 * Returns `null` rather than throwing when unconfigured, same convention as
 * notify.ts's channels: the site still builds and the leaderboard route still
 * responds, it just reports itself as absent instead of failing.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  // Constructed here, not at module scope, so a missing env var surfaces as a
  // handled "not configured" response rather than an import-time crash.
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}
