import ApiState from '../../components/ApiState/ApiState';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { useApiData } from '../../services/api/useApiData';
import './Timeline.css';

const isEnglish = () => document.documentElement.lang === 'en';
const value = (ar, en) => isEnglish() ? (en || ar || '') : (ar || en || '');
const formatDate = (input) => input ? new Intl.DateTimeFormat(isEnglish() ? 'en-GB' : 'ar-SA-u-ca-gregory', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(input)) : '';

export default function Timeline() {
  const { data, loading, error, reload } = useApiData('timeline-events');
  const events = data || [];
  return <section className="page container timeline-page" dir="rtl">
    <SectionHeading overline="SCHEDULE" title="الجدول الزمني" />
    <ApiState loading={loading} error={error} empty={!loading && !error && !events.length ? 'سيُنشر الجدول الزمني بعد اعتماده.' : ''} onRetry={reload} />
    {!loading && !error && events.length > 0 && <ol className="timeline-list">{events.map((event)=><li className="timeline-list__item" key={event.id}>
      <time dateTime={event.start_at}>{formatDate(event.start_at)}</time>
      <div><h2>{value(event.title_ar,event.title_en)}</h2>{(event.description_ar || event.description_en) && <p>{value(event.description_ar,event.description_en)}</p>}
        {(event.location_ar || event.location_en) && <p className="timeline-list__location">{value(event.location_ar,event.location_en)}</p>}
      </div>
    </li>)}</ol>}
  </section>;
}
