"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export default function ClientProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", profile_information: "" });

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/auth?role=client");
        return;
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (userError) {
        setMessage(userError.message);
        setLoading(false);
        return;
      }

      if (user?.role !== "client") {
        router.push("/dashboard");
        return;
      }

      const { data: profile, error } = await supabase
        .from("client_profiles")
        .select("name, profile_information")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
      } else if (profile) {
        setForm({
          name: profile.name || "",
          profile_information: profile.profile_information || "",
        });
      } else {
        const metadataName = typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : "";
        setForm({ name: metadataName, profile_information: "" });
      }

      setLoading(false);
    }

    void load();
  }, [router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/auth?role=client");
      return;
    }

    const name = form.name.trim();
    if (!name) {
      setMessage("Please enter your name.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("client_profiles").upsert(
      {
        user_id: auth.user.id,
        name,
        profile_information: form.profile_information.trim() || null,
      },
      { onConflict: "user_id" },
    );

    setMessage(error ? error.message : "Profile saved!");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="center-page">
        <div className="card"><p>Loading your client profile…</p></div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <header className="topbar">
        <Link href="/dashboard" className="brand">HOVERBOARD</Link>
        <Link href="/dashboard" className="button">Back to dashboard</Link>
      </header>
      <section className="profile-content">
        <div className="hero-small">
          <p className="eyebrow">CLIENT PROFILE</p>
          <h1>Build your profile.</h1>
          <p>Give DJs a little context about who they’ll be working with.</p>
        </div>
        {message && <div className="notice">{message}</div>}
        <form onSubmit={save} className="form">
          <section className="card">
            <h2>About you</h2>
            <div className="form">
              <label>
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name or organization"
                />
              </label>
              <label>
                Profile information
                <textarea
                  value={form.profile_information}
                  onChange={(e) => setForm({ ...form, profile_information: e.target.value })}
                  placeholder="Tell DJs anything useful about you, your events, or the kinds of gigs you host."
                />
              </label>
            </div>
          </section>
          <button className="primary save-profile" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>
    </main>
  );
}
