import { useEffect, useRef } from 'react';
import Icon from '../../components/Icon/Icon';
import { ROLES, committeeCount, committeeHeadcount, committeeLeadsOf, committeeSize } from '../../data/team';

/* Arabic number agreement: 2 → عضوان, 3–10 → أعضاء, otherwise عضوًا. */
const peopleCount = (n) => [
  n === 1 ? 'عضو واحد' : n === 2 ? 'عضوان' : n <= 10 ? `${n} أعضاء` : `${n} عضوًا`,
  `${n} ${n === 1 ? 'person' : 'people'}`,
];

/* Two-column masonry: each committee goes to the column with less content so far (estimated
   as header + one row per person), so neither side is left with a large empty area.
   Column 0 is the inline-start side (right in Arabic). On mobile both columns collapse
   (display: contents) and `order` restores the original sequence. */
const balance = (committees) => {
  const columns = [[], []];
  const heights = [0, 0];
  committees.forEach((c, i) => {
    const col = heights[1] < heights[0] ? 1 : 0;
    columns[col].push({ c, i });
    heights[col] += 2 + committeeSize(c);
  });
  return columns;
};
import { useLanguage } from '../../services/api/publicContentLanguage';

/*
  DepartmentMembers — a native modal <dialog> listing a department's committees.
  Native showModal() gives focus containment, Esc to close and focus return to the trigger.
  Mobile: a bottom sheet; ≥768px: a centred panel. Every name shows in the active language
  with the other language beneath it.
*/
export default function DepartmentMembers({ dept, onClose }) {
  const ref = useRef(null);
  const { language, en, dir, t } = useLanguage();
  const other = en ? 'ar' : 'en';
  const alt = (pair) => (en ? pair[0] : pair[1]);

  useEffect(() => {
    const dialog = ref.current;
    if (dept && dialog && !dialog.open) dialog.showModal();
    if (!dept && dialog?.open) dialog.close();
  }, [dept]);

  const titleId = dept ? `team-members-${dept.key}` : undefined;
  return (
    <dialog
      ref={ref}
      className="team-members"
      lang={language}
      dir={dir}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
    >
      {dept && (
        <div className="team-members__panel">
          <header className="team-members__head">
            <span className="team-dept__icon" aria-hidden="true"><Icon name={dept.icon} size={22} /></span>
            <div className="team-members__titles">
              <h2 id={titleId} className="team-members__title">{t(dept.name)}</h2>
              <p className="team-members__meta">
                {t([`${committeeCount(dept)} لجان · ${committeeHeadcount(dept)} عضوًا`, `${committeeCount(dept)} committees · ${committeeHeadcount(dept)} members`])}
              </p>
            </div>
            <button type="button" className="team-members__close" onClick={() => ref.current?.close()} aria-label={t(['إغلاق', 'Close'])}>
              <Icon name="close" size={20} />
            </button>
          </header>

          <div className="team-members__body">
            <div className="team-members__grid">
            {balance(dept.committees).map((column, col) => <div key={col} className="team-members__column">
            {column.map(({ c, i }) => (
              <section key={c.key} className="team-members__committee" style={{ order: i }} aria-labelledby={`team-committee-${c.key}`}>
                <div className="team-members__committee-head">
                  <span className="team-members__index" lang="en" aria-hidden="true">{c.unassigned ? '—' : String(i + 1).padStart(2, '0')}</span>
                  <h3 id={`team-committee-${c.key}`}>{t(c.name)}</h3>
                  <span className="team-members__count">{t(peopleCount(committeeSize(c)))}</span>
                </div>
                <ul className="team-members__list">
                  {committeeLeadsOf(c).map(({ role, name }) => (
                    <li key={name[1]} className={`team-members__person team-members__person--supervisor${role === ROLES.viceSupervisor ? ' team-members__person--vice' : ''}`}>
                      <span className="team-members__role">{t(role)}</span>
                      <span className="team-members__name">{t(name)}</span>
                      <span className="team-members__alt" lang={other}>{alt(name)}</span>
                    </li>
                  ))}
                  {c.members.map((m) => (
                    <li key={m[1]} className="team-members__person">
                      <span className="team-members__name">{t(m)}</span>
                      <span className="team-members__alt" lang={other}>{alt(m)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            </div>)}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
