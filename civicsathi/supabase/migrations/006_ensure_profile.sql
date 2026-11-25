-- CivicSathi - 006: heal missing profile rows
--
-- Symptom: "/dashboard" shows "Your profile could not be loaded."
-- Cause:   profiles is normally created by the on_auth_user_created trigger (002).
--           Accounts that signed up BEFORE that trigger existed — or whose insert
--           failed — have no public.profiles row, so the app's SELECT returns null.
--
-- Fix:      (1) a SECURITY DEFINER RPC that creates the CALLER'S OWN profile if it is
--           missing, and (2) a one-time backfill for existing auth.users.
--
-- Run this file in Supabase Dashboard -> SQL Editor after 001, 002 and 003.

-- ---------------------------------------------------------------------------
-- 1) RPC: ensure the authenticated user's profile exists and return it.
--    Always role 'citizen'. Only ever acts on auth.uid(), so it cannot be abused
--    to create or read anyone else's profile.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_profile(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_meta    jsonb;
  v_email   text;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select raw_user_meta_data, email
    into v_meta, v_email
    from auth.users
   where id = auth.uid();

  insert into public.profiles (id, full_name, email, role)
  values (
    auth.uid(),
    coalesce(left(coalesce(v_meta ->> 'full_name', ''), 100), ''),
    coalesce(v_email, ''),
    'citizen'
  )
  on conflict (id) do nothing;

  select * into v_profile from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profile could not be created' using errcode = 'P0002';
  end if;

  return v_profile;
end;
$$;

revoke all on function public.ensure_profile(uuid) from public, anon;
grant execute on function public.ensure_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) One-time backfill: create a profile for every auth.user that lacks one.
--    Runs with SQL Editor (owner) privileges. Idempotent, so safe to re-run.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, full_name, email, role)
select u.id,
       coalesce(left(u.raw_user_meta_data ->> 'full_name', 100), ''),
       coalesce(u.email, ''),
       'citizen'
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null
on conflict (id) do nothing;

-- Refresh PostgREST's schema cache so the new RPC is immediately callable.
notify pgrst, 'reload schema';
