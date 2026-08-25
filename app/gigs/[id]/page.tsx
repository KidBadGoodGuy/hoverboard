"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

type Gig = { id: string; title: string; description: string | null; event_date: string; start_time: string | null; end_time: string | null; location: string; budget_min: number | null; budget_max: number | null; genres: string[] | null; status: string; client_id: string };

type Application = { id: string; dj_id: string; message: string | null; proposed_rate: number | null; status: string };

export default function GigPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [gig, setGig] = useState<Gig | null>(null);
  const [role, setRole] = useState<"dj" | "client" | null>(null);
  const [userId, setUserId] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/auth"); return; }
      setUserId(auth.user.id);
      const { data: user } = await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle();
      const currentRole = user?.role === "client" ? "client" : "dj";
      setRole(currentRole);
      const { data, error } = await supabase.from("gigs").select("id, title, description, event_date, start_time, end_time, location, budget_min, budget_max, genres, status, client_id").eq("id", params.id).single();
      if (error || !data) { setMessage(error?.message || "Gig not found."); setLoading(false); return; }
      setGig(data as Gig);
      if (currentRole === "client" && data.client_id === auth.user.id) {
        const { data: apps } = await supabase.from("gig_applications").select("id, dj_id, message, proposed_rate, status").eq("gig_id", params.id).order("created_at", { ascending: false });
        setApplications((apps as Application[]) || []);
      }
      setLoading(false);
    }
    void load();
  }, [params.id, router]);

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gig || role !== "dj") return;
    setSending(true); setMessage("");
    const supabase = getSupabaseBrowserClient();
    const proposedRate = rate.trim() ? Number(rate) : null;
    if (proposedRate !== null && (!Number.isFinite(proposedRate) || proposedRate < 0)) { setMessage("Enter a valid rate."); setSending(false); return; }
    const { error } = await supabase.from("gig_applications").insert({ gig_id: gig.id, dj_id: userId, message: applicationMessage.trim() || null, proposed_rate: proposedRate, status: "pending" });
    setMessage(error ? error.message : "Booking request sent to the client!");
    setSending(false);
  }

  if (loading) return <main className="center-page"><div className="card"><p>Loading gig…</p></div></main>;
  if (!gig) return <main className="center-page"><div className="card"><p>{message}</p><Link className="button" href="/discover">Back to discovery</Link></div></main>;

  const isOwner = role === "client" && gig.client_id === userId;
  const isOpen = gig.status === "open";

  return <main className="dashboard-page">
    <header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><Link href="/discover" className="button">Back to discovery</Link></header>
    <section className="dashboard-content">
      <div className="hero-small"><p className="eyebrow">{gig.status}</p><h1>{gig.title}</h1><p>{gig.location} · {gig.event_date}</p></div>
      {message && <div className="notice">{message}</div>}
      <section className="card">
        <h2>Gig details</h2><p>{gig.description || "No description provided."}</p>
        <p><strong>Date:</strong> {gig.event_date}</p><p><strong>Time:</strong> {gig.start_time || "TBD"}{gig.end_time ? ` – ${gig.end_time}` : ""}</p><p><strong>Location:</strong> {gig.location}</p>
        <p><strong>Budget:</strong> {gig.budget_min != null || gig.budget_max != null ? `$${gig.budget_min ?? 0}–$${gig.budget_max ?? gig.budget_min}` : "Not listed"}</p>
        <p><strong>Genres:</strong> {gig.genres?.length ? gig.genres.join(" · ") : "Not listed"}</p>
      </section>
      {role === "dj" && isOpen && <section className="card"><h2>Request this gig</h2><form onSubmit={apply} className="form"><label>Message<textarea value={applicationMessage} onChange={(e) => setApplicationMessage(e.target.value)} placeholder="Tell the client why you're a good fit." /></label><label>Proposed rate<input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Optional" /></label><button className="primary" disabled={sending}>{sending ? "Sending…" : "Send booking request"}</button></form></section>}
      {role === "dj" && !isOpen && <section className="card"><h2>This gig is no longer open</h2><p>Check discovery for other available gigs.</p></section>}
      {isOwner && <section><h2>Booking requests</h2><div className="gig-grid">{applications.length ? applications.map((app) => <article className="card gig-card" key={app.id}><p className="eyebrow">{app.status}</p><h3>DJ application</h3><p>{app.message || "No message."}</p><p>{app.proposed_rate != null ? `Proposed rate: $${app.proposed_rate}` : "No rate proposed"}</p><p className="muted">DJ ID: {app.dj_id}</p></article>) : <div className="card"><p>No booking requests yet.</p></div>}</div></section>}
    </section>
  </main>;
}
