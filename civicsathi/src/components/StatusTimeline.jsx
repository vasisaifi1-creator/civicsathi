import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { STATUS_STYLE } from './StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime } from '../utils/format';

// Horizontal progress: Pending -> In Progress -> Resolved (or Rejected).
export function StatusStepper({ status }) {
  const { t } = useLanguage();
  const rejected = status === 'rejected';
  const steps = rejected ? ['pending', 'rejected'] : ['pending', 'in_progress', 'resolved'];
  const current = steps.indexOf(status);

  return (
    <ol className="flex items-center" aria-label={t('detail.progress')}>
      {steps.map((s, i) => {
        const done = i <= current;
        const color = done ? STATUS_STYLE[rejected && s === 'rejected' ? 'rejected' : 'resolved'].color : '#cbd5e1';
        return (
          <Fragment key={s}>
            <li className="flex flex-col items-center gap-1.5 text-center" aria-current={i === current ? 'step' : undefined}>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                style={{ background: color }}
              >
                {done ? <Check className="h-5 w-5" aria-hidden="true" /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              <span className={`text-xs font-semibold ${done ? 'text-navy-900' : 'text-slate-500'}`}>{t(`status.${s}`)}</span>
            </li>
            {i < steps.length - 1 && (
              <li aria-hidden="true" className="mx-2 mb-5 h-1 flex-1 rounded-full" style={{ background: i < current ? color : '#e2e8f0' }} />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}

// Vertical history of every status change.
export default function StatusTimeline({ history }) {
  const { t, lang } = useLanguage();
  if (!history.length) return <p className="text-sm text-slate-600">{t('detail.noHistory')}</p>;

  return (
    <ol className="relative ml-3 space-y-6 border-l-2 border-slate-200">
      {history.map((h, idx) => {
        const style = STATUS_STYLE[h.new_status] ?? STATUS_STYLE.pending;
        const latest = idx === history.length - 1;
        return (
          <li key={h.id} className="ml-6">
            <span
              className="absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white"
              style={{ background: style.color }}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-navy-900">
              {h.old_status
                ? t('timeline.changed', { from: t(`status.${h.old_status}`), to: t(`status.${h.new_status}`) })
                : t('timeline.submitted')}
              {latest && (
                <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                  {t('timeline.latest')}
                </span>
              )}
            </p>
            <time className="text-xs text-slate-500" dateTime={h.created_at}>
              {formatDateTime(h.created_at, lang)}
            </time>
            {h.remarks && h.old_status && (
              <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-semibold">{t('detail.remarks')}: </span>
                {h.remarks}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
