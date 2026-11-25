import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Clock, Inbox, Loader2, Search, XCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import Pagination from '../components/Pagination';
import { BarList, StatusDonut, TrendChart } from '../components/Charts';
import { EmptyState, ErrorState, PageLoader } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { adminListComplaints, getAdminStats } from '../services/complaintService';
import { CATEGORIES, STATUSES } from '../utils/constants';
import { friendlyError } from '../utils/errors';

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const { t } = useLanguage();

  // overview
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);

  // table
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      setStats(await getAdminStats());
    } catch (e) {
      setStatsError(friendlyError(e, t));
    } finally {
      setStatsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // debounce the search box
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminListComplaints({ search: debounced, status, category, page, pageSize: PAGE_SIZE });
      setRows(result.rows);
      setTotal(result.total);
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setLoading(false);
    }
  }, [debounced, status, category, page, t]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const categoryItems = (stats?.by_category ?? []).map((c) => ({
    key: c.category,
    label: t(`cat.${c.category}`),
    value: c.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{t('admin.title')}</h1>
        <p className="mt-1 text-slate-600">{t('admin.sub')}</p>
      </div>

      {statsError ? (
        <ErrorState message={statsError} onRetry={loadStats} />
      ) : (
        <>
          <section aria-label={t('admin.overview')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={ClipboardList} tone="navy" label={t('admin.total')} value={stats?.total} loading={statsLoading} />
            <StatCard icon={Clock} tone="amber" label={t('dash.pending')} value={stats?.pending} loading={statsLoading} />
            <StatCard icon={Loader2} tone="blue" label={t('dash.in_progress')} value={stats?.in_progress} loading={statsLoading} />
            <StatCard icon={CheckCircle2} tone="green" label={t('dash.resolved')} value={stats?.resolved} loading={statsLoading} />
            <StatCard icon={XCircle} tone="red" label={t('admin.rejected')} value={stats?.rejected} loading={statsLoading} />
          </section>

          <section className="grid gap-6 lg:grid-cols-3" aria-label={t('admin.charts')}>
            <div className="card p-5">
              <h2 className="mb-4 text-base font-semibold text-navy-900">{t('admin.byCategory')}</h2>
              {statsLoading ? (
                <PageLoader />
              ) : categoryItems.length === 0 ? (
                <p className="text-sm text-slate-600">{t('admin.noData')}</p>
              ) : (
                <BarList items={categoryItems} label={t('admin.byCategory')} />
              )}
            </div>
            <div className="card p-5">
              <h2 className="mb-4 text-base font-semibold text-navy-900">{t('admin.byStatus')}</h2>
              {statsLoading ? <PageLoader /> : <StatusDonut counts={stats ?? {}} label={t('admin.byStatus')} />}
            </div>
            <div className="card p-5">
              <h2 className="mb-4 text-base font-semibold text-navy-900">{t('admin.monthly')}</h2>
              {statsLoading ? <PageLoader /> : <TrendChart items={stats?.monthly ?? []} label={t('admin.monthly')} />}
            </div>
          </section>
        </>
      )}

      <section className="card overflow-hidden" aria-labelledby="manage-title">
        <div className="space-y-4 border-b border-slate-100 p-5">
          <h2 id="manage-title" className="text-lg font-semibold text-navy-900">
            {t('admin.complaints')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="a-search" className="label">{t('admin.search')}</label>
              <input
                id="a-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.searchPh')}
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="a-status" className="label">{t('dash.filterStatus')}</label>
              <select
                id="a-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="input-base"
              >
                <option value="">{t('dash.allStatuses')}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="a-category" className="label">{t('dash.filterCategory')}</label>
              <select
                id="a-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="input-base"
              >
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
            <ErrorState message={error} onRetry={loadRows} />
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            icon={debounced || status || category ? Search : Inbox}
            title={debounced || status || category ? t('common.noResults') : t('admin.empty')}
            description={debounced || status || category ? t('dash.emptyFiltered') : undefined}
          />
        )}
        {!loading && !error && rows.length > 0 && (
          <>
            <ComplaintTable complaints={rows} showCitizen actionLabel={t('admin.manage')} caption={t('admin.complaints')} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
