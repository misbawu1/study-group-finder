import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) return null

  // createBrowserClient uses a shared browser singleton, preventing competing
  // auth clients from rotating the same refresh token during Next.js HMR.
  return createBrowserClient(url, publishableKey)
}
