import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import './Button.css';

/* variant: primary (lime) | secondary (green outline) | outline (neutral outline)
   size:    large | medium
   Internal navigation → `to` (React Router, no page reload).
   External link       → `href` + `external` (new tab, ↗ icon).
   No destination or `disabled` → inert, dimmed. */
export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'large',
  external = false,
  disabled = false,
  fullWidth = false,
  className = '',
}) {
  const cls = `button button--${variant} button--${size} ${fullWidth ? 'button--full' : ''} t-button ${className}`;
  const content = (
    <>
      <span>{children}</span>
      {external && <Icon name="externalLink" size={18} className="button__icon" />}
    </>
  );

  if (disabled || (!to && !href)) {
    return <span className={`${cls} button--disabled`} aria-disabled="true">{content}</span>;
  }
  if (to) return <Link className={cls} to={to}>{content}</Link>;
  return (
    <a className={cls} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      {content}
      {external && <span className="sr-only"> (يفتح في تبويب جديد)</span>}
    </a>
  );
}
