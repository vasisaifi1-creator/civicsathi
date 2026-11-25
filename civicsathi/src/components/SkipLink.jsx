import { useLanguage } from '../context/LanguageContext';

// First focusable element: lets keyboard users jump past the navigation.
export default function SkipLink() {
  const { t } = useLanguage();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900 focus:shadow-lift"
    >
      {t('nav.skip')}
    </a>
  );
}
