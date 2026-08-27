-- Rebuild of the Stripe payment database layer.
-- This migration is intentionally idempotent so it can safely follow earlier attempts.

alter table public.bookings
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text not null default 'unpaid';

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'refunded', 'failed'));

create unique index if not exists bookings_stripe_checkout_session_id_uidx
  on public.bookings(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists bookings_payment_status_idx
  on public.bookings(payment_status);

create index if not exists bookings_stripe_payment_intent_idx
  on public.bookings(stripe_payment_intent_id);

alter table public.bookings enable row level security;

-- Clients may read their own bookings so the payment flow can verify ownership.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'bookings_client_start_payment'
  ) then
    create policy "bookings_client_start_payment"
      on public.bookings
      for select
      to authenticated
      using (auth.uid() = client_id);
  end if;
end
$$;
