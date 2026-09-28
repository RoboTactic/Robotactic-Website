import { Link } from 'react-router-dom';
import Logo from '../Logo/Logo';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { brand, navLinks } from '../../data/site';
import './Footer.css';

export default function Footer() {
  // Home is reached through the logo, so the footer lists the other six pages (as in Figma)
  const links = navLinks.filter(l => l.path !== '/');
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" aria-label="RoboTactic — الرئيسية"><Logo layout="horizontal" markHeight={44} /></Link>
          <p className="footer__slogan t-caption">{brand.slogan}</p>
        </div>
        <nav className="footer__links" aria-label="روابط الموقع">
          {links.map(({ label, path }) => (
            <Link key={path} to={path} className="footer__link t-caption">{label}</Link>
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
