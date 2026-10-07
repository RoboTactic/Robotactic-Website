import CircuitLayer, { REST } from '../../motion/CircuitLayer';
import { lengthOf, segLength } from '../../motion/geometry';

/*
  Timeline — progression signal (the strongest scroll example).
  Header exit → one fragment per day station → milestone nodes → event reveal →
  gap → next fragment from the other side → … → final open endpoint.
  Geometry only; motion/queue/reduced-motion come from the shared CircuitLayer.
*/
const DESKTOP_MIN = 700; // matches the Timeline.css breakpoint

function compose(ctx, stations, refs) {
  const list = refs.listRef.current;
  const hero = refs.heroRef.current;
  if (!list || !hero || !stations.length) return null;
  const lis = [...list.querySelectorAll('.timeline-item')];
  if (!lis.length) return null;
  const items = lis.map((li) => ({
    li, item: ctx.rect(li), nodeEl: li.querySelector('.timeline-item__node'),
    node: ctx.rect(li.querySelector('.timeline-item__node')),
    card: li.querySelector('.timeline-item__card'), when: li.querySelector('.timeline-item__when'),
  }));
  const desktop = ctx.vw >= DESKTOP_MIN;
  const { W } = ctx;
  const listBox = ctx.rect(list);
  const heroB = ctx.rect(hero).bottom;
  const pills = refs.summaryRef.current ? [...refs.summaryRef.current.children].map(ctx.rect) : [];
  const pillsLeft = pills.length ? Math.min(...pills.map((r) => r.left)) : listBox.right;
  const cx = items[0].node.cx;
  const cy = (i) => items[i].node.cy;
  let ambient = null;
  const out = [];

  stations.forEach((idx, s) => {
    const a = idx[0];
    const b = idx[idx.length - 1];
    const top0 = items[a].item.top;
    const pts = [];
    const extras = [];
    const branches = [];
    const marks = [];
    let continuity = false;

    if (desktop) {
      if (s === 0) {
        const sx = Math.min(cx - 120, pillsLeft - 40);
        const hx = Math.max(16, sx - 220);
        const head = [[hx, heroB - 28], [sx - 28, heroB - 28], [sx, heroB]];
        ambient = { pts: head, host: hero };
        extras.push({ at: head[0], r: 3, kind: 'dot' });
        pts.push(...head, [sx, top0 - 32], [cx - 32, top0 - 32], [cx, top0], [cx, cy(a)]);
        continuity = true;
      } else {
        const dir = s % 2 ? -1 : 1; // odd: card side, even: time side
        const start = [cx + dir * 150, top0 - 32];
        extras.push({ at: start, r: 3, kind: 'dot' });
        pts.push(start, [cx + dir * 32, top0 - 32], [cx, top0], [cx, cy(a)]);
      }
      marks.push(pts.length - 1);
      for (let j = a; j < b; j += 1) {
        const J = s % 2 ? 24 : 36;
        const y1 = cy(j);
        const y2 = cy(j + 1);
        pts.push([cx, y1 + 14], [cx + J, y1 + 14 + J], [cx + J, y2 - 18 - J], [cx, y2 - 18], [cx, y2]);
        marks.push(pts.length - 1);
        if (y2 - y1 > 220) {
          const m = (y1 + y2) / 2;
          branches.push([[cx + J, m], [cx + J + 18, m - 18]]);
          extras.push({ at: [cx + J + 20, m - 20], r: 2.5, kind: 'dot' });
        }
      }
      if (s < stations.length - 1) {
        pts.push([cx, cy(b) + 30], [cx + 14, cy(b) + 44]);
        extras.push({ at: [cx + 16, cy(b) + 46], r: 2.5, kind: 'dot' });
      }
    } else {
      if (s === 0) {
        const x0 = listBox.left + 20;
        const head = [[x0, heroB - 22], [x0, top0 - 30], [x0 + 14, top0 - 16]];
        ambient = { pts: head, host: hero };
        pts.push(...head);
        extras.push({ at: head[0], r: 3, kind: 'dot' }, { at: [x0 + 16, top0 - 14], r: 2.5, kind: 'dot' });
        continuity = true;
      } else if (s % 2) {
        pts.push([W, top0 - 24], [cx + 24, top0 - 24], [cx, top0], [cx, cy(a) - 9]);
      } else {
        pts.push([0, top0 - 30], [30, top0 - 30], [44, top0 - 16]);
        extras.push({ at: [46, top0 - 14], r: 2.5, kind: 'dot' });
      }
      idx.forEach(() => marks.push(pts.length - 1));
    }

    // Cumulative length at each milestone vertex → when its node activates / its card reveals.
    const total = lengthOf(pts) || 1;
    const at = [0];
    for (let i = 1; i < pts.length; i += 1) at.push(at[i - 1] + segLength(pts[i - 1], pts[i]));
    const reveal = [];
    const domNodes = [];
    idx.forEach((i, j) => {
      const mark = at[marks[j]] / total;
      domNodes.push({ el: items[i].nodeEl, mark });
      reveal.push({ el: items[i].card, mark, delay: j * 80 }, { el: items[i].when, mark, delay: j * 80 });
    });

    out.push({
      key: `day-${s}`,
      trigger: items[a].li,
      paths: [{ pts, op: continuity ? REST.continuity : REST.trace }, ...branches.map((p) => ({ pts: p }))],
      nodes: extras,
      signals: [pts],
      reveal,
      domNodes,
    });
  });

  // Final fragment → hollow endpoint before the footer.
  const last = items.length - 1;
  const endY = listBox.bottom;
  let endPts;
  let ring;
  if (desktop) {
    endPts = [[cx, cy(last)], [cx, endY + 12], [cx + 28, endY + 40], [cx + 58, endY + 40]];
    ring = [cx + 65, endY + 40];
  } else if ((stations.length - 1) % 2) {
    endPts = [[0, endY + 28], [40, endY + 28], [62, endY + 50]];
    ring = [66, endY + 54];
  } else {
    endPts = [[W, endY + 28], [cx + 24, endY + 28], [cx, endY + 52]];
    ring = [cx, endY + 59];
  }
  out.push({
    key: 'ending', trigger: refs.endRef.current,
    paths: [{ pts: endPts }], signals: [endPts],
    nodes: [{ at: ring, r: 6, kind: 'ring', pulse: true }],
  });
  return { stations: out, ambient };
}

export default function TimelineCircuit({ pageRef, stations, ...refs }) {
  const key = stations.map((s) => s.join('.')).join('|');
  return <CircuitLayer rootRef={pageRef} deps={[key]} compose={(ctx) => compose(ctx, stations, refs)} />;
}
