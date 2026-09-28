import { ICONS } from './icons';

/* Decorative by default. Pass `label` when the icon carries meaning on its own. */
export default function Icon({ name, size = 24, strokeWidth = 1.75, label, className }) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} transform={`translate(${p.x} ${p.y})`} />
      ))}
    </svg>
  );
}
