import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind HOVERBOARD and the person building it.",
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="eyebrow"><span className="status-dot" /> THE STORY BEHIND HOVERBOARD</p>
        <h1>A big idea.<br /><span>A board to build it on.</span></h1>
        <p className="about-lead">HOVERBOARD is a DJ gig platform being built around one simple belief: finding the right DJ and making a booking should feel easier.</p>
      </section>

      <section className="about-founder card">
        <div className="about-monogram" aria-hidden="true">A<span>•</span></div>
        <div className="about-founder-copy">
          <p className="eyebrow">MEET THE FOUNDER</p>
          <h2>Hey, I’m Arjun.</h2>
          <p>I’m a DJ, a music fan, and someone who loves building things with technology. I’m especially interested in the point where music, creative ideas, and software come together — not just imagining what could exist, but actually working to make it real.</p>
          <p>HOVERBOARD is one of those ideas. I’m building it step by step, learning as I go, and aiming to make something genuinely useful for both DJs and the people who want to book them.</p>
        </div>
      </section>

      <section className="about-values">
        <div className="about-section-heading"><p className="eyebrow">WHY I’M BUILDING IT</p><h2>Made with purpose.<br />Built one step at a time.</h2></div>
        <div className="about-value-grid">
          <article className="about-value-card"><span>01</span><h3>Music brings people together.</h3><p>A great DJ can shape the energy of an event. Finding the right one should be a good experience from the very beginning.</p></article>
          <article className="about-value-card"><span>02</span><h3>Technology should help, not get in the way.</h3><p>The goal is to make profiles, booking requests, and payment steps easier to understand — without adding unnecessary complexity.</p></article>
          <article className="about-value-card"><span>03</span><h3>Build, test, improve.</h3><p>HOVERBOARD is being developed in real steps: learning the tools, solving problems, and improving the product as it grows.</p></article>
        </div>
      </section>

      <section className="about-mission">
        <div><p className="eyebrow">THE MISSION</p><h2>Find the Gig.<br /><span>It’s on the Board.</span></h2></div>
        <div><p>HOVERBOARD’s first version focuses on two people in every booking journey: the Solo DJ and the Client. DJs can present themselves and manage requests. Clients can discover DJs and move bookings forward in one place.</p><p>It’s a focused starting point for a bigger ambition: make the business side of DJing feel more approachable, so people can spend more energy on the music and the event.</p><Link href="/auth?role=dj" className="button primary">Be part of the beginning <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="about-bottom"><p className="eyebrow">THANKS FOR STOPPING BY</p><h2>The board is just getting started.</h2><p className="muted">Explore HOVERBOARD and see what we’re building.</p><div className="actions"><Link href="/discover" className="primary button">Discover DJs</Link><Link href="/" className="secondary button">Back to home</Link></div></section>
      <footer className="site-footer"><Link href="/" className="global-brand"><span className="nav-mark">H</span> HOVERBOARD</Link><span>Find the Gig. It’s on the Board.</span><div><Link href="/about">About</Link><Link href="/discover">Discover DJs</Link></div></footer>
    </main>
  );
}
