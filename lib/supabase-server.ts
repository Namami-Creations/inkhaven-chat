import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return value
}

/**
 * Service role client (bypasses RLS). Use only for privileged operations:
 * - matching RPC that is service_role only
 * - storage upload/signing when bucket policies require service_role
 */
export function createServerSupabaseServiceClient() {
  const supabaseUrl = mustGetEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseServiceRoleKey = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient<Database, 'public'>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'inkhaven-server-service'
      }
    }
  })
}

/**
 * User-scoped server client (RLS enforced).
 * Use this for all reads/writes that should respect the caller's JWT.
 */
export function createServerSupabaseUserClient(accessToken: string) {
  const supabaseUrl = mustGetEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = mustGetEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!accessToken) {
    throw new Error('Missing access token for user-scoped Supabase client')
  }

  return createClient<Database, 'public'>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Client-Info': 'inkhaven-server-user'
      }
    }
  })
}

/**
 * Back-compat export name: historically this returned a service-role client.
 * Prefer `createServerSupabaseServiceClient` / `createServerSupabaseUserClient`.
 */
export const createServerSupabaseClient = createServerSupabaseServiceClient
