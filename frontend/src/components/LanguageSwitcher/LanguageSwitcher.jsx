import Icon from '../Icon/Icon';
import { languageSwitch } from '../../data/site';
import './LanguageSwitcher.css';

/* Shows the language you can switch TO. The English site isn't built yet, so
   this is visual only for now — wire `onClick` when the EN version exists. */
export default function LanguageSwitcher({ fullWidth = false, onClick }) {
  return (
    <button
      type="button"
      className={`lang-switch t-label ${fullWidth ? 'lang-switch--full' : ''}`}
      lang={languageSwitch.lang}
      onClick={onClick}
      title="English version — coming soon"
    >
      <Icon name="globe" size={24} strokeWidth={1.5} />
      <span>{languageSwitch.label}</span>
    </button>
  );
}
