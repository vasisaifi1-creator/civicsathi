import { useState } from 'react';
import { Alert, Field, Spinner, fieldProps } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../utils/format';
import { friendlyError } from '../utils/errors';
import { validatePassword, validatePhone } from '../utils/validators';

export default function Profile() {
  const { t, lang } = useLanguage();
  const { profile, updateProfile, updatePassword } = useAuth();

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone_number || '');
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState({});
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwBusy, setPwBusy] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    const next = {};
    const name = fullName.trim();
    if (name.length < 2 || name.length > 100) next.fullName = t('val.nameLen');
    const phoneProblem = validatePhone(phone);
    if (phoneProblem) next.phone = t(phoneProblem);
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await updateProfile({ fullName: name, phoneNumber: phone });
      setMsg({ type: 'success', text: t('profile.updated') });
    } catch (err) {
      setMsg({ type: 'error', text: friendlyError(err, t) });
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    const next = {};
    const problem = validatePassword(pw);
    if (problem) next.pw = t(problem);
    if (pwConfirm !== pw) next.confirm = t('val.passwordMatch');
    setPwErrors(next);
    if (Object.keys(next).length) return;

    setPwBusy(true);
    try {
      await updatePassword(pw);
      setPw('');
      setPwConfirm('');
      setPwMsg({ type: 'success', text: t('profile.passwordUpdated') });
    } catch (err) {
      setPwMsg({ type: 'error', text: friendlyError(err, t) });
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{t('profile.title')}</h1>

      <form onSubmit={saveProfile} noValidate className="card space-y-5 p-5 sm:p-8" aria-labelledby="profile-info">
        <h2 id="profile-info" className="text-base font-semibold text-navy-900">{t('profile.info')}</h2>
        {msg.text && <Alert type={msg.type}>{msg.text}</Alert>}

        <Field id="fullName" label={t('auth.fullName')} required error={errors.fullName}>
          <input
            {...fieldProps('fullName', errors.fullName)}
            type="text"
            maxLength={100}
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-base"
          />
        </Field>

        <div>
          <span className="label">{t('auth.email')}</span>
          <p className="input-base flex items-center bg-slate-50 text-slate-700">{profile.email}</p>
        </div>

        <Field id="phone" label={t('profile.phone')} error={errors.phone}>
          <input
            {...fieldProps('phone', errors.phone)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-base"
          />
        </Field>

        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">{t('profile.role')}</dt>
            <dd className="font-semibold text-navy-900">{t(`profile.role.${profile.role}`)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t('profile.since')}</dt>
            <dd className="font-semibold text-navy-900">{formatDate(profile.created_at, lang)}</dd>
          </div>
        </dl>

        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy && <Spinner className="h-4 w-4" />}
          {t('common.save')}
        </button>
      </form>

      <form onSubmit={savePassword} noValidate className="card space-y-5 p-5 sm:p-8" aria-labelledby="profile-pw">
        <h2 id="profile-pw" className="text-base font-semibold text-navy-900">{t('profile.password.title')}</h2>
        {pwMsg.text && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
        <Field id="newPassword" label={t('auth.newPassword')} required error={pwErrors.pw} hint={t('auth.passwordHint')}>
          <input
            {...fieldProps('newPassword', pwErrors.pw)}
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="input-base"
          />
        </Field>
        <Field id="confirmNewPassword" label={t('auth.confirmPassword')} required error={pwErrors.confirm}>
          <input
            {...fieldProps('confirmNewPassword', pwErrors.confirm)}
            type="password"
            autoComplete="new-password"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            className="input-base"
          />
        </Field>
        <button type="submit" disabled={pwBusy} className="btn btn-outline">
          {pwBusy && <Spinner className="h-4 w-4" />}
          {t('profile.password.btn')}
        </button>
      </form>
    </div>
  );
}
