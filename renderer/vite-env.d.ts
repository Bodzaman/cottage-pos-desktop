/// <reference types="vite/client" />

// Extend Vite's ImportMetaEnv with optional Supabase vars
interface ImportMetaEnv {
  // Optional Supabase env vars for development
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}
