create type public.user_role as enum ('dj', 'client');
create type public.booking_status as enum ('requested', 'accepted', 'declined', 'paid', 'confirmed', 'completed', 'cancelled');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.dj_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  dj_name text not null,
  profile_photo text,
  bio text,
  location text,
  genres text[] not null default '{}',
  price numeric(10,2) not null check (price >= 0),
  availability jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.client_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  name text not null,
  profile_information text,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  dj_id uuid not null references public.users(id) on delete restrict,
  client_id uuid not null references public.users(id) on delete restrict,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  price numeric(10,2) not null check (price >= 0),
  status public.booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (dj_id <> client_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  dj_id uuid not null references public.users(id) on delete restrict,
  client_id uuid not null references public.users(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now()
);

create index bookings_dj_id_idx on public.bookings(dj_id);
create index bookings_client_id_idx on public.bookings(client_id);
create index bookings_event_date_idx on public.bookings(event_date);
create index bookings_status_idx on public.bookings(status);
create index reviews_dj_id_idx on public.reviews(dj_id);

alter table public.users enable row level security;
alter table public.dj_profiles enable row level security;
alter table public.client_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

create policy "users_select_own" on public.users for select to authenticated using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert to authenticated with check (auth.uid() = id);
create policy "users_update_own" on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "dj_profiles_public_select" on public.dj_profiles for select to anon, authenticated using (true);
create policy "dj_profiles_insert_own" on public.dj_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "dj_profiles_update_own" on public.dj_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dj_profiles_delete_own" on public.dj_profiles for delete to authenticated using (auth.uid() = user_id);

create policy "client_profiles_own_select" on public.client_profiles for select to authenticated using (auth.uid() = user_id);
create policy "client_profiles_insert_own" on public.client_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "client_profiles_update_own" on public.client_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "client_profiles_delete_own" on public.client_profiles for delete to authenticated using (auth.uid() = user_id);

create policy "bookings_participant_select" on public.bookings for select to authenticated using (auth.uid() = dj_id or auth.uid() = client_id);
create policy "bookings_client_insert" on public.bookings for insert to authenticated with check (auth.uid() = client_id and status = 'requested');
create policy "bookings_dj_update" on public.bookings for update to authenticated using (auth.uid() = dj_id) with check (auth.uid() = dj_id);
create policy "bookings_client_cancel" on public.bookings for update to authenticated using (auth.uid() = client_id) with check (auth.uid() = client_id);

create policy "reviews_participants_select" on public.reviews for select to anon, authenticated using (true);
create policy "reviews_client_insert" on public.reviews for insert to authenticated with check (auth.uid() = client_id);
create policy "reviews_client_update" on public.reviews for update to authenticated using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "reviews_client_delete" on public.reviews for delete to authenticated using (auth.uid() = client_id);
