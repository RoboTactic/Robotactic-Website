import CTA from '../../../components/CTA/CTA';
import { cta } from '../../../data/home';

export default function CtaSection() {
  return (
    <div className="home-cta">
      <div className="container"><CTA {...cta} /></div>
    </div>
  );
}
