"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type DJ = { user_id: string; dj_name: string; bio: string | null; location: string | null; genres: string[] | null; price: number | null; profile_photo: string | null };
type Gig = { id: string; title: string; description: string | null; event_date: string; start_time: string | null; end_time: string | null; location: string; budget_min: number | null; budget_max: number | null; genres: string[] | null; status: string };

export default function DiscoverPage() {
  const router = useRouter();
  const [role, setRole] = useState<"dj" | "client" | null>(null);
  const [djs, setDjs] = useState<DJ[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/auth"); return; }
      const { data: user, error: userError } = await supabase.from("users").select("role").eq("id", auth.user.id).single();
      if (userError || !user) { setMessage(userError?.message || "We couldn't load your account."); setLoading(false); return; }
      const currentRole = user.role === "client" ? "client" : "dj";
      setRole(currentRole);
      if (currentRole === "client") {
        const { data, error } = await supabase.from("dj_profiles").select("user_id, dj_name, bio, location, genres, price, profile_photo").order("dj_name");
        if (error) setMessage(error.message); else setDjs((data as DJ[]) || []);
      } else {
        const { data, error } = await supabase.from("gigs").select("id, title, description, event_date, start_time, end_time, location, budget_min, budget_max, genres, status").eq("status", "open").order("event_date");
        if (error) setMessage(error.message); else setGigs((data as Gig[]) || []);
      }
      setLoading(false);
    }
    void load();
  }, [router]);

  const clearFilters = () => { setSearch(""); setGenre(""); setLocation(""); };
  const match = (values: string[], q: string) => !q || values.join(" ").toLowerCase().includes(q.trim().toLowerCase());
  const filteredDJs = useMemo(() => djs.filter((dj) => match([dj.dj_name, dj.bio || "", dj.location || "", ...(dj.genres || [])], search) && match(dj.genres || [], genre) && match([dj.location || ""], location)), [djs, search, genre, location]);
  const filteredGigs = useMemo(() => gigs.filter((gig) => match([gig.title, gig.description || "", gig.location, ...(gig.genres || [])], search) && match(gig.genres || [], genre) && match([gig.location], location)), [gigs, search, genre, location]);
  const genres = useMemo(() => Array.from(new Set((role === "client" ? djs.flatMap((d) => d.genres || []) : gigs.flatMap((g) => g.genres || [])))).sort(), [role, djs, gigs]);

  if (loading) return <main className="center-page"><div className="card"><p>Loading discovery…</p></div></main>;

  return (
    <main className="dashboard-page">
      <header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><Link href="/dashboard" className="button">Back to dashboard</Link></header>
      <section className="dashboard-content">
        <div className="hero-small"><p className="eyebrow">DISCOVER</p><h1>{role === "client" ? "Find a DJ." : "Find a gig."}</h1><p>{role === "client" ? "Browse DJs and find the right fit for your event." : "Browse open gigs and find your next opportunity."}</p></div>
        <section className="card">
          <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={role === "client" ? "DJ name, genre, or location" : "Gig title, genre, or location"} /></label>
          <div className="actions">
            <label>Genre<select value={genre} onChange={(e) => setGenre(e.target.value)}><option value="">All genres</option>{genres.map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
            <label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Any location" /></label>
            <button type="button" className="button" onClick={clearFilters}>Clear filters</button>
          </div>
        </section>
        {message && <div className="notice">{message}</div>}
        {role === "client" ? (
          <section><h2>DJs</h2><div className="gig-grid">{filteredDJs.length ? filteredDJs.map((dj) => <article className="card gig-card" key={dj.user_id}>{dj.profile_photo && <img src={dj.profile_photo} alt="" className="discover-photo" />}<p className="eyebrow">{dj.location || "Location not listed"}</p><h3>{dj.dj_name}</h3><p>{dj.bio || "No bio yet."}</p><p>{dj.genres?.length ? dj.genres.join(" · ") : "Genres not listed"}</p><strong>{dj.price != null ? `Starting at $${dj.price}` : "Price not listed"}</strong><Link className="primary button" href={`/profile/${dj.user_id}`}>View DJ profile</Link></article>) : <div className="card"><p>No DJs found.</p></div>}</div></section>
        ) : (
          <section><h2>Open gigs</h2><div className="gig-grid">{filteredGigs.length ? filteredGigs.map((gig) => <article className="card gig-card" key={gig.id}><p className="eyebrow">{gig.event_date}</p><h3>{gig.title}</h3><p>{gig.description || "No description yet."}</p><p><strong>{gig.location}</strong></p><p>{gig.start_time || "Time TBD"}{gig.end_time ? ` – ${gig.end_time}` : ""}</p><p>{gig.genres?.length ? gig.genres.join(" · ") : "Genres not listed"}</p><p>{gig.budget_min != null || gig.budget_max != null ? `$${gig.budget_min ?? 0}–$${gig.budget_max ?? gig.budget_min}` : "Budget not listed"}</p><Link className="primary button" href={`/gigs/${gig.id}`}>View gig</Link></article>) : <div className="card"><p>No open gigs found.</p></div>}</div></section>
        )}
      </section>
    </main>
  );
}
