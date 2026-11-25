import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert, Field, Spinner, fieldProps } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { friendlyError } from '../utils/errors';
import { isValidEmail } from '../utils/validators';

export default function Login() {
  const { t } = useLanguage();
  const { user, profile, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from;

  // already signed in -> go to the right dashboard
  if (user && profile && !busy) {
    return <Navigate to={from || (profile.role === 'admin' ? '/admin' : '/dashboard')} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const next = {};
    if (!isValidEmail(email)) next.email = t('val.email');
    if (!password) next.password = t('val.required');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const p = await signIn({ email, password });
      navigate(from || (p?.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setFormError(friendlyError(err, t));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('login.title')}
      subtitle={t('login.sub')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-teal-700 hover:underline">
            {t('nav.register')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert type="error">{formError}</Alert>}
        <Field id="email" label={t('auth.email')} required error={errors.email}>
          <input
            {...fieldProps('email', errors.email)}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
          />
        </Field>
        <Field id="password" label={t('auth.password')} required error={errors.password}>
          <input
            {...fieldProps('password', errors.password)}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
          />
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-teal-700 hover:underline">
            {t('login.forgot')}
          </Link>
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy && <Spinner className="h-4 w-4" />}
          {busy ? t('login.busy') : t('login.btn')}
        </button>
      </form>
    </AuthShell>
  );
}
