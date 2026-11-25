import { Suspense, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import { PageLoader } from './ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Shell for every signed-in page: responsive sidebar + top bar.
export default function AppLayout() {
  const { t } = useLanguage();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      navigate('/');
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-navy-800 hover:bg-navy-50 lg:hidden"
            aria-label={t('nav.menu')}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="hidden min-w-0 lg:block" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <NotificationBell />
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-navy-800 md:inline">
              {profile?.full_name || profile?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-navy-800 hover:bg-navy-50"
              aria-label={t('nav.logout')}
              title={t('nav.logout')}
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl animate-fade-up">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
