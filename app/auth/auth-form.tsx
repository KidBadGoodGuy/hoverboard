"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const PRODUCTION_CALLBACK = "https://hoverboard.arjun-singh.com/auth/callback";
type Role = "dj" | "client";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("dj");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(() => searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);
  const adminLogin = searchParams.get("admin") === "1";

  useEffect(() => {
    const requestedRole = searchParams.get("role");
    if (requestedRole === "client" || requestedRole === "dj") setRole(requestedRole);
    if (searchParams.get("signup") === "1") setMode("signup");
  }, [searchParams]);

  useEffect(() => {
    if (!message || !noticeRef.current) return;
    const timer = window.setTimeout(() => {
      noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function redirectAfterLogin(supabase: ReturnType<typeof getSupabaseBrowserClient>, userId: string) {
    const { data: admin } = await supabase.from("admin_accounts").select("user_id").eq("user_id", userId).maybeSingle();
    router.replace(admin ? "/admin/command-center" : "/dashboard");
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (mode === "signup") {
        if (!cleanName) throw new Error("Please enter your name.");
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { role, name: cleanName },
            emailRedirectTo: PRODUCTION_CALLBACK,
          },
        });

        if (error) {
          if (/already registered|already exists|user already registered/i.test(error.message)) {
            throw new Error("An account with this email already exists. Please log in instead.");
          }
          throw error;
        }
        if (!data.user) throw new Error("We couldn't create your account. Please try again.");

        if (!data.session) {
          setMessage("Account created! We sent a new confirmation email. Check your inbox before logging in.");
          return;
        }

        await redirectAfterLogin(supabase, data.user.id);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;
      if (!data.user || !data.session) throw new Error("We couldn't start your session. Please try again.");
      await redirectAfterLogin(supabase, data.user.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-brand"><span className="brand-mark">H</span><span>HOVERBOARD</span></div>
        <p className="eyebrow">{adminLogin ? "ADMIN ACCESS" : mode === "signup" ? "JOIN THE BOARD" : "WELCOME BACK"}</p>
        <h1 className="auth-title">{adminLogin ? "Admin sign in." : mode === "signup" ? "Create your account." : "Get back to your gigs."}</h1>
        <p className="auth-copy">{adminLogin ? "Sign in with your authorized HOVERBOARD administrator account." : mode === "signup" ? "One account. Your gigs, profiles, and bookings in one place." : "Sign in to keep your DJ gigs and bookings moving."}</p>

        <form onSubmit={submit} className="form">
          {mode === "signup" && !adminLogin && (
            <>
              <label>Name<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></label>
              <div><span className="field-label">I’m joining as</span><div className="role-switch" role="group" aria-label="Account type">
                <button type="button" className={role === "dj" ? "active" : ""} onClick={() => setRole("dj")}>Solo DJ</button>
                <button type="button" className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>Client</button>
              </div></div>
            </>
          )}
          <label>Email<input autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input autoComplete={mode === "signup" ? "new-password" : "current-password"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
          {mode === "signup" && <p className="field-help">We’ll send a confirmation email before your account is activated.</p>}
          <button className="primary auth-submit" type="submit" disabled={loading}>{loading ? "Working…" : mode === "signup" ? "Create account" : "Log in"}</button>
        </form>

        {message && <div ref={noticeRef} id="confirmation-notice" className="notice confirmation-notice" role="alert">{message}</div>}
        {!adminLogin && <button className="link-button" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "New to HOVERBOARD? Create an account" : "Already have an account? Log in"}
        </button>}
        {!adminLogin && mode === "login" && <a className="admin-login-link" href="/auth?admin=1">Login as admin</a>}
        {adminLogin && <a className="admin-login-link" href="/auth">Back to normal login</a>}
      </div>
    </div>
  );
}
