import './EventControls.css';

export default function SectionHeading({ id, children, className = '' }) {
  const classes = ['event-section-heading', className].filter(Boolean).join(' ');
  return <h2 id={id} className={classes}>{children}</h2>;
}
