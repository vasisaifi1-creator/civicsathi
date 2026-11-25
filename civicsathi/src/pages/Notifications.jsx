import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  listNotifications,
  markAllRead,
  markRead,
  notificationText,
  subscribeToNotifications,
} from '../services/notificationService';
import { formatDateTime } from '../utils/format';
import { friendlyError } from '../utils/errors';

export default function Notifications() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await listNotifications(100));
      setError('');
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    return subscribeToNotifications(user.id, load);
  }, [load, user.id]);

  async function readOne(n) {
    if (n.is_read) return;
    try {
      await markRead(n.id);
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    } catch (e) {
      setError(friendlyError(e, t));
    }
  }

  async function readAll() {
    try {
      await markAllRead(user.id);
      setItems((list) => list.map((x) => ({ ...x, is_read: true })));
    } catch (e) {
      setError(friendlyError(e, t));
    }
  }

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{t('notif.title')}</h1>
        {hasUnread && (
          <button type="button" onClick={readAll} className="btn btn-outline">
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            {t('notif.markAll')}
          </button>
        )}
      </div>

      {loading && <PageLoader />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <div className="card">
          <EmptyState icon={Bell} title={t('notif.empty')} description={t('notif.emptyDesc')} />
        </div>
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {items.map((n) => {
            const text = notificationText(n, t);
            return (
              <li key={n.id} className={n.is_read ? '' : 'bg-teal-50/50'}>
                <div className="flex items-start gap-3 p-4">
                  {!n.is_read ? (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-600" aria-label={t('notif.unread')} />
                  ) : (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-900">{text.title}</p>
                    <p className="text-sm text-slate-700">{text.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(n.created_at, lang)}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold">
                      {n.complaint_id && (
                        <Link
                          to={`/complaints/${n.complaint_id}`}
                          onClick={() => readOne(n)}
                          className="text-teal-700 hover:underline"
                        >
                          {t('common.viewDetails')}
                        </Link>
                      )}
                      {!n.is_read && (
                        <button type="button" onClick={() => readOne(n)} className="text-navy-700 hover:underline">
                          {t('notif.markRead')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
