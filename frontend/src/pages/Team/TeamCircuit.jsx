import CircuitLayer, { REST } from '../../motion/CircuitLayer';
import { elbow } from '../../motion/geometry';

/*
  Team — collaboration network (never an org chart):
  a loose peer mesh in the header's empty side (peer → hub → peers, no hierarchy),
  a short bridge into the team area, and two branches converging on one shared
  endpoint before the Footer. No line touches a card, portrait or name.
*/
const DESKTOP_MIN = 768;

function compose(ctx) {
  const { q, rect, ink } = ctx;
  const hero = rect(q('.info-page__hero'));
  const panelEl = q('.info-page__panel');
  const panel = rect(panelEl);
  const heading = ink(q('.info-page__hero .section-heading'));
  if (!hero || !panel || !heading) return null;
  const heroB = hero.bottom;
  const body = rect(q('.info-page__body'));
  const stations = [];
  const pattern = rect(q('.info-page__pattern'));
  // Mesh lives in the header's empty side, clear of the header pattern and the copy.
  const box = { left: Math.max(body.left + 24, (pattern?.right ?? 0) + 40), right: heading.left - 64, top: hero.top + 36, bottom: heroB - 28 };
  const boxW = box.right - box.left;

  if (ctx.vw >= DESKTOP_MIN && boxW >= 220) {
    const w = Math.min(boxW, 520);
    const h = box.bottom - box.top;
    const at = (fx, fy) => [box.left + fx * w, box.top + fy * h];
    const p1 = at(0.06, 0.3);
    const hub = at(0.4, 0.62);
    const p3 = at(0.8, 0.28);
    const p4 = at(0.62, 0.95);
    const l1 = elbow(p1, hub);
    const l2 = elbow(hub, p3, true);
    const l3 = elbow(hub, p4, true);
    const bridge = [p4, [p4[0], panel.top - 18]];
    stations.push({
      key: 'mesh', trigger: panelEl,
      paths: [{ pts: l1 }, { pts: l2 }, { pts: l3 }, { pts: bridge, op: REST.continuity }],
      nodes: [
        { at: p1, r: 3.5, mark: 0 }, { at: hub, r: 5, mark: 'auto' }, { at: p3, r: 3.5, mark: 'auto' },
        { at: p4, r: 3.5, mark: 'auto' }, { at: [p4[0], panel.top - 14], r: 4, mark: 'auto' },
      ],
      signals: [l1, l2, [...l3, bridge[1]]],
    });
  } else {
    const y = heroB - 18;
    const inlet = [[0, y], [28, y], [46, y - 18], [92, y - 18]];
    const bridge = [[92, y - 18], [110, y], [110, panel.top - 18]];
    stations.push({
      key: 'mesh', trigger: panelEl,
      paths: [{ pts: inlet }, { pts: bridge, op: REST.continuity }, { pts: [[46, y - 18], [46, y - 34]] }],
      nodes: [{ at: [46, y - 18], r: 3.5, mark: 'auto' }, { at: [46, y - 37], r: 2.5, kind: 'dot' }, { at: [92, y - 18], r: 3.5, mark: 'auto' }, { at: [110, panel.top - 14], r: 4, mark: 'auto' }],
      signals: [[...inlet, ...bridge.slice(1)]],
    });
  }

  // Two contributions converge on one shared endpoint.
  const desktop = ctx.vw >= DESKTOP_MIN;
  const X = desktop ? panel.left + 140 : panel.left + 60;
  const y = panel.bottom + (desktop ? 34 : 28);
  const west = [[X - 64, panel.bottom + 12], [X - 42, y], [X - 7, y]];
  const east = [[X + 64, panel.bottom + 12], [X + 42, y], [X + 7, y]];
  stations.push({
    key: 'ending', trigger: panelEl, rootMargin: '0px 0px -30% 0px',
    paths: [{ pts: west }, { pts: east }], signals: [west, east],
    nodes: [{ at: [X, y], r: 6, kind: 'ring', pulse: true }],
  });
  return { stations };
}

export default function TeamCircuit({ rootRef }) {
  return <CircuitLayer rootRef={rootRef} compose={compose} />;
}
