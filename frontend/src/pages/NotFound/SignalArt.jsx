import { forwardRef } from 'react';

/*
  "404 — SIGNAL LOST" artwork. Hand-built circuit glyphs on a 900×340 grid (45° chamfers,
  like the brand circuit pattern). The zero is an open loop: its right trace stops at
  two facing nodes (A above, B below) — the signal arrives at B and cannot cross.
  Brand colours only: #101D2B, #0B3D2E, #16A66A, #B6F23A.
*/
const FOUR_L = 'M200 300V40L80 180V210H250';
const FOUR_R = 'M780 300V40L660 180V210H830';
const ZERO = 'M550 168V258L508 300H392L350 258V82L392 40H508L550 82V118';
const ZERO_INNER = 'M534 166V250L500 284H400L366 250V90L400 56H500L534 90V120';
// The travelling signal: inlet → bar of the first 4 → bridge → around the zero → node B.
export const SIGNAL = 'M10 210H350V258L392 300H508L550 258V168';
const BRIDGE = 'M250 210H350';
const INLET = 'M10 210H80';
const OUTLET = 'M830 210H890';
const STUBS = ['M200 120H228L240 108', 'M140 110L118 88H100', 'M780 250H812L824 262', 'M720 110L742 88H760', 'M450 300V322', 'M392 40L378 26H360'];

// Interactive nodes [x, y, r, kind]; A/B are the disconnected ends of the zero.
export const NODES = [
  [10, 210, 4, 'dot'], [200, 40, 6, 'ring'], [200, 300, 7, 'ring'], [250, 210, 5, 'dot'], [80, 180, 4, 'dot'],
  [240, 108, 4, 'dot'], [100, 88, 3.5, 'dot'], [392, 40, 4, 'pad'], [508, 40, 4, 'pad'], [392, 300, 4, 'pad'],
  [508, 300, 4, 'pad'], [450, 322, 4, 'dot'], [360, 26, 3.5, 'dot'], [780, 40, 6, 'ring'], [780, 300, 7, 'ring'],
  [830, 210, 5, 'dot'], [660, 180, 4, 'dot'], [824, 262, 4, 'dot'], [760, 88, 3.5, 'dot'], [890, 210, 4, 'dot'],
];

const SignalArt = forwardRef(function SignalArt({ run, state }, ref) {
  return (
    <svg ref={ref} className={`nf-art nf-art--${state}`} viewBox="0 0 900 340" role="img" aria-labelledby="nf-art-title" focusable="false">
      <title id="nf-art-title">404</title>
      <defs>
        <filter id="nf-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        <linearGradient id="nf-trace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16A66A" /><stop offset="1" stopColor="#0B3D2E" />
        </linearGradient>
      </defs>

      {/* ghost layer: the composition is legible before (and without) any motion */}
      <g className="nf-ghost" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[FOUR_L, ZERO, FOUR_R].map((d) => <path key={d} d={d} />)}
      </g>

      {/* powered glyphs */}
      <g className="nf-glyphs" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g className="nf-glow" filter="url(#nf-blur)">{[FOUR_L, ZERO, FOUR_R].map((d) => <path key={d} d={d} pathLength="1" />)}</g>
        <g className="nf-body">{[FOUR_L, ZERO, FOUR_R].map((d) => <path key={d} d={d} pathLength="1" />)}</g>
        <g className="nf-ridge">{[FOUR_L, ZERO, FOUR_R].map((d) => <path key={d} d={d} pathLength="1" />)}</g>
        <path className="nf-inner-trace" d={ZERO_INNER} pathLength="1" />
        <g className="nf-wires">{[BRIDGE, INLET, OUTLET, ...STUBS].map((d) => <path key={d} d={d} pathLength="1" />)}</g>
      </g>

      {/* the break in the loop */}
      <g className="nf-gap">
        <path className="nf-spark" d="M550 128l-7 7 7 8-7 7 7 8" fill="none" />
        <path className="nf-bridge" d="M550 125V161" pathLength="1" fill="none" />
        <circle className="nf-gap-ping" cx="550" cy="168" r="9" />
        <circle className="nf-gap-node nf-gap-node--a" cx="550" cy="118" r="7" />
        <circle className="nf-gap-node nf-gap-node--b" cx="550" cy="168" r="7" />
      </g>

      {/* nodes (pointer-reactive on desktop, ambient on touch) */}
      <g className="nf-nodes">
        {NODES.map(([x, y, r, kind], index) => (
          <g key={`${x}-${y}`} className={`nf-node nf-node--${kind}`} style={{ '--i': index }}>
            <circle className="nf-node-halo" cx={x} cy={y} r={r * 3.2} />
            {kind === 'pad'
              ? <rect className="nf-node-core" x={x - r} y={y - r} width={r * 2} height={r * 2} rx="1.5" transform={`rotate(45 ${x} ${y})`} />
              : <circle className="nf-node-core" cx={x} cy={y} r={r} />}
          </g>
        ))}
      </g>

      {/* travelling signal — remounted (key) to replay on reconnect */}
      <g key={run} className="nf-signal" fill="none" strokeLinecap="round">
        <path className="nf-signal-glow" d={SIGNAL} pathLength="1" filter="url(#nf-blur)" />
        <path className="nf-signal-core" d={SIGNAL} pathLength="1" />
      </g>
    </svg>
  );
});

export default SignalArt;
