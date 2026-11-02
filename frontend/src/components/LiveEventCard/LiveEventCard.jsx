import Chip from '../Chip/Chip';
import Icon from '../Icon/Icon';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './LiveEventCard.css';

const STATUS = {
  live: { label: ['مباشر الآن', 'Live now'], tone: 'live', dot: true },
  upcoming: { label: ['قريبًا', 'Coming up'], tone: 'outline', dot: false },
};

/* Live Now card — status: 'live' | 'upcoming' | 'empty'.
   Event cards sit on the navy sunken surface so the red and green status
   colours pass WCAG AA (5.67:1 and 5.47:1). */
export default function LiveEventCard({ status = 'upcoming', title, time, location, message, supporting }) {
  const { t } = useLanguage();
  if (status === 'empty') {
    return (
      <article className="live-card live-card--empty">
        <span className="live-card__empty-icon" aria-hidden="true"><Icon name="live" /></span>
        <div className="live-card__empty-text">
          <p className="t-body-bold">{message}</p>
          {supporting && <p className="t-caption live-card__supporting">{supporting}</p>}
        </div>
      </article>
    );
  }
  const s = STATUS[status] ?? STATUS.upcoming;
  return (
    <article className={`live-card live-card--${status}`}>
      <div className="live-card__header">
        <Chip tone={s.tone} dot={s.dot}>{t(s.label)}</Chip>
        <p className="live-card__time t-caption"><time>{time}</time></p>
      </div>
      <h3 className="live-card__title t-body-bold">{title}</h3>
      <p className="live-card__location t-caption">{location}</p>
    </article>
  );
}
