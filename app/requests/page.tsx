"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Role = "dj" | "client";
type RequestRow = { id: string; gig_id: string; dj_id: string; message: string | null; proposed_rate: number | null; status: string; direction: string; gig?: { id: string; title: string; event_date: string; location: string; budget_min: number | null; budget_max: number | null } };

export default function RequestsPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.push("/auth"); return; }
    const { data: user } = await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle();
    const currentRole: Role = user?.role === "client" ? "client" : "dj";
    setRole(currentRole);

    if (currentRole === "client") {
      const { data: gigs } = await supabase.from("gigs").select("id, title, event_date, location, budget_min, budget_max").eq("client_id", auth.user.id);
      const gigRows = (gigs || []) as RequestRow["gig"][];
      if (!gigRows.length) { setRows([]); return; }
      const { data: apps, error } = await supabase.from("gig_applications").select("id, gig_id, dj_id, message, proposed_rate, status, direction").in("gig_id", gigRows.map((g) => g!.id)).eq("direction", "dj_offer").order("created_at", { ascending: false });
      if (error) { setMessage(error.message); return; }
      const map = new Map(gigRows.map((g) => [g!.id, g]));
      setRows(((apps || []) as RequestRow[]).map((r) => ({ ...r, gig: map.get(r.gig_id) })));
    } else {
      const { data: apps, error } = await supabase.from("gig_applications").select("id, gig_id, dj_id, message, proposed_rate, status, direction").eq("dj_id", auth.user.id).eq("direction", "client_request").order("created_at", { ascending: false });
      if (error) { setMessage(error.message); return; }
      const ids = (apps || []).map((r) => r.gig_id);
      const { data: gigs } = ids.length ? await supabase.from("gigs").select("id, title, event_date, location, budget_min, budget_max").in("id", ids) : { data: [] };
      const map = new Map(((gigs || []) as RequestRow["gig"][]).map((g) => [g!.id, g]));
      setRows(((apps || []) as RequestRow[]).map((r) => ({ ...r, gig: map.get(r.gig_id) })));
    }
  }

  useEffect(() => { void load(); }, []);

  async function decide(id: string, decision: "accept" | "decline") {
    setBusyId(id); setMessage("");
    if (decision === "accept") {
      const response = await fetch("/api/gigs/applications/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: id }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) setMessage(json.error || "The request could not be accepted.");
      else setMessage(json.emailSent ? "Booking created. The other person was emailed and payment can now be finalized." : "Booking created. Add RESEND_API_KEY to enable the email notification.");
    } else {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("gig_applications").update({ status: "rejected" }).eq("id", id);
      if (error) setMessage(error.message); else setMessage("Request declined.");
    }
    setBusyId(null);
    await load();
  }

  if (!role) return <main className="center-page"><div className="card"><p>Loading requests…</p></div></main>;

  return <main className="dashboard-page">
    <header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><div className="topbar-actions"><Link href="/messages" className="button">Messages</Link><Link href="/dashboard" className="button">Dashboard</Link></div></header>
    <section className="dashboard-content">
      <div className="hero-small"><p className="eyebrow">REQUESTS</p><h1>{role === "client" ? "DJ offers." : "Client requests."}</h1><p>{role === "client" ? "Review DJ offers and choose the one that fits your gig." : "Review clients who have requested you for their gigs."}</p></div>
      {message && <div className="notice">{message}</div>}
      <section><div className="gig-grid">{rows.length ? rows.map((row) => <article className="card gig-card" key={row.id}><span className={`status-pill ${row.status === "accepted" ? "blue" : ""}`}>{row.status}</span><p className="eyebrow">{row.gig?.event_date || "Gig"}</p><h3>{row.gig?.title || "Gig"}</h3><p>{row.gig?.location || "Location not listed"}</p><p>{row.message || "No message."}</p><strong>{row.proposed_rate != null ? `$${Number(row.proposed_rate).toFixed(2)} offer` : "No offer amount"}</strong><div className="actions request-actions"><Link className="button" href={`/gigs/${row.gig_id}`}>Open gig</Link>{row.status === "pending" && <><button className="primary" disabled={busyId === row.id} onClick={() => void decide(row.id, "accept")}>{busyId === row.id ? "Accepting…" : "Accept"}</button><button disabled={busyId === row.id} onClick={() => void decide(row.id, "decline")}>Decline</button></>}</div></article>) : <div className="card"><p>No requests yet.</p><p className="muted">{role === "client" ? "When DJs apply to your gigs, their offers will appear here." : "When a client requests you for a gig, it will appear here."}</p></div>}</div></section>
    </section>
  </main>;
}
