import CircuitLayer, { REST } from '../../motion/CircuitLayer';

/*
  Workshops — knowledge / data transmission (deliberately not the Competitions bus):
  Header → feed into the day filter → (day heading) → per row, data packets hop
  card → card across the gaps at the date/time panel, entering from one margin and
  handing off at the other → endpoint. A filter change never replays the journey.
  Mobile: tiny links between stacked sessions, alternating sides — no rail.
*/
const DESKTOP_MIN = 768; // Workshops.css breakpoint

function compose(ctx) {
  const { W, q, qa, rect, ink } = ctx;
  const desktop = ctx.vw >= DESKTOP_MIN;
  const stations = [];
  const chipsEl = q('.workshops-filters__list');
  const chips = chipsEl ? [...chipsEl.querySelectorAll('button')].map(rect).filter(Boolean) : [];
  const cardEls = qa('.workshops-grid > .workshop-card');
  const cards = cardEls.map(rect);
  const metaY = (i) => rect(cardEls[i].querySelector('.workshop-card__meta'))?.cy ?? cards[i].cy;

  // Filter feed
  if (chips.length) {
    let feed;
    let rx;
    let ry;
    if (desktop) {
      const left = Math.min(...chips.map((r) => r.left));
      const y = chips[0].cy;
      rx = left - 24;
      ry = y;
      feed = left - 300 > 40
        ? [[0, y + 20], [left - 300, y + 20], [left - 280, y], [rx, y]]
        : [[0, y + 20], [Math.max(8, left - 64), y + 20], [Math.max(28, left - 44), y], [rx, y]];
    } else {
      const bottom = rect(chipsEl).bottom;
      ry = bottom + 12;
      rx = 64;
      feed = [[0, ry], [rx, ry]];
    }
    stations.push({
      key: 'feed', trigger: chipsEl, replay: false,
      paths: [{ pts: feed, op: REST.continuity }],
      nodes: [{ at: [rx + 4, ry], r: 4, mark: 'auto' }],
      signals: [feed],
    });
  }

  // Day heading (only when one day is selected): the stream arrives at that day.
  const dayEl = q('.workshops-results__day');
  const day = ink(dayEl);
  if (day && desktop) {
    const y = day.cy;
    const pts = [[day.left - 112, y], [day.left - 20, y]];
    stations.push({ key: 'day', trigger: dayEl, paths: [{ pts }], nodes: [{ at: pts[0], r: 2.5, kind: 'dot' }, { at: [day.left - 16, y], r: 3.5, mark: 'auto' }], signals: [pts], packet: true });
  }

  if (cards.length) {
    if (desktop) {
      const rows = [];
      cards.forEach((r, i) => {
        const row = rows.find((g) => Math.abs(cards[g[0]].top - r.top) < 4);
        if (row) row.push(i); else rows.push([i]);
      });
      rows.forEach((row, n) => {
        const segs = [];
        const nodes = [];
        const first = cards[row[0]];
        const last = cards[row[row.length - 1]];
        const mIn = W - first.right;
        const stubIn = Math.min(44, mIn - 8);
        if (stubIn >= 12) {
          const y = metaY(row[0]);
          segs.push([[first.right + stubIn, y], [first.right + 4, y]]);
          nodes.push({ at: [first.right + stubIn + 3, y], r: 2.5, kind: 'dot' });
        }
        for (let k = 0; k + 1 < row.length; k += 1) {
          const a = cards[row[k]];
          const b = cards[row[k + 1]];
          const y = (metaY(row[k]) + metaY(row[k + 1])) / 2;
          segs.push([[a.left - 3, y], [b.right + 3, y]]);
          nodes.push({ at: [(a.left + b.right) / 2, y], r: 2.5, mark: 'auto' });
        }
        const stubOut = Math.min(44, last.left - 8);
        if (stubOut >= 12) { // hand-off into the margin; the stream reappears on the next row
          const y = metaY(row[row.length - 1]);
          const d = Math.min(16, stubOut / 2);
          segs.push([[last.left - 4, y], [last.left - stubOut + d, y], [last.left - stubOut, y + d]]);
          nodes.push({ at: [last.left - stubOut - 2, y + d + 2], r: 3, mark: 'auto' });
        }
        stations.push({
          key: `row-${n}`, trigger: cardEls[row[0]], packet: true, dur: 640,
          paths: segs.map((pts) => ({ pts, op: 0.38 })),
          nodes,
          signals: segs,
          reveal: row.map((i) => ({ el: cardEls[i], at: [cards[i].right - 8, metaY(i)], mark: 'auto', delay: 0 })),
        });
      });
    } else {
      cardEls.forEach((el, i) => {
        if (i === 0) { stations.push({ key: 'card-0', trigger: el, reveal: [{ el, mark: 0 }] }); return; }
        const prev = cards[i - 1];
        const cur = cards[i];
        const x = i % 2 ? cur.left + 48 : cur.right - 48;
        const link = [[x, prev.bottom + 2], [x, cur.top - 2]];
        stations.push({ key: `card-${i}`, trigger: el, packet: true, dur: 450, paths: [{ pts: link, op: 0.45 }], signals: [link], reveal: [{ el, mark: 0.7 }] });
      });
    }
  }

  // Endpoint below the sessions (or the empty state).
  const endBox = cards.length ? { left: Math.min(...cards.map((r) => r.left)), bottom: Math.max(...cards.map((r) => r.bottom)) } : rect(q('.workshops-empty'));
  if (endBox) {
    let run;
    let ring;
    if (desktop) {
      const x = endBox.left + 40;
      run = [[x, endBox.bottom + 16], [x, endBox.bottom + 34], [x + 20, endBox.bottom + 54], [x + 150, endBox.bottom + 54]];
      ring = [x + 156, endBox.bottom + 54];
    } else {
      const y = endBox.bottom + 28;
      run = [[W, y], [W - 48, y], [W - 68, y + 20]];
      ring = [W - 72, y + 24];
    }
    stations.push({ key: 'ending', trigger: q('.rt-end'), rootMargin: '0px 0px -6% 0px', replay: false, paths: [{ pts: run }], signals: [run], nodes: [{ at: ring, r: 5, kind: 'ring', pulse: true }] });
  }
  return { stations };
}

/* A day change only re-measures and settles the circuit (no replay); the results get a
   small local fade in Workshops.css instead. */
export default function WorkshopsCircuit({ rootRef, selectedDay, count }) {
  return <CircuitLayer rootRef={rootRef} compose={compose} deps={[selectedDay, count]} settleOnChange />;
}
