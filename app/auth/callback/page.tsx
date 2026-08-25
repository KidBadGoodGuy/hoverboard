"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Confirming your email…");

  useEffect(() => {
    async function confirm() {
      const supabase = getSupabaseBrowserClient();
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(`Email confirmation failed: ${error.message}`);
          return;
        }
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setMessage("Your email could not be confirmed. Please request a new confirmation email.");
        return;
      }

      router.replace("/dashboard");
    }

    void confirm();
  }, [params, router]);

  return (
    <main className="center-page">
      <div className="card auth-card">
        <p className="eyebrow">HOVERBOARD</p>
        <h2>{message}</h2>
        <p className="muted">Please wait while we finish setting up your account.</p>
      </div>
    </main>
  );
}
