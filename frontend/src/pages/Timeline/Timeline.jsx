import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import ApiState from '../../components/ApiState/ApiState';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { buildTimelineEvents } from '../../data/timeline';
import { useApiData } from '../../services/api/useApiData';
import './Timeline.css';

const timeZone = 'Asia/Riyadh';
const dateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric', timeZone });
const timeFormatter = new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone });
const dayFormatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone });

function endLabel(event) {
  if (!event.startAt || !event.endAt || !Number.isFinite(Date.parse(event.endAt)) || Date.parse(event.endAt) <= Date.parse(event.startAt)) return '';
  const end = new Date(event.endAt);
  const sameDay = dayFormatter.format(new Date(event.startAt)) === dayFormatter.format(end);
  return `حتى ${sameDay ? '' : `${dateFormatter.format(end)} · `}${timeFormatter.format(end)}`;
}

function TimelineCard({ event }) {
  const competition = event.kind === 'competition';
  const ending = endLabel(event);
  return <li className="timeline-item">
    {event.startAt ? <time className="timeline-item__when" dateTime={event.startAt}>
      <strong className="timeline-item__time">{timeFormatter.format(new Date(event.startAt))}</strong>
      <span className="timeline-item__date">{dateFormatter.format(new Date(event.startAt))}</span>
    </time> : <div className="timeline-item__when"><strong className="timeline-item__time timeline-item__time--pending">يُحدَّد لاحقًا</strong></div>}
    <span className={`timeline-item__node${competition ? ' timeline-item__node--competition' : ''}${event.startAt ? '' : ' timeline-item__node--pending'}`} aria-hidden="true" />
    <article className="timeline-item__card">
      <div className="timeline-item__top">
        <span className={`timeline-item__kind${competition ? ' timeline-item__kind--competition' : ''}`}>{competition ? 'مسابقة' : 'ورشة عمل'}</span>
        {ending && <span className="timeline-item__end">{ending}</span>}
      </div>
      <h2>{event.title}</h2>
      {event.description && <p className="timeline-item__description">{event.description}</p>}
      {event.speakers.length > 0 && <p className="timeline-item__speakers">يقدمها {event.speakers.join('، ')}</p>}
      <Link className="timeline-item__link" to={event.href}>{competition ? 'عرض المسابقات' : 'عرض الورش'}</Link>
    </article>
  </li>;
}

export default function Timeline() {
  const competitions = useApiData('competitions');
  const workshops = useApiData('workshops');
  const listRef = useRef(null);
  const events = useMemo(() => buildTimelineEvents(competitions.data, workshops.data), [competitions.data, workshops.data]);
  const loading = competitions.loading || workshops.loading;
  const error = competitions.error || workshops.error;

  useEffect(() => {
    const list = listRef.current;
    if (!list || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
    list.classList.add('timeline-list--motion');
    list.querySelectorAll('.timeline-item').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [events]);

  return <div className="timeline-page" dir="rtl">
    <header className="timeline-hero">
      <div className="container">
        <SectionHeading as="h1" size="h1" overline="SCHEDULE" title="الجدول الزمني" />
        <p className="timeline-hero__note">تابع المسابقات وورش العمل المنشورة حسب وقت بدايتها. الفعاليات التي لم يُحدَّد موعدها تظهر في نهاية الجدول.</p>
      </div>
    </header>
    <section className="container timeline-content" aria-label="مواعيد الفعاليات">
      <ApiState loading={loading} error={error} empty={!loading && !error && !events.length ? 'لا توجد مسابقات أو ورش منشورة حاليًا.' : ''}
        onRetry={() => { competitions.reload(); workshops.reload(); }} />
      {!loading && !error && events.length > 0 && <>
        <div className="timeline-summary" aria-label="ملخص الجدول">
          <span>{events.filter((event) => event.kind === 'competition').length} مسابقات</span>
          <span>{events.filter((event) => event.kind === 'workshop').length} ورش عمل</span>
        </div>
        <ol ref={listRef} className="timeline-list">
          {events.map((event) => <TimelineCard key={event.key} event={event} />)}
        </ol>
      </>}
    </section>
  </div>;
}
