-- CivicSathi - 008: make complaint-number generation independent of the caller's sequence privileges
--
-- Symptom: submitting a complaint from the Report Issue page fails with
--   "You do not have permission to do that."
--   (the app's translation of SQLSTATE 42501, see src/utils/errors.js).
--
-- Root cause: public.complaints_before_insert() (migration 002) is SECURITY INVOKER,
--   so when a citizen INSERTs a complaint the trigger calls nextval() AS the
--   `authenticated` role. Migration 007 already added the sequence grant; this
--   migration makes the fix self-contained and robust by running the trigger as its
--   owner (SECURITY DEFINER), the same pattern already used by complaints_after_insert().
--
-- The function only sets server-controlled fields (complaint_number, status,
-- admin_remarks, created_at, updated_at). It never reads or writes user data, so
-- SECURITY DEFINER is safe here.
-- ---------------------------------------------------------------------------

create or replace function public.complaints_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
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

-- Belt-and-suspenders: also keep the sequence usable by the authenticated role
-- (idempotent, harmless if migration 007 already ran).
grant usage, select on sequence public.complaint_number_seq to authenticated;

-- Ask PostgREST to re-read privileges so the change is effective immediately.
notify pgrst, 'reload schema';
