import { teamSections } from '../../data/team';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import maleIcon from './assets/male.png';
import femaleIcon from './assets/female.png';
import '../Workshops/Workshops.css';
import './Team.css';

function SocialLink({ href, label, children }) {
  if (!href) {
    return <span className="team-social" aria-hidden="true">{children}</span>;
  }

  return (
    <a className="team-social" href={href} target="_blank" rel="noreferrer" aria-label={label}>
      {children}
    </a>
  );
}

function TeamMemberCard({ member }) {
  const avatar = member.gender === 'female' ? femaleIcon : maleIcon;

  return (
    <article className="team-card">
      <div className="team-card__photo">
        <div className="team-card__avatar">
          <img className={`team-card__avatar-image team-card__avatar-image--${member.gender}`} src={avatar} alt="" />
        </div>
      </div>

      <div className="team-card__info">
        <div className="team-card__identity">
          <h3>{member.name}</h3>
          <p>{member.role}</p>
        </div>
        <div className="team-card__socials" aria-label={`روابط ${member.name}`}>
          <SocialLink href={member.socials?.linkedin} label={`حساب ${member.name} على لينكدإن`}>in</SocialLink>
          <SocialLink href={member.socials?.x} label={`حساب ${member.name} على إكس`}>X</SocialLink>
        </div>
      </div>
    </article>
  );
}

function TeamSection({ section }) {
  return (
    <section className={`team-section${section.featured ? ' team-section--featured' : ''}`} aria-labelledby={`team-${section.id}`}>
      <div className="team-section__heading">
        <h2 id={`team-${section.id}`}>{section.title}</h2>
        <span aria-hidden="true" />
      </div>
      <div className="team-section__rail" tabIndex="0" aria-label={`أعضاء ${section.title}`}>
        {section.members.map((member) => <TeamMemberCard key={member.id} member={member} />)}
      </div>
    </section>
  );
}

export default function Team() {
  return (
    <div className="workshops-page team-page" dir="rtl">
      <header className="workshops-hero">
        <img className="workshops-hero__pattern" src={circuitPattern} alt="" />
        <div className="workshops-page__container workshops-hero__content">
          <div className="workshops-overline"><span>TEAM</span><i /></div>
          <h1>فريق العمل</h1>
          <p>تعرّف على فريق روبوتاكتيك والقادة والأقسام التي تعمل معًا لصناعة تجربة متكاملة.</p>
        </div>
      </header>

      <div className="team-content workshops-page__container">
        {teamSections.map((section) => <TeamSection key={section.id} section={section} />)}
      </div>
    </div>
  );
}
