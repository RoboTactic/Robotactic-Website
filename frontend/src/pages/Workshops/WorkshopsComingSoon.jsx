import ComingSoon from '../../components/ComingSoon/ComingSoon';

/*
  Workshops "lab" — a knowledge core (chip with an open book) on a 560×360 grid sends data
  packets along 45° traces to six learning modules, which answer when a packet lands (the
  Workshops motion: knowledge/data transmission, deliberately not the Competitions lap).
  Brand colours only: #101D2B, #0B3D2E, #16A66A, #B6F23A.
*/
// [trace from the core to the module, module x, module y, glyph]
const MODULES = [
  ['M232 160H160L96 96', 96, 96, 'code'],
  ['M328 160H400L464 96', 464, 96, 'sensor'],
  ['M280 132V44', 280, 44, 'idea'],
  ['M328 200H400L464 264', 464, 264, 'gear'],
  ['M280 228V316', 280, 316, 'chip'],
  ['M232 200H160L96 264', 96, 264, 'arm'],
];
const PINS = [148, 164, 180, 196, 212];

const GLYPHS = {
  code: <path d="M-7 -7L-14 0L-7 7M7 -7L14 0L7 7M3 -10L-3 10" />,
  sensor: <><circle cx="-7" cy="0" r="2.5" className="cs-lab__glyph-fill" /><path d="M-2 -7A9 9 0 0 1 -2 7M3 -12A15 15 0 0 1 3 12" /></>,
  idea: <><path d="M-4 6V3C-8 1 -9 -3 -9 -5A9 9 0 0 1 9 -5C9 -3 8 1 4 3V6Z" /><path d="M-3 10H3" /></>,
  gear: <><circle r="7" strokeWidth="4" strokeDasharray="3.2 2.3" /><circle r="2.5" className="cs-lab__glyph-fill" /></>,
  chip: <><rect x="-7" y="-7" width="14" height="14" rx="2" /><path d="M-3 -11V-7M3 -11V-7M-3 7V11M3 7V11M-11 -3H-7M-11 3H-7M7 -3H11M7 3H11" /></>,
  arm: <><path d="M-11 11H11M-6 11V3L2 -5L9 0" /><circle cx="-6" cy="3" r="2" className="cs-lab__glyph-fill" /><circle cx="2" cy="-5" r="2" className="cs-lab__glyph-fill" /></>,
};

function LabArt() {
  return (
    <svg className="cs-art cs-lab" viewBox="0 0 560 360" focusable="false">
      <defs>
        <pattern id="cs-lab-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#16A66A" /></pattern>
        <radialGradient id="cs-lab-halo"><stop offset="0" stopColor="#16A66A" stopOpacity=".32" /><stop offset="1" stopColor="#16A66A" stopOpacity="0" /></radialGradient>
        <linearGradient id="cs-lab-core" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0B3D2E" /><stop offset="1" stopColor="#101D2B" /></linearGradient>
      </defs>

      <rect className="cs-lab__grid" width="560" height="360" fill="url(#cs-lab-dots)" />
      <circle className="cs-lab__halo" cx="280" cy="180" r="120" fill="url(#cs-lab-halo)" />
      <g className="cs-lab__orbits" fill="none">
        <circle className="cs-lab__orbit" cx="280" cy="180" r="104" />
        <circle className="cs-lab__orbit cs-lab__orbit--outer" cx="280" cy="180" r="150" />
      </g>

      <g className="cs-lab__traces" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {MODULES.map(([d]) => <path key={d} d={d} />)}
      </g>
      {/* packets: knowledge leaves the core one module at a time */}
      <g className="cs-lab__packets" fill="none" strokeLinecap="round">
        {MODULES.map(([d], i) => <path key={d} className="cs-lab__packet" style={{ '--i': i }} d={d} pathLength="1" />)}
      </g>

      {MODULES.map(([d, x, y, glyph], i) => (
        <g key={d} className="cs-lab__module" style={{ '--i': i }} transform={`translate(${x} ${y})`}>
          <circle className="cs-lab__module-ping" r="24" />
          <circle className="cs-lab__module-body" r="24" />
          <g className="cs-lab__glyph" fill="none" strokeLinecap="round" strokeLinejoin="round">{GLYPHS[glyph]}</g>
        </g>
      ))}

      {/* focal point: the knowledge core */}
      <g className="cs-lab__pins" strokeLinecap="round">
        {PINS.map((p) => <path key={`t${p}`} d={`M${p + 100} 124V132`} />)}
        {PINS.map((p) => <path key={`b${p}`} d={`M${p + 100} 228V236`} />)}
        {PINS.map((p) => <path key={`l${p}`} d={`M224 ${p}H232`} />)}
        {PINS.map((p) => <path key={`r${p}`} d={`M328 ${p}H336`} />)}
      </g>
      <rect className="cs-lab__core" x="232" y="132" width="96" height="96" rx="14" fill="url(#cs-lab-core)" />
      <path className="cs-lab__core-inner" d="M252 144H308L316 152V208L308 216H252L244 208V152Z" />
      <g className="cs-lab__book" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M280 170L264 164H254V198H264L280 204L296 198H306V164H296Z" />
        <path d="M280 170V204" />
        <path className="cs-lab__book-spark" d="M280 147V155M266 151L270 157M294 151L290 157" />
      </g>
    </svg>
  );
}

export default function WorkshopsComingSoon() {
  return (
    <ComingSoon
      variant="workshops"
      art={<LabArt />}
      title={['رحلتكم القادمة في عالم التقنية تبدأ قريبًا', 'Your next journey into technology begins soon']}
      description={[
        'نحضّر لكم ورشًا وتجارب تعليمية تفتح آفاقًا جديدة في عالم الروبوتات والتقنية والابتكار.',
        'We are preparing workshops and learning experiences that open new horizons in robotics, technology and innovation.',
      ]}
      action={{ to: '/projects', label: ['استكشف معرض المشاريع', 'Explore the project showroom'] }}
    />
  );
}
