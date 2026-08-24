# HOVERBOARD V1 Database Plan

HOVERBOARD V1 will use Supabase PostgreSQL.

## Main Tables

### users

Account-level information. Supabase Auth handles authentication.

Suggested fields:

- `id`
- `email`
- `role` (`dj` or `client`)
- `created_at`

### dj_profiles

DJ marketplace profile.

Suggested fields:

- `user_id`
- `dj_name`
- `profile_photo`
- `bio`
- `location`
- `genres`
- `price`
- `availability`
- `created_at`

### client_profiles

Client profile information.

Suggested fields:

- `user_id`
- `name`
- `profile_information`
- `created_at`

### bookings

Connects a client and DJ.

Suggested fields:

- `id`
- `dj_id`
- `client_id`
- `event_date`
- `start_time`
- `end_time`
- `location`
- `price`
- `status`
- `created_at`

Suggested statuses:

- `requested`
- `accepted`
- `declined`
- `paid`
- `confirmed`
- `completed`
- `cancelled`

### reviews

Review left by a client after a completed booking.

Suggested fields:

- `id`
- `booking_id`
- `dj_id`
- `client_id`
- `rating`
- `review`
- `created_at`

## Relationships

- One `users` record belongs to either a DJ or client role.
- A DJ has one DJ profile.
- A client has one client profile.
- A booking connects one DJ with one client.
- A review belongs to a completed booking and connects its DJ and client.

## Security

Supabase Row Level Security (RLS) should protect user data. Users should only be able to read or modify records they are authorized to access. Public DJ discovery should expose only intentionally public profile information.

Sensitive payment information must not be stored here. Stripe handles payment processing.

## Important Design Rule

This is the initial V1 plan, not the final schema. Before implementation, the schema should be reviewed for constraints, indexes, foreign keys, timestamps, status transitions, and RLS policies.
