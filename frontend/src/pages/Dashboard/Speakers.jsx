import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../services/api/client';
import { createDashboardRecord, updateDashboardRecord } from '../../services/api/dashboard';

const base = '/dashboard/speakers';
const tr = (language, ar, en) => language === 'ar' ? ar : en;
const workshopTitle = (workshop, language) => workshop[`title_${language}`] || workshop.title_ar || workshop.title_en;

function useWorkshops(language, onSessionExpired) {
  const [workshops, setWorkshops] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest('/admin/lookups/workshops').then((records) => { if (active) setWorkshops(records); })
      .catch((issue) => { if (active) { setError(issue.message); if (issue.status === 401) onSessionExpired(); } });
    return () => { active = false; };
  }, [language, onSessionExpired]);
  return { workshops, error };
}

export function SpeakerEditor({ language, notify, onSessionExpired }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { workshops, error: workshopsError } = useWorkshops(language, onSessionExpired);
  const [speaker, setSpeaker] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(params.get('parent') || '');
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    let active = true;
    apiRequest(`/admin/speakers/${encodeURIComponent(id)}`).then((record) => { if (active) setSpeaker(record); })
      .catch((issue) => { if (active) { setError(issue.message); if (issue.status === 401) onSessionExpired(); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, onSessionExpired]);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      full_name: String(form.get('full_name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      notes: String(form.get('notes') || '').trim() || null,
    };
    if (!id) {
      payload.workshop_id = Number(form.get('workshop_id'));
      payload.is_public = form.get('is_public') === 'on';
    }
    setBusy(true); setError('');
    try {
      const saved = id ? await updateDashboardRecord('speakers', id, payload) : await createDashboardRecord('speakers', payload);
      notify(tr(language, 'تم حفظ المتحدث.', 'Speaker saved.'));
      navigate(`${base}/${saved.id}`);
    } catch (issue) {
      setError(issue.message);
      if (issue.status === 401) onSessionExpired();
    } finally { setBusy(false); }
  }
  if (loading) return <p role="status">{tr(language, 'جارٍ تحميل المتحدث…', 'Loading speaker…')}</p>;
  return <>
    <header className="dash-heading"><div><h1 tabIndex="-1">{tr(language, id ? 'تعديل المتحدث' : 'إضافة متحدث', id ? 'Edit speaker' : 'Add speaker')}</h1><p>{tr(language, 'بيانات الاتصال والملاحظات خاصة بفريق الورش.', 'Contact details and notes are visible only to the workshop team.')}</p></div></header>
    <Link className="dash-back" to={id ? `${base}/${id}` : base}>{tr(language, 'العودة', 'Back')}</Link>
    <form className="dash-form" onSubmit={submit}>
      <div className="dash-form-grid">
        <label>{tr(language, 'الاسم', 'Name')}<input name="full_name" defaultValue={speaker?.full_name || ''} required maxLength="255" autoComplete="off" /></label>
        <label>{tr(language, 'رقم الهاتف', 'Phone number')}<input name="phone" type="tel" defaultValue={speaker?.phone || ''} required maxLength="30" autoComplete="off" /></label>
        <label className="dash-field--full">{tr(language, 'ملاحظات خاصة (اختياري)', 'Private notes (optional)')}<textarea name="notes" defaultValue={speaker?.notes || ''} maxLength="4000" rows="4" /></label>
        {!id && <>
          <label>{tr(language, 'الورشة', 'Workshop')}
            <select name="workshop_id" value={selectedWorkshop} onChange={(event) => setSelectedWorkshop(event.target.value)} required>
              <option value="">{tr(language, 'اختر ورشة', 'Choose a workshop')}</option>
              {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshopTitle(workshop, language)}</option>)}
            </select>
          </label>
          <label className="dash-checkbox-label"><span>{tr(language, 'إظهار اسم المتحدث للزوار في هذه الورشة', 'Show speaker name publicly for this workshop')}</span><input name="is_public" type="checkbox" /></label>
        </>}
      </div>
      {(error || workshopsError) && <p role="alert">{error || workshopsError}</p>}
      <div className="dash-form-actions"><button className="dash-action dash-action--primary" type="submit" disabled={busy || (!id && !workshops.length)}>{busy ? tr(language, 'جارٍ الحفظ…', 'Saving…') : tr(language, 'حفظ', 'Save')}</button><Link className="dash-action" to={id ? `${base}/${id}` : base}>{tr(language, 'إلغاء', 'Cancel')}</Link></div>
    </form>
  </>;
}

export function SpeakerDetails({ language, admin, onSessionExpired }) {
  const { id } = useParams();
  const { workshops, error: workshopsError } = useWorkshops(language, onSessionExpired);
  const [speaker, setSpeaker] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    apiRequest(`/admin/speakers/${encodeURIComponent(id)}`).then((record) => { if (active) setSpeaker(record); })
      .catch((issue) => { if (active) { setError(issue.message); if (issue.status === 401) onSessionExpired(); } });
    return () => { active = false; };
  }, [id, onSessionExpired]);
  async function change(method, path, payload) {
    setBusy(true); setError('');
    try {
      const updated = await apiRequest(path, { method, ...(payload ? { body: JSON.stringify(payload) } : {}) });
      setSpeaker(updated);
      return true;
    } catch (issue) {
      setError(issue.message);
      if (issue.status === 401) onSessionExpired();
      return false;
    } finally { setBusy(false); }
  }
  if (error && !speaker) return <div className="dash-empty" role="alert">{error}</div>;
  if (!speaker) return <p role="status">{tr(language, 'جارٍ تحميل المتحدث…', 'Loading speaker…')}</p>;
  const assigned = new Set(speaker.workshops.map((workshop) => workshop.workshop_id));
  const available = workshops.filter((workshop) => !assigned.has(workshop.id));
  return <>
    <header className="dash-heading"><div><h1 tabIndex="-1">{speaker.full_name}</h1><p>{tr(language, 'المتحدث والورش المرتبطة به', 'Speaker and assigned workshops')}</p></div></header>
    <Link className="dash-back" to={base}>{tr(language, 'العودة للمتحدثين', 'Back to speakers')}</Link>
    <div className="dash-details-layout">
      <article className="dash-card dash-detail-fields">
        <h2>{tr(language, 'بيانات خاصة', 'Private details')}</h2>
        <dl className="dash-meta"><div><dt>{tr(language, 'الهاتف', 'Phone')}</dt><dd>{speaker.phone}</dd></div><div><dt>{tr(language, 'ملاحظات', 'Notes')}</dt><dd>{speaker.notes || '—'}</dd></div></dl>
        <Link className="dash-action" to={`${base}/${id}/edit`}>{tr(language, 'تعديل البيانات', 'Edit details')}</Link>
      </article>
      <article className="dash-card dash-detail-fields">
        <h2>{tr(language, 'الورش', 'Workshops')}</h2>
        {speaker.workshops.length ? <ul className="dash-speaker-workshops">{speaker.workshops.map((workshop) => <li key={workshop.workshop_id}>
          {admin?.role_code === 'super_admin' || admin?.permissions?.includes('workshops') ? <Link to={`/dashboard/workshops/${workshop.workshop_id}`}>{workshopTitle(workshop, language)}</Link> : <span>{workshopTitle(workshop, language)}</span>}
          <span>{tr(language, workshop.is_public ? 'ظاهر للزوار' : 'خاص', workshop.is_public ? 'Public' : 'Private')}</span>
          <div className="dash-form-actions">
            <button type="button" className="dash-action" disabled={busy} onClick={() => change('PATCH', `/admin/speakers/${id}/workshops/${workshop.workshop_id}`, { is_public: !workshop.is_public })}>{tr(language, workshop.is_public ? 'إخفاء الاسم' : 'إظهار الاسم', workshop.is_public ? 'Make private' : 'Make public')}</button>
            <button type="button" className="dash-action dash-action--danger" disabled={busy} onClick={() => { if (window.confirm(tr(language, 'إزالة المتحدث من هذه الورشة؟', 'Remove speaker from this workshop?'))) change('DELETE', `/admin/speakers/${id}/workshops/${workshop.workshop_id}`); }}>{tr(language, 'إزالة الربط', 'Remove assignment')}</button>
          </div>
        </li>)}</ul> : <p className="dash-secondary">{tr(language, 'لا توجد ورش مرتبطة.', 'No assigned workshops.')}</p>}
        <form onSubmit={async (event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); const saved = await change('POST', `/admin/speakers/${id}/workshops`, { workshop_id: Number(form.get('workshop_id')), is_public: form.get('is_public') === 'on' }); if (saved) formElement.reset(); }}>
          <label>{tr(language, 'إضافة إلى ورشة أخرى', 'Add another workshop')}
            <select name="workshop_id" required defaultValue=""><option value="">{tr(language, 'اختر ورشة', 'Choose a workshop')}</option>{available.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshopTitle(workshop, language)}</option>)}</select>
          </label>
          <label className="dash-checkbox-label"><span>{tr(language, 'إظهار الاسم للزوار', 'Show name publicly')}</span><input name="is_public" type="checkbox" /></label>
          <p className="dash-secondary">{tr(language, 'يظهر الاسم للزوار عندما تكون الورشة منشورة وهذا الخيار مفعّلًا.', 'The name appears to visitors when the workshop is published and this option is enabled.')}</p>
          <button className="dash-action dash-action--primary" type="submit" disabled={busy || !available.length}>{tr(language, 'إضافة الورشة', 'Add workshop')}</button>
        </form>
      </article>
    </div>
    {(error || workshopsError) && <p role="alert">{error || workshopsError}</p>}
  </>;
}
