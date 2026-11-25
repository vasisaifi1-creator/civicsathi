import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert, PageLoader } from './ui';

// Wrap routes that need a signed-in user. Pass role="admin" for admin-only routes.
// NOTE: this only controls what the UI shows. The real protection is Row Level Security and
// the admin checks inside the database functions, so skipping this component in the browser
// would still not expose any data.
export default function ProtectedRoute({ role, children }) {
  const { user, profile, profileError, isAdmin, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Alert type="error">{t('err.profileLoad')}</Alert>
        <button type="button" className="btn btn-outline mt-4" onClick={() => signOut()}>
          {t('nav.logout')}
        </button>
        {profileError && <span className="sr-only">{String(profileError.message)}</span>}
      </div>
    );
  }

  if (role === 'admin' && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children ?? <Outlet />;
}
