import { useEffect, useId, useRef, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../services/api/client';
import { useDashboardData } from '../../services/api/useDashboardData';
import Icon from '../../components/Icon/Icon';
import SectionVisibilityPanel from './SectionVisibilityPanel';
import { messageForError } from './errorMessages';

/*
  Team management («الفريق») — Super Admin only (the server enforces the same rule).
  Departments → their leaders and committees → committee members. Every write answers with the
  complete structure, which replaces the view; the public Team page reads the same data.
*/
const BASE = '/dashboard/team';
const API = '/admin/team';
const tr = (pair, language) => pair[language === 'ar' ? 0 : 1];
const pairOf = (record, key) => [record?.[`${key}_ar`] || '', record?.[`${key}_en`] || ''];

// Department icons (the backend accepts the same list).
const ICON_CHOICES = [
  ['users', 'أشخاص', 'People'], ['globe', 'الكرة الأرضية', 'Globe'], ['megaphone', 'مكبّر صوت', 'Megaphone'],
  ['route', 'مسار', 'Route'], ['calendar', 'تقويم', 'Calendar'], ['chip', 'شريحة', 'Chip'], ['chat', 'محادثة', 'Chat'],
  ['sensor', 'مستشعر', 'Sensor'], ['controller', 'وحدة تحكم', 'Controller'], ['drone', 'درون', 'Drone'],
  ['workshop', 'ورشة', 'Workshop'], ['competition', 'مسابقة', 'Competition'], ['project', 'مشروع', 'Project'],
  ['simulation', 'محاكاة', 'Simulation'], ['live', 'بث مباشر', 'Live'], ['search', 'بحث', 'Search'],
];
// Title presets. «مسمى آخر» lets the team write any role in both languages.
const LEADER_ROLES = [['القائد', 'Leader'], ['نائب القائد', 'Vice-Leader'], ['قائد', 'Program Leader']];
const MEMBER_ROLES = [['المشرف', 'Supervisor'], ['نائب المشرف', 'Vice Supervisor'], ['القائد', 'Leader']];
const CUSTOM = 'custom';
const PLAIN = 'member';

const peopleCount = (n, language) => tr([n === 1 ? 'عضو واحد' : n === 2 ? 'عضوان' : n <= 10 ? `${n} أعضاء` : `${n} عضوًا`, `${n} ${n === 1 ? 'person' : 'people'}`], language);
const committeeCount = (n, language) => tr([n === 1 ? 'لجنة واحدة' : n === 2 ? 'لجنتان' : n <= 10 ? `${n} لجان` : `${n} لجنة`, `${n} ${n === 1 ? 'committee' : 'committees'}`], language);
const headcount = (department) => department.committees.reduce((n, c) => n + c.members.length, 0);

/* Shared write helper: one request at a time, the returned structure replaces the view. */
function useTeamWriter({ language, notify, onSessionExpired, setData }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function write(method, path, payload, success) {
    setBusy(true); setError('');
    try {
      const tree = await apiRequest(`${API}${path}`, { method, ...(payload ? { body: JSON.stringify(payload) } : {}) });
      setData(tree);
      if (success) notify(tr(success, language));
      return tree;
    } catch (issue) {
      setError(messageForError(issue, language));
      if (issue.status === 401) onSessionExpired();
      return null;
    } finally { setBusy(false); }
  }
  return { busy, error, setError, write };
}

function TextField({ label, name, value, onChange, lang, required = true, maxLength = 200, inputRef }) {
  const id = useId();
  return <div className="dash-field">
    <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <input ref={inputRef} id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} required={required} maxLength={maxLength} autoComplete="off" />
  </div>;
}

/* Role select with presets and a custom option. `allowPlain` adds «عضو» (no highlighted title). */
function RoleField({ language, presets, allowPlain, state, setState }) {
  const id = useId();
  return <>
    <div className="dash-field dash-field--full">
      <label htmlFor={id}>{tr(['الدور', 'Role'], language)}</label>
      <select id={id} value={state.preset} onChange={(event) => {
        const preset = event.target.value;
        const chosen = presets[Number(preset)];
        setState((current) => ({ ...current, preset, ...(chosen ? { role_ar: chosen[0], role_en: chosen[1] } : preset === CUSTOM ? {} : { role_ar: '', role_en: '' }) }));
      }}>
        {allowPlain && <option value={PLAIN}>{tr(['عضو', 'Member'], language)}</option>}
        {presets.map((role, index) => <option key={role[1]} value={String(index)}>{language === 'ar' ? `${role[0]} — ${role[1]}` : `${role[1]} — ${role[0]}`}</option>)}
        <option value={CUSTOM}>{tr(['مسمى آخر…', 'Another title…'], language)}</option>
      </select>
    </div>
    {state.preset === CUSTOM && <>
      <TextField label={tr(['الدور بالعربية', 'Arabic role'], language)} value={state.role_ar} onChange={(value) => setState((current) => ({ ...current, role_ar: value }))} lang="ar" maxLength={100} />
      <TextField label={tr(['الدور بالإنجليزية', 'English role'], language)} value={state.role_en} onChange={(value) => setState((current) => ({ ...current, role_en: value }))} lang="en" maxLength={100} />
    </>}
  </>;
}

const presetOf = (record, presets, allowPlain) => {
  if (allowPlain && !record?.is_lead) return PLAIN;
  if (!record) return '0';
  const index = presets.findIndex(([ar, en]) => ar === record.role_ar && en === record.role_en);
  return index >= 0 ? String(index) : CUSTOM;
};

/* Add or edit a person: a department leader (always titled) or a committee member. */
function PersonForm({ language, kind, initial, busy, onSubmit, onCancel, submitLabel, keepOpen }) {
  const member = kind === 'member';
  const presets = member ? MEMBER_ROLES : LEADER_ROLES;
  const start = () => ({
    name_ar: initial?.name_ar || '', name_en: initial?.name_en || '',
    role_ar: initial?.role_ar || (member ? '' : LEADER_ROLES[0][0]), role_en: initial?.role_en || (member ? '' : LEADER_ROLES[0][1]),
    preset: presetOf(initial, presets, member),
  });
  const [state, setState] = useState(start);
  const first = useRef(null);
  const set = (key) => (value) => setState((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    const titled = !member || state.preset !== PLAIN;
    const payload = { name_ar: state.name_ar.trim(), name_en: state.name_en.trim() };
    if (member) payload.is_lead = titled;
    if (titled) { payload.role_ar = state.role_ar.trim(); payload.role_en = state.role_en.trim(); }
    const saved = await onSubmit(payload);
    // Adding several people in a row: keep the form open, clear the names, stay on the first field.
    if (saved && keepOpen) { setState((current) => ({ ...current, name_ar: '', name_en: '' })); first.current?.focus(); }
  }
  return <form className="dash-team-form" onSubmit={submit} aria-busy={busy}>
    <div className="dash-form-grid">
      <TextField inputRef={first} label={tr(['الاسم بالعربية', 'Arabic name'], language)} value={state.name_ar} onChange={set('name_ar')} lang="ar" />
      <TextField label={tr(['الاسم بالإنجليزية', 'English name'], language)} value={state.name_en} onChange={set('name_en')} lang="en" />
      <RoleField language={language} presets={presets} allowPlain={member} state={state} setState={setState} />
    </div>
    <div className="dash-form-actions">
      <button className="dash-action dash-action--primary" type="submit" disabled={busy}>{busy ? tr(['جارٍ الحفظ…', 'Saving…'], language) : submitLabel}</button>
      {onCancel && <button className="dash-action" type="button" onClick={onCancel} disabled={busy}>{tr(['إلغاء', 'Cancel'], language)}</button>}
    </div>
  </form>;
}

function IconPicker({ language, value, onChange }) {
  return <fieldset className="dash-field--full dash-team-icons">
    <legend>{tr(['أيقونة القسم', 'Department icon'], language)}</legend>
    <div className="dash-team-icons__grid">
      {ICON_CHOICES.map(([name, ar, en]) => <label key={name} className="dash-team-icons__option" title={language === 'ar' ? ar : en}>
        <input type="radio" name="icon" value={name} checked={value === name} onChange={() => onChange(name)} aria-label={language === 'ar' ? ar : en} />
        <Icon name={name} size={22} />
      </label>)}
    </div>
  </fieldset>;
}

function DepartmentForm({ language, initial, busy, onSubmit, onCancel, submitLabel }) {
  const [state, setState] = useState(() => ({ name_ar: initial?.name_ar || '', name_en: initial?.name_en || '', icon: initial?.icon || 'users' }));
  const set = (key) => (value) => setState((current) => ({ ...current, [key]: value }));
  return <form className="dash-team-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ name_ar: state.name_ar.trim(), name_en: state.name_en.trim(), icon: state.icon }); }} aria-busy={busy}>
    <div className="dash-form-grid">
      <TextField label={tr(['اسم القسم بالعربية', 'Arabic department name'], language)} value={state.name_ar} onChange={set('name_ar')} lang="ar" />
      <TextField label={tr(['اسم القسم بالإنجليزية', 'English department name'], language)} value={state.name_en} onChange={set('name_en')} lang="en" />
      <IconPicker language={language} value={state.icon} onChange={set('icon')} />
    </div>
    <div className="dash-form-actions">
      <button className="dash-action dash-action--primary" type="submit" disabled={busy}>{busy ? tr(['جارٍ الحفظ…', 'Saving…'], language) : submitLabel}</button>
      {onCancel && <button className="dash-action" type="button" onClick={onCancel} disabled={busy}>{tr(['إلغاء', 'Cancel'], language)}</button>}
    </div>
  </form>;
}

function CommitteeForm({ language, initial, busy, onSubmit, onCancel, submitLabel }) {
  const [state, setState] = useState(() => ({ name_ar: initial?.name_ar || '', name_en: initial?.name_en || '', is_general: Boolean(initial?.is_general) }));
  const set = (key) => (value) => setState((current) => ({ ...current, [key]: value }));
  const generalId = useId();
  return <form className="dash-team-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ name_ar: state.name_ar.trim(), name_en: state.name_en.trim(), is_general: state.is_general }); }} aria-busy={busy}>
    <div className="dash-form-grid">
      <TextField label={tr(['اسم اللجنة بالعربية', 'Arabic committee name'], language)} value={state.name_ar} onChange={set('name_ar')} lang="ar" />
      <TextField label={tr(['اسم اللجنة بالإنجليزية', 'English committee name'], language)} value={state.name_en} onChange={set('name_en')} lang="en" />
      <div className="dash-field--full">
        <label className="dash-checkbox-label" htmlFor={generalId}>
          <span>{tr(['أعضاء القسم بلا لجنة (تظهر كمجموعة «أعضاء القسم» ولا تُحسب لجنة)', 'Department members without a committee (shown as a members group, not counted as a committee)'], language)}</span>
          <input id={generalId} type="checkbox" checked={state.is_general} onChange={(event) => set('is_general')(event.target.checked)} />
        </label>
      </div>
    </div>
    <div className="dash-form-actions">
      <button className="dash-action dash-action--primary" type="submit" disabled={busy}>{busy ? tr(['جارٍ الحفظ…', 'Saving…'], language) : submitLabel}</button>
      {onCancel && <button className="dash-action" type="button" onClick={onCancel} disabled={busy}>{tr(['إلغاء', 'Cancel'], language)}</button>}
    </div>
  </form>;
}

/* ↑ / ↓ / delete for one row. Labels name the row so screen-reader users know what moves. */
function RowTools({ language, label, index, total, busy, onMove, onEdit, onDelete, editing, moveDisabled = false }) {
  return <div className="dash-team-tools">
    {onEdit && <button type="button" className="dash-action dash-action--edit" aria-expanded={editing} onClick={onEdit} disabled={busy}>{tr(editing ? ['إغلاق', 'Close'] : ['تعديل', 'Edit'], language)}<span className="dash-visually-hidden">: {label}</span></button>}
    <button type="button" className="dash-action dash-team-tools__move" disabled={busy || moveDisabled || index === 0} onClick={() => onMove('up')} aria-label={`${tr(['نقل للأعلى', 'Move up'], language)}: ${label}`}><span aria-hidden="true">↑</span></button>
    <button type="button" className="dash-action dash-team-tools__move" disabled={busy || moveDisabled || index === total - 1} onClick={() => onMove('down')} aria-label={`${tr(['نقل للأسفل', 'Move down'], language)}: ${label}`}><span aria-hidden="true">↓</span></button>
    <button type="button" className="dash-action dash-action--danger" disabled={busy} onClick={onDelete}>{tr(['حذف', 'Delete'], language)}<span className="dash-visually-hidden">: {label}</span></button>
  </div>;
}

/* One person row: role (when titled), name in the interface language, the other language beneath. */
function PersonRow({ language, person, highlighted, children }) {
  const name = pairOf(person, 'name');
  const role = person.role_ar ? pairOf(person, 'role') : null;
  const other = language === 'ar' ? 'en' : 'ar';
  return <div className={`dash-team-person${highlighted ? ' dash-team-person--lead' : ''}`}>
    <div className="dash-team-person__text">
      {role && <span className="dash-team-person__role">{tr(role, language)}</span>}
      <strong className="dash-team-person__name">{tr(name, language)}</strong>
      <span className="dash-team-person__alt" lang={other} dir={other === 'ar' ? 'rtl' : 'ltr'}>{tr(name, other)}</span>
    </div>
    {children}
  </div>;
}

function Panel({ title, description, action, children, id }) {
  return <section className="dash-card dash-team-panel" aria-labelledby={id}>
    <div className="dash-team-panel__head">
      <div><h2 id={id}>{title}</h2>{description && <p className="dash-secondary">{description}</p>}</div>
      {action}
    </div>
    {children}
  </section>;
}

function Status({ error, busy, language }) {
  return <>
    {error && <p className="dash-form-error" role="alert">{error}</p>}
    {busy && <p className="dash-visually-hidden" role="status">{tr(['جارٍ الحفظ…', 'Saving…'], language)}</p>}
  </>;
}

/* ── Departments overview ─────────────────────────────────────────────── */
function DepartmentsView({ language, tree, writer }) {
  const [adding, setAdding] = useState(false);
  const { busy, error, write } = writer;
  async function remove(department) {
    const name = tr(pairOf(department, 'name'), language);
    const people = headcount(department) + department.leaders.length;
    if (!window.confirm(tr([`حذف «${name}» مع ${committeeCount(department.committees.length, 'ar')} و${peopleCount(people, 'ar')}؟ لا يمكن التراجع.`, `Delete “${name}” with ${committeeCount(department.committees.length, 'en')} and ${peopleCount(people, 'en')}? This cannot be undone.`], language))) return;
    await write('DELETE', `/departments/${department.id}`, null, ['تم حذف القسم.', 'Department deleted.']);
  }
  return <>
    <div className="dash-team-toolbar">
      <p className="dash-result-count">{committeeCount(tree.reduce((n, d) => n + d.committees.filter((c) => !c.is_general).length, 0), language)} · {peopleCount(tree.reduce((n, d) => n + headcount(d) + d.leaders.length, 0), language)}</p>
      {!adding && <button type="button" className="dash-action dash-action--primary" onClick={() => setAdding(true)}><span aria-hidden="true">+</span> {tr(['إضافة قسم', 'Add department'], language)}</button>}
    </div>
    <Status {...{ error, busy, language }} />
    {adding && <Panel id="dash-team-new-department" title={tr(['قسم جديد', 'New department'], language)} description={tr(['يظهر القسم في صفحة الفريق العامة بعد آخر قسم.', 'The department appears on the public Team page after the last one.'], language)}>
      <DepartmentForm language={language} busy={busy} submitLabel={tr(['إضافة القسم', 'Add department'], language)} onCancel={() => setAdding(false)}
        onSubmit={async (payload) => { if (await write('POST', '/departments', payload, ['تمت إضافة القسم.', 'Department added.'])) setAdding(false); }} />
    </Panel>}
    {!tree.length ? <div className="dash-empty dash-empty--records" role="status"><Icon name="users" size={32} /><h2>{tr(['لا توجد أقسام بعد.', 'No departments yet.'], language)}</h2><p>{tr(['أضف أول قسم ثم حدّد قادته ولجانه.', 'Add the first department, then its leaders and committees.'], language)}</p></div>
      : <ol className="dash-grid dash-team-departments">{tree.map((department, index) => {
        const name = pairOf(department, 'name');
        const committees = department.committees.filter((c) => !c.is_general).length;
        return <li key={department.id} className="dash-card dash-team-department">
          <div className="dash-card-heading">
            <span className="dash-badge" aria-hidden="true"><Icon name={department.icon} size={22} /></span>
            <h2><Link to={`${BASE}/${department.id}`} className="dash-team-link">{tr(name, language)}</Link></h2>
            <span className="dash-team-index" lang="en" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <dl className="dash-meta">
            {department.leaders.map((leader) => <div key={leader.id}><dt>{tr(pairOf(leader, 'role'), language)}</dt><dd>{tr(pairOf(leader, 'name'), language)}</dd></div>)}
            <div><dt>{tr(['اللجان والأعضاء', 'Committees & members'], language)}</dt><dd>{committeeCount(committees, language)} · {peopleCount(headcount(department), language)}</dd></div>
          </dl>
          <div className="dash-card-actions dash-team-card-actions">
            <Link className="dash-action dash-action--block dash-action--edit" to={`${BASE}/${department.id}`}>{tr(['إدارة القسم', 'Manage department'], language)}<span className="dash-visually-hidden">: {tr(name, language)}</span></Link>
            <RowTools language={language} label={tr(name, language)} index={index} total={tree.length} busy={busy}
              onMove={(direction) => write('POST', `/departments/${department.id}/move`, { direction })} onDelete={() => remove(department)} />
          </div>
        </li>;
      })}</ol>}
  </>;
}

/* ── One department: details, leaders, committees ────────────────────── */
function DepartmentView({ language, tree, writer }) {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const department = tree.find((item) => String(item.id) === departmentId);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const { busy, error, write } = writer;
  useEffect(() => { setEditing(null); setAdding(null); }, [departmentId]);
  if (!department) return <NotFound language={language} />;
  const name = tr(pairOf(department, 'name'), language);
  const toggle = (key) => setEditing((current) => (current === key ? null : key));
  async function removeDepartment() {
    if (!window.confirm(tr([`حذف «${name}» وكل لجانه وأعضائه؟ لا يمكن التراجع.`, `Delete “${name}” with all its committees and members? This cannot be undone.`], language))) return;
    if (await write('DELETE', `/departments/${department.id}`, null, ['تم حذف القسم.', 'Department deleted.'])) navigate(BASE);
  }
  return <>
    <Link className="dash-back" to={BASE}>{tr(['العودة إلى الأقسام', 'Back to departments'], language)}</Link>
    <header className="dash-heading"><div><span className="dash-overline" lang="en">DEPARTMENT</span><h1 tabIndex="-1">{name}</h1><p>{committeeCount(department.committees.filter((c) => !c.is_general).length, language)} · {peopleCount(headcount(department) + department.leaders.length, language)}</p></div></header>
    <Status {...{ error, busy, language }} />
    <div className="dash-team-stack">
      <Panel id="dash-team-dept-details" title={tr(['بيانات القسم', 'Department details'], language)}
        action={editing !== 'department' && <button type="button" className="dash-action dash-action--edit" onClick={() => toggle('department')}>{tr(['تعديل', 'Edit'], language)}</button>}>
        {editing === 'department'
          ? <DepartmentForm language={language} initial={department} busy={busy} submitLabel={tr(['حفظ القسم', 'Save department'], language)} onCancel={() => setEditing(null)}
            onSubmit={async (payload) => { if (await write('PATCH', `/departments/${department.id}`, payload, ['تم حفظ القسم.', 'Department saved.'])) setEditing(null); }} />
          : <div className="dash-team-summary">
            <span className="dash-badge" aria-hidden="true"><Icon name={department.icon} size={22} /></span>
            <dl className="dash-meta"><div><dt>{tr(['بالعربية', 'Arabic'], language)}</dt><dd lang="ar" dir="rtl">{department.name_ar}</dd></div><div><dt>{tr(['بالإنجليزية', 'English'], language)}</dt><dd lang="en" dir="ltr">{department.name_en}</dd></div></dl>
          </div>}
        <div className="dash-form-actions"><button type="button" className="dash-action dash-action--danger" disabled={busy} onClick={removeDepartment}>{tr(['حذف القسم', 'Delete department'], language)}</button></div>
      </Panel>

      <Panel id="dash-team-leaders" title={tr(['قادة القسم', 'Department leaders'], language)} description={tr(['تظهر على بطاقة القسم في صفحة الفريق بهذا الترتيب.', 'Shown on the department card on the Team page, in this order.'], language)}
        action={adding !== 'leader' && <button type="button" className="dash-action dash-action--primary" onClick={() => setAdding('leader')}><span aria-hidden="true">+</span> {tr(['إضافة قائد', 'Add leader'], language)}</button>}>
        {adding === 'leader' && <div className="dash-team-inline">
          <PersonForm language={language} kind="leader" busy={busy} submitLabel={tr(['إضافة القائد', 'Add leader'], language)} onCancel={() => setAdding(null)}
            onSubmit={async (payload) => { const saved = await write('POST', `/departments/${department.id}/leaders`, payload, ['تمت إضافة القائد.', 'Leader added.']); if (saved) setAdding(null); return saved; }} />
        </div>}
        {department.leaders.length ? <ol className="dash-team-list">{department.leaders.map((leader, index) => {
          const label = tr(pairOf(leader, 'name'), language);
          const key = `leader-${leader.id}`;
          return <li key={leader.id}>
            <PersonRow language={language} person={leader} highlighted>
              <RowTools language={language} label={label} index={index} total={department.leaders.length} busy={busy} editing={editing === key} onEdit={() => toggle(key)}
                onMove={(direction) => write('POST', `/leaders/${leader.id}/move`, { direction })}
                onDelete={() => { if (window.confirm(tr([`حذف «${label}» من قادة القسم؟`, `Remove “${label}” from the department leaders?`], language))) write('DELETE', `/leaders/${leader.id}`, null, ['تم حذف القائد.', 'Leader removed.']); }} />
            </PersonRow>
            {editing === key && <div className="dash-team-inline"><PersonForm language={language} kind="leader" initial={leader} busy={busy} submitLabel={tr(['حفظ', 'Save'], language)} onCancel={() => setEditing(null)}
              onSubmit={async (payload) => { const saved = await write('PATCH', `/leaders/${leader.id}`, payload, ['تم حفظ القائد.', 'Leader saved.']); if (saved) setEditing(null); return saved; }} /></div>}
          </li>;
        })}</ol> : <p className="dash-secondary">{tr(['لم يُضف قادة بعد.', 'No leaders added yet.'], language)}</p>}
      </Panel>

      <Panel id="dash-team-committees" title={tr(['اللجان', 'Committees'], language)} description={tr(['اختر لجنة لإدارة أعضائها.', 'Choose a committee to manage its members.'], language)}
        action={adding !== 'committee' && <button type="button" className="dash-action dash-action--primary" onClick={() => setAdding('committee')}><span aria-hidden="true">+</span> {tr(['إضافة لجنة', 'Add committee'], language)}</button>}>
        {adding === 'committee' && <div className="dash-team-inline">
          <CommitteeForm language={language} busy={busy} submitLabel={tr(['إضافة اللجنة', 'Add committee'], language)} onCancel={() => setAdding(null)}
            onSubmit={async (payload) => { const saved = await write('POST', `/departments/${department.id}/committees`, payload, ['تمت إضافة اللجنة.', 'Committee added.']); if (saved) setAdding(null); }} />
        </div>}
        {department.committees.length ? <ol className="dash-team-list">{department.committees.map((committee, index) => {
          const label = tr(pairOf(committee, 'name'), language);
          const leads = committee.members.filter((m) => m.is_lead);
          return <li key={committee.id}>
            <div className="dash-team-person dash-team-committee">
              <div className="dash-team-person__text">
                <Link className="dash-team-link dash-team-person__name" to={`${BASE}/${department.id}/committees/${committee.id}`}>{label}</Link>
                <span className="dash-team-person__alt">
                  {committee.is_general && <span className="dash-status dash-status--soon">{tr(['أعضاء بلا لجنة', 'No committee'], language)}</span>}
                  {peopleCount(committee.members.length, language)}{leads.length > 0 && ` · ${leads.map((m) => tr(pairOf(m, 'name'), language)).join('، ')}`}
                </span>
              </div>
              <div className="dash-team-tools">
                <Link className="dash-action dash-action--edit" to={`${BASE}/${department.id}/committees/${committee.id}`}>{tr(['الأعضاء', 'Members'], language)}<span className="dash-visually-hidden">: {label}</span></Link>
                <RowTools language={language} label={label} index={index} total={department.committees.length} busy={busy}
                  onMove={(direction) => write('POST', `/committees/${committee.id}/move`, { direction })}
                  onDelete={() => { if (window.confirm(tr([`حذف «${label}» مع ${peopleCount(committee.members.length, 'ar')}؟`, `Delete “${label}” with ${peopleCount(committee.members.length, 'en')}?`], language))) write('DELETE', `/committees/${committee.id}`, null, ['تم حذف اللجنة.', 'Committee deleted.']); }} />
              </div>
            </div>
          </li>;
        })}</ol> : <p className="dash-secondary">{tr(['لا توجد لجان بعد.', 'No committees yet.'], language)}</p>}
      </Panel>
    </div>
  </>;
}

/* ── One committee: details and members ──────────────────────────────── */
function CommitteeView({ language, tree, writer }) {
  const { departmentId, committeeId } = useParams();
  const navigate = useNavigate();
  const department = tree.find((item) => String(item.id) === departmentId);
  const committee = department?.committees.find((item) => String(item.id) === committeeId);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const { busy, error, write } = writer;
  useEffect(() => { setEditing(null); setQuery(''); }, [committeeId]);
  if (!committee) return <NotFound language={language} back={department ? `${BASE}/${department.id}` : BASE} />;
  const name = tr(pairOf(committee, 'name'), language);
  const departmentPath = `${BASE}/${department.id}`;
  const toggle = (key) => setEditing((current) => (current === key ? null : key));
  const needle = query.trim().toLocaleLowerCase();
  const shown = committee.members.map((member, index) => ({ member, index }))
    .filter(({ member }) => !needle || `${member.name_ar} ${member.name_en} ${member.role_ar || ''} ${member.role_en || ''}`.toLocaleLowerCase().includes(needle));
  async function removeCommittee() {
    if (!window.confirm(tr([`حذف «${name}» مع ${peopleCount(committee.members.length, 'ar')}؟`, `Delete “${name}” with ${peopleCount(committee.members.length, 'en')}?`], language))) return;
    if (await write('DELETE', `/committees/${committee.id}`, null, ['تم حذف اللجنة.', 'Committee deleted.'])) navigate(departmentPath);
  }
  return <>
    <Link className="dash-back" to={departmentPath}>{tr(['العودة إلى', 'Back to'], language)} {tr(pairOf(department, 'name'), language)}</Link>
    <header className="dash-heading"><div><span className="dash-overline" lang="en">COMMITTEE</span><h1 tabIndex="-1">{name}</h1><p>{tr(pairOf(department, 'name'), language)} · {peopleCount(committee.members.length, language)}</p></div></header>
    <Status {...{ error, busy, language }} />
    <div className="dash-team-stack">
      <Panel id="dash-team-add-member" title={tr(['إضافة عضو', 'Add a member'], language)} description={tr(['يبقى النموذج مفتوحًا لإضافة عدة أعضاء متتالين. اختر «المشرف» أو «نائب المشرف» لإبراز العضو في أعلى اللجنة.', 'The form stays open so you can add several people in a row. Choose Supervisor or Vice Supervisor to highlight a member.'], language)}>
        <PersonForm key={committee.id} language={language} kind="member" busy={busy} keepOpen submitLabel={tr(['إضافة العضو', 'Add member'], language)}
          onSubmit={(payload) => write('POST', `/committees/${committee.id}/members`, payload, ['تمت إضافة العضو.', 'Member added.'])} />
      </Panel>

      <Panel id="dash-team-members" title={tr(['أعضاء اللجنة', 'Committee members'], language)} description={tr(['يظهر الأعضاء في صفحة الفريق بهذا الترتيب؛ ضع المشرفين في الأعلى.', 'Members appear on the Team page in this order; keep supervisors at the top.'], language)}>
        {committee.members.length > 8 && <div className="dash-search"><label htmlFor="dash-team-member-search">{tr(['بحث في الأعضاء', 'Search members'], language)}</label><div className="dash-search-input"><Icon name="search" size={20} /><input id="dash-team-member-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength="100" placeholder={tr(['ابحث بالاسم أو الدور…', 'Search by name or role…'], language)} /></div></div>}
        {committee.members.length ? (shown.length ? <ol className="dash-team-list">{shown.map(({ member, index }) => {
          const label = tr(pairOf(member, 'name'), language);
          const key = `member-${member.id}`;
          return <li key={member.id}>
            <PersonRow language={language} person={member} highlighted={member.is_lead}>
              <RowTools language={language} label={label} index={index} total={committee.members.length} busy={busy} moveDisabled={Boolean(needle)} editing={editing === key} onEdit={() => toggle(key)}
                onMove={(direction) => write('POST', `/members/${member.id}/move`, { direction })}
                onDelete={() => { if (window.confirm(tr([`حذف «${label}» من ${name}؟`, `Remove “${label}” from ${name}?`], language))) write('DELETE', `/members/${member.id}`, null, ['تم حذف العضو.', 'Member removed.']); }} />
            </PersonRow>
            {editing === key && <div className="dash-team-inline"><PersonForm language={language} kind="member" initial={member} busy={busy} submitLabel={tr(['حفظ', 'Save'], language)} onCancel={() => setEditing(null)}
              onSubmit={async (payload) => { const saved = await write('PATCH', `/members/${member.id}`, payload, ['تم حفظ العضو.', 'Member saved.']); if (saved) setEditing(null); return saved; }} /></div>}
          </li>;
        })}</ol> : <p className="dash-secondary" role="status">{tr(['لا توجد نتائج مطابقة.', 'No matching members.'], language)}</p>)
          : <p className="dash-secondary">{tr(['لا يوجد أعضاء بعد. أضف أول عضو من النموذج أعلاه.', 'No members yet. Add the first one with the form above.'], language)}</p>}
      </Panel>

      <Panel id="dash-team-committee-details" title={tr(['بيانات اللجنة', 'Committee details'], language)}
        action={editing !== 'committee' && <button type="button" className="dash-action dash-action--edit" onClick={() => toggle('committee')}>{tr(['تعديل', 'Edit'], language)}</button>}>
        {editing === 'committee'
          ? <CommitteeForm language={language} initial={committee} busy={busy} submitLabel={tr(['حفظ اللجنة', 'Save committee'], language)} onCancel={() => setEditing(null)}
            onSubmit={async (payload) => { if (await write('PATCH', `/committees/${committee.id}`, payload, ['تم حفظ اللجنة.', 'Committee saved.'])) setEditing(null); }} />
          : <dl className="dash-meta"><div><dt>{tr(['بالعربية', 'Arabic'], language)}</dt><dd lang="ar" dir="rtl">{committee.name_ar}</dd></div><div><dt>{tr(['بالإنجليزية', 'English'], language)}</dt><dd lang="en" dir="ltr">{committee.name_en}</dd></div>{committee.is_general && <div><dt>{tr(['النوع', 'Type'], language)}</dt><dd>{tr(['أعضاء القسم بلا لجنة', 'Department members without a committee'], language)}</dd></div>}</dl>}
        <div className="dash-form-actions"><button type="button" className="dash-action dash-action--danger" disabled={busy} onClick={removeCommittee}>{tr(['حذف اللجنة', 'Delete committee'], language)}</button></div>
      </Panel>
    </div>
  </>;
}

function NotFound({ language, back = BASE }) {
  return <div className="dash-empty" role="alert"><p>{tr(['هذا العنصر غير موجود أو تم حذفه.', 'This item does not exist or was deleted.'], language)}</p><Link className="dash-action" to={back}>{tr(['العودة', 'Back'], language)}</Link></div>;
}

export default function TeamManager({ language, admin, notify, onSessionExpired }) {
  const { data: tree, failure, reload, setData } = useDashboardData(admin.role_code === 'super_admin' ? API : null, onSessionExpired);
  const writer = useTeamWriter({ language, notify, onSessionExpired, setData });
  const loadError = failure ? messageForError(failure, language) : '';
  const body = !tree
    ? (loadError ? <div className="dash-empty" role="alert"><p>{loadError}</p><button type="button" className="dash-action" onClick={reload}>{tr(['إعادة المحاولة', 'Retry'], language)}</button></div>
      : <p role="status">{tr(['جارٍ تحميل الفريق…', 'Loading the team…'], language)}</p>)
    : <Routes>
      <Route index element={<DepartmentsView {...{ language, tree, writer }} />} />
      <Route path=":departmentId" element={<DepartmentView {...{ language, tree, writer }} />} />
      <Route path=":departmentId/committees/:committeeId" element={<CommitteeView {...{ language, tree, writer }} />} />
      <Route path="*" element={<NotFound language={language} />} />
    </Routes>;
  return <>
    <Routes>
      <Route index element={<>
        <header className="dash-heading"><div><span className="dash-overline" lang="en">TEAM</span><h1 tabIndex="-1">{tr(['الفريق', 'Team'], language)}</h1><p>{tr(['أقسام فريق التنظيم وقادتها ولجانها وأعضاؤها. التغييرات تظهر مباشرة في صفحة الفريق العامة.', 'The organizing team’s departments, leaders, committees and members. Changes appear on the public Team page right away.'], language)}</p></div><Link className="dash-action" to="/team" target="_blank" rel="noopener noreferrer">{tr(['عرض الصفحة العامة', 'View public page'], language)}</Link></header>
        <SectionVisibilityPanel resource="team-members" {...{ language, admin, notify, onSessionExpired }} />
      </>} />
    </Routes>
    {body}
  </>;
}
