"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

type DJ = { user_id: string; dj_name: string; bio: string | null; location: string | null; genres: string[] | null; price: number | null; profile_photo: string | null };
type Gig = { id: string; title: string; event_date: string; start_time: string | null; end_time: string | null; location: string; budget_min: number | null; budget_max: number | null; status: string };

export default function PublicDJProfile() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [dj, setDj] = useState<DJ | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [gigId, setGigId] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/auth"); return; }
      const { data: user } = await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle();
      if (user?.role !== "client") { setNotice("Only clients can request a DJ for a gig."); setLoading(false); return; }
      const [{ data: profile, error: profileError }, { data: ownGigs, error: gigsError }] = await Promise.all([
        supabase.from("dj_profiles").select("user_id, dj_name, bio, location, genres, price, profile_photo").eq("user_id", params.id).single(),
        supabase.from("gigs").select("id, title, event_date, start_time, end_time, location, budget_min, budget_max, status").eq("client_id", auth.user.id).eq("status", "open").order("event_date")
      ]);
      if (profileError || !profile) setNotice(profileError?.message || "DJ not found."); else setDj(profile as DJ);
      if (!gigsError) setGigs((ownGigs as Gig[]) || []);
      setLoading(false);
    }
    void load();
  }, [params.id, router]);

  async function requestDJ(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gigId || !dj) { setNotice("Choose one of your open gigs first."); return; }
    setSending(true); setNotice("");
    const supabase = getSupabaseBrowserClient();
    const proposedRate = rate.trim() ? Number(rate) : null;
    if (proposedRate !== null && (!Number.isFinite(proposedRate) || proposedRate < 0)) { setNotice("Enter a valid offer amount."); setSending(false); return; }
    const { error } = await supabase.from("gig_applications").insert({ gig_id: gigId, dj_id: dj.user_id, message: requestMessage.trim() || null, proposed_rate: proposedRate, status: "pending", direction: "client_request" });
    if (error) setNotice(error.code === "23505" ? "You already have a request or offer with this DJ for that gig." : error.message);
    else setNotice("DJ request sent! The DJ can review it from their dashboard.");
    setSending(false);
  }

  if (loading) return <main className="center-page"><div className="card"><p>Loading DJ profile…</p></div></main>;
  if (!dj) return <main className="center-page"><div className="card"><p>{notice}</p><Link className="button" href="/discover">Back to discovery</Link></div></main>;

  return <main className="dashboard-page">
    <header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><div className="topbar-actions"><Link href="/messages" className="button">Messages</Link><Link href="/discover" className="button">Back to discovery</Link></div></header>
    <section className="dashboard-content">
      <section className="card profile-hero-card">{dj.profile_photo && <img src={dj.profile_photo} alt="" className="public-profile-photo" />}<div><p className="eyebrow">SOLO DJ</p><h1>{dj.dj_name}</h1><p className="muted">{dj.location || "Location not listed"}</p><p>{dj.bio || "No bio yet."}</p><p>{dj.genres?.length ? dj.genres.join(" · ") : "Genres not listed"}</p><strong>{dj.price != null ? `Starting at $${dj.price}` : "Price not listed"}</strong></div></section>
      <section className="card"><p className="eyebrow">REQUEST THIS DJ</p><h2>Invite {dj.dj_name} to your gig</h2>{gigs.length ? <form className="form" onSubmit={requestDJ}><label>Your open gig<select value={gigId} onChange={(e) => setGigId(e.target.value)}><option value="">Choose a gig…</option>{gigs.map((gig) => <option key={gig.id} value={gig.id}>{gig.title} · {gig.event_date} · {gig.location}</option>)}</select></label><label>Message<textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Tell the DJ about your event and what you need." /></label><label>Offer amount<input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Optional" /></label><button className="primary" disabled={sending}>{sending ? "Sending request…" : "Request this DJ"}</button></form> : <p>You need an open gig before you can request a DJ. <Link href="/gigs/new" className="link-inline">Create a gig</Link>.</p>}{notice && <div className="notice">{notice}</div>}</section>
    </section>
  </main>;
}
