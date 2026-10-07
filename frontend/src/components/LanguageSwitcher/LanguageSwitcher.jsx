import Icon from '../Icon/Icon';
import { languageSwitch } from '../../data/site';
import './LanguageSwitcher.css';

/* The public English version is not available yet. Keep the control disabled
   until a real language switch handler is provided. */
export default function LanguageSwitcher({ fullWidth = false, onClick }) {
  return (
    <button
      type="button"
      className={`lang-switch t-label ${fullWidth ? 'lang-switch--full' : ''}`}
      lang={languageSwitch.lang}
      onClick={onClick}
      disabled={!onClick}
      aria-label={onClick ? languageSwitch.label : 'English version — coming soon'}
      title={onClick ? undefined : 'English version — coming soon'}
    >
      <Icon name="globe" size={24} strokeWidth={1.5} />
      <span>{languageSwitch.label}</span>
    </button>
  );
}
