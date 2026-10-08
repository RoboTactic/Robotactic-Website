import Chip from '../../../components/Chip/Chip';
import Button from '../../../components/Button/Button';
import CircuitPattern from '../../../components/CircuitPattern/CircuitPattern';
import { hero } from '../../../data/home';

/* Venue image (public/images): WebP variants for every width, original PNG as fallback. */
const HERO_IMG = '/images/king-faisal-convention-center-hero';
const HERO_SRCSET = [640, 960, 1280, 1680].map((w) => `${HERO_IMG}-${w}.webp ${w}w`).join(', ');

/* Two-tone display title (Refined Dark): the last word carries the accent line. */
function splitTitle(title) {
  const i = title.lastIndexOf(' ');
  return i > 0 ? [title.slice(0, i), title.slice(i + 1)] : [title, ''];
}

export default function HeroSection() {
  const [lead, accent] = splitTitle(hero.title);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__pattern hero__pattern--mobile"><CircuitPattern variant="mobile" /></div>
      <div className="hero__pattern hero__pattern--desktop"><CircuitPattern variant="desktop" /></div>

      <div className="container hero__inner">
        <div className="hero__copy">
          <Chip tone="outline">{hero.eyebrow}</Chip>
          <h1 id="hero-title" className="hero__title t-display">
            <span className="hero__title-lead">{lead}</span>{accent && ' '}
            {accent && <span className="hero__title-accent">{accent}</span>}
          </h1>
          <p className="hero__description t-body-lg">{hero.description}</p>
          <div className="hero__actions">
            <Button to={hero.primaryAction.path}>{hero.primaryAction.label}</Button>
            <Button to={hero.secondaryAction.path} variant="outline">{hero.secondaryAction.label}</Button>
          </div>
        </div>
        <div className="hero__visual">
          <picture className="hero__media">
            <source type="image/webp" srcSet={HERO_SRCSET} sizes="100vw" />
            <img src={`${HERO_IMG}.png`} alt="واجهة مركز الملك فيصل للمؤتمرات" width="1680" height="936"
              fetchPriority="high" decoding="async" />
          </picture>
        </div>
      </div>
    </section>
  );
}
