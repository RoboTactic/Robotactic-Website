import { Link } from 'react-router-dom';
import Logo from '../Logo/Logo';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { brand, navLinks } from '../../data/site';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './Footer.css';
import { useSectionVisibility } from '../../services/api/SectionVisibility';

export default function Footer() {
  const { t } = useLanguage();
  const { isPathVisible } = useSectionVisibility();
  // Home is reached through the logo, so the footer lists the other six pages (as in Figma)
  const links = navLinks.filter(l => l.path !== '/' && isPathVisible(l.path));
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" aria-label={t('RoboTactic — الرئيسية', 'RoboTactic — Home')}><Logo layout="horizontal" markHeight={44} /></Link>
          <p className="footer__slogan t-caption">{t(brand.slogan)}</p>
        </div>
        <nav className="footer__links" aria-label={t('روابط الموقع', 'Site links')}>
          {links.map(({ label, labelEn, path }) => (
            <Link key={path} to={path} className="footer__link t-caption">{t(label, labelEn)}</Link>
          ))}
        </nav>
        <div className="footer__bottom">
          <p className="footer__copyright t-label" lang="en">{brand.copyright}</p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
