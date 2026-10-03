export default function ApiState({ loading, error, empty, onRetry }) {
  if (loading) return <p className="api-state" role="status">جارٍ تحميل البيانات…</p>;
  if (error) return <div className="api-state api-state--error" role="alert"><span>{error.message}</span>{onRetry && <button type="button" onClick={onRetry}>إعادة المحاولة</button>}</div>;
  if (empty) return <p className="api-state" role="status">{empty}</p>;
  return null;
}
