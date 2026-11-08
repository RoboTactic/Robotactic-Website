import Chip from '../../../components/Chip/Chip';
import Button from '../../../components/Button/Button';
import CircuitPattern from '../../../components/CircuitPattern/CircuitPattern';
import { hero } from '../../../data/home';
import { useSectionVisibility } from '../../../services/api/SectionVisibility';
import { useLanguage } from '../../../services/api/publicContentLanguage';

/* RoboTactic hero artwork (public/images): WebP variants for every width (1672 is the source
   file, unchanged), JPEG as fallback. The previous venue photo stays in public/images as
   king-faisal-convention-center-hero-*; restoring it means pointing these constants back. */
const HERO_IMG = '/images/robotactic-hero';
const HERO_SRCSET = [640, 960, 1280, 1672].map((w) => `${HERO_IMG}-${w}.webp ${w}w`).join(', ');

/* Two-tone display title (Refined Dark): the last word carries the accent line. */
function splitTitle(title) {
  const i = title.lastIndexOf(' ');
  return i > 0 ? [title.slice(0, i), title.slice(i + 1)] : [title, ''];
}

export default function HeroSection() {
  const { t } = useLanguage();
  const { isPathVisible } = useSectionVisibility();
  const [lead, accent] = splitTitle(t(hero.title));
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__pattern hero__pattern--mobile"><CircuitPattern variant="mobile" /></div>
      <div className="hero__pattern hero__pattern--desktop"><CircuitPattern variant="desktop" /></div>

      <div className="container hero__inner">
        <div className="hero__copy">
          <Chip tone="outline">{t(hero.eyebrow)}</Chip>
          <h1 id="hero-title" className="hero__title t-display">
            <span className="hero__title-lead">{lead}</span>{accent && ' '}
            {accent && <span className="hero__title-accent">{accent}</span>}
          </h1>
          <p className="hero__description t-body-lg">{t(hero.description)}</p>
          {(isPathVisible(hero.primaryAction.path) || isPathVisible(hero.secondaryAction.path)) && <div className="hero__actions">
            <Button to={hero.primaryAction.path}>{t(hero.primaryAction.label)}</Button>
            <Button to={hero.secondaryAction.path} variant="outline">{t(hero.secondaryAction.label)}</Button>
          </div>}
        </div>
        <div className="hero__visual">
          <picture className="hero__media">
            <source type="image/webp" srcSet={HERO_SRCSET} sizes="100vw" />
            <img src={`${HERO_IMG}.jpg`} alt={t('روبوت RoboTactic يتأمل رقعة شطرنج مضيئة، ومعه طائرة مسيّرة وروبوت جوّال أمام مبنى حديث', 'The RoboTactic robot considers a glowing chessboard, with a drone and a rover in front of a modern building')} width="1672" height="941"
              fetchPriority="high" decoding="async" />
          </picture>
        </div>
      </div>
    </section>
  );
}
