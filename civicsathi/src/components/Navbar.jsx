import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/#about', label: t('nav.about') },
    { to: '/#how-it-works', label: t('nav.how') },
    { to: '/report', label: t('nav.report') },
  ];

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      navigate('/');
    }
  }

  const linkCls = 'rounded-lg px-3 py-2 text-sm font-medium text-navy-800 hover:bg-navy-50';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Link to="/" aria-label="CivicSathi - home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkCls}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn-primary !py-2">
                {t('nav.dashboard')}
              </Link>
              <button type="button" onClick={handleLogout} className="btn btn-outline !py-2">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline !py-2">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn btn-teal !py-2">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-navy-800 hover:bg-navy-50 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={t('nav.menu')}
        >
          {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={`${linkCls} min-h-[44px] flex items-center`}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <LanguageSwitcher className="self-start" />
            {user ? (
              <>
                <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn-primary">
                  {t('nav.dashboard')}
                </Link>
                <button type="button" onClick={handleLogout} className="btn btn-outline">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-teal">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
