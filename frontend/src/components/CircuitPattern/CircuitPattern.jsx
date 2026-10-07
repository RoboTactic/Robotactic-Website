import { useEffect, useRef } from 'react';
import { DESKTOP, MOBILE, BAND } from './networks';
import './CircuitPattern.css';

const traceById = Object.fromEntries(DESKTOP.traces.map(t => [t[0], t]));
const nodeById = Object.fromEntries(DESKTOP.nodes.map(n => [n[0], n]));

// Hero ambient: one active route (Motion System: a single head; no other loops on the page).
const SIGNAL_TRACES = new Set(['primary-inlet']);

function Network({ traces, nodes, signals }) {
  return (
    <>
      {traces.map(([id, d, kind]) => (
        <path key={id} data-id={id} d={d} pathLength="1" className={`circuit__trace ${kind === 'active' ? 'circuit__trace--active' : ''}`} />
      ))}
      {signals && traces.filter(([id]) => SIGNAL_TRACES.has(id)).map(([id, d], i) => (
        <path key={`s-${id}`} d={d} pathLength="1" className="circuit__signal" style={{ '--signal-delay': `${0.8 + i * 4.5}s` }} />
      ))}
      {nodes.map(([id, cx, cy, r, kind]) => (
        <circle key={id} data-id={id} cx={cx} cy={cy} r={r} className={`circuit__node circuit__node--${kind}`} />
      ))}
    </>
  );
}

/* variant: 'desktop' (1440×420) | 'mobile' (375×614) | 'band' (CTA motif).
   Purely decorative — hidden from assistive tech. */
/* Pause the ambient signal while off-screen or while the tab is hidden (CSS also pauses it
   while a section signal runs: html.rt-busy). */
function usePauseWhenHidden(ref, enabled) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || !('IntersectionObserver' in window)) return undefined;
    let visible = true;
    const sync = () => el.classList.toggle('is-paused', !visible || document.hidden);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [ref, enabled]);
}

export default function CircuitPattern({ variant = 'desktop', animated = true, className = '' }) {
  const ref = useRef(null);
  usePauseWhenHidden(ref, animated);
  const cls = `circuit circuit--${variant} ${animated ? 'circuit--animated' : ''} ${className}`;

  if (variant === 'mobile') {
    return (
      <svg ref={ref} className={cls} viewBox={`0 0 ${MOBILE.width} ${MOBILE.height}`} width={MOBILE.width} height={MOBILE.height} aria-hidden="true" focusable="false">
        {MOBILE.clusters.map(({ offset: [dx, dy], traces, nodes }, i) => (
          <g key={i} transform={`translate(${dx} ${dy})`}>
            <Network traces={traces.map(id => traceById[id])} nodes={nodes.map(id => nodeById[id])} signals={animated && i === 0} />
          </g>
        ))}
      </svg>
    );
  }

  const net = variant === 'band' ? BAND : DESKTOP;
  const svg = (
    <svg ref={ref} className={cls} viewBox={`0 0 ${net.width} ${net.height}`} width={net.width} height={net.height} aria-hidden="true" focusable="false">
      <Network traces={net.traces} nodes={net.nodes} signals={animated && variant === 'desktop'} />
    </svg>
  );
  if (variant !== 'desktop') return svg;

  // Figma `Pattern / Circuit · Desktop — Readability Fade`: page-coloured, 86%, 48px
  // layer blur at x720 y0 636×366 — dims the traces on the copy side of the hero.
  return (
    <div className="circuit-frame" aria-hidden="true">
      {svg}
      <span className="circuit__fade" />
    </div>
  );
}
