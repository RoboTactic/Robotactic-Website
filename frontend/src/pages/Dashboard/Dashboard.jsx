import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../services/api/client';
import { createDashboardRecord, deleteDashboardRecord, getAdminSession, getDashboardRecords, loginAdmin, logoutAdmin, updateDashboardRecord } from '../../services/api/dashboard';
import './Dashboard.css';

const BASE = '/dashboard';
const roleNames = { super_admin: ['المشرف العام', 'Super Admin'], competition_manager: ['مسؤول المسابقات', 'Competition Manager'], workshop_manager: ['مسؤول الورش', 'Workshop Manager'] };
const statusOptions = [['draft', 'مسودة', 'Draft'], ['published', 'منشور', 'Published'], ['hidden', 'مخفي', 'Hidden']];
const registrationOptions = [['coming_soon', 'قريبًا', 'Coming soon'], ['open', 'مفتوح', 'Open'], ['closed', 'مغلق', 'Closed']];
const roleOptions = [['super_admin', 'المشرف العام', 'Super Admin'], ['competition_manager', 'مسؤول المسابقات', 'Competition Manager'], ['workshop_manager', 'مسؤول الورش', 'Workshop Manager']];
const field = (name, labelAr, labelEn, type = 'text', required = false, options) => ({ name, label: [labelAr, labelEn], type, required, options });
const contentFields = {
  competitions: [field('name_ar','الاسم بالعربية','Arabic name','text',true),field('name_en','الاسم بالإنجليزية','English name','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('category_code','الفئة','Category','select',true,[['combat','قتال آلي','Combat'],['simulation','محاكاة','Simulation'],['sensing','استشعار','Sensing'],['other','أخرى','Other']]),field('requirements_ar','المتطلبات بالعربية','Arabic requirements','textarea'),field('requirements_en','المتطلبات بالإنجليزية','English requirements','textarea'),field('audience_type','الفئة المستهدفة','Audience'),field('team_size_min','أقل عدد أعضاء','Minimum team size','number'),field('team_size_max','أكبر عدد أعضاء','Maximum team size','number'),field('max_teams','الحد الأعلى للفرق','Maximum teams','number'),field('start_at','موعد البداية','Start date','datetime-local'),field('end_at','موعد النهاية','End date','datetime-local'),field('registration_status','حالة التسجيل','Registration status','select',true,registrationOptions),field('registration_url','رابط التسجيل','Registration URL','url'),field('image_url','رابط الصورة','Image URL','url'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  workshops: [field('title_ar','العنوان بالعربية','Arabic title','text',true),field('title_en','العنوان بالإنجليزية','English title','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('presenter_name','اسم مقدم الورشة','Presenter','text',true),field('image_url','رابط الصورة','Image URL','url'),field('start_at','موعد البداية','Start date and time','datetime-local',true),field('end_at','موعد النهاية','End date and time','datetime-local'),field('capacity','السعة','Capacity','number'),field('available_seats','المقاعد المتاحة','Available seats','number'),field('registration_status','حالة التسجيل','Registration status','select',true,registrationOptions),field('registration_url','رابط التسجيل الخارجي','External registration URL','url'),field('meeting_url','رابط اللقاء','Meeting URL','url'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  projects: [field('name_ar','اسم المشروع بالعربية','Arabic name','text',true),field('name_en','اسم المشروع بالإنجليزية','English name','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea',true),field('description_en','الوصف بالإنجليزية','English description','textarea',true),field('project_type','نوع المشروع','Project type','select',true,[['defense','دفاعي','Defense'],['invention','ابتكار','Invention']]),field('category_id','رقم الفئة','Category ID','number'),field('image_url','رابط الصورة','Image URL','url'),field('team_name','اسم الفريق','Team name','text',true),field('team_leader_name','قائد الفريق','Team leader'),field('members','أعضاء المشروع بصيغة JSON','Project members as JSON','members-json'),field('project_url','رابط المشروع','Project URL','url'),field('video_url','رابط الفيديو','Video URL','url'),field('technologies','التقنيات','Technologies'),field('stage_ar','مرحلة المشروع بالعربية','Arabic project stage'),field('stage_en','مرحلة المشروع بالإنجليزية','English project stage'),field('status','حالة النشر','Publication status','select',true,statusOptions),field('is_featured','إبراز في الرئيسية','Feature on home','checkbox'),field('featured_order','ترتيب الإبراز','Featured order','number')],
  announcements: [field('title_ar','العنوان بالعربية','Arabic title','text',true),field('title_en','العنوان بالإنجليزية','English title','text',true),field('description_ar','الوصف بالعربية','Arabic description','textarea'),field('description_en','الوصف بالإنجليزية','English description','textarea'),field('image_url','رابط الصورة','Image URL','url'),field('link_url','رابط الإعلان','Announcement URL','url'),field('start_at','وقت بدء النشر','Publication start','datetime-local'),field('end_at','وقت انتهاء النشر','Publication end','datetime-local'),field('status','حالة الإعلان','Announcement status','select',true,[['draft','مسودة','Draft'],['published','منشور','Published'],['in_review','قيد المراجعة','In review'],['expired','منتهي','Expired']])],
  teams: [field('competition_id','رقم المسابقة','Competition ID','number',true),field('team_name','اسم الفريق','Team name','text',true),field('team_leader_name','اسم القائد','Team leader','text',true),field('leader_email','بريد القائد','Leader email','email',true),field('leader_phone','هاتف القائد','Leader phone','tel',true),field('member_names','أسماء الأعضاء','Member names','textarea',true)],
  participants: [field('workshop_id','رقم الورشة','Workshop ID','number',true),field('full_name','الاسم الكامل','Full name','text',true),field('email','البريد الإلكتروني','Email','email',true),field('phone','رقم الهاتف','Phone','tel',true),field('institution','الجهة التعليمية','Institution','text',true),field('notes','ملاحظات','Notes','textarea')],
  users: [field('full_name','الاسم الكامل','Full name','text',true),field('email','البريد الإلكتروني','Email','email',true),field('phone','رقم الهاتف','Phone','tel'),field('role_code','الصلاحية','Role','select',true,roleOptions),field('is_active','حالة الحساب','Account status','select',true,[['true','نشط','Active'],['false','موقوف','Inactive']]),field('password','كلمة المرور','Password','password')],
};
const navResources = [
  { key: 'competitions', roles: ['super_admin','competition_manager'], label: ['المسابقات','Competitions'] },
  { key: 'workshops', roles: ['super_admin','workshop_manager'], label: ['الورش','Workshops'] },
  { key: 'projects', roles: ['super_admin'], label: ['المشاريع','Projects'] },
  { key: 'announcements', roles: ['super_admin'], label: ['الإعلانات','Announcements'] },
  { key: 'teams', roles: ['super_admin','competition_manager'], label: ['الفرق','Teams'] },
  { key: 'participants', roles: ['super_admin','workshop_manager'], label: ['المشاركون','Participants'] },
  { key: 'users', roles: ['super_admin'], label: ['المستخدمون والصلاحيات','Users and permissions'] },
];
const labels = { name_ar:['الاسم بالعربية','Arabic name'], name_en:['الاسم بالإنجليزية','English name'], title_ar:['العنوان بالعربية','Arabic title'], title_en:['العنوان بالإنجليزية','English title'], team_name:['الفريق','Team'], full_name:['الاسم','Name'], team_leader_name:['قائد الفريق','Team leader'], presenter_name:['المقدم','Presenter'], category_code:['الفئة','Category'], project_type:['نوع المشروع','Project type'], registration_status:['حالة التسجيل','Registration'], status:['حالة النشر','Status'], role_code:['الصلاحية','Role'], is_active:['الحالة','Active'], leader_email:['البريد','Email'], email:['البريد','Email'], start_at:['البداية','Start'], registered_at:['تاريخ التسجيل','Registered'] };
const t = (value, language) => Array.isArray(value) ? value[language === 'ar' ? 0 : 1] : String(value ?? '');
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
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { await onLogin({ email: form.get('email'), password: form.get('password') }); }
    catch (issue) { setError(messageForError(issue, language)); }
    finally { setBusy(false); }
  }
  return <main className="dash-content"><div className="dash-login"><Heading title={t(['دخول فريق RoboTactic','RoboTactic team sign in'],language)} description={t(['استخدم حساب الفريق المعتمد.','Sign in with your approved team account.'],language)}/><form className="dash-form" onSubmit={submit}><label>{t(['البريد الإلكتروني','Email'],language)}<input name="email" type="email" autoComplete="username" required maxLength="255"/></label><label>{t(['كلمة المرور','Password'],language)}<input name="password" type="password" autoComplete="current-password" required maxLength="1024"/></label>{error && <p role="alert">{error}</p>}<button className="dash-action dash-action--primary" type="submit" disabled={busy}>{busy?t(['جارٍ الدخول…','Signing in…'],language):t(['دخول','Sign in'],language)}</button></form></div></main>;
}
function RecordTitle({ resource, record, language }) {
  const key = resource === 'competitions' || resource === 'projects' ? 'name' : resource === 'workshops' ? 'title' : resource === 'announcements' ? 'title' : resource === 'participants' ? 'full_name' : resource === 'users' ? 'full_name' : 'team_name';
  return record[`${key}_${language}`] || record[key] || record.full_name || `#${record.id}`;
}
function displayValue(value) {
  if (typeof value === 'boolean') return value ? 'نعم / Yes' : 'لا / No';
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.map((item) => item?.name || '').filter(Boolean).join('، ') || '—';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
function RecordCard({ resource, record, language, onDelete, canEdit }) {
  const visible = Object.keys(record).filter((key) => !['id','created_at','updated_at','password_hash'].includes(key)).slice(0,8);
  return <article className="dash-card"><div className="dash-card-heading"><h2><RecordTitle resource={resource} record={record} language={language}/></h2></div><dl className="dash-meta">{visible.map((key)=><div key={key}><dt>{t(labels[key] || [key,key],language)}</dt><dd>{displayValue(record[key])}</dd></div>)}</dl><div className="dash-card-actions"><Link className="dash-action" to={`${BASE}/${resource}/${record.id}`}>{t(['التفاصيل','Details'],language)}</Link>{canEdit && <Link className="dash-action" to={`${BASE}/${resource}/${record.id}/edit`}>{t(['تعديل','Edit'],language)}</Link>}{canEdit && <Action danger onClick={()=>onDelete(record)}>{t(['حذف','Delete'],language)}</Action>}</div></article>;
}
function DashboardHome({ language, role }) {
  const allowed = navResources.filter((item)=>item.roles.includes(role));
  return <><Heading title={t(['لوحة التحكم','Dashboard'],language)} description={t(roleNames[role] || ['فريق RoboTactic','RoboTactic team'],language)}/><div className="dash-stats">{allowed.map(({key,label})=><Link className="dash-stat" key={key} to={`${BASE}/${key}`}><strong>↗</strong><span>{t(label,language)}</span></Link>)}</div></>;
}
function Listing({ language, admin, notify, onSessionExpired }) {
  const { section } = useParams(); const [params] = useSearchParams(); const parent = params.get('parent');
  const [records,setRecords]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [query,setQuery]=useState('');const [revision,setRevision]=useState(0);
  const config=navResources.find((item)=>item.key===section && item.roles.includes(admin.role_code));
  const canEdit=section!=='participants' || ['super_admin','workshop_manager'].includes(admin.role_code);
  useEffect(()=>{
    if(!config){setLoading(false);return;}
    let active=true;setLoading(true);setError('');
    getDashboardRecords(section,parent).then((data)=>{if(active)setRecords(data);}).catch((issue)=>{if(active){setError(messageForError(issue,language));if(issue.status===401)onSessionExpired();}}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[section,parent,revision,language,config,onSessionExpired]);
  async function remove(record) {
    const accepted=window.confirm(t(['هل تريد حذف هذا السجل؟','Delete this record?'],language));if(!accepted)return;
    try{await deleteDashboardRecord(section,record.id);setRevision((value)=>value+1);notify(t(['تم حذف السجل.','Record deleted.'],language));}
    catch(issue){if(issue.status===401)onSessionExpired();notify(messageForError(issue,language));}
  }
  if(!config)return <Heading title={t(['ليس لديك صلاحية لهذا القسم.','You do not have access to this section.'],language)}/>;
  const filtered=records.filter((record)=>JSON.stringify(record).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const parentQuery=parent?`?parent=${encodeURIComponent(parent)}`:'';
  return <><Heading title={t(config.label,language)} action={canEdit?<Link className="dash-action dash-action--primary" to={`${BASE}/${section}/new${parentQuery}`}>+ {t(['إضافة','Add'],language)}</Link>:null}/>
    {section==='teams' && parent && <Link className="dash-back" to={`${BASE}/competitions/${parent}`}>{t(['العودة للمسابقة','Back to competition'],language)}</Link>}
    {section==='participants' && parent && <Link className="dash-back" to={`${BASE}/workshops/${parent}`}>{t(['العودة للورشة','Back to workshop'],language)}</Link>}
    <div className="dash-filters"><label>{t(['بحث','Search'],language)}<input type="search" value={query} onChange={(event)=>setQuery(event.target.value)} maxLength="100"/></label></div>
    {loading?<p role="status">{t(['جارٍ تحميل البيانات…','Loading…'],language)}</p>:error?<div className="dash-empty" role="alert"><p>{error}</p><Action onClick={()=>setRevision((value)=>value+1)}>{t(['إعادة المحاولة','Retry'],language)}</Action></div>:!filtered.length?<div className="dash-empty" role="status"><p>{t(['لا توجد سجلات مطابقة.','No matching records.'],language)}</p></div>:<div className="dash-grid">{filtered.map((record)=><RecordCard key={record.id} {...{resource:section,record,language,canEdit}} onDelete={remove}/>)}</div>}
  </>;
}
function Details({ language, admin, onSessionExpired }) {
  const {section,id}=useParams();const navigate=useNavigate();const [record,setRecord]=useState(null);const [error,setError]=useState('');
  useEffect(()=>{let active=true;apiRequest(`/admin/${section}/${encodeURIComponent(id)}`).then((value)=>{if(active)setRecord(value);}).catch((issue)=>{if(active){setError(messageForError(issue,language));if(issue.status===401)onSessionExpired();}});return()=>{active=false;};},[section,id,language,onSessionExpired]);
  const label=navResources.find((item)=>item.key===section)?.label;const canEdit=section!=='participants' || ['super_admin','workshop_manager'].includes(admin.role_code);
  if(error)return <div className="dash-empty" role="alert">{error}</div>;if(!record)return <p role="status">{t(['جارٍ تحميل السجل…','Loading record…'],language)}</p>;
  const related=section==='competitions'?['teams',record.id]:section==='workshops'?['participants',record.id]:null;
  return <><Heading title={<RecordTitle resource={section} record={record} language={language}/>} description={t(label || [section,section],language)}/><Link className="dash-back" to={`${BASE}/${section}`}>{t(['العودة للقائمة','Back to list'],language)}</Link><div className="dash-card dash-detail-fields"><dl className="dash-meta">{Object.entries(record).filter(([key])=>!['id','created_at','updated_at','password_hash'].includes(key)).map(([key,value])=><div key={key}><dt>{t(labels[key]||[key,key],language)}</dt><dd>{displayValue(value)}</dd></div>)}</dl></div>{related && <Link className="dash-action dash-action--primary" to={`${BASE}/${related[0]}?parent=${related[1]}`}>{t(related[0]==='teams'?['الفرق المسجلة','Registered teams']:['المشاركون','Participants'],language)}</Link>}{canEdit && <Link className="dash-action" to={`${BASE}/${section}/${id}/edit`}>{t(['تعديل','Edit'],language)}</Link>}</>;
}
function Editor({ language, admin, notify, onSessionExpired }) {
  const {section,id}=useParams();const [params]=useSearchParams();const navigate=useNavigate();const config=navResources.find((item)=>item.key===section && item.roles.includes(admin.role_code));
  const [record,setRecord]=useState(null);const [loading,setLoading]=useState(Boolean(id));const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>{if(!id)return;let active=true;apiRequest(`/admin/${section}/${encodeURIComponent(id)}`).then((value)=>{if(active)setRecord(value);}).catch((issue)=>{if(active){setError(messageForError(issue,language));if(issue.status===401)onSessionExpired();}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[section,id,language,onSessionExpired]);
  if(!config)return <Heading title={t(['ليس لديك صلاحية لهذا القسم.','You do not have access to this section.'],language)}/>;
  const fields=section==='users'?contentFields.users.filter((item)=>id || item.name!=='is_active').map((item)=>item.name==='password' && id?{...item,required:false}:item):contentFields[section];
  if(loading)return <p role="status">{t(['جارٍ تحميل السجل…','Loading record…'],language)}</p>;
  async function submit(event){event.preventDefault();setBusy(true);setError('');const form=new FormData(event.currentTarget);const payload={};
  try { for(const item of fields){const value=form.get(item.name);if(item.type==='checkbox')payload[item.name]=form.get(item.name)==='on';else if(item.name==='password' && !value)continue;else if(value==='' || value==null)payload[item.name]=null;else if(item.type==='number')payload[item.name]=Number(value);else if(item.type==='datetime-local')payload[item.name]=new Date(value).toISOString();else if(item.type==='members-json')payload.members=JSON.parse(value);else if(item.name==='is_active')payload[item.name]=value==='true';else payload[item.name]=value;} }
    catch { setError(t(['صيغة أعضاء المشروع يجب أن تكون مصفوفة JSON صحيحة.','Project members must be a valid JSON array.'],language));setBusy(false);return; }
    try{const saved=id?await updateDashboardRecord(section,id,payload):await createDashboardRecord(section,payload);notify(t(['تم حفظ التغييرات.','Changes saved.'],language));navigate(`${BASE}/${section}/${saved.id}`);}
    catch(issue){setError(messageForError(issue,language));if(issue.status===401)onSessionExpired();}
    finally{setBusy(false);}
  }
  return <><Heading title={`${t(id?['تعديل','Edit']:['إضافة','Add'],language)} ${t(config.label,language)}`}/><Link className="dash-back" to={`${BASE}/${section}`}>{t(['إلغاء والعودة','Cancel and return'],language)}</Link><form className="dash-form" onSubmit={submit}><div className="dash-form-grid">{fields.map((item)=>{const value=record?.[item.name];const parentValue=!id&&section==='teams'&&item.name==='competition_id'?params.get('parent'):!id&&section==='participants'&&item.name==='workshop_id'?params.get('parent'):null;const display=item.type==='datetime-local'?dateInput(value):item.type==='checkbox'?(value?'on':''):item.type==='members-json'?JSON.stringify(record?.members||[],null,2):(value??parentValue??'');const multiline=['textarea','members-json'].includes(item.type);return <label className={multiline?'dash-field--full':''} key={item.name}>{t(item.label,language)}{multiline?<textarea name={item.name} defaultValue={display} required={item.required} maxLength="10000" rows="6"/>:item.type==='select'?<select name={item.name} defaultValue={display} required={item.required}><option value="">{t(['اختر…','Choose…'],language)}</option>{item.options.map(([option,ar,en])=><option key={option} value={option}>{language==='ar'?ar:en}</option>)}</select>:item.type==='checkbox'?<input name={item.name} type="checkbox" defaultChecked={display==='on'} />:<input name={item.name} type={item.type} defaultValue={display} required={item.required && !(item.name==='password'&&id)} maxLength={item.type==='password'?1024:4000} min={item.type==='number'?0:undefined} minLength={item.type==='password'?12:undefined} autoComplete={item.type==='password'?'new-password':'off'}/>}</label>;})}</div>{error&&<p role="alert">{error}</p>}{section==='users'&&<p className="dash-secondary">{t(['الحد الأدنى لطول كلمة المرور 12 حرفًا.','Passwords must be at least 12 characters.'],language)}</p>}{section==='projects'&&<p className="dash-secondary">{t(['صيغة العضو: { "name": "الاسم", "linkedin_url": "https://…", "x_url": "https://…" }','Member format: { "name": "Name", "linkedin_url": "https://…", "x_url": "https://…" }'],language)}</p>}<div className="dash-form-actions"><button className="dash-action dash-action--primary" disabled={busy} type="submit">{busy?t(['جارٍ الحفظ…','Saving…'],language):t(['حفظ','Save'],language)}</button><Link className="dash-action" to={`${BASE}/${section}`}>{t(['إلغاء','Cancel'],language)}</Link></div></form></>;
}
function DashboardContent({ language, admin, notify, onSessionExpired }) {
  const location=useLocation();const allowed=navResources.filter((item)=>item.roles.includes(admin.role_code));const [menu,setMenu]=useState(false);
  useEffect(()=>{document.querySelector('.dash-heading h1')?.focus();setMenu(false);},[location.pathname,location.search]);
  return <><div className="dash-toolbar"><Action aria-expanded={menu} aria-controls="dashboard-nav" onClick={()=>setMenu((value)=>!value)}>{t(menu?['إغلاق القائمة','Close menu']:['القائمة','Menu'],language)}</Action></div><div className="dash-layout"><aside className={`dash-sidebar ${menu?'is-open':''}`}><nav id="dashboard-nav" aria-label={t(['تنقل لوحة التحكم','Dashboard navigation'],language)}><NavLink end to={BASE}>{t(['الرئيسية','Home'],language)}</NavLink>{allowed.map(({key,label})=><NavLink key={key} to={`${BASE}/${key}`}>{t(label,language)}</NavLink>)}</nav><div className="dash-sidebar-bottom"><p>{admin.full_name}<br/>{t(roleNames[admin.role_code],language)}</p><Action onClick={async()=>{try{await logoutAdmin();}catch{}finally{onSessionExpired();}}}>{t(['تسجيل الخروج','Sign out'],language)}</Action></div></aside><section className="dash-content" id="dashboard-content" tabIndex="-1"><Routes><Route index element={<DashboardHome language={language} role={admin.role_code}/>}/><Route path=":section" element={<Listing {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/new" element={<Editor {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/:id/edit" element={<Editor {...{language,admin,notify,onSessionExpired}}/>}/><Route path=":section/:id" element={<Details {...{language,admin,onSessionExpired}}/>}/></Routes></section></div></>;
}
export default function Dashboard() {
  const [language,setLanguage]=useState('ar');const [admin,setAdmin]=useState(null);const [checked,setChecked]=useState(false);const [message,setMessage]=useState('');const location=useLocation();
  const onSessionExpired=useCallback(()=>setAdmin(null),[]);
  useEffect(()=>{const oldLang=document.documentElement.lang;const oldDir=document.documentElement.dir;document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';return()=>{document.documentElement.lang=oldLang;document.documentElement.dir=oldDir;};},[language]);
  useEffect(()=>{let active=true;getAdminSession().then((session)=>{if(active)setAdmin(session);}).catch(()=>{if(active)setAdmin(null);}).finally(()=>{if(active)setChecked(true);});return()=>{active=false;};},[]);
  useEffect(()=>{setMessage('');},[location.pathname,location.search]);
  async function login(credentials){const session=await loginAdmin(credentials);setAdmin(session);}
  return <div className="dashboard" lang={language} dir={language==='ar'?'rtl':'ltr'}><div className="dash-toolbar"><Link className="dash-action" to="/">RoboTactic</Link><Action onClick={()=>setLanguage(language==='ar'?'en':'ar')}>{language==='ar'?'English':'العربية'}</Action></div>{message&&<div className="dash-notice" role="status">{message}<Action onClick={()=>setMessage('')}>{t(['إغلاق','Dismiss'],language)}</Action></div>}{!checked?<p className="api-state" role="status">{t(['جارٍ التحقق من الجلسة…','Checking session…'],language)}</p>:admin?<DashboardContent key={admin.id} {...{language,admin,notify:setMessage,onSessionExpired}}/>:<Login language={language} onLogin={login}/>}</div>;
}
