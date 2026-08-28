"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import CheckoutForm from "../payments/checkout-form";

type Role = "dj" | "client";
type Gig = { id: string; title: string; description: string | null; event_date: string; start_time: string | null; end_time: string | null; location: string; budget_min: number | null; budget_max: number | null; genres: string[]; status: string };
type Application = { id: string; gig_id: string; dj_id: string; message: string | null; proposed_rate: number | null; status: string; direction: string; gig?: Gig };
type Booking = { id: string; dj_id: string; client_id: string; event_date: string; start_time: string; end_time: string; location: string; price: number; status: string; payment_status?: string };

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Application[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);

  const handleCheckoutMessage = useCallback((checkoutMessage: string) => setMessage(checkoutMessage), []);

  async function ensureProfile(supabase: ReturnType<typeof getSupabaseBrowserClient>, authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
    const metadataRole = authUser.user_metadata?.role === "client" ? "client" : "dj";
    const metadataName = typeof authUser.user_metadata?.name === "string" && authUser.user_metadata.name.trim() ? authUser.user_metadata.name.trim() : "HOVERBOARD User";
    const { data: admin } = await supabase.from("admin_accounts").select("user_id").eq("user_id", authUser.id).maybeSingle();
    if (admin) { router.replace("/admin/command-center"); return null; }
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
      const { data: upcoming, error: bookingError } = await supabase.from("bookings").select("*").eq(currentRole === "dj" ? "dj_id" : "client_id", auth.user.id).in("status", ["accepted", "paid", "confirmed"]).order("event_date", { ascending: true });
      if (bookingError) throw new Error(`Bookings could not load: ${bookingError.message}`);
      setBookings((upcoming as Booking[]) || []);
      if (currentRole === "dj") {
        const { data: profile, error: profileError } = await supabase.from("dj_profiles").select("dj_name").eq("user_id", auth.user.id).maybeSingle();
        if (profileError) throw new Error(`DJ profile lookup failed (${profileError.code}): ${profileError.message}`);
        setName(profile?.dj_name || "DJ");
        const { data: open } = await supabase.from("gigs").select("*").eq("status", "open").order("event_date");
        setGigs((open as Gig[]) || []);
        const { data: requests } = await supabase.from("gig_applications").select("*").eq("dj_id", auth.user.id).eq("direction", "client_request").order("created_at", { ascending: false });
        const requestRows = (requests || []) as Application[];
        if (requestRows.length) {
          const { data: requestGigs } = await supabase.from("gigs").select("*").in("id", requestRows.map((r) => r.gig_id));
          const map = new Map(((requestGigs || []) as Gig[]).map((g) => [g.id, g]));
          setIncomingRequests(requestRows.map((r) => ({ ...r, gig: map.get(r.gig_id) })));
        } else setIncomingRequests([]);
      } else {
        const { data: profile, error: profileError } = await supabase.from("client_profiles").select("name").eq("user_id", auth.user.id).maybeSingle();
        if (profileError) throw new Error(`Client profile lookup failed (${profileError.code}): ${profileError.message}`);
        setName(profile?.name || "Client");
        const { data: own } = await supabase.from("gigs").select("*").eq("client_id", auth.user.id).order("event_date");
        const ownGigs = (own as Gig[]) || [];
        setGigs(ownGigs);
        if (ownGigs.length) {
          const { data: apps } = await supabase.from("gig_applications").select("*").in("gig_id", ownGigs.map((g) => g.id)).eq("direction", "dj_offer").order("created_at", { ascending: false });
          const gigMap = new Map(ownGigs.map((g) => [g.id, g]));
          setApplications(((apps || []) as Application[]).map((a) => ({ ...a, gig: gigMap.get(a.gig_id) })));
        } else setApplications([]);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "We couldn't load your profile. Please try again."); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get("payment");
    if (payment === "success") setMessage("Payment submitted. Your booking will switch to Confirmed after Stripe verifies the payment.");
    if (payment === "cancelled") setMessage("Payment was cancelled. Your booking is still waiting for payment.");
  }, []);

  async function payForBooking(bookingId: string) {
    if (payingId) return;
    setPayingId(bookingId); setMessage(""); setCheckoutBookingId(bookingId); setPayingId(null);
  }

  async function decideApplication(application: Application, decision: "accepted" | "rejected") {
    if (decision === "accepted") {
      const response = await fetch("/api/gigs/applications/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: application.id }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) setMessage(json.error || "The request could not be accepted.");
      else setMessage(json.emailSent ? "Booking created. The DJ was emailed and the booking is ready for payment." : "Booking created. Add RESEND_API_KEY to enable the email notification.");
    } else {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("gig_applications").update({ status: "rejected" }).eq("id", application.id);
      if (error) setMessage(error.message); else setMessage("Application rejected.");
    }
    await load();
  }

  async function logout() { await getSupabaseBrowserClient().auth.signOut(); router.push("/"); }
  if (!role) return <main className="center-page"><div className="card"><p>{message || "Loading your HOVERBOARD dashboard…"}</p></div></main>;
  const discoveryLabel = role === "dj" ? "Find gigs" : "Find DJs";

  return <main className="dashboard-page">
    <header className="topbar"><div><span className="brand">HOVERBOARD</span><span className="muted"> · {role === "dj" ? "DJ" : "Client"} Dashboard</span></div><div className="topbar-actions"><Link className="button" href="/requests">Requests</Link><Link className="button" href="/messages">Messages</Link><Link className="button primary" href="/discover">{discoveryLabel}</Link>{role === "client" && <Link className="button primary" href="/gigs/new">Make a gig</Link>}{role === "dj" && <Link className="button" href="/profile">Edit profile</Link>}<button onClick={logout}>Log out</button></div></header>
    <section className="dashboard-content">
      <div className="hero-small"><p className="eyebrow">WELCOME</p><h1>Hey, {name}.</h1><p>{role === "dj" ? "Find your next gig." : "Put your next gig on the Board."}</p></div>
      <Link href="/discover" className="card" style={{ display: "block", textDecoration: "none", cursor: "pointer", marginBottom: "24px" }}><p className="eyebrow">DISCOVERY</p><h2>{discoveryLabel}</h2><p>{role === "dj" ? "Browse and search available gigs." : "Browse and search DJs for your event."}</p><span className="button primary">Open discovery</span></Link>
      {message && <div className="notice">{message}</div>}

      <section><div className="section-heading"><div><p className="eyebrow">BOOKINGS</p><h2>Upcoming bookings</h2><p className="muted">Accepted bookings are ready for payment. Confirmed bookings have been paid.</p></div></div><div className="gig-grid">{bookings.length ? bookings.map((booking) => <article className="card gig-card booking-card" key={booking.id}><span className={`status-pill ${booking.status === "confirmed" || booking.status === "paid" ? "blue" : ""}`}>{booking.status === "accepted" ? "Payment ready" : booking.status}</span><h3>{booking.event_date}</h3><p>{booking.start_time} – {booking.end_time}</p><p><strong>{booking.location}</strong></p><p>Booking total: ${Number(booking.price).toFixed(2)}</p>{role === "client" && booking.status === "accepted" && <button className="primary" disabled={payingId === booking.id} onClick={() => void payForBooking(booking.id)}>{payingId === booking.id ? "Opening secure form…" : checkoutBookingId === booking.id ? "Secure form below" : "Pay securely"}</button>}{booking.status === "confirmed" && <span className="status-pill blue">Payment complete</span>}{checkoutBookingId === booking.id && role === "client" && booking.status === "accepted" && <CheckoutForm bookingId={booking.id} onMessage={handleCheckoutMessage} />}</article>) : <div className="card"><p>No upcoming bookings yet.</p></div>}</div></section>

      {role === "client" ? <>
        <section className="card"><div className="section-heading"><div><p className="eyebrow">CLIENT</p><h2>Make a gig</h2><p>Ready to find a DJ? Create your gig and let DJs send booking requests.</p></div><Link className="button primary" href="/gigs/new">Make a gig</Link></div></section>
        <section><h2>Your gigs</h2><div className="gig-grid">{gigs.length ? gigs.map((gig) => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.status}</p><h3>{gig.title}</h3><p>{gig.event_date} · {gig.location}</p><Link className="button" href={`/gigs/${gig.id}`}>View gig</Link></article>) : <div className="card"><p>No gigs posted yet.</p><Link className="button primary" href="/gigs/new">Make your first gig</Link></div>}</div></section>
        <section><div className="section-heading"><div><h2>DJ offers</h2><p className="muted">Review offers and accept the one you want.</p></div><Link className="button" href="/requests">View all requests</Link></div><div className="gig-grid">{applications.length ? applications.map((app) => <article className="card gig-card" key={app.id}><p className="eyebrow">{app.status}</p><h3>{app.gig?.title || "Gig"}</h3><p>{app.message || "No message."}</p>{app.proposed_rate != null && <p>Proposed rate: ${Number(app.proposed_rate).toFixed(2)}</p>}{app.status === "pending" && <div className="actions request-actions"><Link className="button" href={`/gigs/${app.gig_id}`}>Open gig</Link><button className="primary" onClick={() => void decideApplication(app, "accepted")}>Accept offer</button><button onClick={() => void decideApplication(app, "rejected")}>Decline</button></div>}</article>) : <div className="card"><p>No DJ offers yet.</p></div>}</div></section>
      </> : <>
        <section><div className="section-heading"><div><h2>Client requests</h2><p className="muted">Clients can request you directly for one of their open gigs.</p></div><Link className="button" href="/requests">View all requests</Link></div><div className="gig-grid">{incomingRequests.length ? incomingRequests.map((req) => <article className="card gig-card" key={req.id}><p className="eyebrow">{req.status}</p><h3>{req.gig?.title || "Gig"}</h3><p>{req.gig?.event_date} · {req.gig?.location}</p><p>{req.message || "No message."}</p>{req.proposed_rate != null && <p>Client offer: ${Number(req.proposed_rate).toFixed(2)}</p>}{req.status === "pending" && <div className="actions request-actions"><button className="primary" onClick={() => void decideApplication(req, "accepted")}>Accept request</button><button onClick={() => void decideApplication(req, "rejected")}>Decline</button></div>}</article>) : <div className="card"><p>No client requests yet.</p></div>}</div></section>
        <section><h2>Open gigs</h2><div className="gig-grid">{gigs.map((gig) => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.event_date}</p><h3>{gig.title}</h3><p>{gig.description || "No description yet."}</p><p><strong>{gig.location}</strong></p><p>{gig.start_time || "Time TBD"}{gig.end_time ? ` – ${gig.end_time}` : ""}</p><p>{gig.budget_min != null || gig.budget_max != null ? `$${gig.budget_min ?? 0}–$${gig.budget_max ?? gig.budget_min}` : "Budget not listed"}</p><Link className="primary button" href={`/gigs/${gig.id}`}>Request this gig</Link></article>)}{gigs.length === 0 && <div className="card"><p>No open gigs yet.</p><Link className="button" href="/discover">Find gigs</Link></div>}</div></section>
      </>}
    </section>
  </main>;
}
