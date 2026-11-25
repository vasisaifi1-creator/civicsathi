import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, FilePlus2, LayoutDashboard, Search, ShieldCheck, User, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ open, onClose }) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items = isAdmin
    ? [
        { to: '/admin', label: t('nav.adminDashboard'), icon: ShieldCheck, end: true },
        { to: '/notifications', label: t('nav.notifications'), icon: Bell },
        { to: '/profile', label: t('nav.profile'), icon: User },
      ]
    : [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
        { to: '/report', label: t('nav.report'), icon: FilePlus2 },
        { to: '/track', label: t('nav.track'), icon: Search },
        { to: '/notifications', label: t('nav.notifications'), icon: Bell },
        { to: '/profile', label: t('nav.profile'), icon: User },
      ];

  const itemCls = ({ isActive }) =>
    `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
      isActive ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy-900 p-4 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" onClick={onClose} aria-label="CivicSathi - home">
            <Logo light />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-navy-100 hover:bg-white/10 lg:hidden"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="App">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={itemCls}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
