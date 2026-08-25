"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Role = "dj" | "client";
type Gig = { id: string; title: string; description: string | null; event_date: string; start_time: string | null; end_time: string | null; location: string; budget_min: number | null; budget_max: number | null; genres: string[]; status: string };
type Application = { id: string; gig_id: string; dj_id: string; message: string | null; proposed_rate: number | null; status: string; gig?: Gig };

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", description: "", event_date: "", start_time: "", end_time: "", location: "", budget_min: "", budget_max: "", genres: "" });

  async function ensureProfile(supabase: ReturnType<typeof getSupabaseBrowserClient>, authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
    const metadataRole = authUser.user_metadata?.role === "client" ? "client" : "dj";
    const metadataName = typeof authUser.user_metadata?.name === "string" && authUser.user_metadata.name.trim() ? authUser.user_metadata.name.trim() : "HOVERBOARD User";

    const { data: admin } = await supabase.from("admin_accounts").select("user_id").eq("user_id", authUser.id).maybeSingle();
    if (admin) {
      router.replace("/admin/command-center");
      return null;
    }

    const { data: existing, error: readError } = await supabase.from("users").select("role").eq("id", authUser.id).maybeSingle();
    if (readError) throw new Error(`Profile lookup failed (${readError.code}): ${readError.message}`);

    const currentRole: Role = existing?.role === "client" ? "client" : "dj";
    if (!existing) {
      const { error } = await supabase.from("users").upsert({ id: authUser.id, email: authUser.email ?? "", role: metadataRole }, { onConflict: "id" });
      if (error) throw new Error(`Profile creation failed (${error.code}): ${error.message}`);
    }

    if (currentRole === "dj" || (!existing && metadataRole === "dj")) {
      const { error } = await supabase.from("dj_profiles").upsert({ user_id: authUser.id, dj_name: metadataName, price: 0 }, { onConflict: "user_id" });
      if (error) throw new Error(`DJ profile check failed (${error.code}): ${error.message}`);
      return (existing?.role === "client" ? "client" : metadataRole) as Role;
    }

    const { error } = await supabase.from("client_profiles").upsert({ user_id: authUser.id, name: metadataName }, { onConflict: "user_id" });
    if (error) throw new Error(`Client profile check failed (${error.code}): ${error.message}`);
    return "client" as Role;
  }

  async function load() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) { router.push("/auth"); return; }

    try {
      const currentRole = await ensureProfile(supabase, auth.user);
      if (!currentRole) return;
      setRole(currentRole);
      if (currentRole === "dj") {
        const { data: profile, error: profileError } = await supabase.from("dj_profiles").select("dj_name").eq("user_id", auth.user.id).maybeSingle();
        if (profileError) throw new Error(`DJ profile lookup failed (${profileError.code}): ${profileError.message}`);
        setName(profile?.dj_name || "DJ");
        const { data: open } = await supabase.from("gigs").select("*").eq("status", "open").order("event_date");
        setGigs((open as Gig[]) || []);
      } else {
        const { data: profile, error: profileError } = await supabase.from("client_profiles").select("name").eq("user_id", auth.user.id).maybeSingle();
        if (profileError) throw new Error(`Client profile lookup failed (${profileError.code}): ${profileError.message}`);
        setName(profile?.name || "Client");
        const { data: own } = await supabase.from("gigs").select("*").eq("client_id", auth.user.id).order("event_date");
        const ownGigs = (own as Gig[]) || [];
        setGigs(ownGigs);
        if (ownGigs.length) {
          const { data: apps } = await supabase.from("gig_applications").select("*").in("gig_id", ownGigs.map((g) => g.id)).order("created_at", { ascending: false });
          const gigMap = new Map(ownGigs.map((g) => [g.id, g]));
          setApplications(((apps || []) as Application[]).map((a) => ({ ...a, gig: gigMap.get(a.gig_id) })));
        } else setApplications([]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't load your profile. Please try again.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function createGig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("gigs").insert({ client_id: auth.user.id, title: form.title.trim(), description: form.description.trim() || null, event_date: form.event_date, start_time: form.start_time || null, end_time: form.end_time || null, location: form.location.trim(), budget_min: form.budget_min ? Number(form.budget_min) : null, budget_max: form.budget_max ? Number(form.budget_max) : null, genres: form.genres.split(",").map((x) => x.trim()).filter(Boolean), status: "open" });
    setMessage(error ? error.message : "Gig posted!");
    if (!error) { setForm({ title: "", description: "", event_date: "", start_time: "", end_time: "", location: "", budget_min: "", budget_max: "", genres: "" }); await load(); }
  }

  async function apply(gigId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("gig_applications").insert({ gig_id: gigId, dj_id: auth.user.id, message: "I’m interested in this gig." });
    setMessage(error ? (error.code === "23505" ? "You already applied to this gig." : error.message) : "Application sent!");
  }

  async function decideApplication(application: Application, decision: "accepted" | "rejected") {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !application.gig) return;
    const { error: updateError } = await supabase.from("gig_applications").update({ status: decision }).eq("id", application.id);
    if (updateError) { setMessage(updateError.message); return; }
    if (decision === "accepted") {
      const { error: bookingError } = await supabase.from("bookings").insert({ dj_id: application.dj_id, client_id: auth.user.id, event_date: application.gig.event_date, start_time: application.gig.start_time, end_time: application.gig.end_time, location: application.gig.location, price: application.proposed_rate ?? application.gig.budget_max ?? application.gig.budget_min ?? 0, status: "accepted" });
      if (bookingError) { setMessage(bookingError.message); return; }
      await supabase.from("gigs").update({ status: "booked" }).eq("id", application.gig_id);
    }
    setMessage(decision === "accepted" ? "DJ accepted and booking created!" : "Application rejected.");
    await load();
  }

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/");
  }

  if (!role) return <main className="center-page"><div className="card"><p>{message || "Loading your HOVERBOARD dashboard…"}</p></div></main>;

  return (
    <main className="dashboard-page">
      <header className="topbar"><div><span className="brand">HOVERBOARD</span><span className="muted"> · {role === "dj" ? "DJ" : "Client"} Dashboard</span></div><div className="topbar-actions">{role === "dj" && <Link className="button" href="/profile">Edit profile</Link>}<button onClick={logout}>Log out</button></div></header>
      <section className="dashboard-content">
        <div className="hero-small"><p className="eyebrow">WELCOME</p><h1>Hey, {name}.</h1><p>{role === "dj" ? "Find your next gig." : "Put your next gig on the Board."}</p></div>
        {message && <div className="notice">{message}</div>}
        {role === "client" ? <>
          <section className="card"><h2>Post a gig</h2><form onSubmit={createGig} className="form grid-form">
            <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label>Date<input required type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></label>
            <label>Start<input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></label>
            <label>End<input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></label>
            <label>Min budget<input type="number" min="0" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} /></label>
            <label>Max budget<input type="number" min="0" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></label>
            <label>Genres<input placeholder="Wedding, Hip-hop" value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} /></label>
            <label className="full">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <button className="primary full">Post gig</button>
          </form></section>
          <section><h2>Your gigs</h2><div className="gig-grid">{gigs.length ? gigs.map((gig) => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.status}</p><h3>{gig.title}</h3><p>{gig.event_date} · {gig.location}</p></article>) : <div className="card"><p>No gigs posted yet.</p></div>}</div></section>
          <section><h2>Applications</h2><div className="gig-grid">{applications.length ? applications.map((app) => <article className="card gig-card" key={app.id}><p className="eyebrow">{app.status}</p><h3>{app.gig?.title || "Gig"}</h3><p>{app.message || "No message."}</p>{app.proposed_rate != null && <p>Proposed rate: ${app.proposed_rate}</p>}{app.status === "pending" && <div><button className="primary" onClick={() => void decideApplication(app, "accepted")}>Accept</button> <button onClick={() => void decideApplication(app, "rejected")}>Reject</button></div>}</article>) : <div className="card"><p>No applications yet.</p></div>}</div></section>
        </> : <section><h2>Open gigs</h2><div className="gig-grid">{gigs.length ? gigs.map((gig) => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.event_date}</p><h3>{gig.title}</h3><p>{gig.description || "No description yet."}</p><p><strong>{gig.location}</strong></p><p>{gig.start_time || "Time TBD"}{gig.end_time ? ` – ${gig.end_time}` : ""}</p><p>{gig.budget_min != null || gig.budget_max != null ? `$${gig.budget_min ?? 0}–$${gig.budget_max ?? gig.budget_min}` : "Budget not listed"}</p><button className="primary" onClick={() => void apply(gig.id)}>Apply</button></article>) : <div className="card"><p>No open gigs yet.</p></div>}</div></section>}
      </section>
    </main>
  );
}
