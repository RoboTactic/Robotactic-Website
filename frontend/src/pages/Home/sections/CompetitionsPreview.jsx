import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import CompetitionCard from '../../../components/CompetitionCard/CompetitionCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icon/Icon';
import { competitions } from '../../../data/competitions';
import { sections } from '../../../data/home';
import '../../Competitions/Competitions.css'; // shared CompetitionCard base styles

// data/competitions.js icon keys → Figma icons (CanSat uses Icon / Simulation)
const ICONS = { sensor: 'sensor', controller: 'controller', cansat: 'simulation' };
// The approved Figma Home shows no category chip on the CanSat card
const HIDE_LEVEL_ON_HOME = new Set(['cansat-rockets']);

export default function CompetitionsPreview() {
  const s = sections.competitions;
  return (
    <section className="home-section home-competitions" aria-labelledby="home-competitions-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-competitions-title">{s.title}</span>} />
        <ul className="card-grid card-grid--3">
          {competitions.map(c => (
            <li key={c.id}>
              <CompetitionCard
                competition={HIDE_LEVEL_ON_HOME.has(c.id) ? { ...c, level: null } : c}
                icon={<Icon name={ICONS[c.icon] ?? 'competition'} />}
                registrationLabel="سجّل عبر نموذج Google"
                registrationIcon={<Icon name="externalLink" size={18} strokeWidth={2} />}
                helperText="سينقلك الزر إلى نموذج Google خارجي في تبويب جديد"
              />
            </li>
          ))}
        </ul>
        <Button to={s.action.path} variant="secondary" size="medium" className="home-section__action">{s.action.label}</Button>
      </div>
    </section>
  );
}
