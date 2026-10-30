import { useLanguage } from '../../services/api/publicContentLanguage';
import './EventRegistrationAction.css';

export default function EventRegistrationAction({
  isOpen,
  url,
  helperText,
  closedHelperText = helperText,
  missingUrlHelperText,
  missingUrlLabel,
  openLabel,
  closedLabel,
  icon = null, // optional decorative icon after the label (e.g. Home's external-link arrow)
}) {
  const { t } = useLanguage();
  missingUrlHelperText ??= t('رابط التسجيل غير متاح حاليًا.', 'The registration link isn’t available yet.');
  missingUrlLabel ??= t('رابط التسجيل غير متاح', 'Registration link unavailable');
  openLabel ??= t('سجّل الآن', 'Register now');
  closedLabel ??= t('اكتمل التسجيل', 'Registration closed');
  const isAvailable = isOpen && Boolean(url);
  const label = isAvailable ? openLabel : isOpen ? missingUrlLabel : closedLabel;
  const statusHelp = isAvailable ? helperText : isOpen ? missingUrlHelperText : closedHelperText;

  return (
    <footer className="event-registration">
      {isAvailable ? (
        <a className="event-registration__action" href={url} target="_blank" rel="noopener noreferrer">
          {openLabel}
          {icon && <span className="event-registration__icon" aria-hidden="true">{icon}</span>}
        </a>
      ) : (
        <span className="event-registration__action event-registration__action--closed" aria-disabled="true">
          {label}
        </span>
      )}
      <p>{statusHelp}</p>
    </footer>
  );
}
