import { useRef } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { useApiData } from '../../services/api/useApiData';
import { useContentLanguage, translated } from '../../services/api/publicContentLanguage';
import ApiState from '../../components/ApiState/ApiState';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import AboutCircuit from './AboutCircuit';
import '../InfoPages.css';
import { useSectionVisibility } from '../../services/api/SectionVisibility';

export default function About() {
  const rootRef = useRef(null);
  const { isPathVisible } = useSectionVisibility();
  const {data,loading,error,reload}=useApiData('about');
  const language=useContentLanguage();const ar=language==='ar';
  const values=data?.[`values_${language}`] || [];
  const text=key=>translated(data,key,language);
  return (
    <div ref={rootRef} className="info-page" lang={language} dir={ar?'rtl':'ltr'}>
      <AboutCircuit rootRef={rootRef} />
      <header className="info-page__hero">
        <img className="info-page__pattern" src={circuitPattern} alt="" />
        <div className="container">
          <SectionHeading as="h1" size="h1" overline="ABOUT ROBOTACTIC" title={text('title')||(ar?'من نحن':'About Us')} description={text('subtitle')} />
        </div>
      </header>
      <section className="container info-page__body" aria-label={ar?'من نحن':'About Us'}>
        <ApiState {...{loading,error}} onRetry={reload} empty={!loading&&!error&&!data?(ar?'محتوى من نحن قيد التحديث.':'About content is being updated.'):''}/>
        {!loading&&!error&&data&&<><div className={`info-page__panel ${data.image_url?'info-page__panel--image':''}`}>
          <div><h2 id="about-purpose">{ar?'فكرة الملتقى':'The idea behind the forum'}</h2><p className="info-page__copy">{text('body')}</p></div>
          {data.image_url&&<img className="info-page__photo" src={data.image_url} alt={text('image_alt')} loading="lazy" referrerPolicy="no-referrer"/>}
        </div>
        <div className="info-page__panel">
          <h2>{ar?'قيم الملتقى':'Our values'}</h2>
          <ul className="info-page__values">
            {values.map((item,index) => <li key={`${index}-${item}`}>{item}</li>)}
          </ul>
        </div>
        </>}<nav className="info-page__links" aria-label={ar?'استكشف الملتقى':'Explore the forum'}>
          {isPathVisible('/competitions') && <Link to="/competitions">{ar?'استكشف المسابقات':'Explore competitions'}</Link>}
          {isPathVisible('/workshops') && <Link to="/workshops">{ar?'اطّلع على الورش':'View workshops'}</Link>}
          {isPathVisible('/projects') && <Link to="/projects">{ar?'شاهد المشاريع':'View projects'}</Link>}
        </nav>
      </section>
    </div>
  );
}
