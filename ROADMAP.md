# HOVERBOARD V1 Roadmap

HOVERBOARD is built incrementally. Each milestone should be implemented and tested before moving to the next.

## Step 1 — Project Foundation & Documentation

- [x] Establish V1 scope
- [x] Define the two user roles
- [x] Document the core booking flow
- [x] Document the technology responsibilities
- [x] Establish AI agent rules
- [x] Establish initial repository documentation

**Status: COMPLETE**

## Step 2 — V1 Database Design

- [x] Finalize PostgreSQL schema
- [x] Define relationships and constraints
- [x] Define indexes
- [x] Define Row Level Security requirements
- [x] Define booking status transitions
- [x] Define payment-data boundaries
- [x] Document the V1 schema boundary

**Status: COMPLETE**

## Step 3 — Supabase Setup

- Create/configure Supabase project
- Configure authentication
- Create database schema
- Configure storage
- Apply security policies
- Test database access and RLS

## Step 4 — Application Setup

- Choose and document the application framework
- Configure project structure
- Connect the application to Supabase
- Establish development and testing workflow

## Step 5 — Authentication

- Sign up
- Log in
- Log out
- Role selection
- Protected routes/screens

## Step 6 — DJ Profiles

- Create/edit DJ profile
- Profile photo
- Bio
- Location
- Genres
- Pricing
- Availability

## Step 7 — Client Profiles

- Create/edit client profile
- Basic client information

## Step 8 — DJ Search

- Browse DJs
- Search
- Filters
- DJ profile pages
- Availability and pricing display

## Step 9 — Booking Requests

- Select date/time
- Submit booking request
- DJ receives request
- DJ accepts/declines

## Step 10 — Booking Confirmation

- Payment-ready booking state
- Successful payment confirmation
- Confirmed booking
- Upcoming booking views

## Step 11 — Stripe Payments

- Integrate Stripe
- Process client payments securely
- Track payment state
- Support DJ payout flow after completed gigs

## Step 12 — Reviews

- Client rating
- Client review
- Display reviews on DJ profiles

## Step 13 — Full V1 Testing

Test the complete flow from account creation through booking, payment, gig completion, DJ payment, and review.

## After V1

Only after V1 is working successfully should future capabilities be evaluated, such as teams, venues, additional performer types, advanced verification, AI matching, payroll, and other marketplace systems.
