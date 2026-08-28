create or replace function public.is_hoverboard_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_accounts a
    where a.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_hoverboard_admin() from public;
grant execute on function public.is_hoverboard_admin() to authenticated;

drop policy if exists "applications_dj_insert" on public.gig_applications;
create policy "applications_dj_insert"
on public.gig_applications
for insert
to authenticated
with check (
  dj_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.role::text = 'dj'
    )
    or (select public.is_hoverboard_admin())
  )
);
