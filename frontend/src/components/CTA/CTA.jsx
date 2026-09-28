import Button from '../Button/Button';
import CircuitPattern from '../CircuitPattern/CircuitPattern';
import './CTA.css';

/* Closing call-to-action band (Figma `CTA / Band`). `action` is internal
   navigation; children can replace the button if a page needs something else. */
export default function CTA({ title, description, action, children }) {
  return (
    <section className="cta-band" aria-labelledby="cta-band-title">
      <CircuitPattern variant="band" animated={false} className="cta-band__pattern" />
      <div className="cta-band__content">
        <h2 id="cta-band-title" className="cta-band__title t-h2">{title}</h2>
        {description && <p className="cta-band__description t-body">{description}</p>}
        {children ?? (action && <Button to={action.path}>{action.label}</Button>)}
      </div>
    </section>
  );
}
