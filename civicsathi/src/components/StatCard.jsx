import { useLanguage } from '../context/LanguageContext';
import { formatNumber } from '../utils/format';

const TONES = {
  navy: 'bg-navy-50 text-navy-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  teal: 'bg-teal-50 text-teal-700',
};

export default function StatCard({ icon: Icon, label, value, tone = 'navy', loading = false }) {
  const { lang } = useLanguage();
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-16 animate-pulse rounded bg-slate-200" aria-hidden="true" />
        ) : (
          <p className="text-2xl font-bold text-navy-900">{value == null ? '–' : formatNumber(value, lang)}</p>
        )}
      </div>
    </div>
  );
}
