import { useRef } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import TeamCircuit from './TeamCircuit';
import '../InfoPages.css';
import { useApiData } from '../../services/api/useApiData';
import { contentLanguage, translated } from '../../services/api/publicContentLanguage';
import ApiState from '../../components/ApiState/ApiState';

export default function Team() {
  const rootRef = useRef(null);
  const {data,loading,error,reload}=useApiData('team-members');
  const members=data||[];const language=contentLanguage();const ar=language==='ar';
  return (
    <div ref={rootRef} className="info-page" lang={language} dir={ar?'rtl':'ltr'}>
      <TeamCircuit rootRef={rootRef} />
      <header className="info-page__hero">
        <img className="info-page__pattern" src={circuitPattern} alt="" />
        <div className="container">
          <SectionHeading as="h1" size="h1" overline="TEAM" title={ar?'الفريق':'Team'}
            description={ar?'تعرّف على فريق تنظيم RoboTactic.':'Meet the RoboTactic organizing team.'} />
        </div>
      </header>
      <section className="container info-page__body team-grid" aria-label={ar?'فريق التنظيم':'Organizing team'}>
        <ApiState {...{loading,error}} onRetry={reload}/>
        {!loading&&!error&&!members.length&&<div className="info-page__panel info-page__panel--empty"><h2>{ar?'فريق التنظيم':'Organizing team'}</h2><p>{ar?'ستظهر أسماء فريق التنظيم هنا بعد اعتمادها للنشر.':'Team members will appear here once approved for publication.'}</p><Link to="/about">{ar?'تعرّف على الملتقى':'About the event'}</Link></div>}
        {!loading&&!error&&members.map(member=><article className="info-page__panel team-card" key={member.id}>
          {member.image_url&&<img className="team-card__photo" src={member.image_url} alt={translated(member,'name',language)} loading="lazy" referrerPolicy="no-referrer"/>}
          <h2>{translated(member,'name',language)}</h2><p className="team-card__role">{translated(member,'role',language)}</p>
          {translated(member,'bio',language)&&<p className="info-page__copy">{translated(member,'bio',language)}</p>}
          <nav className="team-card__contacts" aria-label={`${ar?'التواصل مع':'Contact'} ${translated(member,'name',language)}`}>
            {member.public_email&&<a href={`mailto:${member.public_email}`}>{ar?'بريد التواصل':'Email'}</a>}
            {[['contact_url',ar?'تواصل':'Contact'],['linkedin_url','LinkedIn'],['x_url','X']].map(([key,label])=>member[key]&&<a href={member[key]} key={key} target="_blank" rel="noopener noreferrer">{label}</a>)}
          </nav>
        </article>)}
      </section>
    </div>
  );
}
