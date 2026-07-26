# HOVERBOARD AGENTS.md

## Project Identity

Project Name: HOVERBOARD

Mission:
HOVERBOARD is a live performer booking and payment platform designed to connect performers, clients, and venues through a trusted marketplace.

The platform allows performers to receive bookings, complete gigs, and receive secure payments while allowing clients and venues to easily discover, hire, and manage entertainment.

HOVERBOARD's core promise:

**Book. Perform. Get Paid.**

---

# AI Development Instructions

You are an AI software engineer working on the HOVERBOARD project.

Your responsibilities:

* Write clean, maintainable, production-quality code.
* Follow the product requirements exactly.
* Do not create features that conflict with documented business rules.
* Ask before making major architectural changes.
* Prioritize security, reliability, and user experience.
* Explain important technical decisions.
* Keep documentation updated when changing major systems.

Never:

* Remove existing features without approval.
* Change payment logic without approval.
* Store sensitive payment information directly.
* Bypass security rules for convenience.
* Create inconsistent user experiences.

---

# Product Overview

HOVERBOARD is a marketplace with four primary user roles.

## Role 1: Solo Performer

A single entertainer.

Examples:

* DJ
* Singer
* Musician
* Dancer
* Saxophonist
* Violinist
* Host
* MC

Capabilities:

* Create profile
* Set pricing
* Accept bookings
* Manage calendar
* Scan gig QR codes
* Receive payments
* Build reputation

---

## Role 2: Team

A group of performers who book as one unit.

Examples:

* DJ + Singer
* Full Band
* Dance Crew
* DJ + Host

Team Leader:

* Creates team
* Invites members
* Controls booking settings
* Sets payout percentages

Team Members:

* Accept invitations
* View gigs
* Receive automatic payouts
* Leave team

---

## Role 3: Client

People or organizations booking performers.

Examples:

* Bride
* Groom
* Event Planner
* Corporate Company
* Private Party Host

Capabilities:

* Search performers
* View profiles
* Book performers
* Pay securely
* Confirm gigs
* Leave reviews

---

## Role 4: Club / Venue

Recurring entertainment customers.

Examples:

* Bars
* Nightclubs
* Restaurants
* Lounges

Capabilities:

* Manage performer roster
* Schedule recurring bookings
* Handle payroll
* Export payment records

---

# Core Business Rules

## Payment System

Clients pay upfront.

Money is held securely until gig completion.

Performers should never have to chase payments.

---

## Platform Fees

Solo Standard:

* Performer receives 90%
* HOVERBOARD receives 10%

Team Standard:

* Team receives 90%
* HOVERBOARD receives 10%

Solo Superstar:

* Performer receives 95%
* HOVERBOARD receives 5%

Team Superstar:

* Team receives 95%
* HOVERBOARD receives 5%

Club:

* HOVERBOARD receives 8%

---

# Team Payment Rules

Team Leader defines payout percentages.

Example:

DJ:
50%

Singer:
30%

Dancer:
20%

When payment is released:

The system automatically calculates each member's share.

No manual payments.
No Venmo.
No cash splitting.

---

# Reputation System

Reputation is called:

HOVERBOARD STARS

## Point System

Complete gig on time:
+10 points

Five-star review:
+5 points

Fast response:
+3 points

No-show:
-100 points

Late cancellation:
-50 points

---

## Performer Levels

0-99:
Rookie

100-499:
Pro

500-999:
Elite

1000+:
SUPERSTAR

SUPERSTAR benefits:

* 5% platform fee
* Higher search ranking
* Superstar badge
* Priority support

---

# Gig Verification System

## QR Verification

Every gig uses QR verification.

Start:

Client displays Start QR.

Team Leader scans.

System starts:

* Timer
* GPS tracking
* Gig status

End:

Client displays End QR.

Team Leader scans.

System:

* Ends gig
* Releases payment
* Splits team payouts

---

# Remote Authorization

If client is unavailable:

Client authorizes remotely.

Requirements:

* Performer must be at venue location.
* GPS verification required.
* Team members must confirm presence.

---

# Dispute System

Users can submit:

* Evidence
* Short video proof
* Notes

Disputes should be reviewed fairly.

Default dispute goal:

Resolution within 48 hours.

---

# Database Expectations

The database will use:

Supabase PostgreSQL.

Major tables:

Users

Performers

Teams

TeamMembers

Clients

Venues

Bookings

Payments

Payouts

Reviews

Reputation

Messages

Contracts

Availability

Notifications

---

# Security Requirements

Always:

* Validate user permissions.
* Protect private information.
* Use secure authentication.
* Follow Supabase security policies.
* Never expose secret keys.

Payment information must be handled through Stripe.

---

# Technology Stack

Frontend:

React Native

Expo

Backend:

Supabase

Database:

PostgreSQL

Authentication:

Supabase Auth

Payments:

Stripe

Version Control:

GitHub

AI Development:

Codex

---

# Development Roadmap

## Phase 1: Foundation

* Project setup
* Documentation
* Database planning

## Phase 2: Authentication

Build:

* Sign up
* Login
* User roles
* Profiles

## Phase 3: Performer Marketplace

Build:

* Performer profiles
* Search
* Filters
* Availability

## Phase 4: Booking System

Build:

* Booking requests
* Contracts
* Calendar

## Phase 5: Payments

Build:

* Stripe integration
* Escrow system
* Payout tracking

## Phase 6: Teams

Build:

* Team creation
* Member management
* Automatic splits

## Phase 7: Verification

Build:

* QR system
* GPS verification
* Gig completion

## Phase 8: Clubs

Build:

* Recurring bookings
* Payroll
* Venue tools

---

# Coding Standards

Code should be:

* Clean
* Organized
* Documented
* Easy to maintain

Use:

* Clear variable names
* Reusable components
* Consistent formatting
* Proper error handling

---

# UI Guidelines

The app should feel:

* Professional
* Modern
* Fast
* Trustworthy

Prioritize:

* Simple navigation
* Clear buttons
* Minimal confusion
* Mobile-first design

---

# Future Features

Possible future additions:

* AI performer matching
* Performer discovery feed
* Equipment marketplace
* Insurance options
* Emergency replacements
* Analytics dashboard
* Subscription plans

---

# Final Rule

Every decision should support HOVERBOARD becoming the most trusted platform for booking and paying live performers.

Build carefully.

Build securely.

Build for scale.
