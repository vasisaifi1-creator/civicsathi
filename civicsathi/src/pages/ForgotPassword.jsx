import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert, Field, Spinner, fieldProps } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { friendlyError } from '../utils/errors';
import { isValidEmail } from '../utils/validators';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setFieldError(t('val.email'));
      return;
    }
    setFieldError('');
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(friendlyError(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('forgot.title')}
      subtitle={t('forgot.sub')}
      footer={
        <Link to="/login" className="font-semibold text-teal-700 hover:underline">
          {t('forgot.back')}
        </Link>
      }
    >
      {sent ? (
        <Alert type="success">{t('forgot.sent')}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}
          <Field id="email" label={t('auth.email')} required error={fieldError}>
            <input
              {...fieldProps('email', fieldError)}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
            />
          </Field>
          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy && <Spinner className="h-4 w-4" />}
            {t('forgot.btn')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
