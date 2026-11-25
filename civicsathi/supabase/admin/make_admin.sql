-- Grant the admin role to an existing account.
--
-- HOW TO USE (project owner only):
--   1. Register normally in the app with the email you want to make admin.
--   2. Open Supabase Dashboard -> SQL Editor (this runs with owner privileges).
--   3. Replace the email below and run the statement.
--   4. Log out and log in again in the app.
--
-- This cannot be done from the app or the public API: a database trigger rejects any
-- attempt to change `role` coming through the API.

update public.profiles
   set role = 'admin'
 where email = 'REPLACE_WITH_ADMIN_EMAIL@example.com';

-- To remove admin rights again:
-- update public.profiles set role = 'citizen' where email = 'REPLACE_WITH_ADMIN_EMAIL@example.com';

-- To list current admins:
-- select id, full_name, email, created_at from public.profiles where role = 'admin';
