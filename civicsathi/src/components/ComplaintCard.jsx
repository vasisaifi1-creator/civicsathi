import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, shortLocation } from '../utils/format';
import { CATEGORY_ICONS } from '../utils/categoryIcons';

// Card version of a complaint row (used on small screens).
export default function ComplaintCard({ complaint, showCitizen = false, actionLabel }) {
  const { t, lang } = useLanguage();
  const Icon = CATEGORY_ICONS[complaint.category] ?? CATEGORY_ICONS.other;
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs font-semibold text-navy-700">{complaint.complaint_number}</p>
        <StatusBadge status={complaint.status} />
      </div>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{complaint.title}</h3>
      <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
          <dt className="sr-only">{t('table.category')}</dt>
          <dd>{t(`cat.${complaint.category}`)}</dd>
        </div>
        {showCitizen && (
          <div className="text-slate-700">
            <dt className="inline font-medium">{t('table.citizen')}: </dt>
            <dd className="inline">{complaint.profiles?.full_name || complaint.profiles?.email || '–'}</dd>
          </div>
        )}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
          <dt className="sr-only">{t('table.location')}</dt>
          <dd>{shortLocation(complaint)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
          <dt className="sr-only">{t('table.date')}</dt>
          <dd>{formatDate(complaint.created_at, lang)}</dd>
        </div>
      </dl>
      <Link to={`/complaints/${complaint.id}`} className="btn btn-outline mt-4 w-full">
        {actionLabel ?? t('common.viewDetails')}
      </Link>
    </article>
  );
}
