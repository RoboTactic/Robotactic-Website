import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import { brand } from '../../data/site';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './Footer.css';
import WebsiteCredits from './WebsiteCredits';

export default function Footer() {
  const [creditsOpen, setCreditsOpen] = useState(false);
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Link className="footer__contact-link" to="/contact">
          {t('التواصل والأسئلة الشائعة', 'Contact & FAQ')}
        </Link>
        <div className="footer__bottom">
          <p className="footer__copyright t-label" lang="en">{brand.copyright}</p>
          <button
            type="button"
            className="footer__credits t-caption"
            aria-haspopup="dialog"
            aria-controls="website-credits-dialog"
            onClick={() => setCreditsOpen(true)}
          >
            <span className="footer__credits-chip" aria-hidden="true"><Icon name="chip" size={24} /></span>
            <span className="footer__credits-label">{t('لجنة الموقع', 'Website Committee')}</span>
            <span className="footer__credits-trace" aria-hidden="true" />
          </button>
        </div>
      </div>
      <WebsiteCredits open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </footer>
  );
}
