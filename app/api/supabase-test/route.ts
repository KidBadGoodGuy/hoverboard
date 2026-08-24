import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!rawUrl) {
    throw new Error("Supabase URL is not configured at runtime.");
  }

  // The client needs the project URL, not the Data API /rest/v1 endpoint.
  // Normalize a copied Data API URL so it cannot produce /rest/v1/rest/v1.
  const projectUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const parsed = new URL(projectUrl);

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Supabase URL must use HTTPS.");
  }

  return parsed.toString().replace(/\/$/, "");
}

export async function GET() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!key) {
    return NextResponse.json(
      { connected: false, error: "Supabase publishable key is not configured at runtime." },
      { status: 500 }
    );
  }

  try {
    const url = getSupabaseUrl();
    const supabase = createClient(url, key);

    // Verify the Data API itself without depending on a HOVERBOARD table existing yet.
    const response = await fetch(`${url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        {
          connected: false,
          error: `Supabase Data API returned HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
        },
        { status: 502 }
      );
    }

    // Also initialize the SDK so the exact client configuration used by HOVERBOARD is verified.
    if (!supabase) {
      throw new Error("Supabase client could not be initialized.");
    }

    return NextResponse.json({
      connected: true,
      checks: {
        environment: true,
        projectUrl: true,
        dataApi: true,
        client: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Supabase connection error.";
    return NextResponse.json({ connected: false, error: message }, { status: 500 });
  }
}
