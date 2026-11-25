import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  countUnread,
  listNotifications,
  markAllRead,
  markRead,
  notificationText,
  subscribeToNotifications,
} from '../services/notificationService';
import { formatDateTime } from '../utils/format';

export default function NotificationBell() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(false);
  const wrapRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([listNotifications(8), countUnread()]);
      setItems(list);
      setUnread(count);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    refresh();
    return subscribeToNotifications(user.id, refresh);
  }, [user, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function openNotification(n) {
    setOpen(false);
    try {
      if (!n.is_read) await markRead(n.id);
    } catch {
      /* navigating is more important than the read flag */
    }
    refresh();
    if (n.complaint_id) navigate(`/complaints/${n.complaint_id}`);
  }

  async function readAll() {
    try {
      await markAllRead(user.id);
      await refresh();
    } catch {
      setError(true);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-navy-800 hover:bg-navy-50"
        aria-label={t('notif.bell', { count: unread })}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-navy-900">{t('notif.title')}</h2>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                {t('notif.markAll')}
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {error && <li className="px-4 py-6 text-center text-sm text-red-700">{t('err.loadFailed')}</li>}
            {!error && items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">{t('notif.empty')}</li>
            )}
            {items.map((n) => {
              const text = notificationText(n, t);
              return (
                <li key={n.id} className="border-b border-slate-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${n.is_read ? '' : 'bg-teal-50/50'}`}
                  >
                    <span className="flex items-start gap-2">
                      {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-label={t('notif.unread')} />}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy-900">{text.title}</span>
                        <span className="block text-sm text-slate-600">{text.message}</span>
                        <span className="mt-1 block text-xs text-slate-500">{formatDateTime(n.created_at, lang)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-teal-700 hover:bg-slate-50"
          >
            {t('notif.viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
