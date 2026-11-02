import "server-only";
import { createClient } from "@supabase/supabase-js";

// Privileged client using the SECRET key. Bypasses Row Level Security.
// Only for trusted server code: the Stripe webhook and admin actions,
// always after the caller's permission has been checked.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
