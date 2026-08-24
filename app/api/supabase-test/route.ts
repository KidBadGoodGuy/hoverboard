import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { connected: false, error: "Supabase environment variables are not available at runtime." },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key);
  const { error } = await supabase.from("dj_profiles").select("user_id").limit(1);

  if (error) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connected: true });
}
