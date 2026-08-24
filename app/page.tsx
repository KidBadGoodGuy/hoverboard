import Link from "next/link";

export default function HomePage() {
  return <main className="home-page"><div className="hero"><p className="eyebrow">HOVERBOARD</p><h1>Find the Gig.<br/>It’s on the Board.</h1><p className="subtitle">DJ gigs and bookings, all in one place.</p><div className="actions"><Link className="primary button" href="/auth?role=dj">I’m a DJ</Link><Link className="secondary button" href="/auth?role=client">I’m a Client</Link></div></div></main>;
}
