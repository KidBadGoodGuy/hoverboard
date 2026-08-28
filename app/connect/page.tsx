"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export default function ConnectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/auth"); return; }
      const { data: user } = await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle();
      if (user?.role !== "dj") setMessage("DJ payout setup is only available for Solo DJ accounts.");
      const params = new URLSearchParams(window.location.search);
      if (params.get("return") === "1") setMessage("You returned from Stripe. Your payout account may still need verification before it can receive funds.");
      if (params.get("refresh") === "1") setMessage("That Stripe onboarding link expired or was already used. Start again to get a fresh link.");
      setLoading(false);
    }
    void load();
  }, [router]);

  async function startOnboarding() {
    setStarting(true); setMessage("");
    const response = await fetch("/api/connect/onboard", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.url) setMessage(json.error || "Stripe onboarding could not start.");
    else window.location.assign(json.url);
    setStarting(false);
  }

  if (loading) return <main className="center-page"><div className="card"><p>Loading payout setup…</p></div></main>;
  return <main className="dashboard-page"><header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><Link href="/dashboard" className="button">Back to dashboard</Link></header><section className="dashboard-content"><section className="card"><p className="eyebrow">DJ PAYOUTS</p><h1>Get paid for your gigs.</h1><p className="muted">Connect your Stripe Express account so HOVERBOARD can send booking proceeds to you after a client pays.</p>{message && <div className="notice">{message}</div>}<div className="payment-note"><div className="payment-note-icon">$</div><div><strong>Secure Stripe onboarding</strong><p>Stripe collects the required payout and identity information. HOVERBOARD does not store your bank or card details.</p></div></div><button className="primary" onClick={() => void startOnboarding()} disabled={starting}>{starting ? "Opening Stripe…" : "Set up DJ payouts"}</button></section></section></main>;
}
