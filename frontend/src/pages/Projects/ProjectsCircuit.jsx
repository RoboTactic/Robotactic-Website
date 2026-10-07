import CircuitLayer, { REST } from '../../motion/CircuitLayer';

/*
  Projects / Showroom — an innovation network being discovered:
  Header → discovery spark at «تصفّح المشاريع» → per row, a discovery node in the margin
  (alternating sides) branching toward the projects → a trunk under the last row whose
  branches rise toward each card (stopping short of it — never over images or text) →
  the trunk drops to the endpoint. Search/filter re-measure only; they never replay.
*/
const DESKTOP_MIN = 768; // Projects.css breakpoint

function compose(ctx) {
  const { W, q, qa, rect, ink } = ctx;
  const desktop = ctx.vw >= DESKTOP_MIN;
  const stations = [];

  // Discovery spark beside the section heading.
  const headingEl = q('#projects-browser-title');
  const h = ink(headingEl);
  if (h) {
    const x = h.left - 26;
    const y = h.cy;
    const reach = desktop ? 150 : Math.max(0, x - 24);
    const run = [[x, y], [x - reach, y]];
    stations.push({
      key: 'spark', trigger: headingEl, replay: false,
      paths: [
        { pts: run, op: REST.continuity },
        { pts: [[x + 3, y - 3], [x + 11, y - 11]] }, { pts: [[x + 3, y + 3], [x + 11, y + 11]] }, { pts: [[x, y - 4], [x, y - 14]] },
      ],
      nodes: [{ at: [x, y], r: 3.5, mark: 0 }, { at: [x - reach - 3, y], r: 2.5, kind: 'dot' }],
      signals: reach > 20 ? [run] : [],
    });
  }

  const cardEls = qa('.projects-grid > .project-card');
  const cards = cardEls.map(rect);
  const endBox = cards.length ? null : rect(q('.projects-empty'));
  if (cards.length) {
    const rows = [];
    cards.forEach((r, i) => {
      const row = rows.find((g) => Math.abs(cards[g[0]].top - r.top) < 4);
      if (row) row.push(i); else rows.push([i]);
    });
    const left = Math.min(...cards.map((r) => r.left));
    const margin = left;

    rows.forEach((row, n) => {
      const last = n === rows.length - 1;
      const reveal = row.map((i, k) => ({ el: cardEls[i], mark: last && desktop ? 'auto' : 0.6, at: [cards[i].cx, cards[i].bottom + 30], delay: last && desktop ? 0 : k * 80 }));
      if (!desktop) { stations.push({ key: `row-${n}`, trigger: cardEls[row[0]], reveal }); return; }

      if (last) {
        // Trunk under the last row: right → left, branches rise toward each card, then drop to the endpoint.
        const y = Math.max(...row.map((i) => cards[i].bottom)) + 32;
        const xs = row.map((i) => cards[i].cx);
        const startX = Math.max(...xs) + 40;
        const endX = Math.min(...xs) - 60;
        const trunk = [[startX, y], [endX, y], [endX - 20, y + 20], [endX - 70, y + 20]];
        const branches = row.map((i) => [[cards[i].cx, y], [cards[i].cx, cards[i].bottom + 12]]);
        stations.push({
          key: 'network', trigger: cardEls[row[0]], dur: 700,
          paths: [{ pts: trunk }, ...branches.map((pts) => ({ pts }))],
          nodes: [
            { at: [startX + 3, y], r: 2.5, kind: 'dot' },
            ...row.map((i) => ({ at: [cards[i].cx, cards[i].bottom + 9], r: 3, mark: 'auto' })),
            { at: [endX - 76, y + 20], r: 5.5, kind: 'ring', pulse: true },
          ],
          signals: [trunk],
          reveal: row.map((i) => ({ el: cardEls[i], at: [cards[i].cx, y], mark: 'auto', delay: 0 })),
        });
        return;
      }
      // Discovery node in the margin, alternating sides, branching toward the row.
      if (margin < 72) { stations.push({ key: `row-${n}`, trigger: cardEls[row[0]], reveal }); return; }
      const y = cards[row[0]].top + cards[row[0]].height * 0.62;
      const fromLeft = n % 2 === 1;
      const edge = fromLeft ? left : Math.max(...row.map((i) => cards[i].right));
      const dir = fromLeft ? -1 : 1;
      const branch = [[edge + dir * (margin - 24), y - 24], [edge + dir * (margin - 48), y], [edge + dir * 16, y]];
      stations.push({
        key: `row-${n}`, trigger: cardEls[row[0]],
        paths: [{ pts: branch }],
        nodes: [{ at: branch[0], r: 4, mark: 0 }, { at: [edge + dir * 12, y], r: 2.5, kind: 'dot' }],
        signals: [branch], reveal,
      });
    });

    if (!desktop) {
      const bottom = Math.max(...cards.map((r) => r.bottom));
      const run = [[W, bottom + 26], [W - 40, bottom + 26], [W - 58, bottom + 44]];
      stations.push({ key: 'ending', trigger: q('.rt-end'), rootMargin: '0px 0px -6% 0px', paths: [{ pts: run }], signals: [run], nodes: [{ at: [W - 62, bottom + 48], r: 5, kind: 'ring', pulse: true }] });
    }
  } else if (endBox) {
    const run = [[endBox.left + 60, endBox.bottom + 14], [endBox.left + 60, endBox.bottom + 30], [endBox.left + 76, endBox.bottom + 46]];
    stations.push({ key: 'ending', trigger: q('.rt-end'), paths: [{ pts: run }], signals: [run], nodes: [{ at: [endBox.left + 80, endBox.bottom + 50], r: 5, kind: 'ring', pulse: true }] });
  }
  return { stations };
}

export default function ProjectsCircuit({ rootRef, signature }) {
  return <CircuitLayer rootRef={rootRef} compose={compose} deps={[signature]} settleOnChange />;
}
