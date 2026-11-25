import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const linkCls = 'text-sm text-navy-100 hover:text-white hover:underline';
  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm text-navy-200">{t('brand.tagline')}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <Link to="/#about" className={linkCls}>
            {t('footer.about')}
          </Link>
          <Link to="/contact" className={linkCls}>
            {t('footer.contact')}
          </Link>
          <Link to="/privacy" className={linkCls}>
            {t('footer.privacy')}
          </Link>
          <Link to="/terms" className={linkCls}>
            {t('footer.terms')}
          </Link>
        </nav>
        <p className="text-xs text-navy-200">{t('footer.hackathon')}</p>
      </div>
      <div className="border-t border-navy-800 px-4 py-4 text-center text-xs text-navy-300">
        © {new Date().getFullYear()} CivicSathi. {t('footer.rights')}
      </div>
    </footer>
  );
}
