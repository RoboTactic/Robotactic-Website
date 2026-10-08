import CircuitLayer, { REST } from '../../motion/CircuitLayer';

/*
  Competitions — one signal travelling through the tracks:
  Header → track bus (runs BEHIND the cards, visible only in gaps/margins; right → left,
  so cards light up in RTL reading order) → west drop → CTA (inlet → receiver,
  emitter → outlet) → endpoint. Mobile: short fragments only, alternating edges.
*/
const DESKTOP_MIN = 768; // Competitions.css breakpoint

function compose(ctx) {
  const { W, q, qa, rect, ink } = ctx;
  const cardEls = qa('.competitions-grid > .competition-card');
  const stations = [];
  const desktop = ctx.vw >= DESKTOP_MIN;

  if (cardEls.length) {
    const c = cardEls.map(rect);
    const top = Math.min(...c.map((r) => r.top));
    const bottom = Math.max(...c.map((r) => r.bottom));
    if (desktop) {
      const y = top + 28; // behind the card headers
      const left = Math.min(...c.map((r) => r.left));
      const right = Math.max(...c.map((r) => r.right));
      const roomy = left >= 80;
      const bus = roomy ? [[W, y], [61, y], [61, Math.min(y + 230, bottom - 24)]] : [[W, y], [0, y]];
      const rows = [...new Set(c.map((r) => Math.round(r.top)))];
      const firstRow = c.filter((r) => Math.round(r.top) === rows[0]);
      const nodes = [];
      for (let i = 0; i + 1 < firstRow.length; i += 1) nodes.push({ at: [(firstRow[i].left + firstRow[i + 1].right) / 2, y], r: 3.5, mark: 'auto' });
      const paths = [{ pts: bus }];
      const extraRows = rows.slice(1).map((top) => c.map((r, i) => i).filter((i) => Math.round(c[i].top) === top));
      if (roomy) {
        nodes.push({ at: [61, y], r: 3, kind: 'dot' }, { at: [61, Math.min(y + 230, bottom - 24) + 5], r: 4.5, kind: 'ring', mark: 'auto' });
        nodes.push({ at: [W - 61, y], r: 3, kind: 'dot' });
        if (!extraRows.length) {
          const ey = Math.min(y + 150, bottom - 60);
          paths.push({ pts: [[W - 61, y], [W - 61, ey]] });
          nodes.push({ at: [W - 61, ey + 5], r: 4.5, kind: 'ring' });
        }
      }
      stations.push({
        key: 'tracks', trigger: q('.competitions-grid'), paths, nodes, signals: [bus], dur: 700,
        reveal: cardEls.map((el, i) => ({ el, delay: (i % Math.max(1, firstRow.length)) * 80 })),
      });

      // Further rows get a local 45-degree handoff in negative space, never a full-height rail.
      extraRows.forEach((row, n) => {
        const first = c[row[0]];
        const yr = first.top + 28;
        let link;
        let end;
        if (roomy) {
          link = [[W - 45, yr - 52], [W - 45, yr - 16], [W - 61, yr], [first.right + 14, yr]];
          end = [first.right + 10, yr];
        } else if (firstRow.length > 1) {
          const gx = (firstRow[0].left + firstRow[1].right) / 2;
          link = [[gx + 16, first.top - 12], [gx + 8, first.top - 12], [gx, first.top - 4], [gx, yr]];
          end = [gx, yr + 4];
        }
        if (!link) return;
        stations.push({
          key: `tracks-row-${n + 1}`, trigger: cardEls[row[0]],
          paths: [{ pts: link }], signals: [link],
          nodes: [{ at: end, r: 3.5, mark: 'auto' }],
        });
      });
    } else {
      const y = top - 12;
      const lead = [[W, y], [W - 56, y]];
      stations.push({
        key: 'tracks', trigger: cardEls[0], paths: [{ pts: lead, op: REST.continuity }],
        nodes: [{ at: [W - 60, y], r: 4, mark: 'auto' }], signals: [lead],
        reveal: [{ el: cardEls[0], mark: 0.6 }],
      });
      cardEls.slice(1).forEach((el, i) => stations.push({ key: `card-${i + 1}`, trigger: el, reveal: [{ el, mark: 0 }] }));
      const tail = [[0, bottom + 24], [40, bottom + 24], [56, bottom + 40]];
      stations.push({ key: 'tracks-out', trigger: cardEls[cardEls.length - 1], rootMargin: '0px 0px -40% 0px', paths: [{ pts: tail }], nodes: [{ at: [59, bottom + 43], r: 4, mark: 'auto' }], signals: [tail] });
    }
  }

  // CTA: the signal enters the band, reaches its receiver, leaves from the emitter.
  const bandEl = q('.competitions-cta__band');
  const band = rect(bandEl);
  if (band) {
    const copy = ink(q('.competitions-cta__content'));
    const btn = rect(q('.competitions-cta__band button'));
    const textL = Math.min(copy?.left ?? band.cx, btn?.left ?? band.cx);
    const textR = Math.max(copy?.right ?? band.cx, btn?.right ?? band.cx);
    let R;
    let E;
    let inlet;
    let outlet;
    if (desktop) {
      R = [band.right - 160, band.top + 28];
      if (R[0] - 24 < textR) R = [band.right - 36, band.top + 28];
      E = [band.left + 300, band.bottom - 24];
      if (E[0] + 24 > textL) E = [band.left + 36, band.bottom - 24];
      inlet = [[W, R[1] + 20], [R[0] + 220, R[1] + 20], [R[0] + 200, R[1]], [R[0] + 5, R[1]]];
      outlet = [[E[0] - 5, E[1]], [0, E[1]]];
    } else {
      R = [band.left + 28, band.top + 24];
      E = [band.right - 28, band.bottom - 24];
      inlet = [[0, R[1]], [R[0] - 5, R[1]]];
      outlet = [[E[0] + 5, E[1]], [W, E[1]]];
    }
    stations.push({
      key: 'cta', trigger: bandEl,
      paths: [{ pts: inlet, op: 0.38 }, { pts: outlet, op: 0.38 }],
      nodes: [{ at: R, r: 4.5, mark: 'auto' }, { at: E, r: 4.5, mark: 'auto' }],
      signals: [inlet, outlet],
    });

    let run;
    let ring;
    if (desktop) {
      const X = band.left + band.width * 0.65;
      run = [[X, band.bottom], [X, band.bottom + 30], [X + 20, band.bottom + 50], [X + 128, band.bottom + 50]];
      ring = [X + 134, band.bottom + 50];
    } else {
      run = [[0, band.bottom + 22], [96, band.bottom + 22], [108, band.bottom + 34]];
      ring = [112, band.bottom + 38];
    }
    stations.push({
      key: 'ending', trigger: q('.rt-end'), rootMargin: '0px 0px -6% 0px',
      paths: [{ pts: run }], signals: [run], nodes: [{ at: ring, r: 5, kind: 'ring', pulse: true }],
    });
  }
  return { stations };
}

export default function CompetitionsCircuit({ rootRef }) {
  return <CircuitLayer rootRef={rootRef} compose={compose} />;
}
