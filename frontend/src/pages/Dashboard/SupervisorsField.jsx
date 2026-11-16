import { useState } from 'react';

// Repeatable list of a competition's supervisors. The list order is the public display
// order; the whole list is sent as `supervisors` and replaces the saved one on save.
const MAX_SUPERVISORS = 20;
let nextKey = 0;
const blank = () => ({ key: `s${nextKey += 1}`, name_ar: '', name_en: '', title_ar: '', title_en: '', linkedin_url: '' });
const inputs = [
  ['name_ar', 'الاسم بالعربية', 'Arabic name', 'rtl', 'text', true],
  ['name_en', 'الاسم بالإنجليزية', 'English name', 'ltr', 'text'],
  ['title_ar', 'الصفة بالعربية', 'Arabic title', 'rtl', 'text'],
  ['title_en', 'الصفة بالإنجليزية', 'English title', 'ltr', 'text'],
  ['linkedin_url', 'رابط LinkedIn', 'LinkedIn URL', 'ltr', 'url'],
];

export function supervisorsPayload(rows) {
  return rows
    .filter((row) => inputs.some(([name]) => row[name].trim()))
    .map((row, index) => ({
      name_ar: row.name_ar.trim(), name_en: row.name_en.trim() || null,
      title_ar: row.title_ar.trim() || null, title_en: row.title_en.trim() || null,
      linkedin_url: row.linkedin_url.trim() || null, display_order: index + 1,
    }));
}

export default function SupervisorsField({ language, initial = [] }) {
  const ar = language === 'ar';
  const t = (arText, enText) => (ar ? arText : enText);
  const [rows, setRows] = useState(() => initial.map((item) => ({
    ...blank(), ...Object.fromEntries(inputs.map(([name]) => [name, item[name] ?? ''])),
  })));
  const [announcement, setAnnouncement] = useState('');

  const edit = (key, name, value) => setRows((current) => current.map((row) => row.key === key ? { ...row, [name]: value } : row));
  const add = () => { setRows((current) => [...current, blank()]); setAnnouncement(t('أُضيف مشرف جديد.', 'Supervisor added.')); };
  const remove = (key) => { setRows((current) => current.filter((row) => row.key !== key)); setAnnouncement(t('حُذف المشرف من القائمة.', 'Supervisor removed from the list.')); };
  const move = (index, step) => setRows((current) => {
    const next = [...current];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    return next;
  });

  return <fieldset className="dash-field--full dash-supervisors">
    <legend>{t('مشرفو المسابقة', 'Competition supervisors')}</legend>
    <p className="dash-secondary">{t('تظهر الأسماء والصفات في صفحة المسابقات العامة بهذا الترتيب. لا تضف أرقام تواصل أو بريدًا شخصيًا.', 'Names and titles appear on the public Competitions page in this order. Do not add phone numbers or personal email.')}</p>
    <input type="hidden" name="supervisors" value={JSON.stringify(supervisorsPayload(rows))} />
    {rows.length === 0 && <p className="dash-supervisors__empty">{t('لم يُضف مشرفون بعد.', 'No supervisors added yet.')}</p>}
    <ol className="dash-supervisors__list">
      {rows.map((row, index) => {
        const heading = `${t('المشرف', 'Supervisor')} ${index + 1}`;
        return <li key={row.key} className="dash-supervisors__item">
          <div className="dash-supervisors__head">
            <h3 id={`supervisor-${row.key}`}>{heading}</h3>
            <div className="dash-supervisors__tools">
              <button type="button" className="dash-action" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${t('نقل للأعلى', 'Move up')}: ${heading}`}><span aria-hidden="true">↑</span></button>
              <button type="button" className="dash-action" disabled={index === rows.length - 1} onClick={() => move(index, 1)} aria-label={`${t('نقل للأسفل', 'Move down')}: ${heading}`}><span aria-hidden="true">↓</span></button>
              <button type="button" className="dash-action dash-action--danger" onClick={() => remove(row.key)}>{t('حذف', 'Remove')}<span className="sr-only">: {heading}</span></button>
            </div>
          </div>
          <div className="dash-supervisors__grid" role="group" aria-labelledby={`supervisor-${row.key}`}>
            {inputs.map(([name, labelAr, labelEn, dir, type, required]) => <label key={name} className={name === 'linkedin_url' ? 'dash-supervisors__wide' : undefined}>
              {t(labelAr, labelEn)}{required && <span aria-hidden="true"> *</span>}
              <input type={type} dir={dir} value={row[name]} required={required} maxLength={name === 'linkedin_url' ? 4000 : 120}
                autoComplete="off" placeholder={name === 'linkedin_url' ? 'https://www.linkedin.com/in/…' : undefined}
                onChange={(event) => edit(row.key, name, event.target.value)} />
            </label>)}
          </div>
        </li>;
      })}
    </ol>
    <button type="button" className="dash-action dash-supervisors__add" onClick={add} disabled={rows.length >= MAX_SUPERVISORS}>
      <span aria-hidden="true">+</span> {t('إضافة مشرف', 'Add supervisor')}
    </button>
    <p className="sr-only" aria-live="polite">{announcement}</p>
  </fieldset>;
}
