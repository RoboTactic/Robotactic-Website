import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import CompetitionCard from '../../../components/CompetitionCard/CompetitionCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icon/Icon';
import { useApiData } from '../../../services/api/useApiData';
import { presentCompetition } from '../../../services/api/presentRecords';
import ApiState from '../../../components/ApiState/ApiState';
import { sections } from '../../../data/home';
import '../../Competitions/Competitions.css'; // shared CompetitionCard base styles

// Database category codes map to the existing visual track icons.
const ICONS = { sensor: 'sensor', controller: 'controller', simulation: 'simulation' };

export default function CompetitionsPreview() {
  const s = sections.competitions;
  const { data, loading, error, reload } = useApiData('competitions');
  const records = (data || []).filter((item) => item.is_featured).map(presentCompetition);
  return (
    <section className="home-section home-competitions" aria-labelledby="home-competitions-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-competitions-title">{s.title}</span>} />
        <ApiState loading={loading} error={error} empty={!loading && !error && !records.length ? 'لا توجد مسابقات مميزة منشورة حاليًا.' : ''} onRetry={reload} />
        <ul className="card-grid card-grid--3">
          {records.map(c => (
            <li key={c.id}>
              <CompetitionCard
                competition={c}
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
