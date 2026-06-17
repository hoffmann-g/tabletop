import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** False until the user copies .env.example → .env and fills the anon key. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Single shared Supabase client. This is the entire "backend" surface: auth,
 * Postgres queries, Storage and Realtime all go through here — no custom API
 * server sits in between.
 *
 * When env is missing we expose a client that throws on use, so the app can
 * render a "configure .env" screen instead of crashing at import time.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 20 } } })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Supabase is not configured. Copy .env.example to .env and fill VITE_SUPABASE_ANON_KEY (see `pnpm db:status`).'
          )
        }
      }
    ) as SupabaseClient)
