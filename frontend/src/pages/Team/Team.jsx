import { useRef } from 'react';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import Icon from '../../components/Icon/Icon';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import TeamCircuit from './TeamCircuit';
import { ROLES, departments, leadershipTiers } from '../../data/team';
import { useLanguage } from '../../services/api/publicContentLanguage';
import '../InfoPages.css';
import './Team.css';

/*
  Team — the organizing structure as one circuit network: a single leadership trunk
  (Director → Co-Directors → General Management) that feeds seven department nodes.
  Content comes from data/team.js; TeamCircuit draws the connectors from the real layout.
*/
export default function Team() {
  const rootRef = useRef(null);
  const { language, en, dir, t } = useLanguage();
  const other = en ? 'ar' : 'en';
  return (
    <div ref={rootRef} className="info-page team-page" lang={language} dir={dir}>
      <TeamCircuit rootRef={rootRef} />
      <header className="info-page__hero">
        <img className="info-page__pattern" src={circuitPattern} alt="" />
        <div className="container">
          <SectionHeading as="h1" size="h1" overline={t(['الفريق', 'TEAM'])} overlineLang={language}
            title={t(['العقول خلف الابتكار', 'The People Behind the Innovation'])}
            description={t([
              'إدارة واحدة وسبعة أقسام مترابطة، تعمل معًا لتصنع تجربة RoboTactic.',
              'One leadership team and seven connected departments, working together to bring RoboTactic to life.',
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
          <p className="t-body">{t(['سبعة أقسام، كل منها عقدة في شبكة واحدة.', 'Seven departments, each one a node in a single network.'])}</p>
        </div>
        <ul className="team-departments">
          {departments.map((dept, i) => (
            <li key={dept.key}>
              <article className="team-dept" aria-labelledby={`team-dept-${dept.key}`}>
                <div className="team-dept__head">
                  <span className="team-dept__icon"><Icon name={dept.icon} size={22} /></span>
                  <span className="team-dept__index" lang="en" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 id={`team-dept-${dept.key}`} className="team-dept__name">{t(dept.name)}</h3>
                <p className="team-dept__alt" lang={other}>{en ? dept.name[0] : dept.name[1]}</p>
                <dl className="team-dept__people">
                  <div className="team-dept__member team-dept__member--leader"><dt>{t(ROLES.leader)}</dt><dd>{t(dept.leader)}</dd></div>
                  <div className="team-dept__member"><dt>{t(ROLES.viceLeader)}</dt><dd>{t(dept.viceLeader)}</dd></div>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="container team-section team-section--closing" aria-labelledby="team-closing-title">
        <div className="team-closing">
          <p className="team-closing__slogan">{t(['ابتكار يقوده التفكير', 'Innovation driven by ideas'])}</p>
          <h2 id="team-closing-title" className="t-h2">{t(['نبنيها معًا', 'Built together'])}</h2>
          <p className="t-body-lg">{t([
            'الابتكار عمل جماعي؛ كل قسم يضيف حلقة إلى الشبكة، ومعًا نصنع تجربة RoboTactic.',
            'Innovation is a team effort. Every department adds a link to the network, and together we build RoboTactic.',
          ])}</p>
        </div>
      </section>
    </div>
  );
}
