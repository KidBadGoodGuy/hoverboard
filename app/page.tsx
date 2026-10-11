import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> BUILT FOR THE NEXT SET</p>
          <h1>Find the gig.<br /><span>Own the moment.</span></h1>
          <p className="subtitle home-subtitle">
            HOVERBOARD brings DJs and clients together in one place — from discovering a DJ to getting a booking confirmed.
          </p>
          <div className="actions home-actions">
            <Link className="primary button" href="/auth?role=dj">I’m a DJ <span aria-hidden="true">↗</span></Link>
            <Link className="secondary button" href="/auth?role=client">I’m looking for a DJ</Link>
          </div>
          <p className="hero-footnote">One platform. Two sides. Better gigs.</p>
        </div>
        <div className="hero-art" aria-label="HOVERBOARD platform highlights">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-art-top"><span className="mini-mark">H</span><span>HOVERBOARD / V1</span><span className="live-dot" /></div>
          <div className="sound-wave" aria-hidden="true">
            {Array.from({ length: 31 }, (_, i) => <span key={i} style={{ height: `${18 + Math.abs(Math.sin(i * 0.63)) * (i % 4 === 0 ? 74 : 48)}px` }} />)}
          </div>
          <div className="hero-art-caption"><span className="caption-kicker">YOUR NEXT CHAPTER</span><strong>Starts with a booking.</strong><span className="caption-line">DISCOVER <i /> CONNECT <i /> PLAY</span></div>
          <div className="floating-chip chip-top"><span className="chip-icon">↗</span><span><strong>Find your next gig</strong><small>Make the connection</small></span></div>
          <div className="floating-chip chip-bottom"><span className="chip-icon chip-icon-blue">✓</span><span><strong>Booking, simplified</strong><small>From request to confirmed</small></span></div>
        </div>
      </section>

      <section className="home-proof">
        <div><span className="proof-number">01</span><strong>Discover</strong><p>Explore DJs and find the right sound for your event.</p></div>
        <div><span className="proof-number">02</span><strong>Connect</strong><p>Keep booking details and communication in one flow.</p></div>
        <div><span className="proof-number">03</span><strong>Make it happen</strong><p>Move from an accepted request to a confirmed booking.</p></div>
      </section>

      <section className="home-section home-why">
        <div className="section-intro">
          <p className="eyebrow">LESS BACK-AND-FORTH. MORE MUSIC.</p>
          <h2>Everything starts<br />with the right connection.</h2>
          <p className="muted">HOVERBOARD is being built to make the DJ booking experience feel clear, modern, and straightforward for everyone involved.</p>
        </div>
        <div className="feature-stack">
          <article className="feature-card"><span className="feature-number">01 / DJ</span><div><h3>Put your sound out there.</h3><p>Create your DJ profile, show clients what you bring, and manage booking requests in one place.</p><Link href="/auth?role=dj" className="text-link">Start as a DJ <span aria-hidden="true">→</span></Link></div><span className="feature-symbol" aria-hidden="true">♫</span></article>
          <article className="feature-card"><span className="feature-number">02 / CLIENT</span><div><h3>Find a DJ for your event.</h3><p>Discover available DJ profiles, send a request, and keep track of the booking as it moves forward.</p><Link href="/auth?role=client" className="text-link">Find a DJ <span aria-hidden="true">→</span></Link></div><span className="feature-symbol feature-symbol-blue" aria-hidden="true">⌕</span></article>
        </div>
      </section>

      <section className="founder-banner">
        <div className="founder-monogram" aria-hidden="true">H<span>•</span></div>
        <div className="founder-copy"><p className="eyebrow">THE IDEA BEHIND THE BOARD</p><h2>Built by a music lover<br />who likes to build things.</h2><p>HOVERBOARD started with a simple idea: make the path between a DJ and a gig easier to navigate. Meet the person building it.</p></div>
        <Link href="/about" className="button secondary founder-link">Meet the founder <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="home-bottom-cta">
        <p className="eyebrow">YOUR NEXT SET IS OUT THERE</p>
        <h2>Ready to get on the board?</h2>
        <p className="muted">Whether you’re behind the decks or planning an event, there’s a place to start.</p>
        <div className="actions"><Link className="primary button" href="/auth?role=dj">Join as a DJ</Link><Link className="secondary button" href="/auth?role=client">Book a DJ</Link></div>
      </section>
      <footer className="site-footer"><Link href="/" className="global-brand">HOVERBOARD</Link><span>Find the Gig. It’s on the Board.</span><div><Link href="/about">About</Link><Link href="/discover">Discover DJs</Link></div></footer>
    </main>
  );
}
