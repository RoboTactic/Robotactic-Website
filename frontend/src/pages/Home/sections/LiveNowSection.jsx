import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import LiveEventCard from '../../../components/LiveEventCard/LiveEventCard';
import { sections } from '../../../data/home';
import ApiState from '../../../components/ApiState/ApiState';
import { useApiData } from '../../../services/api/useApiData';
import { presentTimelineEvent } from '../../../services/api/presentRecords';

export default function LiveNowSection() {
  const s = sections.liveNow;
  const { data, loading, error, reload } = useApiData('timeline-events', '?current=true');
  const events = (data || []).map(presentTimelineEvent);
  return (
    <section className="band home-section home-live" aria-labelledby="home-live-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-live-title">{s.title}</span>} />
        <ApiState loading={loading} error={error} empty={!loading && !error && !events.length ? 'لا توجد فعاليات مباشرة الآن.' : ''} onRetry={reload} />
        {!loading && !error && events.length ? (
          <ul className="card-grid card-grid--3 card-grid--tight">
            {events.map(e => <li key={e.id}><LiveEventCard {...e} /></li>)}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
