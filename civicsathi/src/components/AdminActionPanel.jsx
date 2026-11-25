import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { Alert, Spinner } from './ui';
import { useLanguage } from '../context/LanguageContext';
import { adminUpdateStatus } from '../services/complaintService';
import { friendlyError } from '../utils/errors';

const ACTIONS = [
  { status: 'in_progress', labelKey: 'admin.toProgress', Icon: Loader2, cls: 'btn-primary' },
  { status: 'resolved', labelKey: 'admin.toResolved', Icon: CheckCircle2, cls: 'btn-teal' },
  { status: 'rejected', labelKey: 'admin.reject', Icon: XCircle, cls: 'btn-danger' },
  { status: 'pending', labelKey: 'admin.toPending', Icon: Clock, cls: 'btn-outline' },
];

// Only rendered for admins. The database function re-checks admin rights, so hiding this
// panel is a convenience - not the security boundary.
export default function AdminActionPanel({ complaint, onUpdated }) {
  const { t } = useLanguage();
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function change(status) {
    setError('');
    setSuccess('');
    if (status === 'rejected' && !remarks.trim()) {
      setError(t('err.reasonRequired'));
      return;
    }
    setBusy(status);
    try {
      const updated = await adminUpdateStatus(complaint.id, status, remarks.trim());
      setRemarks('');
      setSuccess(t('admin.updated', { status: t(`status.${status}`) }));
      onUpdated(updated);
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card p-5" aria-labelledby="admin-panel-title">
      <h2 id="admin-panel-title" className="text-base font-semibold text-navy-900">
        {t('admin.panel.title')}
      </h2>
      <label htmlFor="admin-remarks" className="label mt-4">
        {t('admin.panel.remarks')}
      </label>
      <textarea
        id="admin-remarks"
        rows={3}
        maxLength={1000}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder={t('admin.panel.remarksPh')}
        className="input-base"
      />
      <p className="mt-1 text-xs text-slate-500">{t('admin.panel.rejectHint')}</p>

      <div className="mt-4 flex flex-wrap gap-2" aria-live="polite">
        {ACTIONS.filter((a) => a.status !== complaint.status).map(({ status, labelKey, Icon, cls }) => (
          <button
            key={status}
            type="button"
            disabled={busy !== null}
            onClick={() => change(status)}
            className={`btn ${cls}`}
          >
            {busy === status ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
            {t(labelKey)}
          </button>
        ))}
      </div>

      {error && <Alert type="error" className="mt-4">{error}</Alert>}
      {success && <Alert type="success" className="mt-4">{success}</Alert>}
    </section>
  );
}
