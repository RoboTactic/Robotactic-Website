import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import WorkshopCard from '../../../components/WorkshopCard/WorkshopCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icon/Icon';
import { sections } from '../../../data/home';
import { useApiData } from '../../../services/api/useApiData';
import { presentWorkshop } from '../../../services/api/presentRecords';
import ApiState from '../../../components/ApiState/ApiState';
import '../../Workshops/Workshops.css'; // shared WorkshopCard base styles

export default function WorkshopsPreview() {
  const s = sections.workshops;
  const { data, loading, error, reload } = useApiData('workshops');
  const workshop = (data || []).find((item) => item.is_featured);
  return (
    <section className="home-section home-workshops" aria-labelledby="home-workshops-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-workshops-title">{s.title}</span>} />
        <ApiState loading={loading} error={error} empty={!loading && !error && !workshop ? 'لا توجد ورشة مميزة منشورة حاليًا.' : ''} onRetry={reload} />
        {workshop && <ul className="card-grid card-grid--3">
          <li>
            <WorkshopCard
              workshop={presentWorkshop(workshop)}
              workshopIcon={<Icon name="workshop" />}
              tag="ورشة"
              dateLabel="التاريخ"
              registrationLabel="سجّل عبر نموذج Google"
              registrationIcon={<Icon name="externalLink" size={18} strokeWidth={2} />}
              metaIcons={{ date: <Icon name="calendar" size={16} strokeWidth={1.5} />, time: <Icon name="clock" size={16} strokeWidth={1.5} /> }}
            />
          </li>
        </ul>}
        <Button to={s.action.path} variant="secondary" size="medium" className="home-section__action">{s.action.label}</Button>
      </div>
    </section>
  );
}
