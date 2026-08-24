# HOVERBOARD V1

> **Find the Gig. It’s on the Board.**

HOVERBOARD is a DJ gig-booking platform designed to make it easy for clients to find, book, and pay DJs and for solo DJs to find and manage gigs.

## V1 Scope

HOVERBOARD V1 is intentionally small. It has exactly two user roles:

- **Solo DJ** — creates a DJ profile, receives booking requests, manages gigs, and gets paid.
- **Client** — searches for DJs, requests bookings, pays for bookings, and leaves reviews.

V1 does **not** include DJ teams, clubs/venues, other performer types, GPS verification, QR check-in, AI matching, payroll, or other advanced systems.

## Core Booking Flow

1. Client searches for DJs.
2. Client views a DJ profile.
3. Client chooses an event date/time and requests a booking.
4. DJ accepts or declines.
5. Client pays after the DJ accepts.
6. The booking becomes confirmed after successful payment.
7. DJ performs the gig.
8. The booking is completed.
9. DJ receives payment through the payment system.
10. Client leaves a review.

## Planned Technology

- **GitHub** — source code and version history.
- **Codex** — AI development assistance.
- **Supabase** — authentication, database, storage, and backend services.
- **Cloudflare** — domain, DNS, security, and web infrastructure.
- **Stripe** — payment processing.

These services have separate responsibilities and should not be treated as interchangeable.

## Repository Structure

```text
hoverboard/
├── AGENTS.md
├── PRODUCT.md
├── DATABASE.md
├── ROADMAP.md
├── README.md
├── .gitignore
│
├── docs/
│   ├── business-rules.md
│   ├── ui-guidelines.md
│   ├── api.md
│   └── features.md
│
├── app/
├── backend/
└── assets/
```

The application code is intentionally not being built during the foundation stage.

## Development Principles

1. Keep V1 simple.
2. Build one major feature at a time.
3. Test features before moving forward.
4. Protect user data from the beginning.
5. Never store sensitive payment information directly in HOVERBOARD.
6. Keep documentation synchronized with the actual product.
7. Explain major architecture changes before making them.
8. Do not add future features unless explicitly approved.

## Current Status

**Version:** HOVERBOARD V1  
**Stage:** Step 1 — Project Foundation & Documentation

The repository foundation is being established before application development begins.

## Future Vision

After a successful DJ-only V1, HOVERBOARD may expand to other performers, teams, clubs/venues, advanced verification, AI matching, recurring bookings, payroll, equipment services, and other marketplace capabilities.

Future ideas must not complicate V1.
