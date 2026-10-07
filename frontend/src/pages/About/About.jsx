import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { about } from '../../data/home';
import '../InfoPages.css';

export default function About() {
  return (
    <div className="info-page" dir="rtl">
      <header className="info-page__hero">
        <div className="container">
          <SectionHeading as="h1" size="h1" overline={about.overline} title={about.title} description={about.subtitle} />
        </div>
      </header>
      <section className="container info-page__body" aria-labelledby="about-purpose">
        <div className="info-page__panel">
          <h2 id="about-purpose">فكرة الملتقى</h2>
          <p>{about.body}</p>
        </div>
        <div className="info-page__panel">
          <h2>قيم الملتقى</h2>
          <ul className="info-page__values">
            {about.values.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <nav className="info-page__links" aria-label="استكشف الملتقى">
          <Link to="/competitions">استكشف المسابقات</Link>
          <Link to="/workshops">اطّلع على الورش</Link>
          <Link to="/projects">شاهد المشاريع</Link>
        </nav>
      </section>
    </div>
  );
}
