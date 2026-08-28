alter table public.dj_profiles add column if not exists stripe_connect_account_id text;
create unique index if not exists dj_profiles_stripe_connect_account_uidx on public.dj_profiles(stripe_connect_account_id) where stripe_connect_account_id is not null;
alter table public.bookings add column if not exists stripe_transfer_id text;
create index if not exists bookings_stripe_transfer_idx on public.bookings(stripe_transfer_id);
