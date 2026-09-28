import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import Chip from '../../../components/Chip/Chip';
import { about } from '../../../data/home';

export default function AboutSection() {
  return (
    <section className="home-section about" aria-labelledby="about-title">
      <div className="container about__inner">
        <div className="about__heading">
          <SectionHeading overline={about.overline} title={<span id="about-title">{about.title}</span>} description={about.subtitle} />
        </div>
        <div className="about__content">
          <p className="about__body">{about.body}</p>
          <ul className="about__values" aria-label="قيم الملتقى">
            {about.values.map(v => <li key={v}><Chip tone="outline">{v}</Chip></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
