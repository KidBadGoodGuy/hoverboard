"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

export default function NewGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", description: "", event_date: "", start_time: "", end_time: "", location: "", budget_min: "", budget_max: "", genres: "" });

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/auth?role=client"); return; }
      const metadataRole = auth.user.user_metadata?.role === "client" ? "client" : "dj";
      const { data: user, error: userError } = await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle();
      if (userError) { setMessage(userError.message); return; }
      if (!user) {
        const { error } = await supabase.from("users").insert({ id: auth.user.id, email: auth.user.email ?? "", role: metadataRole });
        if (error) { setMessage(error.message); return; }
        if (metadataRole !== "client") { router.push("/dashboard"); return; }
      } else if (user.role !== "client") {
        if (metadataRole !== "client") { router.push("/dashboard"); return; }
        const { error } = await supabase.from("users").update({ role: "client" }).eq("id", auth.user.id);
        if (error) { setMessage(error.message); return; }
      }
      setLoading(false);
    }
    void load();
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.push("/auth?role=client"); return; }
    const min = form.budget_min ? Number(form.budget_min) : null;
    const max = form.budget_max ? Number(form.budget_max) : null;
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0)) || (min !== null && max !== null && max < min)) {
      setMessage("Please enter a valid budget range."); setSaving(false); return;
    }
    const { data, error } = await supabase.from("gigs").insert({ client_id: auth.user.id, title: form.title.trim(), description: form.description.trim() || null, event_date: form.event_date, start_time: form.start_time || null, end_time: form.end_time || null, location: form.location.trim(), budget_min: min, budget_max: max, genres: form.genres.split(",").map((x) => x.trim()).filter(Boolean), status: "open" }).select("id").single();
    if (error) { setMessage(error.message); setSaving(false); return; }
    router.push(`/gigs/${data.id}`);
  }

  if (loading) return <main className="center-page"><div className="card"><p>{message || "Loading…"}</p></div></main>;

  return <main className="dashboard-page">
    <header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><Link href="/dashboard" className="button">Back to dashboard</Link></header>
    <section className="dashboard-content">
      <div className="hero-small"><p className="eyebrow">CLIENT</p><h1>Make a gig.</h1><p>Post the details DJs need to apply for your event.</p></div>
      {message && <div className="notice">{message}</div>}
      <form onSubmit={submit} className="form card grid-form">
        <label>Gig title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Birthday party DJ" /></label>
        <label>Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Woodbury, MN" /></label>
        <label>Date<input required type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></label>
        <label>Start time<input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></label>
        <label>End time<input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></label>
        <label>Minimum budget<input type="number" min="0" step="0.01" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} /></label>
        <label>Maximum budget<input type="number" min="0" step="0.01" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></label>
        <label>Genres<input value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} placeholder="Pop, Hip-hop, EDM" /></label>
        <label className="full">Description<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell DJs what you need for the event." /></label>
        <button className="primary full" disabled={saving}>{saving ? "Posting…" : "Post gig"}</button>
      </form>
    </section>
  </main>;
}
