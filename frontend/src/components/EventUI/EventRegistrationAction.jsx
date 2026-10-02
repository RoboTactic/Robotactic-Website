import './EventRegistrationAction.css';

export default function EventRegistrationAction({
  isOpen,
  url,
  helperText,
  closedHelperText = helperText,
  openLabel = 'سجّل الآن',
  closedLabel = 'اكتمل التسجيل',
}) {
  const isAvailable = isOpen && Boolean(url);
  const label = isOpen ? openLabel : closedLabel;

  return (
    <footer className="event-registration">
      {isAvailable ? (
        <a className="event-registration__action" href={url} target="_blank" rel="noopener noreferrer">
          {openLabel}
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
