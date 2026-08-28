alter table public.gig_applications add column if not exists direction text not null default 'dj_offer';

alter table public.gig_applications drop constraint if exists gig_applications_status_check;
alter table public.gig_applications add constraint gig_applications_status_check check (status in ('pending','accepted','rejected','withdrawn'));
alter table public.gig_applications drop constraint if exists gig_applications_direction_check;
alter table public.gig_applications add constraint gig_applications_direction_check check (direction in ('dj_offer','client_request'));
create index if not exists gig_applications_dj_direction_status_idx on public.gig_applications(dj_id, direction, status);
create index if not exists gig_applications_gig_direction_status_idx on public.gig_applications(gig_id, direction, status);

create table if not exists public.gig_messages (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index if not exists gig_messages_gig_created_idx on public.gig_messages(gig_id, created_at);
create index if not exists gig_messages_participants_idx on public.gig_messages(sender_id, recipient_id, created_at);

alter table public.gig_messages enable row level security;
drop policy if exists gig_messages_select_participant on public.gig_messages;
create policy gig_messages_select_participant on public.gig_messages for select to authenticated using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists gig_messages_insert_participant on public.gig_messages;
create policy gig_messages_insert_participant on public.gig_messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and (
    exists (
      select 1 from public.gigs g
      where g.id = gig_messages.gig_id
        and g.client_id = auth.uid()
        and exists (select 1 from public.gig_applications ga where ga.gig_id = g.id and ga.dj_id = gig_messages.recipient_id)
    )
    or exists (
      select 1 from public.gig_applications ga
      join public.gigs g on g.id = ga.gig_id
      where ga.gig_id = gig_messages.gig_id and ga.dj_id = auth.uid() and g.client_id = gig_messages.recipient_id
    )
  )
);
drop policy if exists gig_messages_delete_sender on public.gig_messages;
create policy gig_messages_delete_sender on public.gig_messages for delete to authenticated using (auth.uid() = sender_id);

create or replace function public.accept_gig_application(p_application_id uuid)
returns table (booking_id uuid, gig_id uuid, client_id uuid, dj_id uuid, client_email text, dj_email text, title text, event_date date, start_time time, end_time time, location text, price numeric, direction text)
language plpgsql security definer set search_path = public
as $$
declare app public.gig_applications%rowtype; gig public.gigs%rowtype; new_booking uuid;
begin
  select * into app from public.gig_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into gig from public.gigs where id = app.gig_id for update;
  if not found then raise exception 'Gig not found'; end if;
  if app.status <> 'pending' then raise exception 'This request is no longer pending'; end if;
  if app.direction = 'dj_offer' and gig.client_id <> auth.uid() then raise exception 'Only the client can accept this DJ offer'; end if;
  if app.direction = 'client_request' and app.dj_id <> auth.uid() then raise exception 'Only the requested DJ can accept this request'; end if;
  if gig.status <> 'open' then raise exception 'This gig is no longer open'; end if;
  insert into public.bookings (dj_id, client_id, event_date, start_time, end_time, location, price, status)
  values (app.dj_id, gig.client_id, gig.event_date, gig.start_time, gig.end_time, gig.location, coalesce(app.proposed_rate, gig.budget_max, gig.budget_min, 0), 'accepted') returning id into new_booking;
  update public.gig_applications set status = 'accepted', updated_at = now() where id = app.id;
  update public.gig_applications set status = 'rejected', updated_at = now() where gig_id = app.gig_id and id <> app.id and status = 'pending';
  update public.gigs set status = 'booked', updated_at = now() where id = gig.id;
  return query select new_booking, gig.id, gig.client_id, app.dj_id, client.email, dj.email, gig.title, gig.event_date, gig.start_time, gig.end_time, gig.location, coalesce(app.proposed_rate, gig.budget_max, gig.budget_min, 0), app.direction from public.users client, public.users dj where client.id = gig.client_id and dj.id = app.dj_id;
end;
$$;
grant execute on function public.accept_gig_application(uuid) to authenticated;
