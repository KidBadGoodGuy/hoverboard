"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

type Gig = { id: string; title: string; description: string | null; event_date: string; location: string; status: string };

export default function AdminClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", description: "", event_date: "", location: "", budget_min: "", budget_max: "" });

  async function load() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.push("/auth"); return; }
    const { data: admin } = await supabase.from("admin_accounts").select("user_id").eq("user_id", auth.user.id).maybeSingle();
    if (!admin) { router.push("/dashboard"); return; }
    const { data } = await supabase.from("gigs").select("id,title,description,event_date,location,status").eq("client_id", auth.user.id).order("event_date", { ascending: true });
    setGigs((data as Gig[]) || []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function createGig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("gigs").insert({ client_id: auth.user.id, title: form.title.trim(), description: form.description.trim() || null, event_date: form.event_date, location: form.location.trim(), budget_min: form.budget_min ? Number(form.budget_min) : null, budget_max: form.budget_max ? Number(form.budget_max) : null, genres: [], status: "open" });
    setMessage(error ? error.message : "Client test gig posted!");
    if (!error) { setForm({ title: "", description: "", event_date: "", location: "", budget_min: "", budget_max: "" }); await load(); }
  }

  if (loading) return <main className="center-page"><div className="card"><p>Loading Client Mode…</p></div></main>;

  return (
    <main className="dashboard-page">
      <header className="topbar"><div><span className="brand">HOVERBOARD</span><span className="muted"> · Admin Client Mode</span></div><div className="topbar-actions"><Link className="button" href="/admin/command-center">Command Center</Link><Link className="button" href="/dashboard">DJ Dashboard</Link></div></header>
      <section className="dashboard-content">
        <div className="hero-small"><p className="eyebrow">CLIENT MODE</p><h1>Book a DJ.</h1><p>You are using the Client side of the admin account.</p></div>
        {message && <div className="notice">{message}</div>}
        <section className="card"><h2>Post a test gig</h2><form onSubmit={createGig} className="form grid-form">
          <label>Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label>Location<input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
          <label>Date<input required type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></label>
          <label>Min budget<input type="number" min="0" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} /></label>
          <label>Max budget<input type="number" min="0" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} /></label>
          <label className="full">Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <button className="primary full">Post test gig</button>
        </form></section>
        <section><h2>Your test gigs</h2><div className="gig-grid">{gigs.length ? gigs.map(gig => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.status}</p><h3>{gig.title}</h3><p>{gig.event_date} · {gig.location}</p><p>{gig.description || "No description."}</p></article>) : <div className="card"><p>No test gigs yet.</p></div>}</div></section>
      </section>
    </main>
  );
}
