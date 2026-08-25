"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Availability = Record<string, { available: boolean; start: string; end: string }>;

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const defaultAvailability: Availability = Object.fromEntries(DAYS.map((day) => [day, { available: true, start: "18:00", end: "23:00" }])) as Availability;

export default function DJProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [form, setForm] = useState({ dj_name: "", bio: "", location: "", genres: "", price: "" });
  const [availability, setAvailability] = useState<Availability>(defaultAvailability);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/auth?role=dj"); return; }
      const { data: user } = await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle();
      if (user?.role !== "dj") { router.push("/dashboard"); return; }
      const { data: profile, error } = await supabase.from("dj_profiles").select("dj_name, profile_photo, bio, location, genres, price, availability").eq("user_id", auth.user.id).single();
      if (error) { setMessage(error.message); setLoading(false); return; }
      setForm({ dj_name: profile.dj_name || "", bio: profile.bio || "", location: profile.location || "", genres: (profile.genres || []).join(", "), price: profile.price?.toString() || "" });
      setAvailability({ ...defaultAvailability, ...(profile.availability || {}) });
      if (profile.profile_photo) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(profile.profile_photo);
        setPhoto(data.publicUrl);
      }
      setLoading(false);
    }
    void load();
  }, [router]);

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage("Profile photos must be 5 MB or smaller."); return; }
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${auth.user.id}/profile.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setMessage(error.message); return; }
    const { error: updateError } = await supabase.from("dj_profiles").update({ profile_photo: path }).eq("user_id", auth.user.id);
    if (updateError) { setMessage(updateError.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setPhoto(`${data.publicUrl}?v=${Date.now()}`);
    setMessage("Profile photo updated.");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.push("/auth?role=dj"); return; }
    const price = Number(form.price);
    if (!form.dj_name.trim() || !form.location.trim() || !Number.isFinite(price) || price < 0) { setMessage("Add your DJ name, location, and a valid non-negative price."); setSaving(false); return; }
    const { error } = await supabase.from("dj_profiles").update({ dj_name: form.dj_name.trim(), bio: form.bio.trim() || null, location: form.location.trim(), genres: form.genres.split(",").map((genre) => genre.trim()).filter(Boolean), price, availability }).eq("user_id", auth.user.id);
    setMessage(error ? error.message : "Profile saved!");
    setSaving(false);
  }

  function updateDay(day: string, field: "available" | "start" | "end", value: boolean | string) {
    setAvailability((current) => ({ ...current, [day]: { ...current[day], [field]: value } }));
  }

  if (loading) return <main className="center-page"><div className="card"><p>Loading your DJ profile…</p></div></main>;

  return (
    <main className="profile-page">
      <header className="topbar"><Link href="/dashboard" className="brand">HOVERBOARD</Link><Link href="/dashboard" className="button">Back to dashboard</Link></header>
      <section className="profile-content">
        <div className="hero-small"><p className="eyebrow">DJ PROFILE</p><h1>Build your profile.</h1><p>Give clients a clear picture of who you are and what you offer.</p></div>
        {message && <div className="notice">{message}</div>}
        <form onSubmit={save} className="form">
          <section className="card profile-photo-section">
            <div className="avatar-preview">{photo ? <img src={photo} alt="DJ profile" /> : <span>{form.dj_name.slice(0, 1).toUpperCase() || "DJ"}</span>}</div>
            <div><h2>Profile photo</h2><p className="muted">Use a clear photo clients can recognize.</p><label className="button upload-button">Choose photo<input className="hidden-input" type="file" accept="image/*" onChange={uploadPhoto} /></label></div>
          </section>
          <section className="card">
            <h2>About you</h2>
            <div className="form grid-form">
              <label>DJ name<input required value={form.dj_name} onChange={(e) => setForm({ ...form, dj_name: e.target.value })} placeholder="DJ Arjun" /></label>
              <label>Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Woodbury, MN" /></label>
              <label>Genres<input value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} placeholder="Hip-hop, Pop, EDM" /><span className="field-help">Separate genres with commas.</span></label>
              <label>Starting price<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="500" /></label>
              <label className="full">Bio<textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell clients about your style, experience, and the events you love playing." /></label>
            </div>
          </section>
          <section className="card">
            <h2>Availability</h2><p className="muted">Set the usual hours when you can take gigs. You can change these later.</p>
            <div className="availability-list">{DAYS.map((day) => { const item = availability[day]; return <div className="availability-row" key={day}><label className="day-toggle"><input type="checkbox" checked={item.available} onChange={(e) => updateDay(day, "available", e.target.checked)} /><strong>{day[0].toUpperCase() + day.slice(1)}</strong></label><input type="time" disabled={!item.available} value={item.start} onChange={(e) => updateDay(day, "start", e.target.value)} /><span>to</span><input type="time" disabled={!item.available} value={item.end} onChange={(e) => updateDay(day, "end", e.target.value)} /></div> })}</div>
          </section>
          <button className="primary save-profile" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
        </form>
      </section>
    </main>
  );
}
