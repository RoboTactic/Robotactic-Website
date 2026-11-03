import { useState } from 'react';
import { apiRequest } from '../../services/api/client';
import { useDashboardData } from '../../services/api/useDashboardData';
import DateTimeField from './DateTimeField';
import { messageForError } from './errorMessages';

const text = (pair, language) => pair[language === 'ar' ? 0 : 1];

function formatInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function EventStartEditor({ language, notify, onSessionExpired }) {
  const { data, loading, failure, reload, setData } = useDashboardData('/admin/site-settings', onSessionExpired, { editable: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const start = data?.event_start_at || '';

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const localValue = new FormData(event.currentTarget).get('event_start_at');
    const localDate = new Date(localValue);
    if (!localValue || Number.isNaN(localDate.getTime())) {
      setError(text(['اختر تاريخًا ووقتًا صالحين.', 'Choose a valid date and time.'], language));
      return;
    }
    const timestamp = localDate.toISOString();
    setBusy(true);
    setError('');
    try {
      const saved = await apiRequest('/admin/site-settings/event-start', {
        method: 'PATCH',
        body: JSON.stringify({ event_start_at: timestamp }),
      });
      setData(saved);
      notify(text(['تم تحديث موعد انطلاق الملتقى والعداد.', 'Forum start time and countdown updated.'], language));
    } catch (issue) {
      if (issue.status === 401) onSessionExpired();
      setError(messageForError(issue, language));
    } finally { setBusy(false); }
  }

  return <section className="dash-event-start" aria-labelledby="dash-event-start-title">
    <h2 id="dash-event-start-title">{text(['موعد انطلاق RoboTactic', 'RoboTactic start date and time'], language)}</h2>
    <p>{text(['هذا الموعد يحدد العدّاد التنازلي لبدء الملتقى لدى الزوار.', 'This date and time set the countdown shown to visitors.'], language)}</p>
    {loading && <p role="status">{text(['جارٍ تحميل موعد الانطلاق…', 'Loading the start time…'], language)}</p>}
    {failure && <div className="dash-form-error" role="alert"><p>{messageForError(failure, language)}</p><button type="button" className="dash-action" onClick={reload}>{text(['إعادة المحاولة', 'Try again'], language)}</button></div>}
    {!loading && !failure && <form className="dash-event-start__form" onSubmit={submit} aria-busy={busy}>
      <div className="dash-field">
        <label htmlFor="dash-date-event_start_at">{text(['بداية الملتقى', 'Event starts'], language)}</label>
        <DateTimeField name="event_start_at" defaultValue={formatInput(start)} required language={language} />
      </div>
      {!start && <p role="status">{text(['لم يُحدد موعد بعد. اختر الموعد ثم احفظه لتشغيل العدّاد.', 'No start time is set yet. Choose and save a time to start the countdown.'], language)}</p>}
      {error && <p className="dash-form-error" role="alert">{error}</p>}
      <button className="dash-action dash-action--primary" type="submit" disabled={busy || !data}>{busy ? text(['جارٍ الحفظ…', 'Saving…'], language) : text(['حفظ موعد الانطلاق', 'Save start time'], language)}</button>
    </form>}
  </section>;
}
