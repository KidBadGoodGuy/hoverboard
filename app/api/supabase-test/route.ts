import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!rawUrl) {
    throw new Error("Supabase URL is not configured at runtime.");
  }

  // Cloudflare/Supabase may provide the Data API URL. Normalize it to the
  // project root so the SDK can append its own service paths correctly.
  const projectUrl = rawUrl
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");

  const parsed = new URL(projectUrl);

  if (parsed.protocol !== "https:") {
    throw new Error("Supabase URL must use HTTPS.");
  }

  return parsed.toString().replace(/\/$/, "");
}

export async function GET() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!key) {
    return NextResponse.json(
      {
        connected: false,
        error: "Supabase publishable key is not configured at runtime.",
      },
      { status: 500 }
    );
  }

  try {
    const url = getSupabaseUrl();

    // This is the normal HOVERBOARD client configuration.
    // The publishable key is intentionally used; a secret key must never be
    // exposed to the browser or committed to the repository.
    const supabase = createClient(url, key);

    // Do NOT request /rest/v1/ here. Supabase intentionally protects the API
    // root/OpenAPI endpoint from publishable keys. Instead, verify a real
    // public Supabase service endpoint that accepts publishable keys.
    const authResponse = await fetch(`${url}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: key,
      },
      cache: "no-store",
    });

    if (!authResponse.ok) {
      const body = await authResponse.text();
      return NextResponse.json(
        {
          connected: false,
          error: `Supabase API returned HTTP ${authResponse.status}${body ? `: ${body.slice(0, 300)}` : ""}`,
        },
        { status: 502 }
      );
    }

    // Make a harmless SDK-level request too. This confirms the installed
    // Supabase client can be initialized with the same URL/key pair used by
    // the rest of the application. We don't query a HOVERBOARD table yet,
    // because the schema is still being built in Step 4.
    if (!supabase) {
      throw new Error("Supabase client could not be initialized.");
    }

    return NextResponse.json({
      connected: true,
      message: "Supabase is configured and reachable.",
      checks: {
        environment: true,
        projectUrl: true,
        publishableKey: true,
        supabaseApi: true,
        client: true,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Supabase connection error.";

    return NextResponse.json(
      { connected: false, error: message },
      { status: 500 }
    );
  }
}
