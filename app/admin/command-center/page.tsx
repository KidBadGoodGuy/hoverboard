"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

type Mode = "dj" | "client";

type Profile = {
  dj_name?: string | null;
  bio?: string | null;
  location?: string | null;
  price?: number | null;
  name?: string | null;
  profile_information?: string | null;
};

export default function AdminCommandCenter() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("dj");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [name, setName] = useState("Arjun Singh");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/auth"); return; }
      const { data: admin } = await supabase.from("admin_accounts").select("user_id").eq("user_id", auth.user.id).maybeSingle();
      if (!admin) { router.push("/dashboard"); return; }
      const [{ data: dj }, { data: client }] = await Promise.all([
        supabase.from("dj_profiles").select("dj_name, bio, location, price").eq("user_id", auth.user.id).maybeSingle(),
        supabase.from("client_profiles").select("name, profile_information").eq("user_id", auth.user.id).maybeSingle(),
      ]);
      const profile = (mode === "dj" ? dj : client) as Profile | null;
      setName(profile?.dj_name || profile?.name || auth.user.user_metadata?.name || "Arjun Singh");
      setAuthorized(true);
      setLoading(false);
    }
    void load();
  }, [mode, router]);

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/");
  }

  if (loading) return <main className="center-page"><div className="card"><p>Opening the HOVERBOARD Admin Command Center…</p></div></main>;
  if (!authorized) return null;

  return (
    <main className="dashboard-page">
      <header className="topbar"><div><span className="brand">HOVERBOARD</span><span className="muted"> · Admin Command Center</span></div><div className="topbar-actions"><Link className="button" href="/dashboard">Dashboard</Link><button onClick={logout}>Log out</button></div></header>
      <section className="dashboard-content">
        <div className="hero-small"><p className="eyebrow">ADMIN ACCESS</p><h1>Welcome, {name}.</h1><p>One administrator account with both DJ and Client capabilities.</p></div>
        <section className="card"><p className="eyebrow">ACCOUNT MODE</p><h2>Choose your HOVERBOARD role</h2><div className="role-switch"><button className={mode === "dj" ? "active" : ""} onClick={() => setMode("dj")}>DJ Mode</button><button className={mode === "client" ? "active" : ""} onClick={() => setMode("client")}>Client Mode</button></div><div className="notice">{mode === "dj" ? "You are viewing your Solo DJ side." : "You are viewing your Client side."}</div></section>
        <section className="gig-grid">
          <article className="card gig-card"><p className="eyebrow">DJ</p><h3>Solo DJ Profile</h3><p>Manage your DJ identity, pricing, genres, availability, and profile photo.</p><Link className="primary button" href="/profile">Open DJ profile</Link></article>
          <article className="card gig-card"><p className="eyebrow">CLIENT</p><h3>Client Experience</h3><p>Post gigs and test the client workflow using the same protected admin account.</p><Link className="primary button" href="/admin/client">Open Client Mode</Link></article>
        </section>
        <section className="card"><p className="eyebrow">ADMIN</p><h2>Private control room</h2><p>This page is intentionally not linked from public navigation. Access requires an authenticated HOVERBOARD admin account.</p></section>
      </section>
    </main>
  );
}
