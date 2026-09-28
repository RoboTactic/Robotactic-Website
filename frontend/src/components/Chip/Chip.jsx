import './Chip.css';

/* tone: outline (green) | accent (lime) | brand (green fill) | live (red, with dot) */
export default function Chip({ children, tone = 'outline', dot = false, className = '' }) {
  return (
    <span className={`chip chip--${tone} t-caption ${className}`}>
      {dot && <span className="chip__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
