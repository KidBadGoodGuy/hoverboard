create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_name text;
begin
  v_role := case when new.raw_user_meta_data ->> 'role' = 'client' then 'client'::public.user_role else 'dj'::public.user_role end;
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'HOVERBOARD User');

  insert into public.users (id, email, role)
  values (new.id, coalesce(new.email, ''), v_role)
  on conflict (id) do nothing;

  if v_role = 'dj' then
    insert into public.dj_profiles (user_id, dj_name, price)
    values (new.id, v_name, 0)
    on conflict (user_id) do nothing;
  else
    insert into public.client_profiles (user_id, name)
    values (new.id, v_name)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
