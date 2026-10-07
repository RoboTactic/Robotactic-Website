import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../services/api/client';
import { createDashboardRecord, updateDashboardRecord } from '../../services/api/dashboard';

const labels = {
  competitions: ['المسابقات', 'Competitions'],
  teams: ['الفرق', 'Teams'],
  workshops: ['الورش', 'Workshops'],
  speakers: ['المتحدثون', 'Speakers'],
  projects: ['المشاريع', 'Projects'],
  announcements: ['الإعلانات', 'Announcements'],
};
const defaults = {
  super_admin: [],
  competition_manager: ['competitions', 'teams'],
  workshop_manager: ['workshops', 'speakers'],
  team_member: [],
};
const roles = [
  ['super_admin', 'المشرف العام', 'Super Admin'],
  ['competition_manager', 'مسؤول المسابقات', 'Competition Manager'],
  ['workshop_manager', 'مسؤول الورش', 'Workshop Manager'],
  ['team_member', 'عضو الفريق', 'Team Member'],
];
const tr = (ar, en, language) => language === 'ar' ? ar : en;

export function UserEditor({ language, admin, notify, onSessionExpired }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [role, setRole] = useState('team_member');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    apiRequest(`/admin/users/${encodeURIComponent(id)}`)
      .then((user) => { if (active) { setRecord(user); setRole(user.role_code); setPermissions(user.permissions || []); } })
      .catch((issue) => { if (active) { setError(issue.message); if (issue.status === 401) onSessionExpired(); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, onSessionExpired]);

  function chooseRole(nextRole) {
    setRole(nextRole);
    setPermissions(defaults[nextRole]);
  }

  function toggleScope(scope) {
    setPermissions((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  }

  async function submit(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      full_name: String(form.get('full_name')).trim(),
      login_name: String(form.get('login_name')).trim(),
      email: String(form.get('email')).trim() || null,
      phone: String(form.get('phone')).trim() || null,
      role_code: role,
      permissions: role === 'super_admin' ? [] : permissions,
    };
    if (id) payload.is_active = form.get('is_active') === 'true';
    const password = String(form.get('password'));
    if (password) payload.password = password;
    try {
      const saved = id ? await updateDashboardRecord('users', id, payload) : await createDashboardRecord('users', payload);
      notify(tr('تم حفظ المستخدم وصلاحياته.', 'User and permissions saved.', language));
      if (Number(id) === admin?.id) { onSessionExpired(); navigate('/dashboard'); }
      else navigate(`/dashboard/users/${saved.id}`);
    } catch (issue) {
      setError(issue.message || tr('تعذر حفظ المستخدم.', 'Could not save user.', language));
      if (issue.status === 401) onSessionExpired();
    } finally { setBusy(false); }
  }

  if (loading) return <p role="status">{tr('جارٍ تحميل المستخدم…', 'Loading user…', language)}</p>;
  if (id && !record) return <div className="dash-empty" role="alert"><p>{error || tr('تعذر تحميل المستخدم.', 'Could not load user.', language)}</p><Link className="dash-action" to="/dashboard/users">{tr('العودة إلى المستخدمين', 'Back to users', language)}</Link></div>;
  return <>
    <header className="dash-heading"><div><h1>{tr(id ? 'تعديل المستخدم' : 'إضافة مستخدم', id ? 'Edit user' : 'Add user', language)}</h1><p>{tr('اختر الأقسام التي يستطيع هذا الحساب إدارتها.', 'Choose the sections this account can manage.', language)}</p></div></header>
    <Link className="dash-back" to="/dashboard/users">{tr('العودة إلى المستخدمين', 'Back to users', language)}</Link>
    <form className="dash-form" onSubmit={submit}>
      <div className="dash-form-grid">
        <label>{tr('الاسم الكامل', 'Full name', language)}<input name="full_name" defaultValue={record?.full_name || ''} required maxLength="255" autoComplete="name" /></label>
        <label>{tr('اسم الدخول الظاهر في القائمة', 'Login name shown in the list', language)}<input name="login_name" defaultValue={record?.login_name || ''} required minLength="3" maxLength="40" pattern="[A-Za-z0-9._-]{3,40}" autoComplete="off" dir="ltr" /><span className="dash-secondary">{tr('حروف إنجليزية أو أرقام أو . _ -', 'Letters, numbers, . _ -', language)}</span></label>
        <label>{tr('البريد الإلكتروني (اختياري)', 'Email (optional)', language)}<input name="email" type="email" defaultValue={record?.email || ''} maxLength="255" autoComplete="off" /></label>
        <label>{tr('رقم الهاتف (اختياري)', 'Phone (optional)', language)}<input name="phone" type="tel" defaultValue={record?.phone || ''} maxLength="30" autoComplete="off" /></label>
        <label>{tr('نوع الحساب', 'Account type', language)}<select name="role_code" value={role} onChange={(event) => chooseRole(event.target.value)} required>{roles.map(([value, ar, en]) => <option key={value} value={value}>{tr(ar, en, language)}</option>)}</select></label>
        {id && <label>{tr('حالة الحساب', 'Account status', language)}<select name="is_active" defaultValue={String(record?.is_active)}><option value="true">{tr('نشط', 'Active', language)}</option><option value="false">{tr('موقوف', 'Inactive', language)}</option></select></label>}
        <label>{tr(id ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور', id ? 'New password (optional)' : 'Password', language)}<input name="password" type="password" required={!id} minLength="12" maxLength="1024" autoComplete="new-password" /></label>
      </div>
      <fieldset className="dash-permissions"><legend>{tr('صلاحيات الأقسام', 'Section permissions', language)}</legend>
        {role === 'super_admin' && <p className="dash-secondary">{tr('المشرف العام يملك صلاحية جميع الأقسام وإدارة المستخدمين.', 'Super Admin can manage every section and user.', language)}</p>}
        <div className="dash-permission-grid">{Object.entries(labels).map(([scope, [ar, en]]) => <label className="dash-checkbox-label" key={scope}><span>{tr(ar, en, language)}</span><input type="checkbox" checked={role === 'super_admin' || permissions.includes(scope)} disabled={role === 'super_admin'} onChange={() => toggleScope(scope)} /></label>)}</div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <div className="dash-form-actions"><button className="dash-action dash-action--primary" type="submit" disabled={busy}>{tr(busy ? 'جارٍ الحفظ…' : 'حفظ', busy ? 'Saving…' : 'Save', language)}</button><Link className="dash-action" to="/dashboard/users">{tr('إلغاء', 'Cancel', language)}</Link></div>
    </form>
  </>;
}
