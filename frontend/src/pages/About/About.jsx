import { useRef } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { useApiData } from '../../services/api/useApiData';
import { contentLanguage, translated } from '../../services/api/publicContentLanguage';
import ApiState from '../../components/ApiState/ApiState';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import AboutCircuit from './AboutCircuit';
import '../InfoPages.css';

export default function About() {
  const rootRef = useRef(null);
  const {data,loading,error,reload}=useApiData('about');
  const language=contentLanguage();const ar=language==='ar';
  const values=data?.[`values_${language}`] || [];
  const text=key=>translated(data,key,language);
  return (
    <div ref={rootRef} className="info-page" lang={language} dir={ar?'rtl':'ltr'}>
      <AboutCircuit rootRef={rootRef} />
      <header className="info-page__hero">
        <img className="info-page__pattern" src={circuitPattern} alt="" />
        <div className="container">
          <SectionHeading as="h1" size="h1" overline="ABOUT ROBOTACTIC" title={text('title')||(ar?'عن الملتقى':'About RoboTactic')} description={text('subtitle')} />
        </div>
      </header>
      <section className="container info-page__body" aria-label={ar?'عن الملتقى':'About RoboTactic'}>
        <ApiState {...{loading,error}} onRetry={reload} empty={!loading&&!error&&!data?(ar?'محتوى عن الملتقى قيد التحديث.':'About content is being updated.'):''}/>
        {!loading&&!error&&data&&<><div className={`info-page__panel ${data.image_url?'info-page__panel--image':''}`}>
          <div><h2 id="about-purpose">{ar?'فكرة الملتقى':'The event'}</h2><p className="info-page__copy">{text('body')}</p></div>
          {data.image_url&&<img className="info-page__photo" src={data.image_url} alt={text('image_alt')} loading="lazy" referrerPolicy="no-referrer"/>}
        </div>
        <div className="info-page__panel">
          <h2>{ar?'قيم الملتقى':'Our values'}</h2>
          <ul className="info-page__values">
            {values.map((item,index) => <li key={`${index}-${item}`}>{item}</li>)}
          </ul>
        </div>
        </>}<nav className="info-page__links" aria-label={ar?'استكشف الملتقى':'Explore the event'}>
          <Link to="/competitions">{ar?'استكشف المسابقات':'Explore competitions'}</Link>
          <Link to="/workshops">{ar?'اطّلع على الورش':'View workshops'}</Link>
          <Link to="/projects">{ar?'شاهد المشاريع':'View projects'}</Link>
        </nav>
      </section>
    </div>
  );
}
