import EventRegistrationAction from '../EventUI/EventRegistrationAction';
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
  dateLabel = 'اليوم',
  registrationLabel,
  registrationIcon,
  metaIcons = {},
  helperText = 'سينقلك الزر إلى نموذج Google خارجي في تبويب جديد',
}) {
  const isOpen = workshop.registrationStatus === 'open';
  const iconNode = src => (typeof src === 'string' ? <img src={src} alt="" width="24" height="24" /> : src);

  return (
    <article className="workshop-card">
      <header className="workshop-card__header">
        {iconNode(workshopIcon)}
        {tag && <span className="workshop-card__tag">{tag}</span>}
      </header>
      <div className="workshop-card__content">
        <h3>{workshop.title}</h3>
        {workshop.presenter && (
          <div className="workshop-card__presenter">
            {iconNode(teamIcon)}
            <span>{workshop.presenter}</span>
          </div>
        )}
        {workshop.description && <p className="workshop-card__description">{workshop.description}</p>}
      </div>
      <dl className="workshop-card__meta">
        <div><dt>{metaIcons.date}{dateLabel}</dt><dd>{workshop.date}</dd></div>
        <div><dt>{metaIcons.time}الوقت</dt><dd>{workshop.time}</dd></div>
        {workshop.availableSeats != null && <div><dt>المقاعد المتاحة</dt><dd>{workshop.availableSeats}</dd></div>}
      </dl>
      <EventRegistrationAction isOpen={isOpen} url={workshop.registrationUrl}
        {...(registrationLabel ? { openLabel: registrationLabel } : {})}
        icon={registrationIcon}
        helperText={helperText} />
    </article>
  );
}
