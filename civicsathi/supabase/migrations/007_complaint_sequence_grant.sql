-- CivicSathi - 007: fix complaint submission "permission denied for sequence"
--
-- Symptom: submitting a complaint from the Report Issue page fails with
--   "You do not have permission to do that."
--   (the app's translation of SQLSTATE 42501, see src/utils/errors.js).
--
-- Cause: public.complaints_before_insert() (migration 002) is SECURITY INVOKER
--   (the default). When a citizen INSERTs a complaint, the trigger runs
--   nextval('public.complaint_number_seq') AS the `authenticated` role. Migrations
--   001-006 never granted that sequence to `authenticated`, so PostgreSQL raises
--   "permission denied for sequence complaint_number_seq" (42501) and aborts the
--   insert. RLS and the insert policy in 003 are correct and unchanged.
--
-- Fix: grant the sequence only what the trigger needs (nextval / currval).
--   This does NOT disable RLS and does NOT let anyone change another user's row.
-- ---------------------------------------------------------------------------

grant usage, select on sequence public.complaint_number_seq to authenticated;

-- Ask PostgREST to re-read privileges so the grant is effective immediately.
notify pgrst, 'reload schema';
