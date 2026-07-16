import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service_role key, which bypasses Row Level
// Security entirely, so this file must never be imported from a "use client"
// component or anything that ships to the browser.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
