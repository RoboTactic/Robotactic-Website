import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { dashboardData, dashboardSections, filterDashboardRecords, getDashboardSection, text } from '../../data/dashboard';
import './Dashboard.css';

const navigation = ['competitions', 'workshops', 'projects', 'announcements', 'permissions'];
const pending = text('هذه واجهة تجريبية؛ العملية متاحة بعد ربط النظام بواسطة المسؤول. لم يتم حفظ أو حذف أي بيانات.', 'This is a preview. This action will be available after integration. No data was saved or deleted.');
const base = '/dashboard';
function Action({ children, primary, danger, ...props }) {
  return <button type="button" className={`dash-action ${primary ? 'dash-action--primary' : ''} ${danger ? 'dash-action--danger' : ''}`} {...props}>{children}</button>;
}
function Heading({ title, description, overline, action }) {
  return <header className="dash-heading"><div><span className="dash-overline" lang="en">{overline}</span><h1 tabIndex="-1">{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}
function Meta({ items }) {
  return <dl className="dash-meta">{items.map(([label, value])=><div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>;
}
function RecordCard({ section, item, t, notify, query = '', showDetails = true }) {
  const details = `${base}/${section}/${item.id}`;
  const label = (ar,en)=>t(text(ar,en));
  let subtitle, items;
  if(section==='competitions') { subtitle=t(item.category); items=[[label('تاريخ البداية','Start date'),item.start],[label('تاريخ النهاية','End date'),item.end],[label('الحد الأقصى للفرق','Maximum teams'),item.capacity]]; }
  if(section==='workshops') { subtitle=t(item.instructor); items=[[label('التاريخ','Date'),item.date],[label('الوقت','Time'),item.time],[label('المقاعد المتاحة','Available seats'),item.capacity]]; }
  if(section==='projects') { subtitle=t(item.team); items=[[label('قائد الفريق','Team leader'),t(item.leader)],[label('تاريخ الإضافة','Added'),item.date]]; }
  if(section==='announcements') items=[[label('تاريخ النشر','Publish date'),item.start],[label('تاريخ الانتهاء','Expiry date'),item.end]];
  if(section==='permissions') { subtitle=t(item.arabicTitle); items=[[label('أُنشئ في','Created'),item.date]]; }
  if(section==='teams') {subtitle=t(dashboardData.competitions.find(x=>x.id===item.competition)?.title);items=[[label('القائد','Leader'),t(item.leader)],[label('تاريخ التسجيل','Registered'),item.date]];}
  if(section==='participants') {subtitle=t(dashboardData.workshops.find(x=>x.id===item.workshop)?.title);items=[[label('البريد الإلكتروني','Email'),item.email],[label('رقم الجوال','Phone'),item.phone]];}
  return <article className="dash-card"><div className="dash-card-heading"><h2>{t(item.title)}</h2>{item.status && <span className="dash-status">{t(item.status)}</span>}</div>{subtitle && <p className="dash-secondary">{subtitle}</p>}<Meta items={items}/>
    <Link className="dash-action" to={details + query} hidden={!showDetails}>{label(section==='announcements'?'معاينة':'عرض التفاصيل', 'View details')}</Link>
    <div className="dash-card-actions"><Link className="dash-action" to={`${details}/edit${query}`}>{section==='permissions'?label('كلمة المرور','Password'):label('تعديل','Edit')}</Link><Action danger onClick={()=>notify(t(pending))}>{label('حذف','Delete')}</Action>{section==='permissions' && <Action onClick={()=>notify(t(pending))}>{label('تعطيل','Disable')}</Action>}</div>
  </article>;
}
function Home({ t }) {
  return <><Heading title={t(text('لوحة التحكم','Dashboard'))} description={t(text('مرحباً بك في لوحة تحكم RoboTactic','Welcome to the RoboTactic dashboard'))} overline="DASHBOARD"/><div className="dash-stats">{[[dashboardData.competitions.length,text('المسابقات','Competitions'),'competitions'],[dashboardData.workshops.length,text('ورش العمل','Workshops'),'workshops'],[dashboardData.teams.length,text('الفرق المسجلة','Registered teams'),'teams'],[dashboardData.participants.length,text('المشاركون','Participants'),'participants']].map(([value,label,key])=><Link className="dash-stat" key={key} to={`${base}/${key}`}><strong>{value}</strong><span>{t(label)}</span></Link>)}</div></>;
}
function Listing({ t, notify }) {
  const { section }=useParams();
  const [search,setSearch]=useState('');const [status,setStatus]=useState('');const [category,setCategory]=useState('');const [date,setDate]=useState('');
  const [params]=useSearchParams();const parentId=params.get('parent');
  useEffect(()=>{setSearch('');setStatus('');setCategory('');setDate('');},[section,parentId]);
  const config=getDashboardSection(section);if(!config)return <Missing t={t}/>;
  const query=config.parent && parentId?`?parent=${encodeURIComponent(parentId)}`:'';
  const records=filterDashboardRecords(section, { search, status, category, date, parentId });
  const add=t(text('إضافة','Add'))+' '+t(config.singular);
  return <><Heading title={t(config.title)} description={t(config.description)} overline={config.overline} action={<Link className="dash-action dash-action--primary" to={`${base}/${section}/new${query}`}>+ {add}</Link>}/>
    {config.parent && <Link className="dash-back" to={`${base}/${config.parent}`}>{t(text('العودة للقائمة','Back to list'))}</Link>}
    <div className="dash-filters"><label>{t(text('بحث','Search'))}<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t(text('ابحث بالاسم…','Search by name…'))}/></label>
      {['competitions','workshops'].includes(section) && <label>{t(text('حالة التسجيل','Registration status'))}<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">{t(text('جميع الحالات','All statuses'))}</option>{[...new Map(dashboardData[section].map(x=>[x.status[1],x.status])).values()].map(x=><option key={x[1]} value={x[1]}>{t(x)}</option>)}</select></label>}
      {section==='competitions' && <label>{t(text('نوع المسابقة','Competition type'))}<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">{t(text('جميع الأنواع','All types'))}</option>{dashboardData.competitions.map(x=><option key={x.id} value={x.category[1]}>{t(x.category)}</option>)}</select></label>}
      {section==='workshops' && <label>{t(text('التاريخ','Date'))}<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>}
    </div><p className="dash-result-count" aria-live="polite">{records.length} {t(text('نتيجة','results'))}</p>
    <div className={`dash-grid ${section==='teams'?'dash-grid--teams':''}`}>{records.map(item=><RecordCard key={item.id} {...{section,item,t,notify,query}}/>)}</div>
    {!records.length && <div className="dash-empty"><SectionHeading title={t(text('لا توجد نتائج','No results'))} description={t(text('جرّب تغيير البحث أو التصفية.','Try changing the search or filters.'))}/><Action onClick={()=>{setSearch('');setStatus('');setCategory('');setDate('');}}>{t(text('مسح التصفية','Clear filters'))}</Action></div>}</>;
}
function Details({ t, notify }) {
  const {section,id}=useParams();
  const [params]=useSearchParams();
  const config=getDashboardSection(section);
  const item=config?dashboardData[section].find(x=>x.id===id):null;
  if(!item)return <Missing t={t}/>;
  const parent=params.get('parent');
  const query=config.parent && parent?'?parent='+encodeURIComponent(parent):'';
  const detailFields=config.fields.filter(field=>!['password','file'].includes(field.type) && field.key!=='confirmPassword' && field.key!=='title');
  const values=detailFields.map(field=>{
    let value=item[field.key];
    if(field.type==='competition' || field.type==='workshop') {
      value=dashboardData[field.type==='competition'?'competitions':'workshops'].find(record=>record.id===value)?.title;
    }
    return [t(field.label), t(value) || '—'];
  });
  return <><Heading title={t(item.title)} overline={config.overline}/>
    <Link className="dash-back" to={`${base}/${section}${query}`}>{t(text('العودة للقائمة','Back to list'))}</Link>
    <RecordCard {...{section,item,t,notify,query}} showDetails={false}/>
    <div className="dash-card dash-detail-fields"><SectionHeading title={t(text('التفاصيل','Details'))}/><Meta items={values}/></div>
    {['competitions','workshops'].includes(section) && <Link className="dash-action dash-action--primary" to={`${base}/${section==='competitions'?'teams':'participants'}?parent=${id}`}>{t(section==='competitions'?text('عرض الفرق المسجلة','View registered teams'):text('عرض المشاركين','View participants'))}</Link>}
  </>;
}
function Editor({ t, notify }) {
  const {section,id}=useParams();const [params]=useSearchParams();const config=getDashboardSection(section);const item=id && config?dashboardData[section].find(x=>x.id===id):null;
  const [showPassword,setShowPassword]=useState(false);const [error,setError]=useState('');
  useEffect(()=>{setShowPassword(false);setError('');},[section,id]);
  if(!config || (id && !item))return <Missing t={t}/>;
  const parent=params.get('parent');const cancel=`${base}/${section}${config.parent && parent?'?parent='+encodeURIComponent(parent):''}`;
  function submit(e) {
    e.preventDefault();const data=new FormData(e.currentTarget);
    if(!String(data.get('title')??'').trim()){setError(t(text('أدخل اسمًا أو عنوانًا صالحًا.','Enter a valid name or title.')));return;}
    if(data.get('start') && data.get('end') && data.get('end')<data.get('start')){setError(t(text('تاريخ النهاية لا يمكن أن يسبق تاريخ البداية.','End date cannot precede start date.')));return;}
    if(section==='permissions' && data.get('password')!==data.get('confirmPassword')){setError(t(text('كلمتا المرور غير متطابقتين.','Passwords do not match.')));return;}
    setError('');notify(t(pending));e.currentTarget.querySelectorAll('input[type=password], input[data-password]').forEach(input=>{input.value='';});
  }
  return <><Heading title={t(text('إضافة / تعديل','Add / edit'))+' '+t(config.singular)} description={t(text('أدخل التفاصيل المطلوبة','Enter the required details'))} overline={config.overline}/>
    <form className="dash-form" onSubmit={submit} key={`${section}/${id??'new'}`}><div className="dash-form-grid">{config.fields.map(field=>{
      const password=field.type==='password';const full=['textarea','file'].includes(field.type);const options=field.type==='competition'?dashboardData.competitions:field.type==='workshop'?dashboardData.workshops:null;
      const value=item?.[field.key]==='—'?undefined:item?.[field.key];
      const defaultValue=options?(value??parent??''):field.type==='select'?(value?.[1]??''):t(value);
      const common={id:'dash-'+field.key,name:field.key,defaultValue,required:field.key==='title',maxLength:field.type==='textarea'?4000:200};
      return <label className={full?'dash-field--full':''} key={field.key} htmlFor={common.id}>{t(field.label)}
        {field.type==='textarea'?<textarea {...common} rows="4"/>:options || field.type==='select'?<select {...common}><option value="">{t(text('اختر…','Choose…'))}</option>{(options??field.options).map((x,i)=><option key={x.id??i} value={x.id??x[1]}>{t(x.title??x)}</option>)}</select>:<input {...common} defaultValue={field.type==='file'?undefined:defaultValue} type={password?(showPassword?'text':'password'):field.type} data-password={password || undefined} autoComplete={password?'new-password':'off'} min={field.type==='number'?0:undefined} step={field.type==='number'?1:undefined} accept={field.type==='file'?'image/png,image/jpeg,image/webp':undefined}/>}
      </label>;
    })}</div>{section==='permissions' && <Action aria-pressed={showPassword} onClick={()=>setShowPassword(!showPassword)}>{t(showPassword?text('إخفاء كلمة المرور','Hide passwords'):text('إظهار كلمة المرور','Show passwords'))}</Action>}
    {error && <p role="alert">{error}</p>}<p className="dash-secondary">{t(text('معاينة فقط — الحفظ والرفع متاحان بعد الربط.','Preview only — saving and uploading await integration.'))}</p><div className="dash-form-actions"><button type="submit" className="dash-action dash-action--primary">{t(text('حفظ','Save'))} {t(config.singular)}</button><Link className="dash-action" to={cancel}>{t(text('إلغاء','Cancel'))}</Link></div></form></>;
}
function Missing({t}) {return <><Heading title={t(text('الصفحة غير موجودة','Page not found'))} overline="DASHBOARD"/><Link className="dash-action" to={base}>{t(text('الرئيسية','Dashboard home'))}</Link></>;}
export default function Dashboard() {
  const [language,setLanguage]=useState('ar');const [menu,setMenu]=useState(false);const [message,setMessage]=useState('');const location=useLocation();const menuButton=useRef(null);
  const t=value=>Array.isArray(value)?value[language==='ar'?0:1]:String(value??'');
  useEffect(()=>{const oldLang=document.documentElement.lang;const oldDir=document.documentElement.dir;document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';return()=>{document.documentElement.lang=oldLang;document.documentElement.dir=oldDir;};},[language]);
  useEffect(()=>{setMenu(false);setMessage('');document.querySelector('.dash-heading h1')?.focus();},[location.pathname,location.search]);
  return <div className="dashboard" lang={language} dir={language==='ar'?'rtl':'ltr'}><a className="dash-skip" href="#dashboard-content">{t(text('تجاوز التنقل','Skip navigation'))}</a>
    <div className="dash-toolbar"><Action ref={menuButton} aria-expanded={menu} aria-controls="dashboard-nav" onClick={()=>setMenu(!menu)}>{t(text('القائمة','Menu'))}</Action><Action onClick={()=>setLanguage(language==='ar'?'en':'ar')}>{language==='ar'?'English':'العربية'}</Action></div>
    <div className="dash-layout"><aside className={`dash-sidebar ${menu?'is-open':''}`} onKeyDown={event=>{if(event.key==='Escape' && menu){event.preventDefault();setMenu(false);menuButton.current?.focus();}}}><nav id="dashboard-nav" aria-label={t(text('تنقل لوحة التحكم','Dashboard navigation'))}><NavLink end to={base}>{t(text('الرئيسية','Home'))}</NavLink>{navigation.map(key=><NavLink key={key} to={`${base}/${key}`} className={({isActive})=>isActive || location.pathname.includes('/'+(key==='competitions'?'teams':key==='workshops'?'participants':'_'))?'active':''}>{t(dashboardSections[key].title)}</NavLink>)}</nav><div className="dash-sidebar-bottom"><p>{t(text('المشرف العام — معاينة','Super Admin — preview'))}</p><Action onClick={()=>setMessage(t(pending))}>{t(text('تسجيل الخروج','Sign out'))}</Action></div></aside>
      <section className="dash-content" id="dashboard-content" tabIndex={-1} aria-label={t(text('محتوى لوحة التحكم','Dashboard content'))}>{message && <div className="dash-notice" role="status">{message}<Action onClick={()=>setMessage('')}>{t(text('إغلاق','Dismiss'))}</Action></div>}
        <Routes><Route index element={<Home t={t}/>}/><Route path=":section" element={<Listing t={t} notify={setMessage}/>}/><Route path=":section/new" element={<Editor t={t} notify={setMessage}/>}/><Route path=":section/:id/edit" element={<Editor t={t} notify={setMessage}/>}/><Route path=":section/:id" element={<Details t={t} notify={setMessage}/>}/><Route path="*" element={<Missing t={t}/>}/></Routes>
      </section></div></div>;
}
