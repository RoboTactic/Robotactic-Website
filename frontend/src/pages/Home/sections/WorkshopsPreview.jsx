import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import WorkshopCard from '../../../components/WorkshopCard/WorkshopCard';
import Button from '../../../components/Button/Button';
import { workshops } from '../../../data/workshops';
import { sections } from '../../../data/home';

export default function WorkshopsPreview() {
  const s = sections.workshops;
  return (
    <section className="home-section home-workshops" aria-labelledby="home-workshops-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-workshops-title">{s.title}</span>} />
        <ul className="card-grid card-grid--2">
          {workshops.map(w => <li key={w.id}><WorkshopCard {...w} /></li>)}
        </ul>
        <Button to={s.action.path} variant="secondary" size="medium" className="home-section__action">{s.action.label}</Button>
      </div>
    </section>
  );
}
