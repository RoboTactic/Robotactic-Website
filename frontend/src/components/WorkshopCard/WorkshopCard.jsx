import EventRegistrationAction from '../EventUI/EventRegistrationAction';

export default function WorkshopCard({ workshop, workshopIcon, teamIcon }) {
  const isOpen = workshop.registrationStatus === 'open';

  return (
    <article className="workshop-card">
      <header className="workshop-card__header">
        <img src={workshopIcon} alt="" width="24" height="24" />
        <span className="workshop-card__audience">{workshop.audienceLabel}</span>
      </header>
      <div className="workshop-card__content">
        <h3>{workshop.title}</h3>
        <div className="workshop-card__presenter">
          <img src={teamIcon} alt="" width="24" height="24" />
          <span>{workshop.presenter}</span>
        </div>
        <p className="workshop-card__description">{workshop.description}</p>
      </div>
      <dl className="workshop-card__meta">
        <div><dt>اليوم</dt><dd>{workshop.date}</dd></div>
        <div><dt>الوقت</dt><dd>{workshop.time}</dd></div>
        <div><dt>المقاعد المتاحة</dt><dd>{workshop.availableSeats}</dd></div>
      </dl>
      <EventRegistrationAction isOpen={isOpen} url={workshop.registrationUrl}
        helperText="سينقلك الزر إلى نموذج Google خارجي في تبويب جديد" />
    </article>
  );
}
