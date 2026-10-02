import EventRegistrationAction from '../EventUI/EventRegistrationAction';

export default function CompetitionCard({ competition, icon }) {
  const isOpen = competition.registrationStatus === 'open';

  return (
    <article className="competition-card">
      <header className="competition-card__header">
        <span className="competition-card__icon"><img src={icon} alt="" width="24" height="24" /></span>
        {competition.level && <span className="competition-card__level">{competition.level}</span>}
      </header>

      <div className="competition-card__title-group">
        <h2>{competition.title}</h2>
        <p><span>محور التحدي:</span> <strong>{competition.focus}</strong></p>
      </div>

      <dl className="competition-card__meta">
        <div><dt>الفئة المستهدفة</dt><dd>{competition.audience}</dd></div>
        <div><dt>حجم الفريق</dt><dd>{competition.teamSize}</dd></div>
        <div><dt>موعد المسابقة</dt><dd>{competition.date}</dd></div>
      </dl>

      <EventRegistrationAction isOpen={isOpen} url={competition.registrationUrl}
        helperText="سينقلك الزر إلى رابط التسجيل في تبويب جديد"
        closedHelperText="التسجيل غير متاح حاليًا" />
    </article>
  );
}
