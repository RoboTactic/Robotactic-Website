import Button from '../Button/Button';
import Chip from '../Chip/Chip';
import Icon from '../Icon/Icon';
import '../Card/Card.css';
import './CompetitionCard.css';

/* One official competition track. Only confirmed information is shown:
   title, level (optional — hidden when unknown), focus area, and meta rows. */
export default function CompetitionCard({ title, level, focus, icon, audience, teamSize, date, registrationUrl }) {
  return (
    <article className="rt-card competition-card">
      <div className="rt-card__header">
        <span className="rt-card__badge"><Icon name={icon} /></span>
        {level && <Chip tone="outline">{level}</Chip>}
      </div>

      <div className="competition-card__head">
        <h3 className="rt-card__title t-h3">{title}</h3>
        <p className="competition-card__focus">
          <span className="t-body competition-card__focus-label">محور التحدي:</span>
          <span className="t-body-bold competition-card__focus-value">{focus}</span>
        </p>
      </div>

      <dl className="rt-card__meta">
        {[['الفئة المستهدفة', audience], ['حجم الفريق', teamSize], ['موعد المسابقة', date]].map(([k, v]) => (
          <div className="rt-card__meta-row" key={k}>
            <dt className="rt-card__meta-key t-caption">{k}</dt>
            <dd className="rt-card__meta-value t-caption">{v}</dd>
          </div>
        ))}
      </dl>

      {registrationUrl && (
        <div className="rt-card__footer">
          <Button href={registrationUrl} external fullWidth>سجّل عبر نموذج Google</Button>
          <p className="rt-card__note t-caption">سينقلك الزر إلى نموذج Google خارجي في تبويب جديد</p>
        </div>
      )}
    </article>
  );
}
