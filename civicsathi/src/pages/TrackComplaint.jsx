import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ComplaintDetail from '../components/ComplaintDetail';
import { Alert, Spinner } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { getComplaintByNumber } from '../services/complaintService';
import { friendlyError } from '../utils/errors';

export default function TrackComplaint() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('id') || '');
  const [complaint, setComplaint] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | found | notfound | error
  const [message, setMessage] = useState('');
  const lastSearched = useRef('');

  const search = useCallback(
    async (raw) => {
      const number = raw.trim().toUpperCase();
      if (!number) return;
      lastSearched.current = number;
      setState('loading');
      setMessage('');
      try {
        // Row Level Security: only the owner (or an admin) gets a row back.
        const found = await getComplaintByNumber(number);
        if (found) {
          setComplaint(found);
          setState('found');
        } else {
          setComplaint(null);
          setState('notfound');
        }
      } catch (e) {
        setComplaint(null);
        setMessage(friendlyError(e, t));
        setState('error');
      }
    },
    [t]
  );

  // /track?id=CS-2026-000001 searches immediately (used by the success page)
  const initialId = params.get('id');
  useEffect(() => {
    if (initialId && initialId.trim().toUpperCase() !== lastSearched.current) {
      setInput(initialId);
      search(initialId);
    }
  }, [initialId, search]);

  function onSubmit(e) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    setParams({ id: value.toUpperCase() }, { replace: true });
    search(value);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{t('track.title')}</h1>
        <p className="mt-1 text-slate-600">{t('track.sub')}</p>
      </div>

      <form onSubmit={onSubmit} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5" role="search">
        <div className="flex-1">
          <label htmlFor="complaint-id" className="label">{t('track.label')}</label>
          <input
            id="complaint-id"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="CS-2026-000001"
            autoComplete="off"
            autoCapitalize="characters"
            className="input-base font-mono"
          />
        </div>
        <button type="submit" disabled={state === 'loading' || !input.trim()} className="btn btn-primary">
          {state === 'loading' ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" aria-hidden="true" />}
          {t('track.btn')}
        </button>
      </form>

      {state === 'idle' && <p className="text-sm text-slate-600">{t('track.hint')}</p>}
      {state === 'notfound' && <Alert type="error">{t('track.notFound')}</Alert>}
      {state === 'error' && <Alert type="error">{message}</Alert>}
      {state === 'found' && complaint && (
        <ComplaintDetail
          key={complaint.id}
          complaint={complaint}
          onChanged={(updated) => setComplaint((c) => ({ ...c, ...updated }))}
        />
      )}
    </div>
  );
}
