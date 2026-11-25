import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Spinner({ className = 'h-5 w-5' }) {
  const { t } = useLanguage();
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </span>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-navy-700">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

const ALERT_STYLES = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', Icon: AlertTriangle },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  info: { box: 'border-blue-200 bg-blue-50 text-blue-800', Icon: Info },
};

export function Alert({ type = 'info', children, className = '' }) {
  const { box, Icon } = ALERT_STYLES[type];
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${box} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="card p-6">
      <Alert type="error">{message}</Alert>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline mt-4">
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Label + control + error message with correct aria wiring.
export function Field({ id, label, required, error, hint, children }) {
  const { t } = useLanguage();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden="true"> *</span>
        ) : (
          <span className="ml-1 text-xs font-normal text-slate-500">({t('common.optional')})</span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export const fieldProps = (id, error) => ({
  id,
  'aria-invalid': error ? 'true' : undefined,
  'aria-describedby': error ? `${id}-err` : undefined,
});
