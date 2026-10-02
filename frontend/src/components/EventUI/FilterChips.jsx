import './EventControls.css';

export default function FilterChips({ items, selectedId, onSelect, ariaLabel, className = '', onItemClick }) {
  const classes = ['event-filter-chips', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <button key={item.id} type="button" className={selectedId === item.id ? 'is-active' : ''}
          aria-pressed={selectedId === item.id} onClick={(event) => {
            onSelect(item.id);
            onItemClick?.(item, event);
          }}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
