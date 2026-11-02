import ComingSoon from '../../components/ComingSoon/ComingSoon';
import './TeamComingSoon.css';

/*
  Team "signal" — a team network assembling on a 560×360 grid. Seven unrevealed profile
  outlines (abstract, faceless: never stand-ins for real members) sit on a peer ring around one
  shared core, matching the Team motion's rule: a collaboration mesh, never an org chart.
  A signal travels the ring (45° chamfers, like the brand circuit) and lights each outline as
  it arrives (--at = where the ring reaches it). Brand colours only.
*/
const RING = 'M110 110L156 64H356L370 78L460 168V202L380 282L372 290H150L100 240V120Z';
// [x, y, share of the ring's ≈997 length at which the signal reaches it]
const PROFILES = [[110, 110, 0], [230, 64, 0.139], [370, 78, 0.286], [460, 170, 0.415], [380, 282, 0.561], [220, 290, 0.725], [100, 240, 0.866]];
const SPARKS = [[40, 60], [520, 50], [526, 300], [34, 318], [300, 20], [270, 342]];

function SignalArt() {
  return (
    <svg className="cs-art cs-team" viewBox="0 0 560 360" focusable="false">
      <defs>
        <pattern id="cs-team-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#16A66A" /></pattern>
        <radialGradient id="cs-team-halo"><stop offset="0" stopColor="#B6F23A" stopOpacity=".24" /><stop offset="1" stopColor="#B6F23A" stopOpacity="0" /></radialGradient>
        <radialGradient id="cs-team-core" cx=".5" cy=".4"><stop offset="0" stopColor="#0B3D2E" /><stop offset="1" stopColor="#101D2B" /></radialGradient>
      </defs>

      <rect className="cs-team__grid" width="560" height="360" fill="url(#cs-team-dots)" />
      {SPARKS.map(([x, y], i) => <circle key={`${x}-${y}`} className="cs-team__spark" style={{ '--i': i }} cx={x} cy={y} r="2" />)}

      {/* peer links: every outline also reaches the shared core */}
      <g className="cs-team__links" fill="none" strokeLinecap="round">
        {PROFILES.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y}L280 180`} />)}
      </g>
      <path className="cs-team__ring" d={RING} fill="none" strokeLinejoin="round" />

      {/* the travelling signal */}
      <g className="cs-team__signal" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="cs-team__signal-glow" d={RING} pathLength="1" />
        <path className="cs-team__signal-core" d={RING} pathLength="1" />
      </g>

      {/* shared core */}
      <circle className="cs-team__halo" cx="280" cy="180" r="92" fill="url(#cs-team-halo)" />
      <circle className="cs-team__core-orbit" cx="280" cy="180" r="50" fill="none" />
      <circle className="cs-team__core" cx="280" cy="180" r="36" fill="url(#cs-team-core)" />
      <g className="cs-team__core-mark" fill="none" strokeLinecap="round">
        <path d="M280 166L292 187H268Z" strokeLinejoin="round" />
        <circle cx="280" cy="166" r="4.5" /><circle cx="292" cy="187" r="4.5" /><circle cx="268" cy="187" r="4.5" />
      </g>

      {/* unrevealed profiles */}
      {PROFILES.map(([x, y, at]) => (
        <g key={`${x}-${y}`} className="cs-team__profile" style={{ '--at': at }} transform={`translate(${x} ${y})`}>
          <circle className="cs-team__profile-halo" r="38" />
          <circle className="cs-team__profile-badge" r="27" />
          <g className="cs-team__profile-figure" fill="none" strokeLinecap="round">
            <circle cx="0" cy="-6" r="7.5" />
            <path d="M-14 16C-14 6 -7 2 0 2C7 2 14 6 14 16" />
          </g>
        </g>
      ))}
    </svg>
  );
}

export default function TeamComingSoon() {
  return (
    <ComingSoon
      variant="team"
      art={<SignalArt />}
      title={['خلف كل ابتكار… فريق يصنع الفرق', 'Behind every innovation… a team that makes the difference']}
      description={[
        'نعمل على تجهيز مساحة نعرّفكم فيها بالعقول التي تقف خلف RoboTactic. تعرّفوا على فريقنا قريبًا.',
        'We are preparing a space to introduce you to the minds behind RoboTactic. Meet our team soon.',
      ]}
      action={{ to: '/about', label: ['تعرّف على الملتقى', 'About the forum'] }}
    />
  );
}
