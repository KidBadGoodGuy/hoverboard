"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"dj" | "client">("dj");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(() => searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");

        // HOVERBOARD V1 does not require email confirmation. Supabase should
        // return a session immediately when Confirm Email is disabled.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, name: name.trim() },
          },
        });

        if (error) throw error;
        if (!data.user) throw new Error("Account creation did not return a user.");

        // With Supabase email confirmation disabled, signup returns a session.
        // Keep a defensive fallback so the UI never tells users to check email.
        if (!data.session) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (loginError) throw loginError;
          if (!loginData.session) throw new Error("Account was created, but the session could not be started. Please try logging in.");
        }

        router.push("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error("Login did not return a user.");
        router.push("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {mode === "signup" && (
        <>
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Account type
            <select value={role} onChange={(e) => setRole(e.target.value as "dj" | "client")}>
              <option value="dj">Solo DJ</option>
              <option value="client">Client</option>
            </select>
          </label>
        </>
      )}
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
      <button type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}</button>
      <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
        {mode === "login" ? "Create an account" : "Already have an account? Log in"}
      </button>
      {message && <p role="alert">{message}</p>}
    </form>
  );
}
