import { useMemo, useState } from 'react';
import FilterChips from '../../components/EventUI/FilterChips';
import { timeline, timelineDays } from '../../data/timeline';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import '../Workshops/Workshops.css';
import './Timeline.css';

function TimelineEvent({ event }) {
  return (
    <article className="timeline-event">
      <div className="timeline-event__meta">
        <span>{event.type}</span>
        <time>{event.time}</time>
      </div>
      <div className="timeline-event__content">
        <h3>{event.title}</h3>
        <p>{event.presenter}</p>
      </div>
    </article>
  );
}

function TimelineDay({ day }) {
  return (
    <section className="timeline-day" aria-labelledby={`timeline-${day.id}`}>
      <header className="timeline-day__header">
        <h2 id={`timeline-${day.id}`}>{day.title}</h2>
        <span>{day.date}</span>
      </header>

      {day.events.length ? (
        <div className="timeline-day__events">
          {day.events.map((event) => <TimelineEvent key={event.id} event={event} />)}
        </div>
      ) : (
        <p className="timeline-day__empty">{day.emptyMessage}</p>
      )}
    </section>
  );
}

export default function Timeline() {
  const [selectedDay, setSelectedDay] = useState('all');
  const visibleDays = useMemo(
    () => selectedDay === 'all' ? timeline : timeline.filter((day) => day.id === selectedDay),
    [selectedDay],
  );

  return (
    <div className="timeline-page workshops-page" dir="rtl">
      <header className="workshops-hero">
        <img className="workshops-hero__pattern" src={circuitPattern} alt="" />
        <div className="workshops-page__container workshops-hero__content">
          <div className="workshops-overline"><span>TIMELINE</span><i /></div>
          <h1>الجدول الزمني</h1>
          <p>استعرض فعاليات روبوتاكتيك حسب اليوم والوقت بطريقة واضحة وسريعة.</p>
        </div>
      </header>

      <section className="timeline-filters" aria-label="تصفية الجدول الزمني حسب اليوم">
        <div className="workshops-page__container">
          <FilterChips items={timelineDays} selectedId={selectedDay} onSelect={setSelectedDay}
            ariaLabel="تصفية الجدول الزمني حسب اليوم" className="timeline-filters__list"
            onItemClick={(_, event) => event.currentTarget.scrollIntoView({
              behavior: 'smooth', block: 'nearest', inline: 'nearest',
            })} />
        </div>
      </section>

      <div className="timeline-schedule" aria-live="polite">
        <div className="workshops-page__container timeline-schedule__inner">
          {visibleDays.map((day) => <TimelineDay key={day.id} day={day} />)}
        </div>
      </div>
    </div>
  );
}
