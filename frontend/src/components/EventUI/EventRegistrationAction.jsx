import './EventRegistrationAction.css';

export default function EventRegistrationAction({
  isOpen,
  url,
  helperText,
  closedHelperText = helperText,
  openLabel = 'سجّل الآن',
  closedLabel = 'اكتمل التسجيل',
  icon = null, // optional decorative icon after the label (e.g. Home's external-link arrow)
}) {
  const isAvailable = isOpen && Boolean(url);
  const label = isOpen ? openLabel : closedLabel;

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
      <p>{isOpen ? helperText : closedHelperText}</p>
    </footer>
  );
}
