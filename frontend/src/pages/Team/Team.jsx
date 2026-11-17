import { useRef, useState } from 'react';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import Icon from '../../components/Icon/Icon';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import TeamCircuit from './TeamCircuit';
import DepartmentMembers from './DepartmentMembers';
import ApiState from '../../components/ApiState/ApiState';
import { ROLES, committeeCount, isPrimaryLeader, leadershipTiers, presentTeam } from '../../data/team';
import { useLanguage } from '../../services/api/publicContentLanguage';
import { useApiData } from '../../services/api/useApiData';
import '../InfoPages.css';
import './Team.css';

/*
  Team — the organizing structure as one circuit network: a single leadership trunk
  (Director → Co-Directors → General Management) that feeds seven department nodes.
  Leadership comes from data/team.js; departments and committees from the dashboard via
  GET /api/public/team. TeamCircuit draws the connectors from the real layout.
*/
const AR_COUNTS = ['', '', '', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
const EN_COUNTS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
/* «سبعة أقسام» / "seven", with Arabic number agreement (used from three departments up). */
const departmentCount = (n) => [n <= 10 ? `${AR_COUNTS[n]} أقسام` : `${n} قسمًا`, EN_COUNTS[n] || String(n)];
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
/* Centre an incomplete last row: two cards per row from 768px, four from 1100px. */
const gridItemClass = (index, total) => {
  const rest = total % 4;
  return [
    total % 2 && index === total - 1 && 'team-department-item--center-md',
    rest && index === total - rest && `team-department-item--lg-offset-${rest}`,
  ].filter(Boolean).join(' ') || undefined;
};
export default function Team() {
  const rootRef = useRef(null);
  const { language, en, dir, t } = useLanguage();
  const other = en ? 'ar' : 'en';
  const [openDept, setOpenDept] = useState(null);
  const { data, loading, error, reload } = useApiData('team');
  const departments = presentTeam(data);
  const count = departments.length > 2 ? departmentCount(departments.length) : null;
  return (
    <div ref={rootRef} className="info-page team-page" lang={language} dir={dir}>
      <TeamCircuit rootRef={rootRef} />
      <header className="info-page__hero">
        <img className="info-page__pattern" src={circuitPattern} alt="" />
        <div className="container">
          <SectionHeading as="h1" size="h1" overline={t(['الفريق', 'TEAM'])} overlineLang={language}
            title={t(['العقول خلف الابتكار', 'The People Behind the Innovation'])}
            description={t(count ? [
              `إدارة واحدة و${count[0]} مترابطة، تعمل معًا لتصنع تجربة RoboTactic.`,
              `One leadership team and ${count[1]} connected departments, working together to bring RoboTactic to life.`,
            ] : [
              'إدارة واحدة وأقسام مترابطة، تعمل معًا لتصنع تجربة RoboTactic.',
              'One leadership team and connected departments, working together to bring RoboTactic to life.',
            ])} />
        </div>
      </header>

      <section className="container team-section team-section--leadership" aria-labelledby="team-leadership-title">
        <div className="team-section__head">
          <h2 id="team-leadership-title" className="t-h2">{t(['فريق روبوتاكتيك', 'RoboTactic Team'])}</h2>
          <p className="t-body">{t(['ترسم الاتجاه وتربط عمل الأقسام ببعضها.', 'Setting the direction and connecting every department.'])}</p>
        </div>
        <ol className="team-tiers">
          {leadershipTiers.map((tier) => (
            <li key={tier.key} className={`team-tier team-tier--${tier.key}`}>
              <ul className="team-tier__members">
                {tier.members.map((member) => (
                  <li key={member.name[1]} className={member.role === ROLES.viceGeneralManager ? 'team-tier__member--deputy' : undefined}>
                    <article className={`team-person${tier.key === 'director' ? ' team-person--director' : ''}`}>
                      <p className="team-person__role">{t(member.role)}</p>
                      <h3 className="team-person__name">{t(member.name)}</h3>
                    </article>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="container team-section team-section--departments" aria-labelledby="team-departments-title">
        <div className="team-section__head">
          <h2 id="team-departments-title" className="t-h2">{t(['الأقسام', 'Departments'])}</h2>
          <p className="t-body">{t(count ? [`${count[0]}، كل منها عقدة في شبكة واحدة.`, `${capitalize(count[1])} departments, each one a node in a single network.`] : ['كل قسم عقدة في شبكة واحدة.', 'Every department is a node in a single network.'])}</p>
        </div>
        <ApiState loading={loading} error={error} onRetry={reload} empty={data && !departments.length ? t(['تُحدَّث أقسام الفريق قريبًا.', 'Department details are coming soon.']) : ''} />
        {departments.length > 0 && <ul className="team-departments">
          {departments.map((dept, i) => (
            <li key={dept.key} className={gridItemClass(i, departments.length)}>
              <article className="team-dept" aria-labelledby={`team-dept-${dept.key}`}>
                <div className="team-dept__head">
                  <span className="team-dept__icon"><Icon name={dept.icon} size={22} /></span>
                  <span className="team-dept__index" lang="en" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 id={`team-dept-${dept.key}`} className="team-dept__name">{t(dept.name)}</h3>
                <p className="team-dept__alt" lang={other}>{en ? dept.name[0] : dept.name[1]}</p>
                {dept.leaders.length > 0 && <dl className="team-dept__people">
                  {dept.leaders.map((leader, k) => (
                    <div key={leader.key} className={`team-dept__member${isPrimaryLeader(dept, k) ? ' team-dept__member--leader' : ''}`}><dt>{t(leader.role)}</dt><dd>{t(leader.name)}</dd></div>
                  ))}
                </dl>}
                {dept.committees.some((c) => c.rows.length > 0) && (
                  <button type="button" className="team-dept__more" aria-haspopup="dialog" onClick={() => setOpenDept(dept)}>
                    <span>{t(committeeCount(dept) ? ['عرض اللجان والأعضاء', 'View committees & members'] : ['عرض الأعضاء', 'View members'])}</span>
                    <Icon name="chevronLeft" size={16} className="team-dept__more-arrow" />
                  </button>
                )}
              </article>
            </li>
          ))}
        </ul>}
      </section>

      <DepartmentMembers dept={openDept} onClose={() => setOpenDept(null)} />

      <section className="container team-section team-section--closing" aria-labelledby="team-closing-title">
        <div className="team-closing">
          <p className="team-closing__slogan">{t(['التحدي يقوده التفكير', 'A challenge Driven by Thinking'])}</p>
          <h2 id="team-closing-title" className="t-h2">{t(['نبنيها معًا', 'Built together'])}</h2>
          <p className="t-body-lg">{t([
            'التحدي عمل جماعي؛ كل قسم يضيف حلقة إلى الشبكة، ومعًا نصنع تجربة RoboTactic.',
            'The challenge is a team effort. Every department adds a link to the network, and together we build RoboTactic.',
          ])}</p>
        </div>
      </section>


    </div>
  );
}
