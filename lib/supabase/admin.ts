import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error("Supabase server configuration is incomplete.");
  return createClient(url.replace(/\/$/, ""), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
