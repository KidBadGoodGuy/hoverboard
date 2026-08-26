import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PRODUCTION_URL = "https://hoverboard.arjun-singh.com";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth?error=missing_confirmation_code", PRODUCTION_URL),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, PRODUCTION_URL),
    );
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(
      new URL("/auth?error=confirmation_failed", PRODUCTION_URL),
    );
  }

  const metadata = auth.user.user_metadata ?? {};
  const role = metadata.role === "client" ? "client" : "dj";
  const name =
    typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : "HOVERBOARD User";

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(existingError.message)}`, PRODUCTION_URL),
    );
  }

  if (!existing) {
    const { error: userError } = await supabase.from("users").insert({
      id: auth.user.id,
      email: auth.user.email ?? "",
      role,
    });

    if (userError) {
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(userError.message)}`, PRODUCTION_URL),
      );
    }

    if (role === "dj") {
      const { error: profileError } = await supabase.from("dj_profiles").insert({
        user_id: auth.user.id,
        dj_name: name,
      });

      if (profileError) {
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent(profileError.message)}`, PRODUCTION_URL),
        );
      }
    } else {
      const { error: profileError } = await supabase.from("client_profiles").insert({
        user_id: auth.user.id,
        name,
      });

      if (profileError) {
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent(profileError.message)}`, PRODUCTION_URL),
        );
      }
    }
  }

  return NextResponse.redirect(new URL("/dashboard", PRODUCTION_URL));
}
