export default function Button({
  children,
  href = '#',
  variant = 'primary',
  external = false,
  disabled = false,
}) {
  if (disabled || !href) {
    return <span className={`button button--${variant} button--disabled`}>{children}</span>;
  }

  return (
    <a
      className={`button button--${variant}`}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  );
}
