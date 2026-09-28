import './SectionHeading.css';

/* Overline (Latin, lime + tick) → Arabic title → optional description. */
export default function SectionHeading({ overline, title, description, as: Tag = 'h2', size = 'h2', align = 'start', className = '' }) {
  return (
    <div className={`section-heading section-heading--${align} ${className}`}>
      {overline && (
        <p className="section-heading__overline">
          <span className="section-heading__tick" aria-hidden="true" />
          <span className="t-overline" lang="en">{overline}</span>
        </p>
      )}
      <Tag className={`section-heading__title t-${size}`}>{title}</Tag>
      {description && <p className="section-heading__description t-body">{description}</p>}
    </div>
  );
}
