import EventRegistrationAction from '../EventUI/EventRegistrationAction';

/* Shared competition track card (Figma `Card / Competition`), used by the
   Competitions page and the Home preview.
   - competition: one item from data/competitions.js
   - icon: an image URL (string) or a React node (e.g. <Icon name="sensor" />)
   - registrationLabel / registrationIcon / helperText: optional overrides for the Google Form action */
export default function CompetitionCard({
  competition,
  icon,
  registrationLabel,
  registrationIcon,
  helperText = 'سينقلك الزر إلى رابط التسجيل في تبويب جديد',
}) {
  const isOpen = competition.registrationStatus === 'open';

  return (
    <article className="competition-card">
      <header className="competition-card__header">
        <span className="competition-card__icon">
          {typeof icon === 'string' ? <img src={icon} alt="" width="24" height="24" /> : icon}
        </span>
        {competition.level && <span className="competition-card__level">{competition.level}</span>}
      </header>

      {competition.imageUrl && <img className="competition-card__image" src={competition.imageUrl} alt={competition.title} loading="lazy" />}

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
        {...(registrationLabel ? { openLabel: registrationLabel } : {})}
        icon={registrationIcon}
        helperText={helperText}
        closedHelperText="التسجيل غير متاح حاليًا" />
    </article>
  );
}
