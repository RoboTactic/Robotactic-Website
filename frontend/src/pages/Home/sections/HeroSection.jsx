import Logo from '../../../components/Logo/Logo';
import Chip from '../../../components/Chip/Chip';
import Button from '../../../components/Button/Button';
import CircuitPattern from '../../../components/CircuitPattern/CircuitPattern';
import { hero } from '../../../data/home';

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__pattern hero__pattern--mobile"><CircuitPattern variant="mobile" /></div>
      <div className="hero__pattern hero__pattern--desktop"><CircuitPattern variant="desktop" /></div>

      <div className="container hero__inner">
        <div className="hero__copy">
          <Chip tone="outline">{hero.eyebrow}</Chip>
          <h1 id="hero-title" className="hero__title t-display">{hero.title}</h1>
          <p className="hero__description t-body-lg">{hero.description}</p>
          <div className="hero__actions">
            <Button to={hero.primaryAction.path}>{hero.primaryAction.label}</Button>
            <Button to={hero.secondaryAction.path} variant="outline">{hero.secondaryAction.label}</Button>
          </div>
        </div>
        <div className="hero__visual">
          <Logo layout="stacked" />
        </div>
      </div>
    </section>
  );
}
