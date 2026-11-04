import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createDashboardRecord, deleteDashboardRecord, getAdminSession, getLoginOptions, loginAdmin, logoutAdmin, updateDashboardRecord, uploadDashboardImage } from '../../services/api/dashboard';
import { dashboardCache } from '../../services/api/dashboardCache';
import { useDashboardData } from '../../services/api/useDashboardData';
import Icon from '../../components/Icon/Icon';
import Logo from '../../components/Logo/Logo';
import DateTimeField from './DateTimeField';
import ImageUploadField from './ImageUploadField';
import { messageForError } from './errorMessages';
import { SpeakerDetails, SpeakerEditor } from './Speakers';
import { UserEditor } from './Users';
import AboutEditor from './AboutEditor';
import SectionVisibilityPanel from './SectionVisibilityPanel';
import EventStartEditor from './EventStartEditor';
import './Dashboard.css';

const BASE = '/dashboard';
const navIcons = { competitions: 'competition', workshops: 'workshop', projects: 'project', announcements: 'globe', teams: 'users', speakers: 'users', users: 'users', about: 'globe' };
const roleNames = { super_admin: ['المشرف العام', 'Super Admin'], competition_manager: ['مسؤول المسابقات', 'Competition Manager'], workshop_manager: ['مسؤول الورش', 'Workshop Manager'], team_member: ['عضو الفريق', 'Team Member'] };
const statusOptions = [['draft', 'مسودة', 'Draft'], ['published', 'منشور', 'Published'], ['hidden', 'مخفي', 'Hidden']];
const registrationOptions = [['coming_soon', 'قريبًا', 'Coming soon'], ['open', 'مفتوح', 'Open'], ['closed', 'مغلق', 'Closed']];
const field = (name, labelAr, labelEn, type = 'text', required = false, options) => ({ name, label: [labelAr, labelEn], type, required, options });
const contentFields = {
  competitions: [field('name_ar','الاسم بالعربية','Arabic name','text',true),field('name_en','الاسم بالإنجليزية','English name','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('category_code','الفئة','Category','select',true,[['drones','الدرون','Drones'],['controller','وحدة التحكم','Controller'],['sensing','المستشعرات','Sensors'],['combat','قتال آلي','Combat'],['simulation','محاكاة','Simulation'],['other','أخرى','Other']]),field('requirements_ar','المتطلبات بالعربية','Arabic requirements','textarea'),field('requirements_en','المتطلبات بالإنجليزية','English requirements','textarea'),field('audience_type','الفئة المستهدفة','Audience'),field('team_size_min','أقل عدد أعضاء','Minimum team size','number'),field('team_size_max','أكبر عدد أعضاء','Maximum team size','number'),field('max_teams','الحد الأعلى للفرق','Maximum teams','number'),field('start_at','موعد البداية','Start date','datetime-local'),field('end_at','موعد النهاية','End date','datetime-local'),field('registration_status','حالة التسجيل','Registration status','select',true,registrationOptions),field('registration_url','رابط التسجيل','Registration URL','url'),field('image_url','رابط الصورة','Image URL','url'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  workshops: [field('title_ar','العنوان بالعربية','Arabic title','text',true),field('title_en','العنوان بالإنجليزية','English title','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('image_url','رابط الصورة','Image URL','url'),field('start_at','موعد البداية','Start date and time','datetime-local',true),field('end_at','موعد النهاية','End date and time','datetime-local'),field('capacity','السعة','Capacity','number'),field('available_seats','المقاعد المتاحة','Available seats','number'),field('registration_status','حالة التسجيل','Registration status','select',true,registrationOptions),field('registration_url','رابط التسجيل الخارجي','External registration URL','url'),field('meeting_url','رابط اللقاء','Meeting URL','url'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  projects: [field('name_ar','اسم المشروع بالعربية','Arabic name','text',true),field('name_en','اسم المشروع بالإنجليزية','English name','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('project_type','نوع المشروع','Project type','select',true,[['defense','دفاعي','Defense'],['invention','ابتكار','Invention']]),field('category_id','رقم الفئة','Category ID','number'),field('image_url','رابط الصورة','Image URL','url'),field('team_name','اسم الفريق','Team name','text',true),field('team_leader_name','قائد الفريق','Team leader'),field('members','أعضاء المشروع بصيغة JSON','Project members as JSON','members-json'),field('project_url','رابط المشروع','Project URL','url'),field('video_url','رابط الفيديو','Video URL','url'),field('technologies','التقنيات','Technologies'),field('stage_ar','مرحلة المشروع بالعربية','Arabic project stage'),field('stage_en','مرحلة المشروع بالإنجليزية','English project stage'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  announcements: [field('title_ar','العنوان بالعربية','Arabic title','text',true),field('title_en','العنوان بالإنجليزية','English title','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea'),field('description_en','الوصف بالإنجليزية','English description','textarea'),field('image_url','رابط الصورة','Image URL','url'),field('link_url','رابط الإعلان','Announcement URL','url'),field('start_at','وقت بدء النشر','Publication start','datetime-local'),field('end_at','وقت انتهاء النشر','Publication end','datetime-local'),field('status','حالة الإعلان','Announcement status','select',true,[['draft','مسودة','Draft'],['published','منشور','Published'],['in_review','قيد المراجعة','In review'],['expired','منتهي','Expired']])],
  teams: [field('competition_id','المسابقة','Competition','competition-lookup',true),field('team_name','اسم الفريق','Team name','text',true),field('team_leader_name','اسم القائد','Team leader','text',true),field('leader_email','بريد القائد','Leader email','email',true),field('leader_phone','هاتف القائد','Leader phone','tel',true),field('member_names','أسماء الأعضاء','Member names','textarea',true)],
};
// Labels, overlines and descriptions follow Figma «06 · Dashboard» (and the team's earlier
// dashboard copy). Teams and Speakers sit inside competitions/workshops in Figma but keep
// their own entries here because they have their own API sections and permissions.
const navResources = [
  { key: 'competitions', label: ['إدارة المسابقات','Competition management'] },
  { key: 'workshops', label: ['إدارة ورش العمل','Workshop management'] },
  { key: 'projects', label: ['معرض المشاريع','Project showroom'] },
  { key: 'announcements', label: ['المحتوى والإعلانات','Content and announcements'] },
  { key: 'about', label: ['من نحن','About page'] },
  { key: 'teams', label: ['الفرق المسجلة','Registered teams'] },
  { key: 'speakers', label: ['المتحدثون','Speakers'] },
  { key: 'users', label: ['الصلاحيات وكلمات المرور','Permissions and passwords'] },
];
const sectionMeta = {
  home: { overline: 'DASHBOARD', description: ['مرحباً بك في لوحة تحكم RoboTactic','Welcome to the RoboTactic dashboard'] },
  competitions: { overline: 'CONTESTS', description: ['إدارة المسابقات والفرق والطلبات المسجلة','Manage competitions and registered teams'], add: ['إضافة مسابقة جديدة','Add a new competition'], save: ['حفظ المسابقة','Save competition'], form: ['أدخل تفاصيل المسابقة','Enter the competition details'] },
  workshops: { overline: 'WORKSHOPS', description: ['إدارة الورش والمتحدثين ومواعيدها','Manage workshops, speakers and schedules'], add: ['إضافة ورشة جديدة','Add a new workshop'], save: ['حفظ الورشة','Save workshop'], form: ['أدخل تفاصيل الورشة','Enter the workshop details'] },
  projects: { overline: 'PROJECTS', description: ['إدارة مشاريع الفرق المشاركة في المعرض','Manage team projects in the showroom'], add: ['إضافة مشروع جديد','Add a new project'], save: ['حفظ المشروع','Save project'], form: ['أدخل تفاصيل المشروع','Enter the project details'] },
  announcements: { overline: 'CONTENT', description: ['إدارة الإعلانات ونشر المحتوى للزوار','Manage announcements and published content'], add: ['إضافة إعلان جديد','Add a new announcement'], save: ['حفظ الإعلان','Save announcement'], form: ['أدخل تفاصيل الإعلان','Enter the announcement details'] },
  about: { overline: 'ABOUT', description: ['المحتوى المنشور يظهر في صفحة من نحن وفي الصفحة الرئيسية.','Published content appears on the About page and Home page.'] },
  teams: { overline: 'CONTESTS', description: ['الفرق المسجلة في المسابقات','Teams registered in the competitions'], add: ['إضافة فريق','Add a team'], save: ['حفظ الفريق','Save team'], form: ['أدخل تفاصيل الفريق','Enter the team details'] },
  speakers: { overline: 'WORKSHOPS', description: ['متحدثو الورش وظهور أسمائهم للزوار','Workshop speakers and their public visibility'], add: ['إضافة متحدث','Add a speaker'], save: ['حفظ المتحدث','Save speaker'] },
  users: { overline: 'PERMISSIONS', description: ['حسابات فريق التنظيم وصلاحيات الأقسام','Team accounts and section permissions'], add: ['إضافة حساب','Add an account'], save: ['حفظ الحساب','Save account'] },
};
const resourceSingular = {
  competitions: ['مسابقة', 'Competition'], workshops: ['ورشة', 'Workshop'],
  projects: ['مشروع', 'Project'], announcements: ['إعلان', 'Announcement'],
  teams: ['فريق', 'Team'],
};
const canAccess = (admin, key) => admin.role_code === 'super_admin' || (!['users','about','team-members'].includes(key) && admin.permissions?.includes(key));
const permissionNames = Object.fromEntries(navResources.map(({key,label})=>[key,label]));
const labels = { name_ar:['الاسم بالعربية','Arabic name'], name_en:['الاسم بالإنجليزية','English name'], title_ar:['العنوان بالعربية','Arabic title'], title_en:['العنوان بالإنجليزية','English title'], team_name:['الفريق','Team'], full_name:['الاسم','Name'], team_leader_name:['قائد الفريق','Team leader'], workshops:['الورش','Workshops'], phone:['الهاتف','Phone'], notes:['ملاحظات خاصة','Private notes'], category_code:['الفئة','Category'], project_type:['نوع المشروع','Project type'], registration_status:['حالة التسجيل','Registration'], status:['حالة النشر','Status'], role_code:['الصلاحية','Role'], is_active:['الحالة','Active'], leader_email:['البريد','Email'], email:['البريد','Email'], start_at:['البداية','Start'], registered_at:['تاريخ التسجيل','Registered'] };
const t = (value, language) => Array.isArray(value) ? value[language === 'ar' ? 0 : 1] : String(value ?? '');
labels.login_name = ['اسم الدخول', 'Login name'];
labels.permissions = ['صلاحيات الأقسام', 'Section permissions'];
labels.is_featured = ['إبراز في الرئيسية', 'Featured on home'];
labels.competition_id = ['المسابقة', 'Competition'];
labels.registered_at = ['تاريخ التسجيل', 'Registered'];
labels.end_at = ['النهاية', 'End'];
const dateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function Action({ children, primary, danger, className = '', ...props }) {
  return <button type="button" className={`dash-action ${primary ? 'dash-action--primary' : ''} ${danger ? 'dash-action--danger' : ''} ${className}`} {...props}>{children}</button>;
}
function Heading({ title, description, action, overline = 'ROBOTACTIC' }) {
  return <header className="dash-heading"><div><span className="dash-overline" lang="en">{overline}</span><h1 tabIndex="-1">{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}
function Login({ language, onLogin }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [revision, setRevision] = useState(0);
  const [reveal, setReveal] = useState(false);
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
    catch (issue) { setError(issue.status === 401 ? t(['اسم الحساب أو كلمة المرور غير صحيحة.','Incorrect account or password.'], language) : messageForError(issue, language)); }
    finally { setBusy(false); }
  }
  const hasAccounts = accounts?.length > 0;
  const retry = () => { setError(''); setAccounts(null); setRevision((value) => value + 1); };
  return <main className="dash-login-page"><div className="dash-login">
    <Logo layout="horizontal" markHeight={44}/>
    <h1 tabIndex="-1">{t(['تسجيل الدخول','Sign in'],language)}</h1>
    <p className="dash-login-subtitle">{t(['لوحة تحكّم روبوتاكتيك — للمشرفين المخوّلين فقط','RoboTactic dashboard — authorised administrators only'],language)}</p>
    <form className="dash-form dash-login-form" onSubmit={submit} aria-busy={busy}>
      <label>{t(['الحساب','Account'],language)}<select name="login_name" required defaultValue="" disabled={!hasAccounts || busy} aria-describedby={!hasAccounts ? 'dash-login-status' : undefined}><option value="">{t(['اختر الحساب…','Choose an account…'],language)}</option>{accounts?.map((account)=><option key={account.login_name} value={account.login_name}>{t(roleNames[account.role_code] || [account.role_code, account.role_code],language)} — {account.login_name}</option>)}</select></label>
      <label>{t(['كلمة المرور','Password'],language)}<span className="dash-password"><input name="password" type={reveal?'text':'password'} autoComplete="current-password" required maxLength="1024" disabled={!hasAccounts || busy}/><button type="button" className="dash-password-toggle" aria-pressed={reveal} aria-label={t(reveal?['إخفاء كلمة المرور','Hide password']:['إظهار كلمة المرور','Show password'],language)} onClick={()=>setReveal((value)=>!value)}><Icon name={reveal?'eyeOff':'eye'} size={20}/></button></span></label>
      {accounts === null && !error && <p id="dash-login-status" className="dash-form-status" role="status">{t(['جارٍ تحميل الحسابات…','Loading accounts…'],language)}</p>}
      {accounts?.length === 0 && <p id="dash-login-status" className="dash-form-status" role="status">{t(['لا توجد حسابات نشطة. اطلب من المشرف إضافة حسابك أو تفعيله.','No active accounts. Ask the administrator to add or activate your account.'],language)}</p>}
      {error && <p id="dash-login-status" className="dash-form-error" role="alert">{error}</p>}
      {((error && !accounts) || accounts?.length === 0) && <button className="dash-action" type="button" onClick={retry}>{t(['تحديث الحسابات','Refresh accounts'],language)}</button>}
      <button className="dash-action dash-action--primary dash-action--block" type="submit" disabled={busy || !hasAccounts}>{busy?t(['جارٍ الدخول…','Signing in…'],language):t(['تسجيل الدخول','Sign in'],language)}</button>
    </form>
  </div></main>;
}
function NoAccess({ language }) {
  return <><Heading overline="ACCESS" title={t(['ليس لديك صلاحية لهذا القسم.','You do not have access to this section.'],language)} description={t(['يحدد المشرف العام الأقسام المتاحة لكل حساب.','The Super Admin decides which sections each account can open.'],language)}/><div className="dash-empty" role="status"><Link className="dash-action dash-action--primary" to={BASE}>{t(['العودة إلى الرئيسية','Back to dashboard home'],language)}</Link></div></>;
}
function RecordTitle({ resource, record, language }) {
  const key = resource === 'competitions' || resource === 'projects' ? 'name' : resource === 'workshops' ? 'title' : resource === 'announcements' ? 'title' : resource === 'speakers' ? 'full_name' : resource === 'users' ? 'full_name' : 'team_name';
  const title = record[`${key}_${language}`] || record[key] || record.full_name || `#${record.id}`;
  return <bdi lang={/[\u0600-\u06ff]/.test(title) ? 'ar' : 'en'}>{title}</bdi>;
}
function displayValue(value, language) {
  if (typeof value === 'boolean') return t(value ? ['نعم','Yes'] : ['لا','No'], language);
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? t(permissionNames[item] || [item,item],language) : item?.name || item?.title_ar || item?.title_en || '').filter(Boolean).join('، ') || '—';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
const cardFields = {
  competitions: ['category_code','start_at','end_at','registration_status','status'],
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
  drones: ['الدرون','Drones'], controller: ['وحدة التحكم','Controller'],
  combat: ['قتال آلي','Combat'], simulation: ['محاكاة','Simulation'], sensing: ['المستشعرات','Sensors'],
  defense: ['دفاعي','Defense'], invention: ['ابتكار','Invention'],
};
// English-only text (e.g. name_en, description_en) is laid out LTR so its punctuation sits correctly.
const latinOnly = (value) => typeof value === 'string' && /[A-Za-z]/.test(value) && !/[\u0600-\u06FF]/.test(value);
const pad2 = (number) => String(number).padStart(2, '0');
const toDate = (value) => { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.valueOf()) ? date : null; };
const formatDate = (value) => { const date = toDate(value); return date ? `${date.getFullYear()}/${pad2(date.getMonth()+1)}/${pad2(date.getDate())}` : '—'; };
const formatTime = (value) => { const date = toDate(value); return date ? `${pad2(date.getHours())}:${pad2(date.getMinutes())}` : '—'; };
const formatCount = (value, language) => new Intl.NumberFormat(language === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US').format(value);
function cardValue(key, value, language) {
  if (key === 'role_code') return t(roleNames[value] || [value,value],language);
  if (['start_at','end_at','registered_at'].includes(key) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) return `${formatDate(date)} · ${formatTime(date)}`;
  }
  if (typeof value === 'string' && cardOptions[value]) return t(cardOptions[value],language);
  return displayValue(value, language);
}
// Figma cards: icon badge + title + status chip, a «النوع» line, a sunken meta block,
// a full-width «عرض التفاصيل», then «تعديل» / «حذف» side by side.
const statusKey = { competitions: 'registration_status', workshops: 'registration_status', projects: 'status', announcements: 'status', users: 'is_active' };
const statusTone = { open: 'on', published: 'on', true: 'on', coming_soon: 'soon', draft: 'soon', in_review: 'soon', closed: 'off', hidden: 'off', expired: 'off', false: 'off' };
const statusLabel = (resource, value, language) => resource === 'users' ? t(value === true || value === 'true' ? ['نشط','Active'] : ['موقوف','Inactive'], language) : t(cardOptions[value] || [String(value), String(value)], language);
// Per-section card content, following the Figma «06 · Dashboard» list screens:
// line = the context line under the title; meta = the sunken details block.
const cardSpec = {
  competitions: { line: ['category_code', ['النوع','Type'], 'competition'], meta: [['start_at','date',['تاريخ البدء','Start date']],['end_at','date',['تاريخ الانتهاء','End date']],['status','option',['حالة النشر','Publication']]] },
  teams: { line: ['competition_id', ['المسابقة','Competition'], 'competition'], meta: [['team_leader_name','text',['القائد','Leader']],['registered_at','date',['تاريخ التسجيل','Registered']]] },
  workshops: { meta: [['start_at','date',['التاريخ','Date']],['start_at','time',['الوقت','Time']],['available_seats','number',['المقاعد المتاحة','Available seats']],['status','option',['حالة النشر','Publication']]] },
  projects: { line: ['team_name', ['الفريق','Team'], 'users'], meta: [['team_leader_name','text',['قائد الفريق','Team leader']],['project_type','option',['النوع','Type']],['created_at','date',['تاريخ الإضافة','Added']]] },
  announcements: { meta: [['start_at','date',['تاريخ النشر','Publish date']],['end_at','date',['تاريخ الانتهاء','End date']]], details: ['معاينة','Preview'] },
  speakers: { meta: [['workshops','list',['الورش','Workshops']]] },
  users: { line: ['role_code', ['الصلاحية','Role'], 'users'], meta: [['login_name','latin',['اسم الدخول','Login name']],['permissions','list',['صلاحيات الأقسام','Sections']],['created_at','date',['أُنشئ في','Created']]] },
};
function specValue(kind, key, value, language, lookups) {
  if (key === 'competition_id') return lookups?.competitions?.[value] || (value == null ? '—' : `#${value}`);
  if (key === 'permissions' && Array.isArray(value) && !value.length) return t(['كل الأقسام','All sections'],language);
  if (kind === 'date') return <bdi dir="ltr">{formatDate(value)}</bdi>;
  if (kind === 'time') return <bdi dir="ltr">{formatTime(value)}</bdi>;
  if (kind === 'number') return value == null ? '—' : formatCount(value, language);
  if (kind === 'latin') return value ? <bdi dir="ltr">{value}</bdi> : '—';
  return cardValue(key, value, language);
}
const optionText = (value, language) => t(cardOptions[value] || [value, value], language);
const filterSpec = {
  competitions: [{ id: 'type', label: ['نوع المسابقة','Competition type'], value: (r) => r.category_code, text: optionText }, { id: 'registration', label: ['حالة التسجيل','Registration status'], value: (r) => r.registration_status, text: optionText }],
  workshops: [{ id: 'registration', label: ['حالة التسجيل','Registration status'], value: (r) => r.registration_status, text: optionText }, { id: 'date', label: ['التاريخ','Date'], value: (r) => r.start_at ? formatDate(r.start_at) : null, text: (value) => value }],
  projects: [{ id: 'type', label: ['نوع المشروع','Project type'], value: (r) => r.project_type, text: optionText }, { id: 'status', label: ['حالة النشر','Publication'], value: (r) => r.status, text: optionText }],
  announcements: [{ id: 'status', label: ['حالة الإعلان','Announcement status'], value: (r) => r.status, text: optionText }],
  teams: [{ id: 'competition', label: ['المسابقة','Competition'], value: (r) => r.competition_id, text: (value, language, lookups) => lookups?.competitions?.[value] || `#${value}` }],
  users: [{ id: 'role', label: ['الصلاحية','Role'], value: (r) => r.role_code, text: (value, language) => t(roleNames[value] || [value, value], language) }, { id: 'active', label: ['الحالة','Status'], value: (r) => r.is_active, text: (value, language) => statusLabel('users', value, language) }],
};
function RecordCard({ resource, record, language, onDelete, onToggleActive, canEdit, admin, lookups }) {
  const spec = cardSpec[resource] || {}; const sKey = statusKey[resource];
  const hasStatus = sKey && record[sKey] != null;
  const lineValue = !spec.line ? null : typeof spec.line[0] === 'function' ? spec.line[0](record, language) : Object.hasOwn(record, spec.line[0]) && record[spec.line[0]] != null ? specValue('text', spec.line[0], record[spec.line[0]], language, lookups) : null;
  const meta = (spec.meta || []).filter(([key]) => Object.hasOwn(record, key));
  const self = resource === 'users' && record.id === admin?.id;
  return <article className="dash-card">
    <div className="dash-card-heading">
      <span className="dash-badge" aria-hidden="true"><Icon name={navIcons[resource]} size={22}/></span>
      <h2><RecordTitle resource={resource} record={record} language={language}/></h2>
      {hasStatus && <span className={`dash-status dash-status--${statusTone[String(record[sKey])] || 'soon'}`}>{statusLabel(resource, record[sKey], language)}</span>}
    </div>
    {lineValue && <p className="dash-card-type"><Icon name={spec.line[2]} size={16} className="dash-card-type-icon"/>{t(spec.line[1],language)}: {lineValue}</p>}
    {meta.length > 0 && <dl className="dash-meta">{meta.map(([key,kind,label])=><div key={`${key}-${kind}`}><dt>{t(label,language)}</dt><dd>{specValue(kind,key,record[key],language,lookups)}</dd></div>)}</dl>}
    {resource === 'users' ? <div className="dash-card-actions dash-card-actions--three">
      <Action className={`dash-action ${record.is_active ? 'dash-action--danger' : 'dash-action--edit'}`} disabled={self} title={self ? t(['لا يمكنك إيقاف حسابك','You cannot deactivate your own account'],language) : undefined} onClick={()=>onToggleActive(record)}>{t(record.is_active ? ['تعطيل','Deactivate'] : ['تفعيل','Activate'],language)}</Action>
      <Link className="dash-action dash-action--edit" to={`${BASE}/users/${record.id}/edit`}>{t(['كلمة المرور','Password'],language)}</Link>
      <Action danger disabled={self} title={self ? t(['لا يمكنك حذف حسابك','You cannot delete your own account'],language) : undefined} onClick={()=>onDelete(record)}>{t(['حذف','Delete'],language)}</Action>
    </div> : <div className="dash-card-actions">
      <Link className="dash-action dash-action--block" to={`${BASE}/${resource}/${record.id}`}>{t(spec.details || ['عرض التفاصيل','View details'],language)}</Link>
      {canEdit && <Link className="dash-action dash-action--edit" to={`${BASE}/${resource}/${record.id}/edit`}>{t(['تعديل','Edit'],language)}</Link>}
      {canEdit && <Action danger onClick={()=>onDelete(record)}>{t(['حذف','Delete'],language)}</Action>}
    </div>}
  </article>;
}
function DashboardHome({ language, admin, notify, onSessionExpired }) {
  // About is a single page (no record count); it stays in the sidebar.
  const allowed = navResources.filter((item)=>item.key!=='about'&&canAccess(admin,item.key));
  const { data: counts, loading, failure, reload } = useDashboardData('/admin/stats', onSessionExpired);
  const error=failure?messageForError(failure,language):'';
  // Latin digits, as in Figma «Home» (241:493); counts come only from /api/admin/stats.
  const formatter=new Intl.NumberFormat(language==='ar'?'ar-SA-u-nu-latn':'en-US');
  return <>
    <Heading overline={sectionMeta.home.overline} title={t(['لوحة التحكم','Dashboard'],language)} description={<>{t(['مرحباً بك في لوحة تحكم','Welcome to the'],language)} <span lang="en" dir="ltr" className="dash-latin">RoboTactic</span>{language==='en'?' dashboard':''}</>}/>
    {loading&&<p className="dash-visually-hidden" role="status">{t(['جارٍ تحميل الأعداد…','Loading counts…'],language)}</p>}
    {error&&<div className="dash-empty" role="alert"><p>{error}</p><Action onClick={reload}>{t(['إعادة المحاولة','Retry'],language)}</Action></div>}
    <ul className="dash-stats" aria-busy={loading} aria-label={t(['أقسام لوحة التحكم','Dashboard sections'],language)}>{allowed.map(({key,label})=><li key={key}><Link className="dash-stat" to={`${BASE}/${key}`}>
      <span className="dash-stat-top" aria-hidden="true"><span className="dash-badge"><Icon name={navIcons[key]} size={22}/></span><Icon name="chevronLeft" size={20} className="dash-stat-arrow"/></span>
      <strong className="dash-stat-value">{loading?<span className="dash-skeleton" aria-hidden="true"/>:counts?.[key] == null ? '—' : formatter.format(counts[key])}</strong>
      <span className="dash-stat-label">{t(label,language)}</span>
    </Link></li>)}</ul>
    <div className="dash-home-controls">
      {admin.role_code === 'super_admin' && <EventStartEditor {...{language,notify,onSessionExpired}} />}
      <SectionVisibilityPanel {...{language,admin,notify,onSessionExpired}} />
    </div>
  </>;
}
function Listing({ language, admin, notify, onSessionExpired }) {
  const { section } = useParams(); const [params] = useSearchParams(); const parent = params.get('parent');
  const [query,setQuery]=useState('');const [filters,setFilters]=useState({});
  const searchInput=useRef(null);
  useEffect(()=>{setQuery('');setFilters({});},[section,parent]);
  const config=navResources.find((item)=>item.key===section && canAccess(admin,item.key));
  const { data, loading, failure, reload } = useDashboardData(config ? `/admin/${section}${parent ? `?parent=${encodeURIComponent(parent)}` : ''}` : null, onSessionExpired);
  const records = data || [];
  const error=failure?messageForError(failure,language):'';
  // Team cards show the competition name (Figma «المسابقة: …») from the existing lookup endpoint.
  const { data: competitionRows } = useDashboardData(section==='teams'&&canAccess(admin,'teams')?'/admin/lookups/competitions':null, onSessionExpired);
  const lookups=competitionRows?{competitions:Object.fromEntries(competitionRows.map((row)=>[row.id,row[`name_${language}`]||row.name_ar||row.name_en]))}:{};
  const canEdit=true;
  async function remove(record) {
    const accepted=window.confirm(t(section==='speakers'?['حذف المتحدث وإزالته من جميع الورش؟','Delete this speaker and remove all workshop assignments?']:['هل تريد حذف هذا السجل؟','Delete this record?'],language));if(!accepted)return;
    try{await deleteDashboardRecord(section,record.id);notify(t(['تم حذف السجل.','Record deleted.'],language));}
    catch(issue){if(issue.status===401)onSessionExpired();notify(messageForError(issue,language));}
  }
  async function toggleActive(record) {
    const next=!record.is_active;
    if(!next&&!window.confirm(t(['تعطيل هذا الحساب؟ لن يتمكن من تسجيل الدخول حتى يُعاد تفعيله.','Deactivate this account? It cannot sign in until reactivated.'],language)))return;
    try{await updateDashboardRecord('users',record.id,{is_active:next});notify(t(next?['تم تفعيل الحساب.','Account activated.']:['تم تعطيل الحساب.','Account deactivated.'],language));}
    catch(issue){if(issue.status===401)onSessionExpired();notify(messageForError(issue,language));}
  }
  if(!config)return <NoAccess language={language}/>;
  const meta=sectionMeta[section]||{};
  // Filters (Figma: search + section selects). Options come only from values in the loaded records.
  const filterDefs=(filterSpec[section]||[]).map((def)=>{const values=[...new Set(records.map(def.value).filter((value)=>value!=null&&value!==''))].map(String).sort();return {...def,values};}).filter((def)=>def.values.length>0);
  const filtered=records.filter((record)=>JSON.stringify(record).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    &&filterDefs.every((def)=>!filters[def.id]||String(def.value(record))===filters[def.id]));
  const parentQuery=parent?`?parent=${encodeURIComponent(parent)}`:'';
  return <><Heading overline={meta.overline} title={t(config.label,language)} description={meta.description&&t(meta.description,language)} action={canEdit?<Link className="dash-action dash-action--primary" to={`${BASE}/${section}/new${parentQuery}`}><span aria-hidden="true">+</span> {t(meta.add||['إضافة','Add'],language)}</Link>:null}/>
    <SectionVisibilityPanel key={section} resource={section} {...{language,admin,notify,onSessionExpired}} />
    {section==='teams' && parent && <Link className="dash-back" to={`${BASE}/competitions/${parent}`}>{t(['العودة للمسابقة','Back to competition'],language)}</Link>}
    {section==='speakers' && parent && <Link className="dash-back" to={`${BASE}/workshops/${parent}`}>{t(['العودة للورشة','Back to workshop'],language)}</Link>}
    <div className="dash-filters" role="search">
      <div className="dash-search dash-filter-search"><label htmlFor="dash-record-search">{t(['بحث','Search'],language)}</label><div className="dash-search-input"><Icon name="search" size={20}/><input ref={searchInput} id="dash-record-search" type="search" value={query} onChange={(event)=>setQuery(event.target.value)} maxLength="100" placeholder={t(['ابحث بالاسم أو أي تفصيل…','Search by name or any detail…'],language)}/>{query&&<button type="button" aria-label={t(['مسح البحث','Clear search'],language)} onClick={()=>{setQuery('');searchInput.current?.focus();}}><Icon name="close" size={18}/></button>}</div></div>
      {filterDefs.map((def)=><label key={def.id}>{t(def.label,language)}<select value={filters[def.id]||''} onChange={(event)=>setFilters((current)=>({...current,[def.id]:event.target.value}))}><option value="">{t(['الكل','All'],language)}</option>{def.values.map((value)=><option key={value} value={value}>{def.text(value,language,lookups)}</option>)}</select></label>)}
    </div>
    {error&&data&&<div className="dash-empty" role="alert"><p>{error}</p><Action onClick={reload}>{t(['إعادة المحاولة','Retry'],language)}</Action></div>}
    {!loading&&records.length>0&&<p className="dash-result-count" role="status">{t(['عدد النتائج','Results'],language)}: {formatCount(filtered.length,language)}</p>}
    {loading?<p role="status">{t(['جارٍ تحميل البيانات…','Loading…'],language)}</p>:error&&!data?<div className="dash-empty" role="alert"><p>{error}</p><Action onClick={reload}>{t(['إعادة المحاولة','Retry'],language)}</Action></div>:!filtered.length?<div className="dash-empty dash-empty--records" role="status"><Icon name={navIcons[section]} size={32}/><h2>{t(records.length?['لا توجد نتائج مطابقة.','No matching results.']:['لا توجد سجلات بعد.','No records yet.'],language)}</h2><p>{t(records.length?['جرّب كلمة أخرى أو غيّر التصفية.','Try another term or change the filters.']:['استخدم زر الإضافة لإنشاء أول سجل في هذا القسم.','Use Add to create the first record in this section.'],language)}</p>{records.length===0&&canEdit&&<Link className="dash-action dash-action--primary" to={`${BASE}/${section}/new${parentQuery}`}>{t(meta.add||['إضافة','Add'],language)}</Link>}</div>:<div className="dash-grid">{filtered.map((record)=><RecordCard key={record.id} {...{resource:section,record,language,canEdit,admin,lookups}} onDelete={remove} onToggleActive={toggleActive}/>)}</div>}
  </>;
}
function Details({ language, admin, onSessionExpired }) {
  const {section,id}=useParams();
  const { data: record, failure } = useDashboardData(`/admin/${section}/${encodeURIComponent(id)}`, onSessionExpired);
  const error=failure?messageForError(failure,language):'';
  const label=navResources.find((item)=>item.key===section)?.label;const canEdit=true;
  if(error&&!record)return <><Heading overline={sectionMeta[section]?.overline} title={t(label || [section,section],language)}/><div className="dash-empty" role="alert"><p>{error}</p><Link className="dash-action" to={`${BASE}/${section}`}>{t(['العودة للقائمة','Back to list'],language)}</Link></div></>;if(!record)return <p role="status">{t(['جارٍ تحميل السجل…','Loading record…'],language)}</p>;
  const related=section==='competitions'?['teams',record.id]:section==='workshops'?['speakers',record.id]:null;
  const summaryKeys=['team_name','team_leader_name','category_code','project_type','registration_status','status','role_code','is_active','start_at','end_at','registered_at'];
  const entries=Object.entries(record).filter(([key])=>!['id','created_at','updated_at','password_hash'].includes(key));
  const summary=entries.filter(([key])=>summaryKeys.includes(key));
  const details=entries.filter(([key])=>!summaryKeys.includes(key));
  const fields=(items)=><dl className="dash-meta">{items.map(([key,value])=><div key={key} className={Array.isArray(value)||(typeof value==='string' && value.length>120)?'dash-meta-entry--full':undefined}><dt>{t(labels[key]||contentFields[section]?.find(item=>item.name===key)?.label||[key,key],language)}</dt><dd dir={latinOnly(value)?'ltr':undefined}>{cardValue(key,value,language)}</dd></div>)}</dl>;
  return <>
    <Heading overline={sectionMeta[section]?.overline} title={<RecordTitle resource={section} record={record} language={language}/>} description={t(label || [section,section],language)}/>
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
  const { data: options = [], failure } = useDashboardData('/admin/lookups/competitions', onSessionExpired);
  const error=failure?messageForError(failure,language):'';
  const [selected, setSelected] = useState(String(defaultValue || ''));
  return <div className="dash-field"><label htmlFor="dash-competition-id">{t(['المسابقة', 'Competition'],language)}</label><select id="dash-competition-id" name="competition_id" value={selected} onChange={(event)=>setSelected(event.target.value)} required><option value="">{t(['اختر مسابقة…', 'Choose a competition…'],language)}</option>{options.map((item)=><option key={item.id} value={item.id}>{item[`name_${language}`] || item.name_ar || item.name_en}</option>)}</select>{error && <p role="alert">{error}</p>}</div>;
}
function Editor({ language, admin, notify, onSessionExpired }) {
  const {section,id}=useParams();const [params]=useSearchParams();const navigate=useNavigate();const config=navResources.find((item)=>item.key===section && canAccess(admin,item.key));
  const { data: record, loading, failure } = useDashboardData(id && config ? `/admin/${section}/${encodeURIComponent(id)}` : null, onSessionExpired, { editable: true });
  const loadError=failure?messageForError(failure,language):'';
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  if(!config)return <NoAccess language={language}/>;
  const fields=contentFields[section];
  if(loading)return <p role="status">{t(['جارٍ تحميل السجل…','Loading record…'],language)}</p>;
  if(id && !record)return <div className="dash-empty" role="alert">{loadError}</div>;
  async function submit(event){event.preventDefault();setBusy(true);setError('');const form=new FormData(event.currentTarget);const payload={};const imageFile=form.get('image_file');
  try { for(const item of fields){const value=form.get(item.name);if(item.type==='checkbox')payload[item.name]=form.get(item.name)==='on';else if(item.name==='password' && !value)continue;else if(value==='' || value==null)payload[item.name]=null;else if(item.type==='number' || item.type==='competition-lookup')payload[item.name]=Number(value);else if(item.type==='datetime-local')payload[item.name]=new Date(value).toISOString();else if(item.type==='members-json')payload.members=JSON.parse(value);else if(item.name==='is_active')payload[item.name]=value==='true';else payload[item.name]=value;} }
    catch { setError(t(['صيغة أعضاء المشروع يجب أن تكون مصفوفة JSON صحيحة.','Project members must be a valid JSON array.'],language));setBusy(false);return; }
    // Same cross-field rules as the backend (adminContentService.validate), shown in the UI language.
    const rule=payload.start_at&&payload.end_at&&Date.parse(payload.end_at)<=Date.parse(payload.start_at)?['موعد النهاية يجب أن يكون بعد موعد البداية.','The end date must be after the start date.']
      :payload.team_size_min!=null&&payload.team_size_max!=null&&payload.team_size_max<payload.team_size_min?['أكبر عدد أعضاء يجب ألا يقل عن أقل عدد أعضاء.','Maximum team size cannot be less than the minimum.']
      :payload.capacity!=null&&payload.available_seats!=null&&payload.available_seats>payload.capacity?['المقاعد المتاحة يجب ألا تتجاوز السعة.','Available seats cannot exceed capacity.']:null;
    if(rule){setError(t(rule,language));setBusy(false);return;}
    try{if(imageFile instanceof File && imageFile.size){if(!['image/jpeg','image/png','image/webp'].includes(imageFile.type)||imageFile.size>5*1024*1024)throw new Error(t(['اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز 5 ميغابايت.','Choose a JPEG, PNG, or WebP image up to 5 MB.'],language));const uploaded=await uploadDashboardImage(section,imageFile);payload.image_url=uploaded.url;}const saved=id?await updateDashboardRecord(section,id,payload):await createDashboardRecord(section,payload);notify(t(['تم حفظ التغييرات.','Changes saved.'],language));navigate(`${BASE}/${section}/${saved.id}`);}
    catch(issue){setError(issue.status===503 && imageFile instanceof File && imageFile.size ? t(['رفع الصور غير مهيأ في الخادم. أضف مفتاح Supabase السري في إعدادات الباك إند.','Image storage is not configured on the server. Add the Supabase secret key to the backend settings.'],language) : messageForError(issue,language));if(issue.status===401)onSessionExpired();}
    finally{setBusy(false);}
  }
  const meta=sectionMeta[section]||{};
  return <><Link className="dash-back" to={`${BASE}/${section}`}>{t(['إلغاء والعودة','Cancel and return'],language)}</Link><form className="dash-form dash-panel" onSubmit={submit} aria-busy={busy}><Heading overline={meta.overline} title={`${t(id?['تعديل','Edit']:['إضافة','Add'],language)} ${t(resourceSingular[section] || config.label,language)}`} description={meta.form&&t(meta.form,language)}/><div className="dash-form-grid">{fields.map((item)=>{const value=record?.[item.name];const parentValue=!id&&section==='teams'&&item.name==='competition_id'?params.get('parent'):!id&&section==='speakers'&&item.name==='workshop_id'?params.get('parent'):null;const display=item.type==='datetime-local'?dateInput(value):item.type==='checkbox'?(value?'on':''):item.type==='members-json'?JSON.stringify(record?.members||[],null,2):(value??parentValue??'');const fieldDir=item.name.endsWith('_en')||['url','email'].includes(item.type)?'ltr':item.name.endsWith('_ar')?'rtl':undefined;const multiline=['textarea','members-json'].includes(item.type);if(item.type==='competition-lookup')return <CompetitionSelect key={item.name} language={language} defaultValue={display} onSessionExpired={onSessionExpired}/>;if(item.type==='datetime-local')return <div className="dash-field" key={item.name}><label htmlFor={`dash-date-${item.name}`}>{t(item.label,language)}</label><DateTimeField name={item.name} defaultValue={display} required={item.required} language={language}/></div>;return <label className={multiline?'dash-field--full':''} key={item.name}>{t(item.label,language)}{multiline?<textarea name={item.name} dir={fieldDir} defaultValue={display} required={item.required} maxLength="10000" rows="6"/>:item.type==='select'?<select name={item.name} dir={fieldDir} defaultValue={display} required={item.required}><option value="">{t(['اختر…','Choose…'],language)}</option>{item.options.map(([option,ar,en])=><option key={option} value={option}>{language==='ar'?ar:en}</option>)}</select>:item.type==='checkbox'?<input name={item.name} type="checkbox" defaultChecked={display==='on'} />:<input name={item.name} type={item.type} dir={fieldDir} defaultValue={display} required={item.required && !(item.name==='password'&&id)} maxLength={item.type==='password'?1024:4000} min={item.type==='number'?(['capacity','available_seats'].includes(item.name)?0:1):undefined} minLength={item.type==='password'?12:undefined} autoComplete={item.type==='password'?'new-password':'off'}/>}</label>;})}{fields.some((item)=>item.name==='image_url')&&<ImageUploadField language={language} currentUrl={record?.image_url}/>}</div>{error&&<p className="dash-form-error" role="alert">{error}</p>}{section==='projects'&&<p className="dash-secondary">{t(['صيغة العضو: { "name": "الاسم", "linkedin_url": "https://…", "x_url": "https://…" }','Member format: { "name": "Name", "linkedin_url": "https://…", "x_url": "https://…" }'],language)}</p>}<div className="dash-form-actions"><button className="dash-action dash-action--primary" disabled={busy} type="submit">{busy?t(['جارٍ الحفظ…','Saving…'],language):t(meta.save||['حفظ','Save'],language)}</button><Link className="dash-action" to={`${BASE}/${section}`}>{t(['إلغاء','Cancel'],language)}</Link></div></form></>;
}
// Route guard: sections outside the account's permissions never mount their forms or details
// (the backend enforces the same scopes; this keeps the UI from offering them).
const allowedSection = (admin, section) => navResources.some((item) => item.key === section) && canAccess(admin, section);
function DetailsRoute(props) { const {section}=useParams(); if(!allowedSection(props.admin,section))return <NoAccess language={props.language}/>; return section==='speakers'?<SpeakerDetails {...props}/>:<Details {...props}/>; }
function EditorRoute(props) { const {section}=useParams(); if(!allowedSection(props.admin,section))return <NoAccess language={props.language}/>; return section==='speakers'?<SpeakerEditor {...props}/>:section==='users'?<UserEditor {...props}/>:<Editor {...props}/>; }
function DashboardContent({ language, admin, notify, onSessionExpired }) {
  const location=useLocation();const allowed=navResources.filter((item)=>canAccess(admin,item.key));const [menu,setMenu]=useState(false);const menuButton=useRef(null);
  useEffect(()=>{document.querySelector('.dash-heading h1')?.focus();setMenu(false);},[location.pathname,location.search]);
  return <><div className="dash-toolbar"><Action ref={menuButton} aria-expanded={menu} aria-controls="dashboard-nav" onClick={()=>setMenu((value)=>!value)}><Icon name={menu?'close':'menu'} size={20}/>{t(menu?['إغلاق القائمة','Close menu']:['القائمة','Menu'],language)}</Action></div><div className="dash-layout"><aside className={`dash-sidebar ${menu?'is-open':''}`} onKeyDown={event=>{if(event.key==='Escape' && menu){event.preventDefault();setMenu(false);menuButton.current?.focus();}}}><nav id="dashboard-nav" aria-label={t(['تنقل لوحة التحكم','Dashboard navigation'],language)}><NavLink end to={BASE}><Icon name="sensor" className="dash-nav-icon"/><span>{t(['الرئيسية','Home'],language)}</span></NavLink>{allowed.map(({key,label})=><NavLink key={key} to={`${BASE}/${key}`}><Icon name={navIcons[key]} className="dash-nav-icon"/><span>{t(label,language)}</span></NavLink>)}</nav><div className="dash-sidebar-bottom"><div className="dash-account"><span className="dash-account-avatar" aria-hidden="true"><Icon name="users" size={20}/></span><p><strong lang={/[\u0600-\u06ff]/.test(admin.full_name)?'ar':'en'} dir="auto">{admin.full_name}</strong><span>{t(roleNames[admin.role_code]||[admin.role_code,admin.role_code],language)}{language==='ar'&&roleNames[admin.role_code]&&<> · <span lang="en" dir="ltr">{roleNames[admin.role_code][1]}</span></>}</span></p></div><Action onClick={async()=>{try{await logoutAdmin();}catch{}finally{onSessionExpired();}}}><Icon name="logout" className="dash-nav-icon"/>{t(['تسجيل الخروج','Sign out'],language)}</Action></div></aside><section className="dash-content" id="dashboard-content" tabIndex="-1"><div className={`dash-page ${/\/(?:new|edit|about)$/.test(location.pathname)?'dash-page--editor':''}`}><Routes><Route path="about" element={allowedSection(admin,'about')?<AboutEditor {...{language,admin,notify,onSessionExpired}}/>:<NoAccess language={language}/>}/><Route index element={<DashboardHome language={language} admin={admin} notify={notify} onSessionExpired={onSessionExpired}/>}/><Route path=":section" element={<Listing {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/new" element={<EditorRoute key={location.pathname} {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/:id/edit" element={<EditorRoute key={location.pathname} {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/:id" element={<DetailsRoute key={location.pathname} {...{language,admin,onSessionExpired}}/>}/></Routes></div></section></div></>;
}
export default function Dashboard() {
  const [language,setLanguage]=useState('ar');const [admin,setAdmin]=useState(null);const [checked,setChecked]=useState(false);const [message,setMessage]=useState('');const location=useLocation();
  const onSessionExpired=useCallback(()=>{dashboardCache.clear();setAdmin(null);},[]);
  useEffect(()=>dashboardCache.subscribe((_path,type)=>{if(type==='expired')onSessionExpired();}),[onSessionExpired]);
  useEffect(()=>{const oldLang=document.documentElement.lang;const oldDir=document.documentElement.dir;document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';return()=>{document.documentElement.lang=oldLang;document.documentElement.dir=oldDir;};},[language]);
  useEffect(()=>{let active=true;getAdminSession().then((session)=>{if(active)setAdmin(session);}).catch(()=>{if(active)setAdmin(null);}).finally(()=>{if(active)setChecked(true);});return()=>{active=false;};},[]);
  // A notice raised right before a navigation (save → details page) survives that redirect;
  // any later, user-initiated navigation clears it.
  const noticeAt=useRef(0);
  const notify=useCallback((text)=>{noticeAt.current=Date.now();setMessage(text);},[]);
  useEffect(()=>{if(Date.now()-noticeAt.current<1500){noticeAt.current=0;return;}setMessage('');},[location.pathname,location.search]);
  useEffect(()=>()=>dashboardCache.clear(),[]);
  async function login(credentials){const session=await loginAdmin(credentials);setAdmin(session);}
  return <div className="dashboard" lang={language} dir={language==='ar'?'rtl':'ltr'}><header className="dash-header"><Link to="/" aria-label="RoboTactic"><Logo layout="horizontal" markHeight={36}/></Link><button type="button" className="dash-language" lang={language==='ar'?'en':'ar'} dir={language==='ar'?'ltr':'rtl'} onClick={()=>setLanguage(language==='ar'?'en':'ar')}><Icon name="globe" size={20}/>{language==='ar'?'English':'العربية'}</button></header>{message&&<div className="dash-notice" role="status">{message}<Action onClick={()=>setMessage('')}>{t(['إغلاق','Dismiss'],language)}</Action></div>}{!checked?<p className="api-state" role="status">{t(['جارٍ التحقق من الجلسة…','Checking session…'],language)}</p>:admin?<DashboardContent key={admin.id} {...{language,admin,notify,onSessionExpired}}/>:<Login language={language} onLogin={login}/>}</div>;
}
