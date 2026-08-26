-- Step 10: Booking confirmation foundation.
-- Accepted bookings are payment-ready. Stripe/payment transitions remain Step 11.

-- A client may create an accepted booking when accepting a DJ application.
drop policy if exists "bookings_client_insert" on public.bookings;
create policy "bookings_client_insert" on public.bookings
for insert to authenticated
with check (
  auth.uid() = client_id
  and status in ('requested', 'accepted')
);

-- Participants can cancel their booking; DJs can advance an accepted booking
-- to payment-ready/paid/confirmed/completed as later payment and completion
-- flows are introduced. The app currently only uses accepted here.
drop policy if exists "bookings_dj_update" on public.bookings;
create policy "bookings_dj_update" on public.bookings
for update to authenticated
using (auth.uid() = dj_id)
with check (auth.uid() = dj_id);

-- Keep the existing participant SELECT policy; it powers upcoming-booking views.
