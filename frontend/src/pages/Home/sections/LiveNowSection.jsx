import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import LiveEventCard from '../../../components/LiveEventCard/LiveEventCard';
import { liveEvents, liveEmptyState } from '../../../data/liveEvents';
import { sections } from '../../../data/home';

/* ⚠ liveEvents currently holds DEMO data (see src/data/liveEvents.js). */
export default function LiveNowSection() {
  const s = sections.liveNow;
  return (
    <section className="band home-section home-live" aria-labelledby="home-live-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-live-title">{s.title}</span>} />
        {liveEvents.length ? (
          <ul className="card-grid card-grid--3 card-grid--tight">
            {liveEvents.map(e => <li key={e.id}><LiveEventCard {...e} /></li>)}
          </ul>
        ) : (
          <div className="home-live__empty"><LiveEventCard status="empty" {...liveEmptyState} /></div>
        )}
      </div>
    </section>
  );
}
