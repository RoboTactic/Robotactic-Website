import EventRegistrationAction from '../EventUI/EventRegistrationAction';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './WorkshopCard.css';

/* Shared workshop card, used by the Workshops page and the Home preview.
   Optional fields render only when present, so a workshop with unconfirmed
   details (no presenter / seats yet) never shows invented values.
   - workshopIcon / teamIcon: image URLs (string) or React nodes
   - tag: optional chip in the header (Home shows «ورشة»)
   - dateLabel: label for the date row (Workshops page: «اليوم», Home: «التاريخ»)
   - metaIcons: optional { date, time } icons shown before the meta labels
   - registrationIcon: optional icon after the registration label */
export default function WorkshopCard({
  workshop,
  workshopIcon,
  teamIcon,
  tag,
  dateLabel,
  registrationLabel,
  registrationIcon,
  metaIcons = {},
  helperText,
}) {
  const { t } = useLanguage();
  const isOpen = workshop.registrationStatus === 'open';
  const iconNode = src => (typeof src === 'string' ? <img src={src} alt="" width="24" height="24" /> : src);

  return (
    <article className="workshop-card">
      <header className="workshop-card__header">
        {iconNode(workshopIcon)}
        {tag && <span className="workshop-card__tag">{tag}</span>}
      </header>
      {workshop.imageUrl && <img className="workshop-card__image" src={workshop.imageUrl} alt={workshop.title} loading="lazy" />}
      <div className="workshop-card__content">
        <h3>{workshop.title}</h3>
        {workshop.presenter && (
          <div className="workshop-card__presenter">
            {iconNode(teamIcon)}
            <span>{t('يقدمها ', 'Presented by ')}<bdi>{workshop.presenter}</bdi></span>
          </div>
        )}
        {workshop.description && <p className="workshop-card__description">{workshop.description}</p>}
      </div>
      <dl className="workshop-card__meta">
        <div><dt>{metaIcons.date}{dateLabel ?? t('اليوم', 'Day')}</dt><dd>{workshop.date}</dd></div>
        <div><dt>{metaIcons.time}{t('الوقت', 'Time')}</dt><dd>{workshop.time}</dd></div>
        {workshop.availableSeats != null && <div><dt>{t('المقاعد المتاحة', 'Seats available')}</dt><dd>{workshop.availableSeats}</dd></div>}
      </dl>
      <EventRegistrationAction isOpen={isOpen} url={workshop.registrationUrl}
        {...(registrationLabel ? { openLabel: registrationLabel } : {})}
        icon={registrationIcon}
        helperText={helperText ?? t('سينقلك الزر إلى نموذج Google خارجي في تبويب جديد', 'Opens an external Google Form in a new tab')} />
    </article>
  );
}
