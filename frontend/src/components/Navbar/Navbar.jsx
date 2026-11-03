import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../Logo/Logo';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { navLinks, registerCta } from '../../data/site';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './Navbar.css';
import { useSectionVisibility } from '../../services/api/SectionVisibility';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const menuButton = useRef(null);
  const menuPanel = useRef(null);
  const closeButton = useRef(null);
  const closeMenu = () => { setMenuOpen(false); menuButton.current?.focus(); }; // return focus to the trigger
  const { dir, language, t } = useLanguage();
  const { isPathVisible } = useSectionVisibility();
  const links = navLinks.filter(({ path }) => isPathVisible(path));

  useEffect(() => setMenuOpen(false), [pathname]);                 // close on navigation
  useEffect(() => {                                                // desktop nav takes over at 1200px
    const desktop = window.matchMedia('(min-width: 1200px)');
    const onChange = (e) => e.matches && setMenuOpen(false);
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);
  useEffect(() => {
    if (!menuOpen) return undefined;
    closeButton.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;                                 // keep focus inside the open dialog
      const items = [...menuPanel.current.querySelectorAll('a[href], button:not([disabled])')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';                       // lock page scroll behind the menu
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <div className="navbar__brand-links">
          <Link to="/" className="navbar__logo" aria-label={t('RoboTactic — الرئيسية', 'RoboTactic — Home')}>
            <Logo layout="horizontal" markHeight={44} />
          </Link>
          <nav className="navbar__links" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
            {links.map(({ label, labelEn, path }) => (
              <NavLink key={path} to={path} end={path === '/'} className="navbar__link t-nav">{t(label, labelEn)}</NavLink>
            ))}
          </nav>
        </div>

        <div className="navbar__actions">
          <LanguageSwitcher />
          <Button to={registerCta.path} size="medium">{t(registerCta.label, registerCta.labelEn)}</Button>
        </div>

        <button
          type="button"
          ref={menuButton}
          className="navbar__menu-button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={t('فتح القائمة', 'Open menu')}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </div>

      {/* Rendered in <body>: the header's backdrop-filter makes it the containing block for
          position:fixed descendants, which squeezed this full-screen menu into the 64px bar. */}
      {createPortal(
        <div className={`mobile-menu-layer${menuOpen ? ' is-open' : ''}`} dir={dir} lang={language} inert={!menuOpen}>
          <div className="mobile-menu__backdrop" aria-hidden="true" onClick={closeMenu} />
          <div ref={menuPanel} id="mobile-menu" className="mobile-menu" role="dialog" aria-modal="true" aria-label={t('القائمة', 'Menu')}>
            <div className="mobile-menu__top container">
              <Link to="/" aria-label={t('RoboTactic — الرئيسية', 'RoboTactic — Home')} onClick={() => setMenuOpen(false)}><Logo layout="horizontal" markHeight={44} /></Link>
              <button type="button" ref={closeButton} className="navbar__menu-button navbar__menu-button--visible" aria-label={t('إغلاق القائمة', 'Close menu')} onClick={closeMenu}>
                <Icon name="close" />
              </button>
            </div>
            <nav className="mobile-menu__list" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
              {links.map(({ label, labelEn, path }) => (
                // Closes on every tap, including the current page (no route change to react to).
                <NavLink key={path} to={path} end={path === '/'} className="mobile-menu__item t-h3" onClick={() => setMenuOpen(false)}>
                  <span className="mobile-menu__label">{t(label, labelEn)}</span>
                  <Icon name="chevronLeft" size={18} strokeWidth={1.6} className="mobile-menu__chevron" />
                </NavLink>
              ))}
            </nav>
            <div className="mobile-menu__actions container" onClick={(e) => e.target.closest('a') && setMenuOpen(false)}>
              <Button to={registerCta.path} fullWidth>{t(registerCta.label, registerCta.labelEn)}</Button>
              <LanguageSwitcher fullWidth />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
