import { DESKTOP, MOBILE, BAND } from './networks';
import './CircuitPattern.css';

const traceById = Object.fromEntries(DESKTOP.traces.map(t => [t[0], t]));
const nodeById = Object.fromEntries(DESKTOP.nodes.map(n => [n[0], n]));

// A few traces carry the travelling "signal" (progressive enhancement, CSS only).
const SIGNAL_TRACES = new Set(['primary-inlet', 'north-trunk', 'east-main-reach', 'south-east-trunk', 'east-upper-split']);

function Network({ traces, nodes, signals }) {
  return (
    <>
      {traces.map(([id, d, kind]) => (
        <path key={id} data-id={id} d={d} pathLength="1" className={`circuit__trace ${kind === 'active' ? 'circuit__trace--active' : ''}`} />
      ))}
      {signals && traces.filter(([id]) => SIGNAL_TRACES.has(id)).map(([id, d], i) => (
        <path key={`s-${id}`} d={d} pathLength="1" className="circuit__signal" style={{ '--signal-delay': `${i * 1.7}s` }} />
      ))}
      {nodes.map(([id, cx, cy, r, kind], i) => (
        <circle key={id} data-id={id} cx={cx} cy={cy} r={r} className={`circuit__node circuit__node--${kind}`} style={{ '--node-delay': `${(i % 7) * 0.6}s` }} />
      ))}
    </>
  );
}

/* variant: 'desktop' (1440×420) | 'mobile' (375×614) | 'band' (CTA motif).
   Purely decorative — hidden from assistive tech. */
export default function CircuitPattern({ variant = 'desktop', animated = true, className = '' }) {
  const cls = `circuit circuit--${variant} ${animated ? 'circuit--animated' : ''} ${className}`;

  if (variant === 'mobile') {
    return (
      <svg className={cls} viewBox={`0 0 ${MOBILE.width} ${MOBILE.height}`} width={MOBILE.width} height={MOBILE.height} aria-hidden="true" focusable="false">
        {MOBILE.clusters.map(({ offset: [dx, dy], traces, nodes }, i) => (
          <g key={i} transform={`translate(${dx} ${dy})`}>
            <Network traces={traces.map(id => traceById[id])} nodes={nodes.map(id => nodeById[id])} signals={animated} />
          </g>
        ))}
      </svg>
    );
  }

  const net = variant === 'band' ? BAND : DESKTOP;
  return (
    <svg className={cls} viewBox={`0 0 ${net.width} ${net.height}`} width={net.width} height={net.height} aria-hidden="true" focusable="false">
      <Network traces={net.traces} nodes={net.nodes} signals={animated && variant === 'desktop'} />
    </svg>
  );
}
