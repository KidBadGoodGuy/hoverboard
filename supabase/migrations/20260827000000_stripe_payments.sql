alter table public.bookings
  add column if not exists stripe_checkout_session_id text unique,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text not null default 'unpaid';

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'refunded', 'failed'));

create index if not exists bookings_payment_status_idx on public.bookings(payment_status);
create index if not exists bookings_stripe_payment_intent_idx on public.bookings(stripe_payment_intent_id);

create policy "bookings_client_start_payment" on public.bookings
  for select to authenticated
  using (auth.uid() = client_id);
