import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabasePublicKey = supabasePublishableKey ?? supabaseAnonKey

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey)

// The client is deliberately optional until the project is configured.
// Never place service-role credentials in a VITE_ variable.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublicKey)
  : null
