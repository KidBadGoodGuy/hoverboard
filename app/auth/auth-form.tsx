"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"dj" | "client">(params.get("role") === "client" ? "client" : "dj");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function ensureProfile(userId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data: existing } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
    if (existing) return existing.role as "dj" | "client";
    const { data } = await supabase.auth.getUser();
    const metadata = data.user?.user_metadata ?? {};
    const savedRole = metadata.role === "client" ? "client" : "dj";
    const savedName = typeof metadata.name === "string" && metadata.name.trim() ? metadata.name.trim() : "HOVERBOARD User";
    const { error: userError } = await supabase.from("users").insert({ id: userId, email: data.user?.email ?? email, role: savedRole });
    if (userError) throw userError;
    if (savedRole === "dj") {
      const { error } = await supabase.from("dj_profiles").insert({ user_id: userId, dj_name: savedName });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("client_profiles").insert({ user_id: userId, name: savedName });
      if (error) throw error;
    }
    return savedRole;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role, name } } });
        if (error) throw error;
        if (!data.user) throw new Error("Account creation did not return a user.");
        if (!data.session) {
          setMessage("Account created. Check your email to confirm it, then log in.");
          setMode("login");
        } else {
          await ensureProfile(data.user.id);
          router.push("/dashboard");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error("Login did not return a user.");
        await ensureProfile(data.user.id);
        router.push("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="card auth-card">
        <Link href="/" className="brand">HOVERBOARD</Link>
        <h1>{mode === "signup" ? "Join the Board." : "Welcome back."}</h1>
        <p>{mode === "signup" ? "Create your DJ or Client account." : "Log in to your HOVERBOARD account."}</p>
        {mode === "signup" && <div className="role-switch"><button type="button" className={role === "dj" ? "active" : ""} onClick={() => setRole("dj")}>I’m a DJ</button><button type="button" className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>I’m a Client</button></div>}
        <form onSubmit={submit} className="form">
          {mode === "signup" && <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>}
          <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="primary" disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create account" : "Log in"}</button>
        </form>
        {message && <p className="notice">{message}</p>}
        <button className="link-button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>{mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}</button>
      </div>
    </main>
  );
}
