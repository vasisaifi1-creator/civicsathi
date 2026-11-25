-- CivicSathi - 003: Row Level Security, grants

alter table public.profiles          enable row level security;
alter table public.complaints        enable row level security;
alter table public.complaint_history enable row level security;
alter table public.notifications     enable row level security;

-- Start from zero privileges, then grant only what the app needs.
revoke all on public.profiles          from anon, authenticated;
revoke all on public.complaints        from anon, authenticated;
revoke all on public.complaint_history from anon, authenticated;
revoke all on public.notifications     from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles: read own (admins read all). Update only name + phone of your own row.
-- No INSERT policy: profiles are created only by the auth trigger.
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (full_name, phone_number) on public.profiles to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- complaints: citizens read/create their own; admins read all.
-- No UPDATE / DELETE policy: status changes go through admin_update_complaint_status().
-- ---------------------------------------------------------------------------
grant select on public.complaints to authenticated;
grant insert (user_id, title, description, category, image_url, state, city, locality, latitude, longitude)
  on public.complaints to authenticated;

drop policy if exists "complaints_select_own_or_admin" on public.complaints;
create policy "complaints_select_own_or_admin" on public.complaints
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "complaints_insert_own" on public.complaints;
create policy "complaints_insert_own" on public.complaints
  for insert to authenticated
  with check (
    user_id = auth.uid()
    -- a photo path must live inside the uploader's own folder
    and (image_url is null or image_url like (auth.uid()::text || '/%'))
  );

-- ---------------------------------------------------------------------------
-- complaint_history: read-only for the complaint's owner and admins.
-- Rows are written only by trusted trigger / function code.
-- ---------------------------------------------------------------------------
grant select on public.complaint_history to authenticated;

drop policy if exists "history_select_owner_or_admin" on public.complaint_history;
create policy "history_select_owner_or_admin" on public.complaint_history
  for select to authenticated
  using (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_history.complaint_id
        and (c.user_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- notifications: users read their own and may only flip is_read on them.
-- ---------------------------------------------------------------------------
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Function execution rights
-- ---------------------------------------------------------------------------
revoke execute on function public.admin_update_complaint_status(uuid, text, text) from public, anon;
revoke execute on function public.admin_dashboard_stats() from public, anon;
revoke execute on function public.get_public_stats() from public;
revoke execute on function public.is_admin() from public, anon;

grant execute on function public.admin_update_complaint_status(uuid, text, text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.is_admin() to authenticated;
-- the landing page statistics are intentionally public (aggregate counts only)
grant execute on function public.get_public_stats() to anon, authenticated;

-- Trigger functions are never called directly by clients
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.complaints_after_insert() from public, anon, authenticated;
revoke execute on function public.complaints_before_insert() from public, anon, authenticated;
revoke execute on function public.protect_profile_fields() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Live notification updates (bell icon) via Supabase Realtime
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
