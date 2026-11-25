import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Page({ title, children }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900">{title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-slate-700">{children}</div>
      <Link to="/" className="btn btn-outline mt-10">
        {t('notfound.home')}
      </Link>
    </div>
  );
}

export function Privacy() {
  const { t } = useLanguage();
  return (
    <Page title={t('privacy.title')}>
      <p>{t('privacy.p1')}</p>
      <p>{t('privacy.p2')}</p>
      <p>{t('privacy.p3')}</p>
      <p>{t('privacy.p4')}</p>
    </Page>
  );
}

export function Terms() {
  const { t } = useLanguage();
  return (
    <Page title={t('terms.title')}>
      <p>{t('terms.p1')}</p>
      <p>{t('terms.p2')}</p>
      <p>{t('terms.p3')}</p>
      <p>{t('terms.p4')}</p>
    </Page>
  );
}

export function Contact() {
  const { t } = useLanguage();
  return (
    <Page title={t('contact.title')}>
      <p>{t('contact.p1')}</p>
      <p>{t('contact.p2')}</p>
    </Page>
  );
}
