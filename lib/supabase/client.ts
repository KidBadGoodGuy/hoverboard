import { createBrowserClient } from "@supabase/ssr";

function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!rawUrl) {
    throw new Error("Supabase URL is not configured.");
  }

  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function getSupabaseBrowserClient() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!key) {
    throw new Error("Supabase publishable key is not configured.");
  }

  return createBrowserClient(getSupabaseUrl(), key);
}

// Keep the shorter name available for future code too.
export const createClient = getSupabaseBrowserClient;
