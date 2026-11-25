// Shown instead of the app when the Supabase environment variables are missing.
// Deliberately NOT translated through the language context (providers are not mounted yet).
export default function ConfigMissing() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold text-navy-900">CivicSathi is not configured yet</h1>
      <p className="mt-3 text-slate-700">
        The Supabase connection settings are missing. Create a <code className="rounded bg-slate-200 px-1">.env</code> file
        (see <code className="rounded bg-slate-200 px-1">.env.example</code>) with:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-navy-900 p-4 text-sm text-teal-200">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key`}
      </pre>
      <p className="mt-4 text-sm text-slate-600">
        Then restart the dev server (or set the same variables in Vercel and redeploy). The README explains the full setup,
        including the SQL migrations in <code className="rounded bg-slate-200 px-1">supabase/migrations</code>.
      </p>
    </div>
  );
}
