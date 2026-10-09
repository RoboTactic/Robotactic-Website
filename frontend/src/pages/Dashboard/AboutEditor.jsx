import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api/client';
import { uploadDashboardImage } from '../../services/api/dashboard';
import { useDashboardData } from '../../services/api/useDashboardData';
import ImageUploadField from './ImageUploadField';

const fields = [
 ['title_ar','العنوان بالعربية','Arabic title',true],['title_en','العنوان بالإنجليزية','English title',true],
 ['subtitle_ar','المقدمة بالعربية','Arabic introduction',false,'textarea'],['subtitle_en','المقدمة بالإنجليزية','English introduction',false,'textarea'],
 ['body_ar','النص بالعربية','Arabic body',true,'textarea'],['body_en','النص بالإنجليزية','English body',true,'textarea'],
 ['values_ar','القيم بالعربية — قيمة في كل سطر','Arabic values — one per line',false,'lines'],['values_en','القيم بالإنجليزية — قيمة في كل سطر','English values — one per line',false,'lines'],
 ['image_url','رابط الصورة','Image URL',false,'url'],['image_alt_ar','وصف الصورة بالعربية','Arabic image alternative text'],['image_alt_en','وصف الصورة بالإنجليزية','English image alternative text'],
];
export default function AboutEditor({language,admin,notify,onSessionExpired}) {
 const ar=language==='ar';const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [formVersion,setFormVersion]=useState(0);
 const {data:record,error:loadError,reload,setData}=useDashboardData(admin.role_code==='super_admin'?'/admin/about':null,onSessionExpired,{editable:true});
 const displayError=error||loadError;
 function discard(){setError('');setFormVersion(value=>value+1);reload()}
 if(admin.role_code!=='super_admin')return <h1>{ar?'ليس لديك صلاحية لهذا القسم.':'You do not have access to this section.'}</h1>;
 async function submit(event) {
  event.preventDefault();setBusy(true);setError('');const form=new FormData(event.currentTarget);const payload={};
  try {
   for(const [name] of fields){const value=String(form.get(name)||'').trim();payload[name]=name.startsWith('values_')?value.split('\n').map(item=>item.trim()).filter(Boolean):value||null}
   payload.status=form.get('status');const image=form.get('image_file');
   const hasFile=image instanceof File && image.size>0;
   if((payload.image_url||hasFile)&&(!payload.image_alt_ar||!payload.image_alt_en))throw new Error(ar?'أضف وصف الصورة بالعربية والإنجليزية.':'Add image alternative text in both languages.');
   if(['values_ar','values_en'].some(key=>payload[key].length>20||payload[key].some(item=>item.length>120)))throw new Error(ar?'الحد الأقصى 20 قيمة، وكل قيمة حتى 120 حرفًا.':'Use up to 20 values, each up to 120 characters.');
   if(hasFile){if(!['image/jpeg','image/png','image/webp'].includes(image.type)||image.size>5*1024*1024)throw new Error(ar?'اختر صورة JPEG أو PNG أو WebP حتى 5 ميغابايت.':'Choose a JPEG, PNG or WebP image up to 5 MB.');payload.image_url=(await uploadDashboardImage('about',image)).url}
   const saved=await apiRequest('/admin/about',{method:'PATCH',body:JSON.stringify(payload)});setData(saved);notify(ar?'تم حفظ محتوى عن الملتقى.':'About content saved.');
  } catch(issue){setError(issue.message);if(issue.status===401)onSessionExpired()}
  finally{setBusy(false)}
 }
 function renderField(name) {
  const [,labelAr,labelEn,required,type] = fields.find(item => item[0] === name);
  const english = name.endsWith('_en') || type === 'url';
  const multiline = ['textarea','lines'].includes(type);
  const id = `dash-about-${name}`;
  return <div key={name} className={`dash-field ${name==='image_url'?'dash-field--full':''}`}>
   <label htmlFor={id}>{ar?labelAr:labelEn}</label>
   {multiline?<textarea id={id} name={name} lang={english?'en':'ar'} dir={english?'ltr':'rtl'} rows={type==='lines'?6:name.startsWith('body_')?8:3} maxLength={4000} required={required} defaultValue={type==='lines'?(record[name]||[]).join('\n'):record[name]||''}/>:<input id={id} name={name} lang={english?'en':'ar'} dir={english?'ltr':'rtl'} type={type||'text'} maxLength={4000} required={required} defaultValue={record[name]||''}/>}
  </div>;
 }
 const groups = [
  {key:'intro',label:ar?'العنوان والمقدمة':'Title and introduction',names:['title_ar','title_en','subtitle_ar','subtitle_en']},
  {key:'body',label:ar?'محتوى الملتقى':'Event content',names:['body_ar','body_en']},
  {key:'values',label:ar?'قيم الملتقى':'Event values',hint:ar?'اكتب كل قيمة في سطر مستقل.':'Write one value per line.',names:['values_ar','values_en']},
  {key:'image',label:ar?'الصورة ووصفها':'Image and alternative text',names:['image_url','image_alt_ar','image_alt_en']},
 ];
 return <><header className="dash-heading"><div><span className="dash-overline" lang="en">ROBOTACTIC</span><h1 tabIndex="-1">{ar?'إدارة عن الملتقى':'About page management'}</h1><p>{ar?'المحتوى المنشور يظهر في صفحة عن الملتقى وفي الصفحة الرئيسية.':'Published content appears on the About page and Home page.'}</p></div><Link className="dash-action" to="/about" target="_blank" rel="noopener noreferrer">{ar?'عرض الصفحة العامة':'View public page'}</Link></header>
 {!record?displayError?<div className="dash-empty" role="alert"><p>{displayError}</p><button className="dash-action" onClick={discard}>{ar?'إعادة المحاولة':'Retry'}</button></div>:<p role="status">{ar?'جارٍ تحميل المحتوى…':'Loading content…'}</p>:<form key={formVersion} className="dash-form dash-about-form" onSubmit={submit}>
  {groups.map(group=><fieldset className={`dash-editor-group dash-about-${group.key}`} key={group.key}><legend>{group.label}</legend>{group.hint&&<p className="dash-secondary">{group.hint}</p>}<div className="dash-form-grid">{group.names.map(renderField)}{group.key==='image'&&<ImageUploadField language={language} currentUrl={record.image_url}/>}</div></fieldset>)}
  <fieldset className="dash-editor-group"><legend>{ar?'نشر المحتوى':'Publication'}</legend><div className="dash-field"><label htmlFor="dash-about-status">{ar?'حالة النشر':'Publication status'}</label><select id="dash-about-status" name="status" defaultValue={record.status}><option value="draft">{ar?'مسودة':'Draft'}</option><option value="published">{ar?'منشور':'Published'}</option><option value="hidden">{ar?'مخفي':'Hidden'}</option></select></div></fieldset>
  {displayError&&<p role="alert">{displayError}</p>}<div className="dash-form-actions"><button className="dash-action dash-action--primary" type="submit" disabled={busy}>{busy?(ar?'جارٍ الحفظ…':'Saving…'):(ar?'حفظ':'Save')}</button><button className="dash-action" type="button" disabled={busy} onClick={discard}>{ar?'إلغاء التعديلات':'Discard edits'}</button></div>
 </form>}</>;
}
