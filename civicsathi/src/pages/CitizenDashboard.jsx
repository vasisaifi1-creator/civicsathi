import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Clock, FilePlus2, Inbox, Loader2, Search, User } from 'lucide-react';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import { EmptyState, ErrorState, PageLoader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getRecentActivity, listMyComplaints } from '../services/complaintService';
import { CATEGORIES, STATUSES } from '../utils/constants';
import { formatDateTime } from '../utils/format';
import { friendlyError } from '../utils/errors';
import { STATUS_STYLE } from '../components/StatusBadge';

export default function CitizenDashboard() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, recent] = await Promise.all([listMyComplaints(user.id), getRecentActivity(6)]);
      setComplaints(list);
      setActivity(recent);
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setLoading(false);
    }
  }, [user.id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'pending').length,
      in_progress: complaints.filter((c) => c.status === 'in_progress').length,
      resolved: complaints.filter((c) => c.status === 'resolved').length,
    }),
    [complaints]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter(
      (c) =>
        (!q || c.complaint_number.toLowerCase().includes(q)) &&
        (!status || c.status === status) &&
        (!category || c.category === category)
    );
  }, [complaints, search, status, category]);

  const firstName = (profile?.full_name || '').split(' ')[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">
          {t('dash.welcome', { name: firstName || t('dash.citizen') })}
        </h1>
        <p className="mt-1 text-slate-600">{t('dash.subtitle')}</p>
      </div>

      <section aria-label={t('dash.summary')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} tone="navy" label={t('dash.total')} value={counts.total} loading={loading} />
        <StatCard icon={Clock} tone="amber" label={t('dash.pending')} value={counts.pending} loading={loading} />
        <StatCard icon={Loader2} tone="blue" label={t('dash.in_progress')} value={counts.in_progress} loading={loading} />
        <StatCard icon={CheckCircle2} tone="green" label={t('dash.resolved')} value={counts.resolved} loading={loading} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5" aria-labelledby="quick-title">
          <h2 id="quick-title" className="text-base font-semibold text-navy-900">
            {t('dash.quick')}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/report" className="btn btn-teal justify-start">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              {t('dash.reportNew')}
            </Link>
            <Link to="/track" className="btn btn-outline justify-start">
              <Search className="h-4 w-4" aria-hidden="true" />
              {t('dash.trackComplaint')}
            </Link>
            <Link to="/profile" className="btn btn-outline justify-start">
              <User className="h-4 w-4" aria-hidden="true" />
              {t('dash.viewProfile')}
            </Link>
          </div>
        </section>

        <section className="card p-5 lg:col-span-2" aria-labelledby="recent-title">
          <h2 id="recent-title" className="text-base font-semibold text-navy-900">
            {t('dash.recent')}
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">{t('common.loading')}</p>
          ) : activity.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">{t('dash.noRecent')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: STATUS_STYLE[a.new_status]?.color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <Link to={`/complaints/${a.complaint_id}`} className="font-semibold text-navy-900 hover:underline">
                      {a.complaints?.complaint_number}
                    </Link>
                    <span className="text-slate-700">
                      {' – '}
                      {a.old_status
                        ? t('timeline.changed', { from: t(`status.${a.old_status}`), to: t(`status.${a.new_status}`) })
                        : t('timeline.submitted')}
                    </span>
                    <p className="text-xs text-slate-500">{formatDateTime(a.created_at, lang)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card overflow-hidden" aria-labelledby="my-title">
        <div className="space-y-4 border-b border-slate-100 p-5">
          <h2 id="my-title" className="text-lg font-semibold text-navy-900">
            {t('dash.myComplaints')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="f-search" className="label">{t('dash.search')}</label>
              <input
                id="f-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="CS-2026-000001"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="f-status" className="label">{t('dash.filterStatus')}</label>
              <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)} className="input-base">
                <option value="">{t('dash.allStatuses')}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-category" className="label">{t('dash.filterCategory')}</label>
              <select id="f-category" value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
                <option value="">{t('dash.allCategories')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`cat.${c}`)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <PageLoader />}
        {!loading && error && (
          <div className="p-5">
            <ErrorState message={error} onRetry={load} />
          </div>
        )}
        {!loading && !error && complaints.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={t('dash.empty.title')}
            description={t('dash.empty.desc')}
            action={
              <Link to="/report" className="btn btn-teal">
                {t('dash.reportNew')}
              </Link>
            }
          />
        )}
        {!loading && !error && complaints.length > 0 && filtered.length === 0 && (
          <EmptyState icon={Search} title={t('common.noResults')} description={t('dash.emptyFiltered')} />
        )}
        {!loading && !error && filtered.length > 0 && (
          <ComplaintTable complaints={filtered} caption={t('dash.myComplaints')} />
        )}
      </section>
    </div>
  );
}
