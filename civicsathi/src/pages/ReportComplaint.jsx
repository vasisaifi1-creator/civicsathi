import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, CheckCircle2, Copy, MapPin, Navigation, RefreshCw, Trash2, X } from 'lucide-react';
import { Alert, Field, Spinner, fieldProps } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createComplaint } from '../services/complaintService';
import { getCurrentPosition, reverseGeocode } from '../services/geolocationService';
import { CATEGORIES, INDIAN_STATES } from '../utils/constants';
import { friendlyError } from '../utils/errors';
import { validateComplaintForm, validateImage } from '../utils/validators';
import { mapLink } from '../utils/format';

const EMPTY = { title: '', category: '', description: '', state: '', city: '', locality: '' };

const STATE_ALIASES = {
  'nct of delhi': 'Delhi',
  'national capital territory of delhi': 'Delhi',
  orissa: 'Odisha',
  pondicherry: 'Puducherry',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
};

// Reverse geocoders sometimes spell a state differently than the form's select list.
function matchIndianState(name) {
  const clean = String(name || '').trim();
  if (!clean) return '';
  const exact = INDIAN_STATES.find((s) => s.toLowerCase() === clean.toLowerCase());
  if (exact) return exact;
  return STATE_ALIASES[clean.toLowerCase().replace(/&/g, 'and')] || '';
}

// Builds the OpenStreetMap embed URL with a marker, used for the inline preview.
const MAP_PREVIEW_DELTA = 0.004;
function mapEmbedUrl(latitude, longitude) {
  const d = MAP_PREVIEW_DELTA;
  const bbox = [
    (longitude - d).toFixed(6),
    (latitude - d).toFixed(6),
    (longitude + d).toFixed(6),
    (latitude + d).toFixed(6),
  ].join(',');
  const marker = encodeURIComponent(`${latitude},${longitude}`);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
}

export default function ReportComplaint() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialCategory = CATEGORIES.includes(params.get('category')) ? params.get('category') : '';

  const [values, setValues] = useState({ ...EMPTY, category: initialCategory });
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [place, setPlace] = useState(null); // { city, state, locality, postalCode, displayName }
  const [geo, setGeo] = useState('idle'); // idle | getting | geocoding | denied | timeout | unavailable | unsupported | geocode_failed
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef(null);

  // object URL for the photo preview (revoked when replaced / unmounted)
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  function onFile(e) {
    const picked = e.target.files?.[0];
    e.target.value = ''; // allows choosing the same file again
    if (!picked) return;
    const problem = validateImage(picked);
    if (problem) {
      setErrors((er) => ({ ...er, image: t(problem) }));
      return;
    }
    setErrors((er) => ({ ...er, image: undefined }));
    setFile(picked);
  }

  function removeFile() {
    setFile(null);
    setErrors((er) => ({ ...er, image: undefined }));
  }

  // Location is requested only after the user explicitly presses the button.
  async function useMyLocation() {
    if (geo === 'getting' || geo === 'geocoding') return;
    setPlace(null);
    setCoords(null);
    setGeo('getting');
    try {
      const pos = await getCurrentPosition();
      const latitude = Number(pos.coords.latitude.toFixed(6));
      const longitude = Number(pos.coords.longitude.toFixed(6));
      setCoords({ latitude, longitude });
      setGeo('geocoding');
      try {
        const address = await reverseGeocode(latitude, longitude, 'en');
        setPlace(address);
        setValues((v) => ({
          ...v,
          state: matchIndianState(address.state) || v.state,
          city: address.city || v.city,
          locality: address.locality || v.locality,
        }));
        setErrors((er) => ({ ...er, state: undefined, city: undefined, locality: undefined }));
        setGeo('idle');
      } catch {
        setGeo('geocode_failed');
      }
    } catch (err) {
      setCoords(null);
      if (err.code === 1) setGeo('denied');
      else if (err.code === 3) setGeo('timeout');
      else if (err.code === 'unsupported') setGeo('unsupported');
      else setGeo('unavailable');
    }
  }

  function clearLocation() {
    setCoords(null);
    setPlace(null);
    setGeo('idle');
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitError('');

    const found = validateComplaintForm(values);
    const messages = Object.fromEntries(Object.entries(found).map(([k, key]) => [k, t(key)]));
    if (file) {
      const imgProblem = validateImage(file);
      if (imgProblem) messages.image = t(imgProblem);
    }
    setErrors(messages);
    const firstKey = Object.keys(messages)[0];
    if (firstKey) {
      document.getElementById(firstKey === 'image' ? 'photo' : firstKey)?.focus();
      return;
    }

    setSubmitting(true);
    setProgress(0);
    try {
      const result = await createComplaint({
        values: { ...values, latitude: coords?.latitude, longitude: coords?.longitude },
        file,
        userId: user.id,
        onProgress: setProgress,
        onStage: setStage,
      });
      setCreated(result);
    } catch (err) {
      // Log the full error to the browser console during development so the real
      // cause is visible (e.g. "permission denied for sequence complaint_number_seq").
      // The user-facing message stays generic and safe in production.
      if (import.meta.env.DEV) {
        // Print the raw message string FIRST so the console shows the actual cause
        // instead of a collapsed "Object". The full error object follows.
        console.error('Complaint submission failed:', err?.message || err, err);
      }
      setSubmitError(friendlyError(err, t));
    } finally {
      setSubmitting(false);
      setStage('');
    }
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(created.complaint_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable; the ID is visible on screen anyway */
    }
  }

  function reportAnother() {
    setCreated(null);
    setValues({ ...EMPTY });
    setFile(null);
    setCoords(null);
    setPlace(null);
    setGeo('idle');
    setErrors({});
    setProgress(0);
  }

  // ---- success page --------------------------------------------------------
  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-6 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-navy-900">{t('report.success.title')}</h1>
          <p className="mt-2 text-slate-600">{t('report.success.desc')}</p>
          <p className="mt-6 text-sm text-slate-500">{t('report.success.id')}</p>
          <p className="mt-1 break-all font-mono text-2xl font-bold text-teal-700">{created.complaint_number}</p>
          <button type="button" onClick={copyId} className="btn btn-outline mt-3 !py-2">
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? t('report.success.copied') : t('report.success.copy')}
          </button>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/track?id=${encodeURIComponent(created.complaint_number)}`} className="btn btn-primary">
              {t('report.success.track')}
            </Link>
            <button type="button" onClick={reportAnother} className="btn btn-outline">
              {t('report.success.another')}
            </button>
          </div>
          <p className="mt-6 text-xs text-slate-500">{t('report.disclaimer')}</p>
        </div>
      </div>
    );
  }

  // ---- form ---------------------------------------------------------------
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{t('report.title')}</h1>
      <p className="mt-1 text-slate-600">{t('report.sub')}</p>

      <form onSubmit={onSubmit} noValidate className="card mt-6 space-y-5 p-5 sm:p-8">
        {submitError && <Alert type="error">{submitError}</Alert>}

        <Field id="title" label={t('report.fieldTitle')} required error={errors.title}>
          <input
            {...fieldProps('title', errors.title)}
            type="text"
            maxLength={120}
            value={values.title}
            onChange={set('title')}
            placeholder={t('report.titlePh')}
            className="input-base"
          />
        </Field>

        <Field id="category" label={t('table.category')} required error={errors.category}>
          <select {...fieldProps('category', errors.category)} value={values.category} onChange={set('category')} className="input-base">
            <option value="">{t('report.selectCategory')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`cat.${c}`)}</option>
            ))}
          </select>
        </Field>

        <Field id="description" label={t('detail.description')} required error={errors.description} hint={t('report.descHint')}>
          <textarea
            {...fieldProps('description', errors.description)}
            rows={5}
            maxLength={1000}
            value={values.description}
            onChange={set('description')}
            placeholder={t('report.descPh')}
            className="input-base"
          />
          <p className="mt-1 text-right text-xs text-slate-500">{values.description.length}/1000</p>
        </Field>

        {/* Photograph */}
        <div>
          <span className="label">
            {t('report.photo')}
            <span className="ml-1 text-xs font-normal text-slate-500">({t('common.optional')})</span>
          </span>
          <input
            ref={fileInput}
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            className="sr-only"
            aria-describedby="photo-help"
            aria-invalid={errors.image ? 'true' : undefined}
          />
          {!file ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-600 hover:border-teal-600 hover:bg-teal-50"
            >
              <Camera className="h-8 w-8 text-teal-600" aria-hidden="true" />
              <span className="font-semibold text-navy-900">{t('report.choosePhoto')}</span>
            </button>
          ) : (
            <div className="rounded-xl border border-slate-200 p-3">
              <img src={previewUrl} alt={t('report.previewAlt')} className="max-h-64 w-full rounded-lg object-contain" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm text-slate-600">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-outline !py-2">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t('common.replace')}
                  </button>
                  <button type="button" onClick={removeFile} className="btn btn-outline !py-2 text-red-700">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t('common.remove')}
                  </button>
                </div>
              </div>
            </div>
          )}
          <p id="photo-help" className="mt-1 text-xs text-slate-500">{t('report.photoHelp')}</p>
          {errors.image && <p id="photo-err" className="field-error" role="alert">{errors.image}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="state" label={t('report.state')} required error={errors.state}>
            <select {...fieldProps('state', errors.state)} value={values.state} onChange={set('state')} className="input-base">
              <option value="">{t('report.selectState')}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field id="city" label={t('report.city')} required error={errors.city}>
            <input
              {...fieldProps('city', errors.city)}
              type="text"
              maxLength={80}
              autoComplete="address-level2"
              value={values.city}
              onChange={set('city')}
              className="input-base"
            />
          </Field>
        </div>

        <Field id="locality" label={t('report.locality')} required error={errors.locality} hint={t('report.localityHint')}>
          <input
            {...fieldProps('locality', errors.locality)}
            type="text"
            maxLength={120}
            value={values.locality}
            onChange={set('locality')}
            className="input-base"
          />
        </Field>

        {/* Optional precise location */}
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-navy-900">{t('report.geo.title')}</p>
          <p className="mt-1 text-sm text-slate-600">{t('report.geo.desc')}</p>

          {coords ? (
            <div className="mt-3 space-y-3">
              {geo === 'geocoding' && (
                <p className="flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
                  <Spinner className="h-4 w-4" />
                  {t('report.geo.geocoding')}
                </p>
              )}

              {place && <Alert type="success">{t('report.geo.success')}</Alert>}

              {place && (
                <div className="rounded-lg border border-teal-200 bg-white p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('report.geo.detected')}
                  </p>
                  <p className="mt-1 text-base font-semibold text-navy-900">{place.displayName}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    {place.locality && (
                      <span>{t('report.locality')}: <strong className="font-semibold text-navy-900">{place.locality}</strong></span>
                    )}
                    {place.city && (
                      <span>{t('report.city')}: <strong className="font-semibold text-navy-900">{place.city}</strong></span>
                    )}
                    {place.district && (
                      <span>{t('report.geo.district')}: <strong className="font-semibold text-navy-900">{place.district}</strong></span>
                    )}
                    {place.state && (
                      <span>{t('report.state')}: <strong className="font-semibold text-navy-900">{place.state}</strong></span>
                    )}
                    {place.postalCode && (
                      <span>{t('report.geo.postal')}: <strong className="font-semibold text-navy-900">{place.postalCode}</strong></span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{t('report.geo.filledHint')}</p>
                  <p className="mt-1 text-xs text-slate-500">{t('report.geo.wardNote')}</p>
                </div>
              )}

              {geo === 'geocode_failed' && (
                <div className="space-y-2">
                  <Alert type="info">{t('report.geo.geocode_failed')}</Alert>
                  <button type="button" onClick={useMyLocation} className="btn btn-outline !py-1.5 !min-h-[36px]">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t('report.geo.retry')}
                  </button>
                </div>
              )}

              {/* Optional map preview with marker */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{t('report.geo.mapPreview')}</p>
                <div className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <iframe
                    title={t('report.geo.mapPreview')}
                    src={mapEmbedUrl(coords.latitude, coords.longitude)}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t('report.geo.coords')}: {coords.latitude}, {coords.longitude} ·{' '}
                  <a
                    href={mapLink(coords.latitude, coords.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    {t('detail.viewMap')}
                  </a>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={useMyLocation} className="btn btn-outline !py-1.5 !min-h-[36px]">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {t('report.geo.refresh')}
                </button>
                <button type="button" onClick={clearLocation} className="btn btn-outline !py-1.5 !min-h-[36px] text-red-700">
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t('report.geo.clear')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" onClick={useMyLocation} disabled={geo === 'getting'} className="btn btn-outline mt-3">
                {geo === 'getting' ? <Spinner className="h-4 w-4" /> : <Navigation className="h-4 w-4" aria-hidden="true" />}
                {geo === 'getting' ? t('report.geo.getting') : t('report.geo.btn')}
              </button>

              {(geo === 'denied' || geo === 'timeout' || geo === 'unavailable') && (
                <div className="mt-3 space-y-2">
                  <Alert type="info">{t(`report.geo.${geo}`)}</Alert>
                  <button type="button" onClick={useMyLocation} className="btn btn-outline !py-1.5 !min-h-[36px]">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t('report.geo.retry')}
                  </button>
                </div>
              )}

              {geo === 'unsupported' && <Alert type="info" className="mt-3">{t('report.geo.unsupported')}</Alert>}
            </>
          )}
        </div>

        {submitting && (
          <div aria-live="polite">
            <p className="mb-1 text-sm font-medium text-navy-900">
              {stage === 'uploading' ? `${t('report.uploading')} ${progress}%` : t('report.saving')}
            </p>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{ width: stage === 'uploading' ? `${progress}%` : '100%' }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stage === 'uploading' ? progress : 100}
              />
            </div>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-teal w-full !py-3 text-base">
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? t('report.submitting') : t('report.submit')}
        </button>
        <p className="text-center text-xs text-slate-500">{t('report.disclaimer')}</p>
      </form>
    </div>
  );
}
