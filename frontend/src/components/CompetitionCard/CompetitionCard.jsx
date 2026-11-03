import EventRegistrationAction from '../EventUI/EventRegistrationAction';
import { useLanguage } from '../../services/api/publicContentLanguage';
import { eventVenue } from '../../data/site';

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
  helperText,
}) {
  const { t } = useLanguage();
  const isOpen = competition.registrationStatus === 'open';
  const comingSoon = competition.registrationStatus === 'coming_soon';

  return (
    <article className="competition-card">
      <header className="competition-card__header">
        <span className="competition-card__icon">
          {typeof icon === 'string' ? <img src={icon} alt="" width="24" height="24" /> : icon}
        </span>
        {competition.level && <bdi className="competition-card__level">{competition.level}</bdi>}
      </header>

      {competition.imageUrl && <img className="competition-card__image" src={competition.imageUrl} alt={competition.title} loading="lazy" />}

      <div className="competition-card__title-group">
        <h2><bdi>{competition.title}</bdi></h2>
        <p><span>{t('محور التحدي:', 'Challenge focus:')}</span> <strong>{competition.focus}</strong></p>
      </div>

      <p className="competition-card__description">{competition.description || t('سيُعلن وصف المسابقة وتفاصيلها لاحقًا.', 'The competition description and details will be announced later.')}</p>

      <dl className="competition-card__meta">
        <div><dt>{t('الفئة المستهدفة', 'Audience')}</dt><dd><bdi>{competition.audience}</bdi></dd></div>
        <div><dt>{t('حجم الفريق', 'Team size')}</dt><dd>{competition.teamSize}</dd></div>
        <div><dt>{t('موعد المسابقة', 'Date')}</dt><dd>{competition.date}</dd></div>
        <div><dt>{t('المكان', 'Venue')}</dt><dd>{t(eventVenue)}</dd></div>
      </dl>

      <EventRegistrationAction isOpen={isOpen} url={competition.registrationUrl}
        {...(registrationLabel ? { openLabel: registrationLabel } : {})}
        icon={registrationIcon}
        helperText={helperText ?? t('سينقلك الزر إلى رابط التسجيل في تبويب جديد', 'Opens the registration link in a new tab')}
        closedLabel={comingSoon ? t('التسجيل قريبًا', 'Registration coming soon') : undefined}
        closedHelperText={comingSoon ? t('سيُعلن رابط التسجيل لاحقًا.', 'The registration link will be announced later.') : t('التسجيل غير متاح حاليًا', 'Registration isn’t open at the moment')} />
    </article>
  );
}
