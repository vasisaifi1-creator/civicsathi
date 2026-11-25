import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Pagination({ page, pageSize, total, onChange }) {
  const { t } = useLanguage();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3" aria-label="Pagination">
      <button type="button" className="btn btn-outline !py-2" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t('common.prev')}
      </button>
      <span className="text-sm text-slate-600" aria-live="polite">
        {t('common.pageOf', { page, pages })}
      </span>
      <button type="button" className="btn btn-outline !py-2" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t('common.next')}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
