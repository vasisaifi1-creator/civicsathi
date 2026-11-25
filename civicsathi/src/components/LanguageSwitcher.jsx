import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useLanguage();
  const base = 'min-h-[36px] px-3 text-sm font-semibold transition';
  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white ${className}`}
      role="group"
      aria-label={t('nav.language')}
    >
      <Languages className="ml-2 h-4 w-4 text-slate-500" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        lang="en"
        className={`${base} ${lang === 'en' ? 'bg-navy-800 text-white' : 'text-navy-800 hover:bg-slate-100'}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
        lang="hi"
        className={`${base} ${lang === 'hi' ? 'bg-navy-800 text-white' : 'text-navy-800 hover:bg-slate-100'}`}
      >
        हिं
      </button>
    </div>
  );
}
