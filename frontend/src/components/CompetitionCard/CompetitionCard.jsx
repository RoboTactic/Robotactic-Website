import Button from '../Button/Button';

export default function CompetitionCard({
  title,
  level,
  focus,
  description,
  registrationUrl,
}) {
  return (
    <article className="card competition-card">
      <div className="card__meta">
        {level && <span>{level}</span>}
        {focus && <span>{focus}</span>}
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {registrationUrl && (
        <Button href={registrationUrl} external>
          سجّل عبر نموذج Google
        </Button>
      )}
    </article>
  );
}
