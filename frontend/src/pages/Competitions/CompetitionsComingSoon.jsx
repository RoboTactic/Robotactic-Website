import ComingSoon from '../../components/ComingSoon/ComingSoon';

/*
  Competitions "arena" — a top-down robotics arena on a 560×360 grid (45° chamfers, like the
  brand circuit). A lime signal laps the circuit track and lights each checkpoint as it passes
  (the Competitions motion: one signal along a bus); the robot waits on the central podium.
  Brand colours only: #101D2B, #0B3D2E, #16A66A, #B6F23A.
*/
const ARENA = 'M120 36H440L524 120V240L440 324H120L36 240V120Z';
const TRACK = 'M150 90H410L470 150V210L410 270H150L90 210V150Z';
const PODIUM = 'M280 130L323 155V205L280 230L237 205V155Z';
const PODIUM_INNER = 'M280 142L313 161V199L280 218L247 199V161Z';
const SPOKES = ['M237 180H118', 'M323 180H442', 'M280 130V108'];
// Checkpoints on the track, with where the lap reaches them (fraction of its ≈979 length).
const CHECKPOINTS = [[150, 90, 0], [410, 90, 0.266], [470, 180, 0.383], [410, 270, 0.5], [150, 270, 0.766], [90, 180, 0.883]];
const PYLONS = [[78, 78], [482, 78], [482, 282], [78, 282]];

function ArenaArt() {
  return (
    <svg className="cs-art cs-arena" viewBox="0 0 560 360" focusable="false">
      <defs>
        <pattern id="cs-arena-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#16A66A" /></pattern>
        <radialGradient id="cs-arena-halo"><stop offset="0" stopColor="#B6F23A" stopOpacity=".28" /><stop offset="1" stopColor="#B6F23A" stopOpacity="0" /></radialGradient>
        <linearGradient id="cs-arena-podium" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B3D2E" /><stop offset="1" stopColor="#101D2B" /></linearGradient>
      </defs>

      <rect className="cs-arena__grid" width="560" height="360" fill="url(#cs-arena-dots)" />
      <path className="cs-arena__wall" d={ARENA} />
      {PYLONS.map(([x, y], i) => (
        <rect key={x + y} className="cs-arena__pylon" style={{ '--i': i }} x={x - 5} y={y - 5} width="10" height="10" rx="2" transform={`rotate(45 ${x} ${y})`} />
      ))}

      <g fill="none" strokeLinejoin="round">
        <path className="cs-arena__track-edge" d={TRACK} />
        <path className="cs-arena__track-bed" d={TRACK} />
        <path className="cs-arena__track-lane" d={TRACK} />
      </g>

      {/* start / finish gate across the top straight */}
      <g className="cs-arena__gate">
        <path d="M280 74V106" />
        {[0, 1, 2, 3].map((n) => <rect key={n} x={n % 2 ? 284 : 288} y={76 + n * 7} width="4" height="4" />)}
      </g>

      <g className="cs-arena__spokes" fill="none" strokeLinecap="round">
        {SPOKES.map((d) => <path key={d} d={d} />)}
        {SPOKES.map((d) => <path key={`p${d}`} className="cs-arena__spoke-pulse" d={d} pathLength="1" />)}
      </g>

      {/* the lap: a glow and a core dash travelling the same track */}
      <g className="cs-arena__lap" fill="none" strokeLinecap="round">
        <path className="cs-arena__lap-glow" d={TRACK} pathLength="1" />
        <path className="cs-arena__lap-core" d={TRACK} pathLength="1" />
      </g>

      {CHECKPOINTS.map(([x, y, at]) => (
        <g key={`${x}-${y}`} className="cs-arena__checkpoint" style={{ '--at': at }}>
          <circle className="cs-arena__checkpoint-halo" cx={x} cy={y} r="13" />
          <circle className="cs-arena__checkpoint-core" cx={x} cy={y} r="5.5" />
        </g>
      ))}

      {/* focal point: the robot on its podium */}
      <circle className="cs-arena__halo" cx="280" cy="180" r="86" fill="url(#cs-arena-halo)" />
      <path className="cs-arena__podium" d={PODIUM} fill="url(#cs-arena-podium)" />
      <path className="cs-arena__podium-inner" d={PODIUM_INNER} />
      <g className="cs-arena__robot">
        <path className="cs-arena__robot-line" d="M280 163V151" />
        <circle className="cs-arena__robot-led" cx="280" cy="148" r="3.5" />
        <rect className="cs-arena__robot-ear" x="251" y="174" width="5" height="12" rx="2" />
        <rect className="cs-arena__robot-ear" x="304" y="174" width="5" height="12" rx="2" />
        <rect className="cs-arena__robot-head" x="257" y="163" width="46" height="34" rx="10" />
        <circle className="cs-arena__robot-eye" cx="271" cy="180" r="4.5" />
        <circle className="cs-arena__robot-eye" cx="289" cy="180" r="4.5" />
      </g>
    </svg>
  );
}

export default function CompetitionsComingSoon() {
  return (
    <ComingSoon
      variant="competitions"
      art={<ArenaArt />}
      title={['الميدان يستعد لاستقبال التحدي القادم', 'The arena is getting ready for the next challenge']}
      description={[
        'نجهّز لكم تجارب تنافسية تجمع الإبداع والهندسة وروح التحدي. ترقبوا الإعلان عن المنافسات القادمة.',
        'We are preparing competitive experiences that bring together creativity, engineering and the spirit of challenge. Stay tuned for the upcoming competitions.',
      ]}
      action={{ to: '/timeline', label: ['تابع الجدول الزمني', 'Follow the timeline'] }}
    />
  );
}
