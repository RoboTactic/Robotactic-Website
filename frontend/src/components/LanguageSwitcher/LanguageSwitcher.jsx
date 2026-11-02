import Icon from '../Icon/Icon';
import { languageSwitch } from '../../data/site';
import { setContentLanguage, useLanguage } from '../../services/api/publicContentLanguage';
import './LanguageSwitcher.css';

/* Switches the public site between Arabic and English in place (no navigation). Every
   instance — Navbar, mobile menu, Footer — reads the same <html lang>, so they stay in sync.
   The label names the language the visitor can switch to, in that language. */
export default function LanguageSwitcher({ fullWidth = false }) {
  const { en } = useLanguage();
  const target = en ? languageSwitch.ar : languageSwitch.en;
  return (
    <button
      type="button"
      className={`lang-switch t-label ${fullWidth ? 'lang-switch--full' : ''}`}
      lang={target.lang}
      onClick={() => setContentLanguage(target.lang)}
      aria-label={target.ariaLabel}
    >
      <Icon name="globe" size={24} strokeWidth={1.5} />
      <span>{target.label}</span>
    </button>
  );
}
