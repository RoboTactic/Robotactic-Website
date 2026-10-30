import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import LiveEventCard from '../../../components/LiveEventCard/LiveEventCard';
import { sections } from '../../../data/home';
import ApiState from '../../../components/ApiState/ApiState';
import { useApiData } from '../../../services/api/useApiData';
import { presentTimelineEvent } from '../../../services/api/presentRecords';
import { useLanguage } from '../../../services/api/publicContentLanguage';

export default function LiveNowSection() {
  const s = sections.liveNow;
  const { t } = useLanguage();
  const { data, loading, error, reload } = useApiData('timeline-events', '?current=true');
  const events = (data || []).map(presentTimelineEvent);
  return (
    <section className="band home-section home-live" aria-labelledby="home-live-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-live-title">{t(s.title)}</span>} />
        <ApiState loading={loading} error={error} empty={!loading && !error && !events.length ? t('لا توجد فعاليات مباشرة الآن.', 'Nothing is live right now.') : ''} onRetry={reload} />
        {!loading && !error && events.length ? (
          <ul className="card-grid card-grid--3 card-grid--tight">
            {events.map(e => <li key={e.id}><LiveEventCard {...e} /></li>)}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
