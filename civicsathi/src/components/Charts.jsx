import { useLanguage } from '../context/LanguageContext';
import { STATUS_STYLE } from './StatusBadge';
import { STATUSES } from '../utils/constants';
import { formatMonth, formatNumber } from '../utils/format';

// Lightweight, dependency-free SVG/CSS charts (fast on low-end devices).

export function BarList({ items, label }) {
  const { lang } = useLanguage();
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3" aria-label={label}>
      {items.map((i) => (
        <li key={i.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-slate-700">{i.label}</span>
            <span className="font-semibold text-navy-900">{formatNumber(i.value, lang)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StatusDonut({ counts, label }) {
  const { t, lang } = useLanguage();
  const total = STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0);
  let offset = 25; // start at 12 o'clock
  const segments = STATUSES.map((s) => {
    const pct = total ? ((counts[s] || 0) / total) * 100 : 0;
    const seg = { s, pct, offset };
    offset -= pct;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 36 36" className="h-40 w-40 shrink-0" role="img" aria-label={label}>
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4" />
        {segments.map(
          ({ s, pct, offset: off }) =>
            pct > 0 && (
              <circle
                key={s}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={STATUS_STYLE[s].color}
                strokeWidth="4"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={off}
              />
            )
        )}
        <text x="18" y="18.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="#0d1f3c">
          {formatNumber(total, lang)}
        </text>
        <text x="18" y="23" textAnchor="middle" fontSize="2.6" fill="#475569">
          {t('admin.total')}
        </text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {STATUSES.map((s) => (
          <li key={s} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_STYLE[s].color }} aria-hidden="true" />
              {t(`status.${s}`)}
            </span>
            <span className="font-semibold text-navy-900">{formatNumber(counts[s] || 0, lang)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendChart({ items, label }) {
  const { lang } = useLanguage();
  const max = Math.max(1, ...items.map((i) => i.count));
  const W = 320;
  const H = 150;
  const padTop = 18;
  const padBottom = 24;
  const slot = W / Math.max(items.length, 1);
  const barW = Math.min(36, slot * 0.6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" role="img" aria-label={label}>
      <line x1="0" y1={H - padBottom} x2={W} y2={H - padBottom} stroke="#cbd5e1" strokeWidth="1" />
      {items.map((i, idx) => {
        const h = ((H - padTop - padBottom) * i.count) / max;
        const x = idx * slot + (slot - barW) / 2;
        const y = H - padBottom - h;
        return (
          <g key={i.month}>
            <rect x={x} y={y} width={barW} height={Math.max(h, i.count ? 2 : 0)} rx="4" fill="#14857f" />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0d1f3c">
              {formatNumber(i.count, lang)}
            </text>
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#475569">
              {formatMonth(i.month, lang)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
