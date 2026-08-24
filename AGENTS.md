# HOVERBOARD AI AGENT INSTRUCTIONS

## Project Identity

**Project:** HOVERBOARD  
**Version:** HOVERBOARD V1  
**Slogan:** “Find the Gig. It’s on the Board.”

HOVERBOARD V1 is a DJ gig-booking platform. Its immediate mission is to make it easy for a client to find, book, and pay a DJ and for a solo DJ to receive and manage gigs.

## V1 Roles — Exactly Two

### 1. Solo DJ

A DJ who can create a profile, set pricing and availability, receive booking requests, accept or decline bookings, view upcoming and past gigs, view earnings, receive payment after completed gigs, and receive client reviews.

### 2. Client

A person who can create a profile, search and filter DJs, view DJ profiles, pricing, and availability, request bookings, pay for bookings, view upcoming and past bookings, and review DJs.

**Do not create additional V1 roles.**

## Explicitly Out of Scope for V1

Do not build or introduce these unless the project owner explicitly requests a scope change:

- DJ Teams
- Club/Venue accounts
- Other performer types
- GPS verification
- QR check-in/check-out
- Advanced reputation systems
- AI performer matching
- Payroll
- Recurring club bookings
- Complex dispute systems
- Automatic team payout splitting
- Emergency DJ replacement
- Equipment marketplace
- Advanced analytics
- Performer marketplace expansion

Future ideas must not silently become V1 requirements.

## Core Booking Flow

Client searches → views DJ → chooses date/time → requests booking → DJ accepts → client pays → booking becomes confirmed → DJ performs → gig completes → DJ gets paid → client reviews DJ.

Keep this flow understandable and predictable.

## Technology Responsibilities

- **GitHub:** source code and version history.
- **Codex:** AI development assistance.
- **Supabase:** authentication, database, storage, security policies, and backend services.
- **Cloudflare:** domain, DNS, security, and web infrastructure.
- **Stripe:** payment processing.

Never treat these services as interchangeable.

## Security Rules

- Use Supabase Auth for authentication.
- Enforce authorization and database security policies.
- Never expose secret keys in client-side code.
- Never store sensitive payment information directly in HOVERBOARD.
- Use Stripe for payment processing.
- Validate permissions on every protected operation.
- Do not weaken security to make development easier.

## Development Rules

1. Read the project documentation before making major changes.
2. Follow the current V1 scope.
3. Build one major feature at a time.
4. Prefer simple solutions over unnecessary architecture.
5. Test changes before moving to the next milestone.
6. Explain major technical or architectural decisions before implementing them.
7. Do not delete working functionality without approval.
8. Keep documentation synchronized with the actual implementation.
9. Ask for clarification when a major product decision is genuinely unclear.
10. Do not implement future features merely because they could be useful later.

## Repository Structure

```text
hoverboard/
├── AGENTS.md
├── PRODUCT.md
├── DATABASE.md
├── ROADMAP.md
├── README.md
├── .gitignore
├── docs/
│   ├── business-rules.md
│   ├── ui-guidelines.md
│   ├── api.md
│   └── features.md
├── app/
├── backend/
└── assets/
```

## Current Stage

**Step 1 — Project Foundation & Documentation**

Do not rush into application implementation until the foundation documentation is complete and reviewed.
