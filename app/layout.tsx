import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOVERBOARD",
  description: "Find the Gig. It’s on the Board.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
