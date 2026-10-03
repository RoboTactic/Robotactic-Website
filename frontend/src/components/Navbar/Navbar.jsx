import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../Logo/Logo';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { navLinks, registerCta } from '../../data/site';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const menuButton = useRef(null);
  const closeMenu = () => { setMenuOpen(false); menuButton.current?.focus(); }; // return focus to the trigger

  useEffect(() => setMenuOpen(false), [pathname]);                 // close on navigation
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = e => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';                       // lock page scroll behind the menu
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <div className="navbar__brand-links">
          <Link to="/" className="navbar__logo" aria-label="RoboTactic — الرئيسية">
            <Logo layout="horizontal" markHeight={44} />
          </Link>
          <nav className="navbar__links" aria-label="التنقل الرئيسي">
            {navLinks.map(({ label, path }) => (
              <NavLink key={path} to={path} end={path === '/'} className="navbar__link t-nav">{label}</NavLink>
            ))}
          </nav>
        </div>

        <div className="navbar__actions">
          <LanguageSwitcher />
          <Button to={registerCta.path} size="medium">{registerCta.label}</Button>
        </div>

        <button
          type="button"
          ref={menuButton}
          className="navbar__menu-button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="فتح القائمة"
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="mobile-menu" role="dialog" aria-modal="true" aria-label="القائمة">
          <div className="mobile-menu__top container">
            <Link to="/" aria-label="RoboTactic — الرئيسية"><Logo layout="horizontal" markHeight={44} /></Link>
            <button type="button" className="navbar__menu-button navbar__menu-button--visible" aria-label="إغلاق القائمة" onClick={closeMenu} autoFocus>
              <Icon name="close" />
            </button>
          </div>
          <nav className="mobile-menu__list" aria-label="التنقل الرئيسي">
            {navLinks.map(({ label, path }) => (
              <NavLink key={path} to={path} end={path === '/'} className="mobile-menu__item t-h3">
                <span className="mobile-menu__label">{label}</span>
                <Icon name="chevronLeft" size={18} strokeWidth={1.6} className="mobile-menu__chevron" />
              </NavLink>
            ))}
          </nav>
          <div className="mobile-menu__actions container">
            <Button to={registerCta.path} fullWidth>{registerCta.label}</Button>
            <LanguageSwitcher fullWidth />
          </div>
        </div>
      )}
    </header>
  );
}
