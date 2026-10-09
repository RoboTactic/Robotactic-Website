import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createDashboardRecord, deleteDashboardRecord, getAdminSession, getLoginOptions, loginAdmin, logoutAdmin, updateDashboardRecord, uploadDashboardImage } from '../../services/api/dashboard';
import { dashboardCache } from '../../services/api/dashboardCache';
import { useDashboardData } from '../../services/api/useDashboardData';
import Icon from '../../components/Icon/Icon';
import Logo from '../../components/Logo/Logo';
import DateTimeField from './DateTimeField';
import ImageUploadField from './ImageUploadField';
import { SpeakerDetails, SpeakerEditor } from './Speakers';
import { UserEditor } from './Users';
import AboutEditor from './AboutEditor';
import { teamMemberFields } from './teamMemberFields';
import './Dashboard.css';

const BASE = '/dashboard';
const navIcons = { competitions: 'competition', workshops: 'workshop', projects: 'project', announcements: 'globe', teams: 'users', speakers: 'users', users: 'users', about: 'globe', 'team-members': 'users' };
const roleNames = { super_admin: ['المشرف العام', 'Super Admin'], competition_manager: ['مسؤول المسابقات', 'Competition Manager'], workshop_manager: ['مسؤول الورش', 'Workshop Manager'], team_member: ['عضو الفريق', 'Team Member'] };
const statusOptions = [['draft', 'مسودة', 'Draft'], ['published', 'منشور', 'Published'], ['hidden', 'مخفي', 'Hidden']];
const registrationOptions = [['coming_soon', 'قريبًا', 'Coming soon'], ['open', 'مفتوح', 'Open'], ['closed', 'مغلق', 'Closed']];
const field = (name, labelAr, labelEn, type = 'text', required = false, options) => ({ name, label: [labelAr, labelEn], type, required, options });
const contentFields = {
  'team-members': teamMemberFields,
  competitions: [field('name_ar','الاسم بالعربية','Arabic name','text',true),field('name_en','الاسم بالإنجليزية','English name','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('category_code','الفئة','Category','select',true,[['combat','قتال آلي','Combat'],['simulation','محاكاة','Simulation'],['sensing','استشعار','Sensing'],['other','أخرى','Other']]),field('requirements_ar','المتطلبات بالعربية','Arabic requirements','textarea'),field('requirements_en','المتطلبات بالإنجليزية','English requirements','textarea'),field('audience_type','الفئة المستهدفة','Audience'),field('team_size_min','أقل عدد أعضاء','Minimum team size','number'),field('team_size_max','أكبر عدد أعضاء','Maximum team size','number'),field('max_teams','الحد الأعلى للفرق','Maximum teams','number'),field('start_at','موعد البداية','Start date','datetime-local'),field('end_at','موعد النهاية','End date','datetime-local'),field('registration_status','حالة التسجيل','Registration status','select',true,registrationOptions),field('registration_url','رابط التسجيل','Registration URL','url'),field('image_url','رابط الصورة','Image URL','url'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  workshops: [field('title_ar','العنوان بالعربية','Arabic title','text',true),field('title_en','العنوان بالإنجليزية','English title','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('image_url','رابط الصورة','Image URL','url'),field('start_at','موعد البداية','Start date and time','datetime-local',true),field('end_at','موعد النهاية','End date and time','datetime-local'),field('capacity','السعة','Capacity','number'),field('available_seats','المقاعد المتاحة','Available seats','number'),field('registration_status','حالة التسجيل','Registration status','select',true,registrationOptions),field('registration_url','رابط التسجيل الخارجي','External registration URL','url'),field('meeting_url','رابط اللقاء','Meeting URL','url'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  projects: [field('name_ar','اسم المشروع بالعربية','Arabic name','text',true),field('name_en','اسم المشروع بالإنجليزية','English name','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('project_type','نوع المشروع','Project type','select',true,[['defense','دفاعي','Defense'],['invention','ابتكار','Invention']]),field('category_id','رقم الفئة','Category ID','number'),field('image_url','رابط الصورة','Image URL','url'),field('team_name','اسم الفريق','Team name','text',true),field('team_leader_name','قائد الفريق','Team leader'),field('members','أعضاء المشروع بصيغة JSON','Project members as JSON','members-json'),field('project_url','رابط المشروع','Project URL','url'),field('video_url','رابط الفيديو','Video URL','url'),field('technologies','التقنيات','Technologies'),field('stage_ar','مرحلة المشروع بالعربية','Arabic project stage'),field('stage_en','مرحلة المشروع بالإنجليزية','English project stage'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  announcements: [field('title_ar','العنوان بالعربية','Arabic title','text',true),field('title_en','العنوان بالإنجليزية','English title','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea'),field('description_en','الوصف بالإنجليزية','English description','textarea'),field('image_url','رابط الصورة','Image URL','url'),field('link_url','رابط الإعلان','Announcement URL','url'),field('start_at','وقت بدء النشر','Publication start','datetime-local'),field('end_at','وقت انتهاء النشر','Publication end','datetime-local'),field('status','حالة الإعلان','Announcement status','select',true,[['draft','مسودة','Draft'],['published','منشور','Published'],['in_review','قيد المراجعة','In review'],['expired','منتهي','Expired']])],
  teams: [field('competition_id','المسابقة','Competition','competition-lookup',true),field('team_name','اسم الفريق','Team name','text',true),field('team_leader_name','اسم القائد','Team leader','text',true),field('leader_email','بريد القائد','Leader email','email',true),field('leader_phone','هاتف القائد','Leader phone','tel',true),field('member_names','أسماء الأعضاء','Member names','textarea',true)],
};
const navResources = [
  { key: 'about', label: ['عن الملتقى','About page'] },
  { key: 'team-members', label: ['فريق الملتقى','Event team'] },
  { key: 'competitions', label: ['المسابقات','Competitions'] },
  { key: 'workshops', label: ['الورش','Workshops'] },
  { key: 'projects', label: ['المشاريع','Projects'] },
  { key: 'announcements', label: ['الإعلانات','Announcements'] },
  { key: 'teams', label: ['الفرق','Teams'] },
  { key: 'speakers', label: ['المتحدثون','Speakers'] },
  { key: 'users', label: ['المستخدمون والصلاحيات','Users and permissions'] },
];
const resourceSingular = {
  competitions: ['مسابقة', 'Competition'], workshops: ['ورشة', 'Workshop'],
  projects: ['مشروع', 'Project'], announcements: ['إعلان', 'Announcement'],
  teams: ['فريق', 'Team'], 'team-members': ['عضو فريق الملتقى', 'Event team member'],
};
const canAccess = (admin, key) => admin.role_code === 'super_admin' || (!['users','about','team-members'].includes(key) && admin.permissions?.includes(key));
const permissionNames = Object.fromEntries(navResources.map(({key,label})=>[key,label]));
const labels = { name_ar:['الاسم بالعربية','Arabic name'], name_en:['الاسم بالإنجليزية','English name'], title_ar:['العنوان بالعربية','Arabic title'], title_en:['العنوان بالإنجليزية','English title'], team_name:['الفريق','Team'], full_name:['الاسم','Name'], team_leader_name:['قائد الفريق','Team leader'], workshops:['الورش','Workshops'], phone:['الهاتف','Phone'], notes:['ملاحظات خاصة','Private notes'], category_code:['الفئة','Category'], project_type:['نوع المشروع','Project type'], registration_status:['حالة التسجيل','Registration'], status:['حالة النشر','Status'], role_code:['الصلاحية','Role'], is_active:['الحالة','Active'], leader_email:['البريد','Email'], email:['البريد','Email'], start_at:['البداية','Start'], registered_at:['تاريخ التسجيل','Registered'] };
const t = (value, language) => Array.isArray(value) ? value[language === 'ar' ? 0 : 1] : String(value ?? '');
for (const item of teamMemberFields) labels[item.name] = item.label;
labels.login_name = ['اسم الدخول', 'Login name'];
labels.permissions = ['صلاحيات الأقسام', 'Section permissions'];
labels.is_featured = ['إبراز في الرئيسية', 'Featured on home'];
labels.competition_id = ['المسابقة', 'Competition'];
labels.registered_at = ['تاريخ التسجيل', 'Registered'];
const dateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const messageForError = (error, language) => error?.message || (language === 'ar' ? 'تعذر إكمال الطلب.' : 'The request could not be completed.');

function Action({ children, primary, danger, ...props }) {
  return <button type="button" className={`dash-action ${primary ? 'dash-action--primary' : ''} ${danger ? 'dash-action--danger' : ''}`} {...props}>{children}</button>;
}
function Heading({ title, description, action }) {
  return <header className="dash-heading"><div><span className="dash-overline" lang="en">ROBOTACTIC</span><h1 tabIndex="-1">{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}
function Login({ language, onLogin }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    getLoginOptions().then((items) => { if (active) { setAccounts(items); setError(''); } })
      .catch((issue) => { if (active) { setAccounts(null); setError(messageForError(issue, language)); } });
    return () => { active = false; };
  }, [revision, language]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { await onLogin({ login_name: form.get('login_name'), password: form.get('password') }); }
    catch (issue) { setError(messageForError(issue, language)); }
    finally { setBusy(false); }
  }
  const ar = language === 'ar';
  const hasAccounts = accounts?.length > 0;
  const retry = () => { setError(''); setAccounts(null); setRevision(value => value + 1); };
  return (
    <section className="dash-content dash-login-page">
      <div className="dash-login">
        <Heading title={<>{ar ? 'دخول فريق ' : ''}<bdi className="dash-login-brand" lang="en">RoboTactic</bdi>{ar ? '' : ' team sign in'}</>} description={t(['اختر حسابك وأدخل كلمة المرور.', 'Choose your account and enter its password.'], language)} />
        <form className="dash-form dash-login-form" onSubmit={submit}>
          <div className="dash-field"><label htmlFor="dash-login-account">{t(['الحساب', 'Account'], language)}</label>
            <select id="dash-login-account" name="login_name" required defaultValue="" disabled={!hasAccounts || busy} aria-describedby={!hasAccounts ? 'dash-login-status' : undefined}>
              <option value="">{t(['اختر الحساب…', 'Choose an account…'], language)}</option>
              {accounts?.map(account => <option key={account.login_name} value={account.login_name}>{t(roleNames[account.role_code] || [account.role_code, account.role_code], language)} — {account.login_name}</option>)}
            </select>
          </div>
          <div className="dash-field"><label htmlFor="dash-login-password">{t(['كلمة المرور', 'Password'], language)}</label>
            <input id="dash-login-password" name="password" type="password" autoComplete="current-password" required maxLength="1024" disabled={!hasAccounts || busy} />
          </div>
          {accounts === null && !error && <p id="dash-login-status" className="dash-login-status" role="status">{t(['جارٍ تحميل الحسابات…', 'Loading accounts…'], language)}</p>}
          {accounts?.length === 0 && <p id="dash-login-status" className="dash-login-status" role="status">{t(['لا توجد حسابات نشطة. اطلب من المشرف إضافة حسابك أو تفعيله.', 'No active accounts. Ask the administrator to add or activate your account.'], language)}</p>}
          {error && <p id="dash-login-status" className="dash-login-status" role="alert">{error}</p>}
          <div className="dash-form-actions">
            <button className="dash-action dash-action--primary" type="submit" disabled={busy || !hasAccounts}>{busy ? t(['جارٍ الدخول…', 'Signing in…'], language) : t(['دخول', 'Sign in'], language)}</button>
            {((error && !accounts) || accounts?.length === 0) && <button className="dash-action" type="button" onClick={retry}>{t(['تحديث الحسابات', 'Refresh accounts'], language)}</button>}
          </div>
        </form>
      </div>
    </section>
  );
}
function RecordTitle({ resource, record, language }) {
  const key = resource === 'competitions' || resource === 'projects' || resource === 'team-members' ? 'name' : resource === 'workshops' ? 'title' : resource === 'announcements' ? 'title' : resource === 'speakers' ? 'full_name' : resource === 'users' ? 'full_name' : 'team_name';
  const title = record[`${key}_${language}`] || record[key] || record.full_name || `#${record.id}`;
  return <bdi lang={/[\u0600-\u06ff]/.test(title) ? 'ar' : 'en'}>{title}</bdi>;
}
function displayValue(value, language) {
  if (typeof value === 'boolean') return value ? t(['نعم','Yes'],language) : t(['لا','No'],language);
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? t(permissionNames[item] || [item,item],language) : item?.name || item?.title_ar || item?.title_en || '').filter(Boolean).join('، ') || '—';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
const cardFields = {
  'team-members': ['role_ar','role_en','display_order','status'],
  competitions: ['category_code','start_at','registration_status','status'],
  workshops: ['start_at','registration_status','status'],
  projects: ['project_type','status','is_featured'],
  announcements: ['status','is_featured'],
  teams: ['competition_id','registered_at'],
  speakers: ['workshops'],
  users: ['login_name','role_code','permissions','is_active'],
};
const cardOptions = {
  draft: ['مسودة','Draft'], published: ['منشور','Published'], hidden: ['مخفي','Hidden'],
  coming_soon: ['قريبًا','Coming soon'], open: ['مفتوح','Open'], closed: ['مغلق','Closed'],
  in_review: ['قيد المراجعة','In review'], expired: ['منتهي','Expired'],
  combat: ['قتال آلي','Combat'], simulation: ['محاكاة','Simulation'], sensing: ['استشعار','Sensing'],
  defense: ['دفاعي','Defense'], invention: ['ابتكار','Invention'],
};
function cardValue(key, value, language) {
  if (key === 'role_code') return t(roleNames[value] || [value,value],language);
  if (['start_at','end_at','registered_at'].includes(key) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
  if (typeof value === 'string' && cardOptions[value]) return t(cardOptions[value],language);
  return displayValue(value, language);
}
function RecordCard({ resource, record, language, onDelete, canEdit }) {
  const visible = (cardFields[resource] || []).filter((key) => Object.hasOwn(record,key));
  return <article className="dash-card"><div className="dash-card-heading"><h2><RecordTitle resource={resource} record={record} language={language}/></h2></div>{visible.length > 0 && <dl className="dash-meta">{visible.map((key)=><div key={key}><dt>{t(labels[key] || contentFields[resource]?.find(item=>item.name===key)?.label || [key,key],language)}</dt><dd>{cardValue(key,record[key],language)}</dd></div>)}</dl>}<div className="dash-card-actions"><Link className="dash-action" to={`${BASE}/${resource}/${record.id}`}>{t(['التفاصيل','Details'],language)}</Link>{canEdit && <Link className="dash-action" to={`${BASE}/${resource}/${record.id}/edit`}>{t(['تعديل','Edit'],language)}</Link>}{canEdit && <Action danger onClick={()=>onDelete(record)}>{t(['حذف','Delete'],language)}</Action>}</div></article>;
}
function DashboardHome({ language, admin, onSessionExpired }) {
  const allowed = navResources.filter((item)=>canAccess(admin,item.key));
  const { data: counts, loading, error, reload } = useDashboardData('/admin/stats', onSessionExpired);
  const formatter=new Intl.NumberFormat(language==='ar'?'ar-SA':'en-US');
  return <>
    <Heading title={t(['لوحة التحكم','Dashboard'],language)} description={t(['إجمالي السجلات في الأقسام المتاحة لك.','Total records in the sections available to you.'],language)}/>
    {loading&&<p role="status">{t(['جارٍ تحميل الأعداد…','Loading counts…'],language)}</p>}
    {error&&<div className="dash-empty" role="alert"><p>{error}</p><Action onClick={reload}>{t(['إعادة المحاولة','Retry'],language)}</Action></div>}
    <div className="dash-stats" aria-busy={loading}>{allowed.map(({key,label})=><Link className="dash-stat" key={key} to={`${BASE}/${key}`}><strong>{counts?.[key] == null ? '—' : formatter.format(counts[key])}</strong><span>{t(label,language)}</span></Link>)}</div>
  </>;
}
function Listing({ language, admin, notify, onSessionExpired }) {
  const { section } = useParams(); const [params] = useSearchParams(); const parent = params.get('parent');
  const [query,setQuery]=useState('');
  const config=navResources.find((item)=>item.key===section && canAccess(admin,item.key));
  const { data, loading, error, reload } = useDashboardData(config ? `/admin/${section}${parent ? `?parent=${encodeURIComponent(parent)}` : ''}` : null, onSessionExpired);
  const records = data || [];
  const searchInput = useRef(null);
  useEffect(() => setQuery(''), [section, parent]);
  const canEdit=true;
  async function remove(record) {
    const accepted=window.confirm(t(section==='speakers'?['حذف المتحدث وإزالته من جميع الورش؟','Delete this speaker and remove all workshop assignments?']:['هل تريد حذف هذا السجل؟','Delete this record?'],language));if(!accepted)return;
    try{await deleteDashboardRecord(section,record.id);notify(t(['تم حذف السجل.','Record deleted.'],language));}
    catch(issue){if(issue.status===401)onSessionExpired();notify(messageForError(issue,language));}
  }
  if(!config)return <Heading title={t(['ليس لديك صلاحية لهذا القسم.','You do not have access to this section.'],language)}/>;
  const filtered=records.filter((record)=>JSON.stringify(record).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const parentQuery=parent?`?parent=${encodeURIComponent(parent)}`:'';
  return <><Heading title={t(config.label,language)} action={canEdit?<Link className="dash-action dash-action--primary" to={`${BASE}/${section}/new${parentQuery}`}>+ {t(['إضافة','Add'],language)}</Link>:null}/>
    {section==='teams' && parent && <Link className="dash-back" to={`${BASE}/competitions/${parent}`}>{t(['العودة للمسابقة','Back to competition'],language)}</Link>}
    {section==='speakers' && parent && <Link className="dash-back" to={`${BASE}/workshops/${parent}`}>{t(['العودة للورشة','Back to workshop'],language)}</Link>}
    <div className="dash-filters">{!loading&&!error&&<p className="dash-result-count" role="status" aria-live="polite"><span>{t(query.trim()?['نتائج البحث','Search results']:['السجلات','Records'],language)}</span><strong>{new Intl.NumberFormat(language==='ar'?'ar-SA':'en-US').format(filtered.length)}</strong></p>}<div className="dash-search"><label htmlFor="dash-record-search">{t(['بحث في السجلات','Search records'],language)}</label><div className="dash-search-input"><Icon name="search" size={20}/><input ref={searchInput} id="dash-record-search" type="search" placeholder={t(['ابحث بالاسم أو التفاصيل…','Search by name or details…'],language)} value={query} onChange={event=>setQuery(event.target.value)} maxLength="100"/>{query&&<button type="button" aria-label={t(['مسح البحث','Clear search'],language)} onClick={()=>{setQuery('');searchInput.current?.focus();}}><Icon name="close" size={18}/></button>}</div></div></div>
    {error && data && <div className="dash-empty" role="alert"><p>{error}</p><Action onClick={reload}>{t(['إعادة المحاولة','Retry'],language)}</Action></div>}
    {loading?<p role="status">{t(['جارٍ تحميل البيانات…','Loading…'],language)}</p>:error&&!data?<div className="dash-empty" role="alert"><p>{error}</p><Action onClick={reload}>{t(['إعادة المحاولة','Retry'],language)}</Action></div>:!filtered.length?<div className="dash-empty dash-empty--records" role="status"><Icon name={navIcons[section]} size={32}/><h2>{t(query.trim()?['لا توجد نتائج مطابقة.','No matching results.']:['لا توجد سجلات بعد.','No records yet.'],language)}</h2><p>{t(query.trim()?['جرّب كلمة أخرى أو امسح البحث.','Try another term or clear the search.']:['استخدم زر الإضافة لإنشاء أول سجل في هذا القسم.','Use Add to create the first record in this section.'],language)}</p></div>:<div className="dash-grid">{filtered.map((record)=><RecordCard key={record.id} {...{resource:section,record,language,canEdit}} onDelete={remove}/>)}</div>}
  </>;
}
function Details({ language, admin, onSessionExpired }) {
  const {section,id}=useParams();
  const { data: record, error } = useDashboardData(`/admin/${section}/${encodeURIComponent(id)}`, onSessionExpired);
  const label=navResources.find((item)=>item.key===section)?.label;const canEdit=true;
  if(error&&!record)return <div className="dash-empty" role="alert">{error}</div>;if(!record)return <p role="status">{t(['جارٍ تحميل السجل…','Loading record…'],language)}</p>;
  const related=section==='competitions'?['teams',record.id]:section==='workshops'?['speakers',record.id]:null;
  const summaryKeys=['team_name','team_leader_name','category_code','project_type','registration_status','status','role_code','is_active','start_at','end_at','registered_at'];
  const entries=Object.entries(record).filter(([key])=>!['id','created_at','updated_at','password_hash'].includes(key));
  const summary=entries.filter(([key])=>summaryKeys.includes(key));
  const details=entries.filter(([key])=>!summaryKeys.includes(key));
  const fields=(items)=><dl className="dash-meta">{items.map(([key,value])=><div key={key} className={Array.isArray(value)||(typeof value==='string' && value.length>120)?'dash-meta-entry--full':undefined}><dt>{t(labels[key]||contentFields[section]?.find(item=>item.name===key)?.label||[key,key],language)}</dt><dd>{cardValue(key,value,language)}</dd></div>)}</dl>;
  return <>
    <Heading title={<RecordTitle resource={section} record={record} language={language}/>} description={t(label || [section,section],language)}/>
    <Link className="dash-back" to={`${BASE}/${section}`}>{t(['العودة للقائمة','Back to list'],language)}</Link>
    {error && <p role="alert">{error}</p>}
    <div className="dash-details-layout">
      <article className="dash-card dash-detail-fields">
        <h2>{t(['الملخص','Overview'],language)}</h2>
        {summary.length?fields(summary):<p className="dash-secondary"><RecordTitle resource={section} record={record} language={language}/></p>}
        <div className="dash-form-actions">
          {related && <Link className="dash-action dash-action--primary" to={`${BASE}/${related[0]}?parent=${related[1]}`}>{t(related[0]==='teams'?['الفرق المسجلة','Registered teams']:['متحدثو الورشة','Workshop speakers'],language)}</Link>}
          {canEdit && <Link className="dash-action" to={`${BASE}/${section}/${id}/edit`}>{t(['تعديل','Edit'],language)}</Link>}
        </div>
      </article>
      <article className="dash-card dash-detail-fields">
        <h2>{t(['التفاصيل','Details'],language)}</h2>
        {details.length?fields(details):<p className="dash-secondary">{t(['لا توجد تفاصيل إضافية.','No additional details.'],language)}</p>}
      </article>
    </div>
  </>;
}
function CompetitionSelect({ language, defaultValue, onSessionExpired }) {
  const { data: options = [], error } = useDashboardData('/admin/lookups/competitions', onSessionExpired);
  const [selected, setSelected] = useState(String(defaultValue || ''));
  return <div className="dash-field"><label htmlFor="dash-competition-id">{t(['المسابقة', 'Competition'],language)}</label><select id="dash-competition-id" name="competition_id" value={selected} onChange={(event)=>setSelected(event.target.value)} required><option value="">{t(['اختر مسابقة…', 'Choose a competition…'],language)}</option>{options.map((item)=><option key={item.id} value={item.id}>{item[`name_${language}`] || item.name_ar || item.name_en}</option>)}</select>{error && <p role="alert">{error}</p>}</div>;
}
function Editor({ language, admin, notify, onSessionExpired }) {
  const {section,id}=useParams();const [params]=useSearchParams();const navigate=useNavigate();const config=navResources.find((item)=>item.key===section && canAccess(admin,item.key));
  const { data: record, loading, error: loadError } = useDashboardData(id && config ? `/admin/${section}/${encodeURIComponent(id)}` : null, onSessionExpired, { editable: true });
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  if(!config)return <Heading title={t(['ليس لديك صلاحية لهذا القسم.','You do not have access to this section.'],language)}/>;
  const fields=contentFields[section];
  if(loading)return <p role="status">{t(['جارٍ تحميل السجل…','Loading record…'],language)}</p>;
  if(id && !record)return <div className="dash-empty" role="alert">{loadError}</div>;
  async function submit(event){event.preventDefault();setBusy(true);setError('');const form=new FormData(event.currentTarget);const payload={};const imageFile=form.get('image_file');
  try { for(const item of fields){const value=form.get(item.name);if(item.type==='checkbox')payload[item.name]=form.get(item.name)==='on';else if(item.name==='password' && !value)continue;else if(value==='' || value==null)payload[item.name]=null;else if(item.type==='number' || item.type==='competition-lookup')payload[item.name]=Number(value);else if(item.type==='datetime-local')payload[item.name]=new Date(value).toISOString();else if(item.type==='members-json')payload.members=JSON.parse(value);else if(item.name==='is_active')payload[item.name]=value==='true';else payload[item.name]=value;} }
    catch { setError(t(['صيغة أعضاء المشروع يجب أن تكون مصفوفة JSON صحيحة.','Project members must be a valid JSON array.'],language));setBusy(false);return; }
    try{if(imageFile instanceof File && imageFile.size){if(!['image/jpeg','image/png','image/webp'].includes(imageFile.type)||imageFile.size>5*1024*1024)throw new Error(t(['اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز 5 ميغابايت.','Choose a JPEG, PNG, or WebP image up to 5 MB.'],language));const uploaded=await uploadDashboardImage(section,imageFile);payload.image_url=uploaded.url;}const saved=id?await updateDashboardRecord(section,id,payload):await createDashboardRecord(section,payload);notify(t(['تم حفظ التغييرات.','Changes saved.'],language));navigate(`${BASE}/${section}/${saved.id}`);}
    catch(issue){setError(issue.status===503 && imageFile instanceof File && imageFile.size ? t(['رفع الصور غير مهيأ في الخادم. أضف مفتاح Supabase السري في إعدادات الباك إند.','Image storage is not configured on the server. Add the Supabase secret key to the backend settings.'],language) : messageForError(issue,language));if(issue.status===401)onSessionExpired();}
    finally{setBusy(false);}
  }
  return <><Heading title={`${t(id?['تعديل','Edit']:['إضافة','Add'],language)} ${t(resourceSingular[section] || config.label,language)}`}/><Link className="dash-back" to={`${BASE}/${section}`}>{t(['إلغاء والعودة','Cancel and return'],language)}</Link><form className="dash-form" onSubmit={submit}>{section==='team-members'&&<p className="dash-secondary">{t(['أضف فقط وسائل التواصل التي وافق العضو على نشرها. اختر «منشور» لعرض العضو للزوار.','Only add contacts approved for publication. Choose Published to show this member to visitors.'],language)}</p>}<div className="dash-form-grid">{fields.map((item)=>{const value=record?.[item.name];const parentValue=!id&&section==='teams'&&item.name==='competition_id'?params.get('parent'):!id&&section==='speakers'&&item.name==='workshop_id'?params.get('parent'):null;const display=item.type==='datetime-local'?dateInput(value):item.type==='checkbox'?(value?'on':''):item.type==='members-json'?JSON.stringify(record?.members||[],null,2):(value??parentValue??(section==='team-members'&&item.name==='status'?'draft':section==='team-members'&&item.name==='display_order'?1:''));const multiline=['textarea','members-json'].includes(item.type);if(item.type==='competition-lookup')return <CompetitionSelect key={item.name} language={language} defaultValue={display} onSessionExpired={onSessionExpired}/>;if(item.type==='datetime-local')return <div className="dash-field" key={item.name}><label htmlFor={`dash-date-${item.name}`}>{t(item.label,language)}</label><DateTimeField name={item.name} dir={item.name.endsWith('_en')?'ltr':item.name.endsWith('_ar')?'rtl':undefined} defaultValue={display} required={item.required} language={language}/></div>;return <label className={multiline?'dash-field--full':''} key={item.name}>{t(item.label,language)}{multiline?<textarea name={item.name} dir={item.name.endsWith('_en')?'ltr':item.name.endsWith('_ar')?'rtl':undefined} defaultValue={display} required={item.required} maxLength="10000" rows="6"/>:item.type==='select'?<select name={item.name} dir={item.name.endsWith('_en')?'ltr':item.name.endsWith('_ar')?'rtl':undefined} defaultValue={display} required={item.required}><option value="">{t(['اختر…','Choose…'],language)}</option>{item.options.map(([option,ar,en])=><option key={option} value={option}>{language==='ar'?ar:en}</option>)}</select>:item.type==='checkbox'?<input name={item.name} type="checkbox" defaultChecked={display==='on'} />:<input name={item.name} type={item.type} dir={item.name.endsWith('_en')||['url','email'].includes(item.type)?'ltr':item.name.endsWith('_ar')?'rtl':undefined} defaultValue={display} required={item.required && !(item.name==='password'&&id)} maxLength={item.type==='password'?1024:4000} min={item.type==='number'?(item.name==='display_order'?1:0):undefined} minLength={item.type==='password'?12:undefined} autoComplete={item.type==='password'?'new-password':'off'}/>}</label>;})}{fields.some((item)=>item.name==='image_url')&&<ImageUploadField language={language} currentUrl={record?.image_url}/>}</div>{error&&<p role="alert">{error}</p>}{section==='projects'&&<p className="dash-secondary">{t(['صيغة العضو: { "name": "الاسم", "linkedin_url": "https://…", "x_url": "https://…" }','Member format: { "name": "Name", "linkedin_url": "https://…", "x_url": "https://…" }'],language)}</p>}<div className="dash-form-actions"><button className="dash-action dash-action--primary" disabled={busy} type="submit">{busy?t(['جارٍ الحفظ…','Saving…'],language):t(['حفظ','Save'],language)}</button><Link className="dash-action" to={`${BASE}/${section}`}>{t(['إلغاء','Cancel'],language)}</Link></div></form></>;
}
function DetailsRoute(props) { const {section}=useParams(); return section==='speakers'?<SpeakerDetails {...props}/>:<Details {...props}/>; }
function EditorRoute(props) { const {section}=useParams(); return section==='speakers'?<SpeakerEditor {...props}/>:section==='users'?<UserEditor {...props}/>:<Editor {...props}/>; }
function DashboardContent({ language, admin, notify, onSessionExpired }) {
  const location=useLocation();const allowed=navResources.filter((item)=>canAccess(admin,item.key));const [menu,setMenu]=useState(false);const menuButton=useRef(null);
  useEffect(()=>{document.querySelector('.dash-heading h1')?.focus();setMenu(false);},[location.pathname,location.search]);
  return <><div className="dash-toolbar"><Action ref={menuButton} aria-expanded={menu} aria-controls="dashboard-nav" onClick={()=>setMenu((value)=>!value)}>{t(menu?['إغلاق القائمة','Close menu']:['القائمة','Menu'],language)}</Action></div><div className="dash-layout"><aside className={`dash-sidebar ${menu?'is-open':''}`} onKeyDown={event=>{if(event.key==='Escape' && menu){event.preventDefault();setMenu(false);menuButton.current?.focus();}}}><nav id="dashboard-nav" aria-label={t(['تنقل لوحة التحكم','Dashboard navigation'],language)}><NavLink end to={BASE}><Icon name="sensor" className="dash-nav-icon"/><span>{t(['الرئيسية','Home'],language)}</span></NavLink>{allowed.map(({key,label})=><NavLink key={key} to={`${BASE}/${key}`}><Icon name={navIcons[key]} className="dash-nav-icon"/><span>{t(label,language)}</span></NavLink>)}</nav><div className="dash-sidebar-bottom"><div className="dash-user"><span className="dash-user-avatar" aria-hidden="true"><Icon name="users" size={24}/></span><div className="dash-user-copy"><strong lang={/[\u0600-\u06ff]/.test(admin.full_name)?'ar':'en'} dir="auto">{admin.full_name}</strong><span className="dash-user-role">{t(roleNames[admin.role_code],language)}</span></div></div><Action className="dash-action dash-signout" onClick={async()=>{try{await logoutAdmin();}catch{}finally{onSessionExpired();}}}><Icon name="logout" className="dash-nav-icon"/><span>{t(['تسجيل الخروج','Sign out'],language)}</span></Action></div></aside><section className="dash-content" id="dashboard-content" tabIndex="-1"><div className={`dash-page ${/\/(?:new|edit|about)$/.test(location.pathname)?'dash-page--editor':''}`}><Routes><Route path="about" element={<AboutEditor {...{language,admin,notify,onSessionExpired}}/>}/><Route index element={<DashboardHome language={language} admin={admin} onSessionExpired={onSessionExpired}/>}/><Route path=":section" element={<Listing {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/new" element={<EditorRoute key={location.pathname} {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/:id/edit" element={<EditorRoute key={location.pathname} {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/:id" element={<DetailsRoute key={location.pathname} {...{language,admin,onSessionExpired}}/>}/></Routes></div></section></div></>;
}
export default function Dashboard() {
  const [language,setLanguage]=useState('ar');const [admin,setAdmin]=useState(null);const [checked,setChecked]=useState(false);const [message,setMessage]=useState('');const location=useLocation();
  const onSessionExpired=useCallback(()=>{dashboardCache.clear();setAdmin(null);},[]);
  useEffect(()=>dashboardCache.subscribe((_path,type)=>{if(type==='expired')onSessionExpired();}),[onSessionExpired]);
  useEffect(()=>{const oldLang=document.documentElement.lang;const oldDir=document.documentElement.dir;document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';return()=>{document.documentElement.lang=oldLang;document.documentElement.dir=oldDir;};},[language]);
  useEffect(()=>{let active=true;getAdminSession().then((session)=>{if(active)setAdmin(session);}).catch(()=>{if(active)setAdmin(null);}).finally(()=>{if(active)setChecked(true);});return()=>{active=false;};},[]);
  useEffect(()=>()=>dashboardCache.clear(),[]);
  useEffect(()=>{setMessage('');},[location.pathname,location.search]);
  async function login(credentials){const session=await loginAdmin(credentials);setAdmin(session);}
  return <div className="dashboard" lang={language} dir={language==='ar'?'rtl':'ltr'}><header className="dash-header"><Link to="/" aria-label="RoboTactic"><Logo layout="horizontal"/></Link><button type="button" className="dash-language" lang={language==='ar'?'en':'ar'} dir={language==='ar'?'ltr':'rtl'} onClick={()=>setLanguage(language==='ar'?'en':'ar')}><Icon name="globe" size={20}/>{language==='ar'?'English':'العربية'}</button></header>{message&&<div className="dash-notice" role="status">{message}<Action onClick={()=>setMessage('')}>{t(['إغلاق','Dismiss'],language)}</Action></div>}{!checked?<p className="api-state" role="status">{t(['جارٍ التحقق من الجلسة…','Checking session…'],language)}</p>:admin?<DashboardContent key={admin.id} {...{language,admin,notify:setMessage,onSessionExpired}}/>:<Login language={language} onLogin={login}/>}</div>;
}
