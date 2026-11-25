import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const STATUS_STYLE = {
  pending: { cls: 'bg-amber-50 text-amber-800 ring-amber-200', color: '#d97706', Icon: Clock },
  in_progress: { cls: 'bg-blue-50 text-blue-800 ring-blue-200', color: '#2563eb', Icon: Loader2 },
  resolved: { cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200', color: '#059669', Icon: CheckCircle2 },
  rejected: { cls: 'bg-red-50 text-red-800 ring-red-200', color: '#dc2626', Icon: XCircle },
};

// Icon + text (never colour alone) so status is readable for everyone.
export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const Icon = style.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.cls}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  );
}
