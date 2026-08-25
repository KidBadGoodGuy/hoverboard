"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthSessionHandler() {
  const router = useRouter();

  useEffect(() => {
    async function handleConfirmation() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: existing } = await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle();
      if (!existing) {
        const metadata = auth.user.user_metadata ?? {};
        const role = metadata.role === "client" ? "client" : "dj";
        const name = typeof metadata.name === "string" && metadata.name.trim() ? metadata.name.trim() : "HOVERBOARD User";

        const { error: userError } = await supabase.from("users").insert({ id: auth.user.id, email: auth.user.email ?? "", role });
        if (userError) return;

        if (role === "dj") {
          await supabase.from("dj_profiles").insert({ user_id: auth.user.id, dj_name: name });
        } else {
          await supabase.from("client_profiles").insert({ user_id: auth.user.id, name });
        }
        router.replace("/dashboard");
      }
    }

    void handleConfirmation();
  }, [router]);

  return null;
}
