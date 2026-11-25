import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ComplaintDetail from '../components/ComplaintDetail';
import { Alert, ErrorState, PageLoader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getComplaintById } from '../services/complaintService';
import { friendlyError } from '../utils/errors';

export default function ComplaintDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setComplaint(await getComplaintById(id));
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const backTo = isAdmin ? '/admin' : '/dashboard';

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('detail.back')}
      </Link>

      {loading && <PageLoader />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && !complaint && <Alert type="error">{t('track.notFound')}</Alert>}
      {!loading && !error && complaint && (
        <ComplaintDetail
          complaint={complaint}
          onChanged={(updated) => setComplaint((c) => ({ ...c, ...updated }))}
        />
      )}
    </div>
  );
}
