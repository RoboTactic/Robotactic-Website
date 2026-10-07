import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import ApiState from '../../components/ApiState/ApiState';
import CircuitPattern from '../../components/CircuitPattern/CircuitPattern';
import Icon from '../../components/Icon/Icon';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { buildTimelineEvents } from '../../data/timeline';
import { useApiData } from '../../services/api/useApiData';
import TimelineCircuit from './TimelineCircuit';
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

// Consecutive events on the same Riyadh calendar day form one milestone station;
// undated events (already sorted last) form the final, open station.
function groupStations(events) {
  const stations = [];
  let lastKey;
  events.forEach((event, i) => {
    const key = event.startAt ? dayFormatter.format(new Date(event.startAt)) : 'pending';
    if (key !== lastKey) stations.push([]);
    stations[stations.length - 1].push(i);
    lastKey = key;
  });
  return stations;
}

function TimelineCard({ event, stationStart }) {
  const competition = event.kind === 'competition';
  const ending = endLabel(event);
  return <li className={`timeline-item${stationStart ? ' timeline-item--station-start' : ''}`}>
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
      <Link className="timeline-item__link" to={event.href}>{competition ? 'عرض المسابقات' : 'عرض الورش'}<Icon name="arrowLeft" size={16} className="timeline-item__link-arrow" /></Link>
    </article>
  </li>;
}

export default function Timeline() {
  const competitions = useApiData('competitions');
  const workshops = useApiData('workshops');
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const summaryRef = useRef(null);
  const listRef = useRef(null);
  const endRef = useRef(null);
  const events = useMemo(() => buildTimelineEvents(competitions.data, workshops.data), [competitions.data, workshops.data]);
  const stations = useMemo(() => groupStations(events), [events]);
  const loading = competitions.loading || workshops.loading;
  const error = competitions.error || workshops.error;
  const ready = !loading && !error && events.length > 0;
  const stationStarts = new Set(stations.map((s) => s[0]));

  return <div ref={pageRef} className="timeline-page" dir="rtl">
    {ready && <TimelineCircuit pageRef={pageRef} listRef={listRef} heroRef={heroRef} summaryRef={summaryRef} endRef={endRef} stations={stations} />}
    <header ref={heroRef} className="timeline-hero">
      <div className="timeline-hero__pattern timeline-hero__pattern--desktop"><CircuitPattern variant="desktop" animated={false} /></div>
      <div className="timeline-hero__pattern timeline-hero__pattern--mobile"><CircuitPattern variant="mobile" animated={false} /><span className="timeline-hero__fade" /></div>
      <div className="container">
        <SectionHeading as="h1" size="h1" overline="SCHEDULE" title="الجدول الزمني" />
        <p className="timeline-hero__note">تابع المسابقات وورش العمل المنشورة حسب وقت بدايتها. الفعاليات التي لم يُحدَّد موعدها تظهر في نهاية الجدول.</p>
      </div>
    </header>
    <section className="container timeline-content" aria-label="مواعيد الفعاليات">
      <ApiState loading={loading} error={error} empty={!loading && !error && !events.length ? 'لا توجد مسابقات أو ورش منشورة حاليًا.' : ''}
        onRetry={() => { competitions.reload(); workshops.reload(); }} />
      {ready && <>
        <div ref={summaryRef} className="timeline-summary" aria-label="ملخص الجدول">
          <span>{events.filter((event) => event.kind === 'competition').length} مسابقات</span>
          <span>{events.filter((event) => event.kind === 'workshop').length} ورش عمل</span>
        </div>
        <ol ref={listRef} className="timeline-list">
          {events.map((event, i) => <TimelineCard key={event.key} event={event} stationStart={i > 0 && stationStarts.has(i)} />)}
        </ol>
        <div ref={endRef} className="timeline-end" aria-hidden="true" />
      </>}
    </section>
  </div>;
}
