import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert, Field, Spinner, fieldProps } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { friendlyError } from '../utils/errors';
import { isValidEmail, validatePassword } from '../utils/validators';

export default function Register() {
  const { t } = useLanguage();
  const { user, profile, signUp } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user && profile && !busy) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const next = {};
    const name = values.fullName.trim();
    if (name.length < 2 || name.length > 100) next.fullName = t('val.nameLen');
    if (!isValidEmail(values.email)) next.email = t('val.email');
    const pw = validatePassword(values.password);
    if (pw) next.password = t(pw);
    if (values.confirm !== values.password) next.confirm = t('val.passwordMatch');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUp(values);
      if (needsEmailConfirmation) {
        setConfirmEmailSent(true);
        setBusy(false);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setFormError(friendlyError(err, t));
      setBusy(false);
    }
  }

  if (confirmEmailSent) {
    return (
      <AuthShell title={t('register.checkEmail.title')}>
        <Alert type="success">{t('register.checkEmail.desc', { email: values.email.trim() })}</Alert>
        <Link to="/login" className="btn btn-primary mt-6 w-full">
          {t('forgot.back')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('register.title')}
      subtitle={t('register.sub')}
      footer={
        <>
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-teal-700 hover:underline">
            {t('nav.login')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert type="error">{formError}</Alert>}
        <Field id="fullName" label={t('auth.fullName')} required error={errors.fullName}>
          <input
            {...fieldProps('fullName', errors.fullName)}
            type="text"
            autoComplete="name"
            maxLength={100}
            value={values.fullName}
            onChange={set('fullName')}
            className="input-base"
          />
        </Field>
        <Field id="email" label={t('auth.email')} required error={errors.email}>
          <input
            {...fieldProps('email', errors.email)}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={set('email')}
            className="input-base"
          />
        </Field>
        <Field id="password" label={t('auth.password')} required error={errors.password} hint={t('auth.passwordHint')}>
          <input
            {...fieldProps('password', errors.password)}
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            className="input-base"
          />
        </Field>
        <Field id="confirm" label={t('auth.confirmPassword')} required error={errors.confirm}>
          <input
            {...fieldProps('confirm', errors.confirm)}
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={set('confirm')}
            className="input-base"
          />
        </Field>
        <button type="submit" disabled={busy} className="btn btn-teal w-full">
          {busy && <Spinner className="h-4 w-4" />}
          {busy ? t('register.busy') : t('register.btn')}
        </button>
      </form>
    </AuthShell>
  );
}
