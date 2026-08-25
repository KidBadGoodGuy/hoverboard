import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!rawUrl) throw new Error("Supabase URL is not configured.");
  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export async function createClient() {
  const cookieStore = await cookies();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) throw new Error("Supabase publishable key is not configured.");

  return createServerClient(getSupabaseUrl(), key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie writes can be unavailable in some server-rendering contexts.
        }
      },
    },
  });
}
