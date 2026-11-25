import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ComplaintCard from './ComplaintCard';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, shortLocation } from '../utils/format';

// Table on md+ screens, stacked cards on phones.
export default function ComplaintTable({ complaints, showCitizen = false, actionLabel, caption }) {
  const { t, lang } = useLanguage();
  const action = actionLabel ?? t('common.viewDetails');
  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600';

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className={th}>{t('table.id')}</th>
              {showCitizen && <th scope="col" className={th}>{t('table.citizen')}</th>}
              <th scope="col" className={th}>{t('table.category')}</th>
              <th scope="col" className={th}>{t('table.title')}</th>
              <th scope="col" className={th}>{t('table.location')}</th>
              <th scope="col" className={th}>{t('table.date')}</th>
              <th scope="col" className={th}>{t('table.status')}</th>
              <th scope="col" className={th}>
                <span className="sr-only">{t('table.action')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {complaints.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-navy-700">{c.complaint_number}</td>
                {showCitizen && (
                  <td className="px-4 py-3 text-slate-700">{c.profiles?.full_name || c.profiles?.email || '–'}</td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{t(`cat.${c.category}`)}</td>
                <td className="max-w-xs truncate px-4 py-3 font-medium text-navy-900" title={c.title}>{c.title}</td>
                <td className="px-4 py-3 text-slate-700">{shortLocation(c)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(c.created_at, lang)}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link to={`/complaints/${c.id}`} className="font-semibold text-teal-700 hover:underline">
                    {action}
                    <span className="sr-only"> {c.complaint_number}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} showCitizen={showCitizen} actionLabel={action} />
        ))}
      </div>
    </>
  );
}
