import CTA from '../../../components/CTA/CTA';
import { cta } from '../../../data/home';
import { useLanguage } from '../../../services/api/publicContentLanguage';

export default function CtaSection() {
  const { t } = useLanguage();
  return (
    <div className="home-cta">
      <div className="container"><CTA title={t(cta.title)} description={t(cta.description)} action={{ ...cta.action, label: t(cta.action.label) }} /></div>
    </div>
  );
}
