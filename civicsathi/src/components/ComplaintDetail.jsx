import { useCallback, useEffect, useState } from 'react';
import { ImageOff, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import StatusTimeline, { StatusStepper } from './StatusTimeline';
import AdminActionPanel from './AdminActionPanel';
import { Alert, Spinner } from './ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getComplaintHistory, getImageUrl } from '../services/complaintService';
import { formatDateTime, fullLocation, mapLink } from '../utils/format';
import { friendlyError } from '../utils/errors';

function Row({ label, children }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-navy-900 sm:col-span-2">{children}</dd>
    </div>
  );
}

// Shared by "Track complaint" (search by ID) and the complaint details page.
export default function ComplaintDetail({ complaint, onChanged }) {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageState, setImageState] = useState(complaint.image_url ? 'loading' : 'none');

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      setHistory(await getComplaintHistory(complaint.id));
    } catch (e) {
      setHistoryError(friendlyError(e, t));
    } finally {
      setHistoryLoading(false);
    }
  }, [complaint.id, t]);

  // reload the timeline whenever the complaint changes (e.g. admin updated the status)
  useEffect(() => {
    loadHistory();
  }, [loadHistory, complaint.updated_at]);

  useEffect(() => {
    let active = true;
    if (!complaint.image_url) {
      setImageUrl(null);
      setImageState('none');
      return undefined;
    }
    setImageState('loading');
    getImageUrl(complaint.image_url)
      .then((url) => {
        if (!active) return;
        setImageUrl(url);
        setImageState('ready');
      })
      .catch(() => active && setImageState('error'));
    return () => {
      active = false;
    };
  }, [complaint.image_url]);

  const hasCoords = complaint.latitude != null && complaint.longitude != null;

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6" aria-labelledby="complaint-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-teal-700">{complaint.complaint_number}</p>
            <h1 id="complaint-title" className="mt-1 break-words text-xl font-bold text-navy-900 sm:text-2xl">
              {complaint.title}
            </h1>
          </div>
          <StatusBadge status={complaint.status} />
        </div>
        <div className="mt-6">
          <StatusStepper status={complaint.status} />
        </div>
        {complaint.admin_remarks && complaint.status !== 'pending' && (
          <Alert type={complaint.status === 'rejected' ? 'error' : 'info'} className="mt-6">
            <span className="font-semibold">{t('detail.remarks')}: </span>
            {complaint.admin_remarks}
          </Alert>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card space-y-4 p-5 sm:p-6 lg:col-span-3" aria-label={t('detail.info')}>
          <dl className="space-y-3">
            <Row label={t('table.category')}>{t(`cat.${complaint.category}`)}</Row>
            {isAdmin && (
              <Row label={t('detail.reportedBy')}>
                {complaint.profiles?.full_name || '–'}
                {complaint.profiles?.email && <span className="block text-slate-600">{complaint.profiles.email}</span>}
              </Row>
            )}
            <Row label={t('table.location')}>
              <span className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                {fullLocation(complaint)}
              </span>
              {hasCoords && (
                <a
                  href={mapLink(complaint.latitude, complaint.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-teal-700 underline"
                >
                  {t('detail.viewMap')} ({Number(complaint.latitude).toFixed(5)}, {Number(complaint.longitude).toFixed(5)})
                </a>
              )}
            </Row>
            <Row label={t('detail.submitted')}>{formatDateTime(complaint.created_at, lang)}</Row>
            <Row label={t('detail.updated')}>{formatDateTime(complaint.updated_at, lang)}</Row>
            <Row label={t('detail.description')}>
              <p className="whitespace-pre-wrap break-words">{complaint.description}</p>
            </Row>
          </dl>
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-2" aria-label={t('detail.photo')}>
          <h2 className="mb-3 text-base font-semibold text-navy-900">{t('detail.photo')}</h2>
          {imageState === 'loading' && (
            <div className="flex h-48 items-center justify-center rounded-xl bg-slate-100 text-navy-700">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {imageState === 'ready' && (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" title={t('detail.openPhoto')}>
              <img
                src={imageUrl}
                alt={t('detail.photoAlt', { title: complaint.title })}
                loading="lazy"
                onError={() => setImageState('error')}
                className="max-h-80 w-full rounded-xl object-cover"
              />
            </a>
          )}
          {(imageState === 'none' || imageState === 'error') && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-center text-sm text-slate-600">
              <ImageOff className="h-8 w-8" aria-hidden="true" />
              {imageState === 'none' ? t('detail.noPhoto') : t('detail.photoFailed')}
            </div>
          )}
        </section>
      </div>

      {isAdmin && <AdminActionPanel complaint={complaint} onUpdated={onChanged} />}

      <section className="card p-5 sm:p-6" aria-labelledby="history-title">
        <h2 id="history-title" className="mb-5 text-base font-semibold text-navy-900">
          {t('detail.history')}
        </h2>
        {historyLoading && <Spinner className="h-6 w-6 text-navy-700" />}
        {historyError && <Alert type="error">{historyError}</Alert>}
        {!historyLoading && !historyError && <StatusTimeline history={history} />}
      </section>
    </div>
  );
}
