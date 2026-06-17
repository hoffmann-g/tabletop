/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Local default: http://127.0.0.1:54321 */
  readonly VITE_SUPABASE_URL: string
  /** Supabase anon/public key (safe to ship in the client). */
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
