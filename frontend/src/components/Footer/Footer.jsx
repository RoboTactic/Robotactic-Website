import { useState } from 'react';
import Icon from '../Icon/Icon';
import { brand, contact } from '../../data/site';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './Footer.css';
import WebsiteCredits from './WebsiteCredits';

export default function Footer() {
  const [creditsOpen, setCreditsOpen] = useState(false);
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <section className="footer__contact" aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title" className="footer__contact-title">{t(contact.title)}</h2>
          <p className="footer__contact-tagline">{t(contact.tagline)}</p>
          {contact.intro.map((p) => <p key={p[1]} className="footer__contact-intro">{t(p)}</p>)}
        </section>
        {/* Contact channels: icon-only links; each name is the link's accessible label. */}
        <ul className="footer__social" aria-label={t('قنوات التواصل', 'Contact channels')}>
          {contact.channels.map((c) => {
            const external = !c.href.startsWith('mailto:');
            const name = c.value ? `${t(c.label)}: ${c.value}` : t(c.label);
            return (
              <li key={c.key}>
                <a
                  className="footer__social-link"
                  href={c.href}
                  {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                  aria-label={external ? `${name} — ${t('يفتح في نافذة جديدة', 'opens in a new tab')}` : name}
                  title={t(c.label)}
                >
                  <Icon name={c.icon} size={20} />
                </a>
              </li>
            );
          })}
        </ul>
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
