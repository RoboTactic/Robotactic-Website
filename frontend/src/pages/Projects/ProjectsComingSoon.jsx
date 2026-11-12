import ComingSoon from '../../components/ComingSoon/ComingSoon';

/*
  Projects "showroom" — an exhibition floor on a 560×360 grid. A spotlit centre exhibit holds a
  robot-arm blueprint that a scan line keeps drafting; four reserved display slots wait on either
  side, each lit in turn by a pulse from the centre (the Projects motion: projects arriving on the
  floor, deliberately not the Competitions lap or the Workshops packets).
  Brand colours only: #101D2B, #0B3D2E, #16A66A, #B6F23A.
*/
// [slot x, slot y, trace from the centre exhibit to the slot]
const SLOTS = [
  [52, 72, 'M200 112H152'],
  [408, 72, 'M360 112H408'],
  [408, 176, 'M360 216H408'],
  [52, 176, 'M200 216H152'],
];
const SLOT_W = 100;
const SLOT_H = 80;
const LEADS = ['M102 72V46L118 30H176', 'M458 72V46L442 30H384'];

function ShowroomArt() {
  return (
    <svg className="cs-art cs-show" viewBox="0 0 560 360" focusable="false">
      <defs>
        <pattern id="cs-show-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#16A66A" /></pattern>
        <pattern id="cs-show-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#16A66A" strokeWidth=".6" /></pattern>
        <linearGradient id="cs-show-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B6F23A" stopOpacity=".22" /><stop offset="1" stopColor="#B6F23A" stopOpacity="0" /></linearGradient>
        <linearGradient id="cs-show-plinth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B3D2E" /><stop offset="1" stopColor="#101D2B" /></linearGradient>
        <clipPath id="cs-show-print"><rect x="216" y="100" width="128" height="128" rx="8" /></clipPath>
      </defs>

      <rect className="cs-show__dots" width="560" height="360" fill="url(#cs-show-dots)" />
      <path className="cs-show__beam" d="M262 0H298L360 88H200Z" fill="url(#cs-show-beam)" />
      {/* the floor sits low in the frame; the spotlight above reaches down to meet it */}
      <g transform="translate(0 24)">
      <path className="cs-show__floor" d="M40 292H520" />

      <g className="cs-show__leads" fill="none" strokeLinecap="round">
        {LEADS.map((d) => <path key={d} d={d} />)}
      </g>
      <circle className="cs-show__lead-end" cx="176" cy="30" r="3" />
      <circle className="cs-show__lead-end" cx="384" cy="30" r="3" />

      {/* reserved display slots, each answering a pulse from the centre */}
      {SLOTS.map(([x, y, trace], i) => (
        <g key={trace} className="cs-show__slot" style={{ '--i': i }}>
          <path className="cs-show__trace" d={trace} />
          <path className="cs-show__trace-pulse" d={trace} pathLength="1" />
          <rect className="cs-show__slot-frame" x={x} y={y} width={SLOT_W} height={SLOT_H} rx="12" />
          <rect className="cs-show__slot-media" x={x + 12} y={y + 12} width={SLOT_W - 24} height="30" rx="5" />
          <rect className="cs-show__slot-line" x={x + 12} y={y + 52} width="52" height="5" rx="2.5" />
          <rect className="cs-show__slot-line cs-show__slot-line--short" x={x + 12} y={y + 63} width="32" height="5" rx="2.5" />
        </g>
      ))}

      {/* centre exhibit: plinth, frame and the robot-arm blueprint */}
      <path className="cs-show__plinth" d="M216 264H344L366 292H194Z" fill="url(#cs-show-plinth)" />
      <rect className="cs-show__frame" x="200" y="64" width="160" height="200" rx="16" />
      <circle className="cs-show__port" cx="200" cy="112" r="3.5" />
      <circle className="cs-show__port" cx="360" cy="112" r="3.5" />
      <circle className="cs-show__port" cx="360" cy="216" r="3.5" />
      <circle className="cs-show__port" cx="200" cy="216" r="3.5" />
      <rect className="cs-show__tag" x="216" y="78" width="40" height="10" rx="5" />
      <circle className="cs-show__tag-dot" cx="336" cy="83" r="3.5" />

      <g clipPath="url(#cs-show-print)">
        <rect className="cs-show__print" x="216" y="100" width="128" height="128" fill="url(#cs-show-grid)" />
        <rect className="cs-show__scan" x="216" y="100" width="128" height="3" />
      </g>
      <rect className="cs-show__print-edge" x="216" y="100" width="128" height="128" rx="8" />
      <g className="cs-show__arm" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="cs-show__arm-base" d="M254 214H306L298 202H262Z" />
        <path d="M280 202L258 162L300 132" />
        <path d="M304 128L318 120M304 136L318 144" />
        <path className="cs-show__arm-dim" d="M330 132V202M326 132H334M326 202H334" />
      </g>
      <circle className="cs-show__joint" cx="280" cy="202" r="5.5" />
      <circle className="cs-show__joint" cx="258" cy="162" r="4.5" />
      <circle className="cs-show__joint cs-show__joint--tip" cx="300" cy="132" r="4" />
      <rect className="cs-show__caption" x="216" y="240" width="88" height="6" rx="3" />
      <rect className="cs-show__caption cs-show__caption--short" x="216" y="251" width="56" height="5" rx="2.5" />
      </g>
    </svg>
  );
}

export default function ProjectsComingSoon() {
  return (
    <ComingSoon
      variant="projects"
      art={<ShowroomArt />}
      title={['المعرض يتهيّأ لاستقبال أولى الابتكارات', 'The showroom is getting ready for its first innovations']}
      description={[
        'ستُعرض هنا مشاريع الفرق المشاركة فور اعتمادها ونشرها، لتتعرّفوا على أفكار تجمع الهندسة والبرمجة وروح الابتكار.',
        'Projects from participating teams will appear here once they are approved and published, showcasing ideas that bring engineering, programming and innovation together.',
      ]}
      action={{ to: '/competitions', label: ['استكشف المسابقات', 'Explore the competitions'] }}
    />
  );
}
