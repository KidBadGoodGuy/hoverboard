import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOVERBOARD",
  description: "Find the Gig. It’s on the Board.",
};

function GlobalNav() {
  return (
    <nav className="global-nav">
      <Link href="/" className="global-brand">HOVERBOARD</Link>
      <Link href="/discover" className="global-search-button">Search</Link>
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
