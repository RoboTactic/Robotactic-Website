import Button from '../Button/Button';
import Chip from '../Chip/Chip';
import Icon from '../Icon/Icon';
import '../Card/Card.css';

/* One workshop: name, date, time and — only when officially available — a
   short description. Unknown date/time stay «يُحدَّد لاحقًا». */
export default function WorkshopCard({ tag = 'ورشة', title, description, date, time, registrationUrl }) {
  return (
    <article className="rt-card workshop-card">
      <div className="rt-card__header">
        <span className="rt-card__badge"><Icon name="workshop" size={20} /></span>
        <Chip tone="accent">{tag}</Chip>
      </div>

      <h3 className="rt-card__title t-h3">{title}</h3>
      {description && <p className="workshop-card__description t-body">{description}</p>}

      <dl className="rt-card__meta">
        {[['التاريخ', date, 'calendar'], ['الوقت', time, 'clock']].map(([k, v, icon]) => (
          <div className="rt-card__meta-row" key={k}>
            <dt className="rt-card__meta-key t-caption"><Icon name={icon} size={16} strokeWidth={1.5} />{k}</dt>
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
