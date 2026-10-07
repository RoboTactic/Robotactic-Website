import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import '../InfoPages.css';

export default function Team() {
  return (
    <div className="info-page" dir="rtl">
      <header className="info-page__hero">
        <div className="container">
          <SectionHeading as="h1" size="h1" overline="TEAM" title="الفريق"
            description="تعرّف على فريق تنظيم RoboTactic." />
        </div>
      </header>
      <section className="container info-page__body" aria-labelledby="team-status">
        <div className="info-page__panel info-page__panel--empty">
          <h2 id="team-status">فريق التنظيم</h2>
          <p>ستظهر أسماء فريق التنظيم هنا بعد اعتمادها للنشر.</p>
          <Link to="/about">تعرّف على الملتقى</Link>
        </div>
      </section>
    </div>
  );
}
