import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Smartphone,
  Languages,
  ClipboardCheck,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useLanguage } from '../context/LanguageContext';
import { getPublicStats } from '../services/complaintService';
import { HOME_CATEGORIES } from '../utils/constants';
import { CATEGORY_ICONS } from '../utils/categoryIcons';

function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-teal-800 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
        <div className="animate-fade-up">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-teal-200">
            {t('brand.tagline')}
          </p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{t('hero.title')}</h1>
          <p className="mt-5 max-w-xl text-base text-navy-100 sm:text-lg">{t('hero.desc')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/report" className="btn btn-teal !px-6 !py-3 text-base">
              {t('hero.report')}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              to="/track"
              className="btn !px-6 !py-3 text-base border border-white/40 text-white hover:bg-white/10"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              {t('hero.track')}
            </Link>
          </div>
        </div>

        <div className="hidden justify-center lg:flex" aria-hidden="true">
          <div className="relative flex h-80 w-80 items-center justify-center rounded-full bg-white/5">
            <div className="flex h-60 w-60 items-center justify-center rounded-full bg-white/10">
              <svg viewBox="0 0 48 48" className="h-40 w-40">
                <path
                  d="M24 2C14.6 2 7 9.4 7 18.5 7 30.5 24 46 24 46s17-15.5 17-27.5C41 9.4 33.4 2 24 2z"
                  fill="#ffffff"
                />
                <path d="M24 9.5 34.5 15.5H13.5z" fill="#162d52" />
                <rect x="15" y="17.5" width="3.4" height="9" fill="#162d52" />
                <rect x="22.3" y="17.5" width="3.4" height="9" fill="#162d52" />
                <rect x="29.6" y="17.5" width="3.4" height="9" fill="#162d52" />
                <rect x="12.5" y="27.5" width="23" height="2.6" rx="1" fill="#14857f" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="categories-title">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="categories-title" className="text-2xl font-bold text-navy-900 sm:text-3xl">
          {t('home.categories.title')}
        </h2>
        <p className="mt-3 text-slate-600">{t('home.categories.sub')}</p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c];
          return (
            <li key={c}>
              <Link
                to={`/report?category=${c}`}
                className="card flex h-full items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-navy-900">{t(`home.cat.${c}`)}</span>
                  <span className="mt-1 block text-sm text-slate-600">{t(`home.catdesc.${c}`)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HowItWorks() {
  const { t } = useLanguage();
  const steps = [
    { icon: ClipboardList, n: 1 },
    { icon: Camera, n: 2 },
    { icon: ClipboardCheck, n: 3 },
    { icon: CheckCircle2, n: 4 },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-16" aria-labelledby="how-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="how-title" className="text-2xl font-bold text-navy-900 sm:text-3xl">
            {t('how.title')}
          </h2>
          <p className="mt-3 text-slate-600">{t('how.sub')}</p>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, n }) => (
            <li key={n} className="relative rounded-2xl bg-slate-50 p-6">
              <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">
                {n}
              </span>
              <Icon className="h-8 w-8 text-teal-600" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-navy-900">{t(`how.step${n}.title`)}</h3>
              <p className="mt-1 text-sm text-slate-600">{t(`how.step${n}.desc`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LiveStats() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    getPublicStats()
      .then(setStats)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="stats-title">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="stats-title" className="text-2xl font-bold text-navy-900 sm:text-3xl">
          {t('stats.title')}
        </h2>
        <p className="mt-3 text-slate-600">{t('stats.sub')}</p>
      </div>
      {failed ? (
        <div className="mt-8 text-center" role="alert">
          <p className="text-sm text-red-700">{t('stats.error')}</p>
          <button type="button" onClick={load} className="btn btn-outline mt-3">
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ClipboardList} tone="navy" label={t('stats.total')} value={stats?.total} loading={loading} />
          <StatCard icon={CheckCircle2} tone="green" label={t('stats.resolved')} value={stats?.resolved} loading={loading} />
          <StatCard icon={Clock} tone="amber" label={t('stats.pending')} value={stats?.pending} loading={loading} />
          <StatCard icon={Loader2} tone="blue" label={t('stats.in_progress')} value={stats?.in_progress} loading={loading} />
        </div>
      )}
    </section>
  );
}

function About() {
  const { t } = useLanguage();
  const features = [
    { icon: Smartphone, key: 'f1' },
    { icon: Languages, key: 'f2' },
    { icon: ShieldCheck, key: 'f3' },
  ];
  return (
    <section id="about" className="scroll-mt-20 bg-navy-900 py-16 text-white" aria-labelledby="about-title">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 id="about-title" className="text-2xl font-bold sm:text-3xl">
            {t('about.title')}
          </h2>
          <p className="mt-4 text-navy-100">{t('about.p1')}</p>
          <p className="mt-3 text-navy-100">{t('about.p2')}</p>
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-white/10 p-4 text-sm text-navy-100">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
            {t('about.disclaimer')}
          </p>
        </div>
        <ul className="space-y-4">
          {features.map(({ icon: Icon, key }) => (
            <li key={key} className="flex gap-4 rounded-2xl bg-white/5 p-5">
              <Icon className="h-7 w-7 shrink-0 text-teal-300" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">{t(`about.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-navy-100">{t(`about.${key}.desc`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <HowItWorks />
      <LiveStats />
      <About />
    </>
  );
}
