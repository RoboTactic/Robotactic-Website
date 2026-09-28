/* Approved Home hero circuit network — exported from Figma
   `Pattern / Circuit · Desktop` (1440×420). Single source of truth:
   the mobile composition below is built from THIS data, not redrawn. */

export const DESKTOP = {
  width: 1440,
  height: 420,
  traces: [
    ['primary-inlet', 'M0 310H120L150 280H360L390 250H520'],
    ['primary-east-seed', 'M520 250H650'],
    ['primary-north-branch', 'M520 250V190L550 160H680'],
    ['central-rise', 'M650 250L700 200H880'],
    ['north-trunk', 'M680 160L730 110H930'],
    ['north-crown', 'M680 160V80L730 30H900'],
    ['east-trunk', 'M880 200L930 250H1100'],
    ['east-upper-split', 'M880 200L930 150H1100'],
    ['south-trunk', 'M650 250V330L700 380H900'],
    ['satellite-upper', 'M20 70H180L210 40H350'],
    ['upper-connector', 'M350 40L400 90H520L570 140H680'],
    ['satellite-lower', 'M0 360H180L210 330H390'],
    ['lower-connector', 'M390 330L430 290H520L560 250'],
    ['north-east-reach', 'M930 110L970 70H1160L1190 100H1360'],
    ['east-main-reach', 'M1100 250H1160L1200 210H1440'],
    ['east-lower-reach', 'M1100 250L1140 290H1300'],
    ['central-drop', 'M930 150V210'],
    ['crown-terminal', 'M900 30H970'],
    ['north-vertical', 'M1160 70V30H1250'],
    ['north-east-fork', 'M1190 100L1230 140H1390'],
    ['south-east-trunk', 'M900 380H970L1010 340H1180'],
    ['south-edge-fork', 'M1180 340L1220 380H1390'],
    ['south-north-fork', 'M1180 340L1240 280'],
    ['south-return', 'M700 380V320L760 260'],
    ['upper-drop', 'M520 90V130'],
    ['satellite-upper-drop', 'M210 40V100'],
    ['satellite-lower-drop', 'M390 330V390H500'],
    ['growth', 'M1300 290L1330 320H1410', 'active'],
  ],
  // [id, cx, cy, r, kind] — kind: 'hub' (ring), 'hollow', 'filled', 'core', 'active'
  nodes: [
    ['primary', 520, 250, 7.375, 'hub'], ['primary-core', 520, 250, 3, 'core'],
    ['primary-east', 650, 250, 4, 'filled'], ['primary-north', 680, 160, 3.875, 'hollow'],
    ['central-junction', 880, 200, 3.875, 'hollow'], ['north-junction', 930, 110, 3.875, 'hollow'],
    ['north-crown', 900, 30, 4, 'filled'], ['east-trunk', 1100, 250, 4, 'filled'],
    ['south-junction', 900, 380, 3.875, 'hollow'], ['satellite-upper', 350, 40, 3.875, 'hollow'],
    ['upper-link', 520, 90, 4, 'filled'], ['satellite-lower', 390, 330, 3.875, 'hollow'],
    ['lower-link', 520, 290, 4, 'filled'], ['north-east-mid', 1160, 70, 3.875, 'hollow'],
    ['north-east-terminal', 1360, 100, 3.875, 'hollow'], ['east-main', 1200, 210, 4, 'filled'],
    ['east-lower', 1300, 290, 3.875, 'hollow'], ['central-drop', 930, 210, 4, 'filled'],
    ['crown-terminal', 970, 30, 3.875, 'hollow'], ['north-terminal', 1250, 30, 3.875, 'hollow'],
    ['north-east-fork', 1390, 140, 4, 'filled'], ['south-east-junction', 1180, 340, 3.875, 'hollow'],
    ['south-edge-terminal', 1390, 380, 3.875, 'hollow'], ['south-north-terminal', 1240, 280, 3.875, 'hollow'],
    ['south-return', 760, 260, 4, 'filled'], ['upper-drop', 520, 130, 4, 'filled'],
    ['satellite-upper-drop', 210, 100, 3.875, 'hollow'], ['satellite-lower-drop', 500, 390, 3.875, 'hollow'],
    ['growth-tip', 1410, 320, 3, 'active'],
  ],
};

/* Figma `Pattern / Circuit · Mobile` (375×614): two crops of the SAME network
   at 1:1 scale, placed in the free corners beside the hero logo. Offsets and
   element lists come from the Figma component. */
export const MOBILE = {
  width: 375,
  height: 614,
  clusters: [
    {
      offset: [-464, -236],
      traces: ['primary-inlet', 'primary-east-seed', 'lower-connector', 'satellite-lower-drop'],
      nodes: ['primary', 'primary-core', 'primary-east', 'lower-link', 'satellite-lower-drop'],
    },
    {
      offset: [-604, -16],
      traces: ['east-trunk', 'east-upper-split', 'north-east-reach', 'central-drop', 'crown-terminal'],
      nodes: ['central-junction', 'north-junction', 'north-crown', 'central-drop', 'crown-terminal'],
    },
  ],
};

/* Small decorative motif used by the CTA band (Figma `Pattern / Circuit`). */
export const BAND = {
  width: 375,
  height: 240,
  traces: [
    ['b1', 'M375 40H300L276 64H210'], ['b2', 'M375 96H330L306 120H232'], ['b3', 'M0 200H70L94 176H160'],
    ['b4', 'M0 140H44L68 116H130'], ['b5', 'M250 0V30L226 54V110'], ['b6', 'M120 240V206L144 182V140'],
  ],
  nodes: [
    ['n1', 210, 64, 4.5, 'filled'], ['n2', 232, 120, 3.875, 'hollow'], ['n3', 160, 176, 4.5, 'filled'],
    ['n4', 130, 116, 3.875, 'hollow'], ['n5', 226, 110, 4.5, 'filled'], ['n6', 144, 140, 3.875, 'hollow'],
  ],
};
