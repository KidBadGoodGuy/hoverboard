import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const supabase = await createClient();
  const { code } = await searchParams;

  if (!code) redirect("/auth?error=missing_confirmation_code");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) redirect(`/auth?error=${encodeURIComponent(error.message)}`);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth?error=confirmation_failed");

  const metadata = auth.user.user_metadata ?? {};
  const role = metadata.role === "client" ? "client" : "dj";
  const name = typeof metadata.name === "string" && metadata.name.trim()
    ? metadata.name.trim()
    : "HOVERBOARD User";

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!existing) {
    const { error: userError } = await supabase.from("users").insert({
      id: auth.user.id,
      email: auth.user.email ?? "",
      role,
    });

    if (userError) redirect(`/auth?error=${encodeURIComponent(userError.message)}`);

    if (role === "dj") {
      await supabase.from("dj_profiles").insert({
        user_id: auth.user.id,
        dj_name: name,
      });
    } else {
      await supabase.from("client_profiles").insert({
        user_id: auth.user.id,
        name,
      });
    }
  }

  redirect("/dashboard");
}
