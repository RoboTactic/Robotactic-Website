import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import WorkshopCard from '../../../components/WorkshopCard/WorkshopCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icon/Icon';
import { confirmedWorkshop, sections } from '../../../data/home';
import '../../Workshops/Workshops.css'; // shared WorkshopCard base styles

export default function WorkshopsPreview() {
  const s = sections.workshops;
  return (
    <section className="home-section home-workshops" aria-labelledby="home-workshops-title">
      <div className="container home-section__stack">
        <SectionHeading overline={s.overline} title={<span id="home-workshops-title">{s.title}</span>} />
        <ul className="card-grid card-grid--3">
          <li>
            <WorkshopCard
              workshop={confirmedWorkshop}
              workshopIcon={<Icon name="workshop" />}
              tag="ورشة"
              dateLabel="التاريخ"
              registrationLabel="سجّل عبر نموذج Google"
              registrationIcon={<Icon name="externalLink" size={18} strokeWidth={2} />}
              metaIcons={{ date: <Icon name="calendar" size={16} strokeWidth={1.5} />, time: <Icon name="clock" size={16} strokeWidth={1.5} /> }}
            />
          </li>
        </ul>
        <Button to={s.action.path} variant="secondary" size="medium" className="home-section__action">{s.action.label}</Button>
      </div>
    </section>
  );
}
