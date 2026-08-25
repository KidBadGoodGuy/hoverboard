"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setLoggedIn(Boolean(data.session));
        setChecking(false);
      }
    }
    void checkSession();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="home-page">
      <div className="hero">
        <p className="eyebrow">HOVERBOARD</p>
        <h1>Find the Gig.<br />It’s on the Board.</h1>
        <p className="subtitle">DJ gigs and bookings, all in one place.</p>
        <div className="actions">
          {checking ? (
            <span className="button primary">Loading…</span>
          ) : loggedIn ? (
            <Link className="primary button" href="/dashboard">Go to dashboard</Link>
          ) : (
            <>
              <Link className="primary button" href="/auth?role=dj">I’m a DJ</Link>
              <Link className="secondary button" href="/auth?role=client">I’m a Client</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
