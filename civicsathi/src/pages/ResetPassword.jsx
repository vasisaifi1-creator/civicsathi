import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert, Field, PageLoader, Spinner, fieldProps } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { friendlyError } from '../utils/errors';
import { validatePassword } from '../utils/validators';

// The e-mailed link signs the user in with a temporary recovery session; they then pick a new password.
export default function ResetPassword() {
  const { t } = useLanguage();
  const { user, loading, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;

  if (!user && !done) {
    return (
      <AuthShell title={t('reset.title')}>
        <Alert type="error">{t('reset.invalid')}</Alert>
        <Link to="/forgot-password" className="btn btn-primary mt-6 w-full">
          {t('forgot.title')}
        </Link>
      </AuthShell>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const next = {};
    const pw = validatePassword(password);
    if (pw) next.password = t(pw);
    if (confirm !== password) next.confirm = t('val.passwordMatch');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      await signOut().catch(() => {});
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setFormError(friendlyError(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t('reset.title')} subtitle={done ? undefined : t('reset.sub')}>
      {done ? (
        <Alert type="success">{t('reset.success')}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}
          <Field id="password" label={t('auth.newPassword')} required error={errors.password} hint={t('auth.passwordHint')}>
            <input
              {...fieldProps('password', errors.password)}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
            />
          </Field>
          <Field id="confirm" label={t('auth.confirmPassword')} required error={errors.confirm}>
            <input
              {...fieldProps('confirm', errors.confirm)}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-base"
            />
          </Field>
          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy && <Spinner className="h-4 w-4" />}
            {t('reset.btn')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
