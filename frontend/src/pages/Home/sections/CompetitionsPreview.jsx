import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import CompetitionCard from '../../../components/CompetitionCard/CompetitionCard';
import Button from '../../../components/Button/Button';
import { competitions } from '../../../data/competitions';
import { sections } from '../../../data/home';

export default function CompetitionsPreview() {
  const s = sections.competitions;
  return (
    <section className="home-section home-competitions" aria-labelledby="home-competitions-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-competitions-title">{s.title}</span>} />
        <ul className="card-grid card-grid--3">
          {competitions.map(c => <li key={c.id}><CompetitionCard {...c} /></li>)}
        </ul>
        <Button to={s.action.path} variant="secondary" size="medium" className="home-section__action">{s.action.label}</Button>
      </div>
    </section>
  );
}
