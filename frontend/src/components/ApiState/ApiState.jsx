import { useLanguage } from '../../services/api/publicContentLanguage';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

/* Request messages from client.js are written in Arabic, so English describes the failure
   from its status instead; Arabic keeps showing the original message. */
function englishError(error) {
  if (!error?.status) return 'We couldn’t reach the server. Check your connection and try again.';
  if (error.status === 404) return 'This content isn’t available.';
  if (error.status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (error.status >= 500) return 'The service is unavailable right now. Please try again shortly.';
  return 'We couldn’t load this content.';
}

export default function ApiState({ loading, error, empty, onRetry }) {
  const { en, t } = useLanguage();
  if (loading) return <LoadingScreen compact />;
  if (error) return <div className="api-state api-state--error" role="alert"><span>{en ? englishError(error) : error.message}</span>{onRetry && <button type="button" onClick={onRetry}>{t('إعادة المحاولة', 'Try again')}</button>}</div>;
  if (empty) return <p className="api-state" role="status">{empty}</p>;
  return null;
}
