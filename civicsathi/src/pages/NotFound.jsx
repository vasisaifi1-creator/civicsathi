import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        <MapPin className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="mt-4 text-5xl font-extrabold text-navy-900">404</p>
      <h1 className="mt-2 text-xl font-bold text-navy-900">{t('notfound.title')}</h1>
      <p className="mt-2 text-slate-600">{t('notfound.desc')}</p>
      <Link to="/" className="btn btn-primary mt-6">
        {t('notfound.home')}
      </Link>
    </div>
  );
}
