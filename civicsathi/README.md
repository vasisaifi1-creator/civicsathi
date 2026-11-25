# CivicSathi

**Report Problems. Track Progress. Build Better Cities.**

CivicSathi is a bilingual (English / हिन्दी) civic issue reporting platform built for
**HackNova 2026 – Build for Bharat, Track 5: Smarter Cities and Civic Infrastructure**.
Citizens report potholes, garbage, broken streetlights, water leakage and drainage problems with a photo and
location, then track the status. Administrators manage and resolve complaints from a protected dashboard.

> **Prototype notice:** CivicSathi is a management prototype. Complaints are **not** delivered to any municipal
> authority unless an authorised integration is built. The app never claims otherwise.

## Features

| Area | What works |
| --- | --- |
| Public site | Landing page, categories, how it works, **live statistics from the database**, About, Contact, Privacy, Terms |
| Auth | Register, login, logout, forgot / reset password, profile page, protected routes |
| Citizen | Dashboard with counts, searchable / filterable complaint list, recent activity, quick actions |
| Reporting | Validated form, photo preview / replace / remove, real upload progress, optional GPS (only after explicit click), readable ID such as `CS-2026-000042`, success page |
| Tracking | Search by complaint ID (owner or admin only), status stepper, full status history timeline |
| Admin | Stat cards, charts (by category, by status, monthly trend), searchable table, details + photo, change status, remarks, mandatory reason for rejection |
| Notifications | Stored in Supabase, live bell icon (Realtime), list page, mark read |
| i18n | English + Hindi, switcher in the navbar, remembered between visits (310 keys, verified identical in both) |
| Accessibility / low-end | Skip link, keyboard focus styles, 44px touch targets, reduced-motion support, system fonts, no heavy libraries (charts are plain SVG/CSS) |

## Tech stack

React 18 · Vite 5 · JavaScript · Tailwind CSS 3 · React Router 6 · Lucide icons ·
Supabase (Auth, PostgreSQL, Storage, Realtime) · Vercel

## Security model

* Only the public **anon** key is used in the browser. **Never** add a `service_role` key to this project.
* Row Level Security is enabled on every table; all privileges are revoked and then granted per column.
* Registration always creates a `citizen`. The role comes from a database trigger and ignores anything the client sends.
* A trigger rejects any attempt to change `role`, `email` or `id` through the API, so nobody can promote themselves.
  Admins are assigned only from the Supabase SQL editor (see below).
* Citizens can read and create only their own complaints. They have no UPDATE / DELETE rights on complaints.
* Status changes happen only through the `admin_update_complaint_status()` database function, which checks
  the caller is an admin and writes the complaint update, the history row and the notification in one transaction.
* Complaint photos live in a **private** bucket, in a folder named after the user's id, 5 MB limit, JPEG / PNG / WebP only.
  They are shown through 1-hour signed URLs, and only to the owner or an admin.
* Landing-page statistics come from `get_public_stats()` which returns aggregate counts only.

## Getting started

Requirements: Node.js 18+ and a free [Supabase](https://supabase.com) project.

```bash
npm install
cp .env.example .env      # then fill in the two values below
npm run dev               # http://localhost:5173
```

`.env` (Supabase Dashboard → Project Settings → API):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

If these are missing the app shows a clear setup screen instead of failing silently.

## Database setup

Run the files in `supabase/migrations/` **in order** in Supabase Dashboard → SQL Editor
(or with `supabase db push` if you use the Supabase CLI):

| File | Purpose |
| --- | --- |
| `001_schema.sql` | Tables, constraints, indexes |
| `002_functions_triggers.sql` | Profile-on-signup, complaint number, history, notifications, admin RPC, stats |
| `003_rls_policies.sql` | Row Level Security, grants, Realtime |
| `004_storage.sql` | Private `complaint-images` bucket + storage policies |
| `005_demo_seed.sql` | **Optional** demo complaints (Meerut pothole, garbage, streetlight, water leak, drain) |
| `006_ensure_profile.sql` | Heals missing `profiles` rows (one-time backfill + `ensure_profile()` RPC) |

Then in Authentication → URL Configuration set the **Site URL** to your deployed URL and add
`http://localhost:5173` and `https://YOUR-APP.vercel.app/**` to the redirect URLs
(needed for the password reset and email confirmation links).
For a quick demo you may turn off "Confirm email" under Authentication → Providers → Email.

## Admin setup

There is no default admin and no hard-coded credentials.

1. Register normally in the app with the email that should be the admin.
2. Open Supabase Dashboard → SQL Editor and run (edit the email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   (also saved in `supabase/admin/make_admin.sql`)
3. Log out and log in again. The sidebar now shows the **Admin Dashboard** and `/admin` becomes available
   (citizens who open `/admin` are redirected to their own dashboard).

The SQL editor runs with owner rights, which is the only place a role can be changed.

## Demo data (optional)

1. Register a citizen account in the app.
2. Run `005_demo_seed.sql`. It attaches five realistic complaints (some with history) to the oldest citizen account.
3. Remove later with `delete from public.complaints where title like '[Demo]%';`

## Deploy to Vercel

1. Push the repository to GitHub (`.env` is git-ignored; only `.env.example` is committed).
2. Vercel → New Project → import the repo. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. `vercel.json` already contains the SPA fallback (so `/dashboard` etc. work on refresh) and security headers.
5. Add the Vercel URL to Supabase redirect URLs (see Database setup).

## Test checklist (run before the demo)

1. Register a citizen → profile row exists, role is `citizen`.
2. Log in / log out. Visiting `/dashboard` while logged out redirects to login.
3. Report a complaint with a photo → progress bar, success page shows `CS-YYYY-NNNNNN`, status Pending, notification appears.
4. Try an invalid file (PDF, > 5 MB) and empty fields → clear validation errors.
5. Track the complaint by ID. Open it with a **second** citizen account → shown as "not found" (privacy).
6. Make an admin (see above). Open `/admin` → stats and charts show the data. A citizen opening `/admin` is redirected.
7. Change status to In Progress, then Resolved; try Reject without a reason → blocked.
8. As the citizen: status, history timeline and notifications updated (bell updates live).
9. Switch to Hindi and back; resize to phone width and check the menu, form and tables.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check:i18n` | Verify every translation key exists in English **and** Hindi |

## Project structure

```
src/
  components/   Navbar, Sidebar, Footer, StatCard, StatusBadge, ComplaintCard, Charts, ProtectedRoute, ...
  pages/        Home, Login, Register, CitizenDashboard, AdminDashboard, ReportComplaint,
                TrackComplaint, ComplaintDetails, Profile, Notifications, legal pages, NotFound
  context/      AuthContext, LanguageContext
  services/     supabase, complaintService, notificationService
  i18n/         translations (English + Hindi)
  utils/        constants, validators, formatters, error mapping
supabase/
  migrations/   001 – 005 SQL
  admin/        make_admin.sql
```

## License

Created for HackNova 2026. Add a license of your choice before publishing.
