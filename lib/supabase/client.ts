import { createBrowserClient } from "@supabase/ssr";

function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!rawUrl) {
    throw new Error("Supabase URL is not configured.");
  }

  // Supabase expects the project URL, not the Data API /rest/v1 endpoint.
  // Accept both so a copied Data API URL cannot break the client.
  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createClient() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!key) {
    throw new Error("Supabase publishable key is not configured.");
  }

  return createBrowserClient(getSupabaseUrl(), key);
}
