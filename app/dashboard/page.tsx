"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Role = "dj" | "client";
type Gig = { id: string; title: string; description: string | null; event_date: string; start_time: string | null; end_time: string | null; location: string; budget_min: number | null; budget_max: number | null; genres: string[]; status: string };
type Application = { id: string; gig_id: string; dj_id: string; message: string | null; proposed_rate: number | null; status: string; gig?: Gig };
type Booking = { id: string; dj_id: string; client_id: string; event_date: string; start_time: string; end_time: string; location: string; price: number; status: string };

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");

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
      const { data: upcoming } = await supabase.from("bookings").select("*").eq(currentRole === "dj" ? "dj_id" : "client_id", auth.user.id).in("status", ["accepted", "paid", "confirmed"]).order("event_date", { ascending: true });
      setBookings((upcoming as Booking[]) || []);
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
    } catch (error) { setMessage(error instanceof Error ? error.message : "We couldn't load your profile. Please try again."); }
  }

  useEffect(() => { void load(); }, []);

  async function decideApplication(application: Application, decision: "accepted" | "rejected") {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !application.gig) return;
    const { error: updateError } = await supabase.from("gig_applications").update({ status: decision }).eq("id", application.id);
    if (updateError) { setMessage(updateError.message); return; }
    if (decision === "accepted") {
      const { error: bookingError } = await supabase.from("bookings").insert({
        dj_id: application.dj_id,
        client_id: auth.user.id,
        event_date: application.gig.event_date,
        start_time: application.gig.start_time,
        end_time: application.gig.end_time,
        location: application.gig.location,
        price: application.proposed_rate ?? application.gig.budget_max ?? application.gig.budget_min ?? 0,
        status: "accepted",
      });
      if (bookingError) { setMessage(`Booking could not be created: ${bookingError.message}`); return; }
      const { error: gigError } = await supabase.from("gigs").update({ status: "booked" }).eq("id", application.gig_id);
      if (gigError) { setMessage(`Booking created, but gig status could not update: ${gigError.message}`); return; }
    }
    setMessage(decision === "accepted" ? "Booking confirmed and is ready for payment." : "Application rejected.");
    await load();
  }

  async function logout() { await getSupabaseBrowserClient().auth.signOut(); router.push("/"); }

  if (!role) return <main className="center-page"><div className="card"><p>{message || "Loading your HOVERBOARD dashboard…"}</p></div></main>;

  const discoveryLabel = role === "dj" ? "Find gigs" : "Find DJs";

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <div><span className="brand">HOVERBOARD</span><span className="muted"> · {role === "dj" ? "DJ" : "Client"} Dashboard</span></div>
        <div className="topbar-actions"><Link className="button primary" href="/discover">{discoveryLabel}</Link>{role === "client" && <Link className="button primary" href="/gigs/new">Make a gig</Link>}{role === "dj" && <Link className="button" href="/profile">Edit profile</Link>}<button onClick={logout}>Log out</button></div>
      </header>
      <section className="dashboard-content">
        <div className="hero-small"><p className="eyebrow">WELCOME</p><h1>Hey, {name}.</h1><p>{role === "dj" ? "Find your next gig." : "Put your next gig on the Board."}</p></div>
        <Link href="/discover" className="card" style={{ display: "block", textDecoration: "none", cursor: "pointer", marginBottom: "24px" }}>
          <p className="eyebrow">DISCOVERY</p><h2>{discoveryLabel}</h2><p>{role === "dj" ? "Browse and search available gigs." : "Browse and search DJs for your event."}</p><span className="button primary">Open discovery</span>
        </Link>
        {message && <div className="notice">{message}</div>}

        <section>
          <div className="section-heading"><div><p className="eyebrow">BOOKINGS</p><h2>Upcoming bookings</h2><p className="muted">Accepted bookings are locked in and ready for the payment step.</p></div></div>
          <div className="gig-grid">{bookings.length ? bookings.map((booking) => <article className="card gig-card booking-card" key={booking.id}>
            <span className={`status-pill ${booking.status === "confirmed" || booking.status === "paid" ? "blue" : ""}`}>{booking.status === "accepted" ? "Payment ready" : booking.status}</span>
            <h3>{booking.event_date}</h3><p>{booking.start_time} – {booking.end_time}</p><p><strong>{booking.location}</strong></p><p>Booking total: ${Number(booking.price).toFixed(2)}</p>
          </article>) : <div className="card"><p>No upcoming bookings yet.</p></div>}</div>
        </section>

        {role === "client" ? (
          <>
            <section className="card"><div className="section-heading"><div><p className="eyebrow">CLIENT</p><h2>Make a gig</h2><p>Ready to find a DJ? Create your gig and let DJs send booking requests.</p></div><Link className="button primary" href="/gigs/new">Make a gig</Link></div></section>
            <section><h2>Your gigs</h2><div className="gig-grid">{gigs.length ? gigs.map((gig) => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.status}</p><h3>{gig.title}</h3><p>{gig.event_date} · {gig.location}</p><Link className="button" href={`/gigs/${gig.id}`}>View gig</Link></article>) : <div className="card"><p>No gigs posted yet.</p><Link className="button primary" href="/gigs/new">Make your first gig</Link></div>}</div></section>
            <section><h2>Booking requests</h2><div className="gig-grid">{applications.length ? applications.map((app) => <article className="card gig-card" key={app.id}><p className="eyebrow">{app.status}</p><h3>{app.gig?.title || "Gig"}</h3><p>{app.message || "No message."}</p>{app.proposed_rate != null && <p>Proposed rate: ${app.proposed_rate}</p>}{app.status === "pending" && <div><button className="primary" onClick={() => void decideApplication(app, "accepted")}>Accept & create booking</button> <button onClick={() => void decideApplication(app, "rejected")}>Decline</button></div>}</article>) : <div className="card"><p>No booking requests yet.</p></div>}</div></section>
          </>
        ) : (
          <section><h2>Open gigs</h2><div className="gig-grid">{gigs.map((gig) => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.event_date}</p><h3>{gig.title}</h3><p>{gig.description || "No description yet."}</p><p><strong>{gig.location}</strong></p><p>{gig.start_time || "Time TBD"}{gig.end_time ? ` – ${gig.end_time}` : ""}</p><p>{gig.budget_min != null || gig.budget_max != null ? `$${gig.budget_min ?? 0}–$${gig.budget_max ?? gig.budget_min}` : "Budget not listed"}</p><Link className="primary button" href={`/gigs/${gig.id}`}>Request this gig</Link></article>)}{gigs.length === 0 && <div className="card"><p>No open gigs yet.</p><Link className="button" href="/discover">Find gigs</Link></div>}</div></section>
        )}
      </section>
    </main>
  );
}
