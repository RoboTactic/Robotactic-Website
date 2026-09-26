import Button from '../Button/Button';

export default function WorkshopCard({
  title,
  date,
  time,
  description,
  registrationUrl,
}) {
  return (
    <article className="card workshop-card">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <div>{date}</div>
      <div>{time}</div>
      {registrationUrl && (
        <Button href={registrationUrl} external>
          سجّل عبر نموذج Google
        </Button>
      )}
    </article>
  );
}
