# HOVERBOARD V1 Database Design

## Purpose

This document defines the database design for HOVERBOARD V1 before the Supabase database is created.

HOVERBOARD V1 uses **Supabase PostgreSQL**.

The database is intentionally small and supports exactly two application roles:

- `dj` — Solo DJ
- `client` — Client

No teams, venues, other performer types, reputation systems, GPS verification, QR systems, payroll, or AI matching belong in this V1 schema.

---

## 1. Data Model Overview

```text
auth.users
    │
    └── users
          ├── dj_profiles
          │      │
          │      └──── bookings ──── client_profiles
          │               │
          │               └──── reviews
          │
          └── client_profiles
```

Supabase Auth owns authentication credentials. HOVERBOARD's `users` table stores the application's role and account-level data and references `auth.users`.

---

# 2. Tables

## `users`

One application account per authenticated Supabase user.

| Column | Type | Rules / Purpose |
|---|---|---|
| `id` | `uuid` | Primary key; references `auth.users.id` |
| `email` | `text` | Account email; should stay synchronized with Auth as appropriate |
| `role` | `text` | Required; only `dj` or `client` |
| `created_at` | `timestamptz` | Required; defaults to current time |

### Constraints

- `id` is the primary key.
- `role` must be one of `dj`, `client`.
- A user can have only one role in V1.
- Do not allow a user to become a team, venue, or other performer role.

---

## `dj_profiles`

Public-facing marketplace information for a Solo DJ.

| Column | Type | Rules / Purpose |
|---|---|---|
| `user_id` | `uuid` | Primary key and FK to `users.id` |
| `dj_name` | `text` | Required display name |
| `profile_photo` | `text` | Optional storage object path/identifier |
| `bio` | `text` | Optional biography |
| `location` | `text` | DJ's service location |
| `genres` | `text[]` | Genres offered |
| `price` | `numeric` | Base booking price; must not be negative |
| `availability` | `jsonb` | Availability configuration; exact structure to be finalized before implementation |
| `created_at` | `timestamptz` | Required; defaults to current time |

### Constraints

- `user_id` must reference a user whose role is `dj`.
- One DJ account can have only one DJ profile.
- `price >= 0`.
- Public profile data must not contain private payment or authentication information.

---

## `client_profiles`

Profile information for a Client.

| Column | Type | Rules / Purpose |
|---|---|---|
| `user_id` | `uuid` | Primary key and FK to `users.id` |
| `name` | `text` | Required display name |
| `profile_information` | `text` | Optional additional profile information |
| `created_at` | `timestamptz` | Required; defaults to current time |

### Constraints

- `user_id` must reference a user whose role is `client`.
- One client account can have only one client profile.

---

## `bookings`

The central V1 transaction record connecting one Client with one Solo DJ.

| Column | Type | Rules / Purpose |
|---|---|---|
| `id` | `uuid` | Primary key |
| `dj_id` | `uuid` | FK to `dj_profiles.user_id` |
| `client_id` | `uuid` | FK to `client_profiles.user_id` |
| `event_date` | `date` | Required |
| `start_time` | `time` | Required |
| `end_time` | `time` | Required; must be after `start_time` |
| `location` | `text` | Required event location |
| `price` | `numeric` | Required agreed booking price; must not be negative |
| `status` | `text` | Required booking state |
| `created_at` | `timestamptz` | Required; defaults to current time |

### Booking status values

- `requested` — Client has submitted a request; DJ has not decided.
- `accepted` — DJ accepted the request; payment has not successfully completed.
- `declined` — DJ declined the request.
- `paid` — Client payment has successfully completed; confirmation processing is in progress.
- `confirmed` — Booking is fully confirmed after successful payment.
- `completed` — Gig has been completed.
- `cancelled` — Booking was cancelled according to the V1 cancellation rules.

### Status transitions

```text
requested
├── accepted
│    └── paid
│         └── confirmed
│              └── completed
│
└── declined

requested ──> cancelled
accepted  ──> cancelled   (only if V1 cancellation rules permit)
confirmed ──> cancelled   (only if V1 cancellation rules permit)
```

The application must not allow arbitrary status changes. Valid transitions should be enforced in the database and/or trusted backend logic during Step 3.

### Booking constraints

- `dj_id` must reference a DJ profile.
- `client_id` must reference a client profile.
- `dj_id` and `client_id` cannot refer to the same account.
- `price >= 0`.
- `end_time > start_time`.
- A DJ should not have two confirmed bookings that overlap in date/time. The exact database enforcement strategy will be finalized during Supabase implementation.

---

## `reviews`

A Client's review of a completed booking.

| Column | Type | Rules / Purpose |
|---|---|---|
| `id` | `uuid` | Primary key |
| `booking_id` | `uuid` | Required FK to `bookings.id` |
| `dj_id` | `uuid` | FK to `dj_profiles.user_id` |
| `client_id` | `uuid` | FK to `client_profiles.user_id` |
| `rating` | `integer` | Required; 1 through 5 |
| `review` | `text` | Optional written review |
| `created_at` | `timestamptz` | Required; defaults to current time |

### Constraints

- `booking_id` must refer to a completed booking.
- `dj_id` and `client_id` must match the DJ and Client on the referenced booking.
- A Client may leave at most one review for a booking.
- `rating` must be between 1 and 5.
- Only the Client associated with the booking may create its review.

---

# 3. Relationships

- `auth.users.id` → `users.id` — one application account per authenticated user.
- `users.id` → `dj_profiles.user_id` — one-to-one for DJ accounts.
- `users.id` → `client_profiles.user_id` — one-to-one for Client accounts.
- `dj_profiles.user_id` → `bookings.dj_id` — one DJ can have many bookings.
- `client_profiles.user_id` → `bookings.client_id` — one Client can have many bookings.
- `bookings.id` → `reviews.booking_id` — one booking can have at most one review.

Foreign keys should use appropriate delete behavior so that account deletion cannot accidentally destroy historical booking records without an explicit policy.

---

# 4. Index Plan

The initial schema should include indexes for common V1 queries:

- `users(role)` — role-based queries.
- `dj_profiles(location)` — location filtering.
- `bookings(dj_id, event_date)` — DJ schedule and upcoming gigs.
- `bookings(client_id, event_date)` — Client bookings and history.
- `bookings(status)` — booking workflow queries.
- `reviews(dj_id)` — reviews displayed on DJ profiles.
- `reviews(booking_id)` — checking whether a booking has been reviewed.

Additional indexes should only be added when a real query requires them.

---

# 5. Row Level Security (RLS) Plan

RLS must be enabled before production use.

### Users

- A signed-in user can read their own account record.
- A signed-in user cannot modify their own role directly.
- Users cannot read or modify another user's private account information.

### DJ profiles

- Public marketplace fields may be readable for DJ discovery.
- A DJ can create and edit only their own profile.
- A DJ cannot edit another DJ's profile.

### Client profiles

- A Client can create and edit only their own profile.
- Private client information must not be publicly readable by default.

### Bookings

- A Client can create a booking request for themselves.
- A Client can read bookings where they are the client.
- A DJ can read bookings where they are the DJ.
- A DJ can accept or decline only bookings assigned to that DJ.
- Clients and DJs cannot arbitrarily change booking ownership or trusted payment/completion states from the client application.

### Reviews

- Only the Client associated with a completed booking can create its review.
- Reviews can be publicly displayed as appropriate for DJ discovery.
- A review cannot be edited by another user.

All RLS policies will be implemented and tested in Step 3.

---

# 6. Payments

HOVERBOARD will use Stripe for actual payment processing.

The HOVERBOARD database must **not** store sensitive card information, card numbers, CVVs, or other payment credentials.

Payment-specific identifiers and state may be added later where needed to connect a booking to Stripe, but the payment architecture must be designed around Stripe rather than turning HOVERBOARD into a payment-card database.

---

# 7. Data Integrity Rules

The database should protect important business rules rather than relying entirely on the UI.

At minimum:

- Roles are restricted to `dj` and `client`.
- DJ and Client profile ownership must match the user's role.
- Booking ownership must reference valid DJ and Client accounts.
- Booking times must be valid.
- Booking prices cannot be negative.
- Reviews must reference completed bookings.
- Ratings must be 1–5.
- A booking can have at most one review.
- Booking status changes must follow the documented lifecycle.

---

# 8. V1 Schema Boundary

These five application tables are the planned core V1 schema:

1. `users`
2. `dj_profiles`
3. `client_profiles`
4. `bookings`
5. `reviews`

Supabase's built-in `auth.users` is also used for authentication but is managed by Supabase Auth rather than treated as a normal HOVERBOARD application table.

Do not add new business tables merely because a future feature might eventually need them.

---

# 9. Step 2 Completion Criteria

Step 2 is complete when:

- [x] Core V1 tables are defined.
- [x] Columns and data types are defined.
- [x] Primary and foreign-key relationships are defined.
- [x] Core constraints are defined.
- [x] Booking statuses and transitions are defined.
- [x] Initial indexes are defined.
- [x] RLS requirements are defined.
- [x] Payment-data boundaries are defined.
- [x] The V1 schema boundary is documented.

The actual Supabase project, SQL migration, RLS policies, and database deployment belong to **Step 3 — Supabase Setup**.
