import { useState } from 'react';
import { publicSections, canManageVisibility } from '../../data/publicSections';
import { apiRequest } from '../../services/api/client';
import { useDashboardData } from '../../services/api/useDashboardData';
import { useSectionVisibility } from '../../services/api/SectionVisibility';
import { messageForError } from './errorMessages';
import Icon from '../../components/Icon/Icon';

const text = (pair, language) => pair[language === 'ar' ? 0 : 1];

function Controls({ sections, language, notify, onSessionExpired }) {
  const { data, loading, failure, reload } = useDashboardData('/admin/section-visibility', onSessionExpired);
  const { apply } = useSectionVisibility();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  async function toggle(key) {
    if (busy || !data || typeof data[key] !== 'boolean') return;
    setBusy(key); setError('');
    try {
      const saved = await apiRequest(`/admin/section-visibility/${key}`, { method: 'PATCH', body: JSON.stringify({ visible: !data[key] }) });
      apply(saved);
      reload();
      notify?.(text(saved.visible ? ['تم إظهار القسم في الموقع.', 'Section shown on the website.'] : ['تم إخفاء القسم من الموقع.', 'Section hidden from the website.'], language));
    } catch (issue) {
      if (issue.status === 401) onSessionExpired();
      setError(messageForError(issue, language));
    } finally { setBusy(null); }
  }
  return <section className="dash-visibility" aria-label={text(['ظهور أقسام الموقع', 'Website section visibility'], language)} aria-busy={Boolean(busy)}>
    <p className="dash-secondary">{text(['إخفاء القسم يزيله من الموقع والقوائم والرئيسية. تبقى بياناته محفوظة ويمكن إظهاره مجددًا.', 'Hiding a section removes it from the website, menus and home page. Its content is kept and can be shown again.'], language)}</p>
    {loading && <p role="status">{text(['جارٍ تحميل إعدادات الظهور…', 'Loading visibility settings…'], language)}</p>}
    {(failure || error) && <div className="dash-form-error" role="alert"><p>{error || messageForError(failure, language)}</p><button type="button" className="dash-action" onClick={() => { setError(''); reload(); }}>{text(['إعادة المحاولة', 'Try again'], language)}</button></div>}
    <div className="dash-visibility__list">{sections.map(section => {
      const visible = data?.[section.key];
      return <div className="dash-visibility__row" key={section.key}>
        <div><h2>{text(section.label, language)}</h2><p role="status">{typeof visible === 'boolean' ? text(visible ? ['ظاهر في الموقع', 'Visible on website'] : ['مخفي من الموقع', 'Hidden from website'], language) : text(['الحالة غير متاحة', 'Status unavailable'], language)}</p></div>
        <button type="button" className="dash-action" disabled={Boolean(busy) || Boolean(failure) || typeof visible !== 'boolean'} onClick={() => toggle(section.key)} aria-label={`${text(visible ? ['إخفاء هذه الخانة', 'Hide this section'] : ['إظهار هذه الخانة', 'Show this section'], language)}: ${text(section.label, language)}`}>
          <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
          {busy === section.key ? text(['جارٍ الحفظ…', 'Saving…'], language) : text(visible ? ['إخفاء هذه الخانة', 'Hide this section'] : ['إظهار هذه الخانة', 'Show this section'], language)}
        </button>
      </div>;
    })}</div>
  </section>;
}

export default function SectionVisibilityPanel({ resource, admin, ...props }) {
  const sections = publicSections.filter(section => (!resource || section.resource === resource) && canManageVisibility(admin, section));
  if (!sections.length) return null;
  return <Controls {...props} sections={sections} />;
}
