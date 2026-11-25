-- CivicSathi - 002: functions and triggers

-- ---------------------------------------------------------------------------
-- Helper: is the current API user an admin? (SECURITY DEFINER so RLS policies can call it
-- without recursing into the profiles policies.)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New auth user -> profile. The role is ALWAYS 'citizen'. Nothing the client sends
-- (including user metadata) can influence the role.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 100), ''),
    coalesce(new.email, ''),
    'citizen'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Block privilege escalation: through the API (auth.uid() is not null) nobody can change
-- role, email or id on a profile. The project owner can still change a role from the
-- Supabase SQL editor (auth.uid() is null there). See supabase/admin/make_admin.sql.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and (
       new.role  is distinct from old.role
    or new.email is distinct from old.email
    or new.id    is distinct from old.id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'role, email and id cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- Complaints: force server-controlled fields on insert
-- ---------------------------------------------------------------------------
create or replace function public.complaints_before_insert()
returns trigger
language plpgsql
as $$
begin
  new.complaint_number := 'CS-'
    || to_char(now() at time zone 'Asia/Kolkata', 'YYYY')
    || '-'
    || lpad(nextval('public.complaint_number_seq')::text, 6, '0');
  new.status        := 'pending';
  new.admin_remarks := null;
  new.created_at    := now();
  new.updated_at    := now();
  return new;
end;
$$;

drop trigger if exists complaints_before_insert on public.complaints;
create trigger complaints_before_insert
  before insert on public.complaints
  for each row execute function public.complaints_before_insert();

-- After a complaint is created: write the first history row and notify the citizen.
-- SECURITY DEFINER because clients have no INSERT rights on these two tables.
create or replace function public.complaints_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
  values (new.id, null, 'pending', 'Complaint submitted', new.user_id);

  insert into public.notifications (user_id, complaint_id, type, title, message)
  values (
    new.user_id, new.id, 'submitted',
    'Complaint submitted',
    'Your complaint ' || new.complaint_number || ' was submitted and is now pending review.'
  );
  return new;
end;
$$;

drop trigger if exists complaints_after_insert on public.complaints;
create trigger complaints_after_insert
  after insert on public.complaints
  for each row execute function public.complaints_after_insert();

-- ---------------------------------------------------------------------------
-- Admin: change a complaint's status. This is the ONLY way a status can change.
-- It verifies the caller is an admin, updates the complaint, writes the history row
-- and notifies the citizen - all in one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_complaint_status(
  p_complaint_id uuid,
  p_new_status   text,
  p_remarks      text default null
)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     public.complaints;
  v_old     text;
  v_remarks text := nullif(btrim(coalesce(p_remarks, '')), '');
  v_title   text;
  v_message text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_new_status is null or p_new_status not in ('pending', 'in_progress', 'resolved', 'rejected') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;

  if v_remarks is not null and char_length(v_remarks) > 1000 then
    raise exception 'Remarks are too long (max 1000 characters)' using errcode = '22023';
  end if;

  select * into v_row from public.complaints where id = p_complaint_id for update;
  if not found then
    raise exception 'Complaint not found' using errcode = 'P0002';
  end if;

  v_old := v_row.status;
  if v_old = p_new_status then
    raise exception 'Complaint already has this status' using errcode = '22023';
  end if;

  if p_new_status = 'rejected' and v_remarks is null then
    raise exception 'A reason is required to reject a complaint' using errcode = '22023';
  end if;

  update public.complaints
     set status = p_new_status,
         admin_remarks = v_remarks
   where id = p_complaint_id
   returning * into v_row;

  insert into public.complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
  values (p_complaint_id, v_old, p_new_status, v_remarks, auth.uid());

  v_title := case p_new_status
    when 'in_progress' then 'Complaint in progress'
    when 'resolved'    then 'Complaint resolved'
    when 'rejected'    then 'Complaint rejected'
    else 'Complaint moved back to pending'
  end;

  v_message := 'Your complaint ' || v_row.complaint_number || case p_new_status
    when 'in_progress' then ' is now being worked on.'
    when 'resolved'    then ' has been marked as resolved.'
    when 'rejected'    then ' was rejected.'
    else ' was moved back to pending review.'
  end;

  if v_remarks is not null then
    v_message := v_message || ' Remarks: ' || v_remarks;
  end if;

  insert into public.notifications (user_id, complaint_id, type, title, message)
  values (v_row.user_id, v_row.id, p_new_status, v_title, v_message);

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public statistics for the landing page: aggregate counts only, no personal data.
-- ---------------------------------------------------------------------------
create or replace function public.get_public_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total',       count(*),
    'pending',     count(*) filter (where status = 'pending'),
    'in_progress', count(*) filter (where status = 'in_progress'),
    'resolved',    count(*) filter (where status = 'resolved'),
    'rejected',    count(*) filter (where status = 'rejected')
  )
  from public.complaints;
$$;

-- ---------------------------------------------------------------------------
-- Admin dashboard statistics (admins only)
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_totals   jsonb;
  v_category jsonb;
  v_monthly  jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total',       count(*),
    'pending',     count(*) filter (where status = 'pending'),
    'in_progress', count(*) filter (where status = 'in_progress'),
    'resolved',    count(*) filter (where status = 'resolved'),
    'rejected',    count(*) filter (where status = 'rejected')
  ) into v_totals
  from public.complaints;

  select coalesce(jsonb_agg(jsonb_build_object('category', category, 'count', n) order by n desc), '[]'::jsonb)
    into v_category
  from (select category, count(*) as n from public.complaints group by category) s;

  select coalesce(jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'count', coalesce(c.n, 0)) order by m), '[]'::jsonb)
    into v_monthly
  from generate_series(
         date_trunc('month', now()) - interval '5 months',
         date_trunc('month', now()),
         interval '1 month') as m
  left join (
    select date_trunc('month', created_at) as mm, count(*) as n
    from public.complaints group by 1
  ) c on c.mm = m;

  return v_totals || jsonb_build_object('by_category', v_category, 'monthly', v_monthly);
end;
$$;
