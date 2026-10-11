import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HOVERBOARD — Find the Gig. It’s on the Board.",
    template: "%s | HOVERBOARD",
  },
  description: "A simpler way for DJs and clients to connect, manage booking requests, and get events moving.",
};

function GlobalNav() {
  return (
    <nav className="global-nav" aria-label="Main navigation">
      <Link href="/" className="global-brand" aria-label="HOVERBOARD home"><span className="nav-mark">H</span> HOVERBOARD</Link>
      <div className="global-nav-links">
        <Link href="/discover" className="nav-text-link">Discover</Link>
        <Link href="/about" className="nav-text-link">About</Link>
        <Link href="/auth?role=dj" className="nav-join-button">Get on the board <span aria-hidden="true">↗</span></Link>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Script src="https://js.stripe.com/dahlia/stripe.js" strategy="beforeInteractive" />
        <GlobalNav />
        {children}
      </body>
    </html>
  );
}
