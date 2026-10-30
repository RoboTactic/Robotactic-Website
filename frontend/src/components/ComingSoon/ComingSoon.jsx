import Button from '../Button/Button';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './ComingSoon.css';

/*
  "Next chapter" state for a public listing whose API answered with an empty list.
  Never used for loading or errors (ApiState keeps those). Copy comes as [ar, en] pairs and
  follows the document language, like the Workshops day labels. `action` must be a real route.
*/
export default function ComingSoon({ variant, art, title, description, action }) {
  const { en, t: pick } = useLanguage();
  const titleId = `coming-soon-${variant}-title`;
  return (
    <section className={`coming-soon coming-soon--${variant}`} lang={en ? 'en' : 'ar'} dir={en ? 'ltr' : 'rtl'} aria-labelledby={titleId}>
      <div className="coming-soon__art" aria-hidden="true">{art}</div>
      <div className="coming-soon__copy">
        <p className="coming-soon__label">
          <span className="coming-soon__pulse" aria-hidden="true" />
          {/* one language at a time, following the page */}
          {en ? <span lang="en">COMING SOON</span> : <span lang="ar">قريبًا</span>}
        </p>
        <h2 id={titleId}>{pick(title)}</h2>
        <p className="coming-soon__description">{pick(description)}</p>
        {action && <Button to={action.to} variant="outline" size="medium">{pick(action.label)}</Button>}
      </div>
    </section>
  );
}
