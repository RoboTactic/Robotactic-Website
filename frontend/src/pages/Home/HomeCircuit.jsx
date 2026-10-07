import CircuitLayer from '../../motion/CircuitLayer';

/*
  Home — "system boot", the reference journey:
  Hero ambient (CircuitPattern) → About values → Countdown time signal → Competitions
  signal → Workshops packet handoff → Live Now node → CTA receiver → final fork pulse.
  Each station is measured from the real layout and skipped when its content is missing
  (loading / error / empty), so traces never land on text or cards.
*/
const DESKTOP_MIN = 1024; // Home.css breakpoint

function compose(ctx) {
  const { W, q, qa, rect, ink } = ctx;
  const desktop = ctx.vw >= DESKTOP_MIN;
  const stations = [];

  // About — values light up in reading order (reveal-only, no travelling signal).
  const chips = qa('.about__values > li');
  if (chips.length) stations.push({ key: 'about', trigger: q('.about__values'), reveal: chips.map((el, i) => ({ el, mark: 0, delay: i * 70 })) });

  // Countdown — a time signal enters, crosses the timer and leaves it.
  const cdSection = q('.home-countdown');
  const units = rect(q('.countdown__units'));
  const cdTitle = ink(q('.home-countdown .section-heading__title'));
  if (cdSection && cdTitle) {
    if (desktop && units) {
      const y = units.cy;
      const inlet = units.left >= 60 ? [[0, y], [units.left - 18, y]] : null; // no room at narrow desktop widths
      const textLeft = ink(q('.countdown__text'))?.left ?? cdTitle.left;
      const endX = Math.min(units.right + 300, textLeft - 48);
      const out = endX - units.right > 190
        ? [[units.right + 18, y], [units.right + 138, y], [units.right + 162, y - 24], [endX, y - 24]]
        : [[units.right + 18, y], [Math.max(units.right + 60, endX), y]];
      stations.push({
        key: 'countdown', trigger: cdSection,
        paths: [inlet && { pts: inlet }, { pts: out }].filter(Boolean),
        nodes: [inlet && { at: inlet[1], r: 3.5, mark: 'auto' }, { at: out[out.length - 1], r: 4, mark: 'auto' }].filter(Boolean),
        signals: [inlet, out].filter(Boolean),
      });
    } else {
      const y = cdTitle.cy;
      const end = Math.max(28, Math.min(84, cdTitle.left - 28));
      const inlet = [[0, y], [end, y]];
      stations.push({ key: 'countdown', trigger: cdSection, paths: [{ pts: inlet }], nodes: [{ at: [end + 4, y], r: 4, mark: 'auto' }], signals: [inlet] });
    }
  }

  // Competitions preview — one restrained pass through the negative space beside the
  // heading into the first card gap; out of the next gap toward «عرض كل المسابقات».
  const cards = qa('.home-competitions .card-grid > li');
  const compTitle = ink(q('.home-competitions .section-heading__title'));
  if (cards.length && compTitle) {
    const c = cards.map(rect);
    const top = Math.min(...c.map((r) => r.top));
    const bottom = Math.max(...c.map((r) => r.bottom));
    const btn = rect(q('.home-competitions .home-section__action'));
    const reveal = cards.map((el, i) => ({ el, mark: 0.55, delay: i * 80 }));
    if (desktop && c.length >= 2) {
      const gx = (c[0].left + c[1].right) / 2;
      const yTop = top - 14;
      const y0 = compTitle.cy;
      const d = yTop - y0;
      const inlet = [[0, y0], [gx - d, y0], [gx, yTop]];
      const paths = [{ pts: inlet }];
      const nodes = [{ at: [gx, yTop], r: 4.5, mark: 'auto' }];
      const signals = [inlet];
      if (c.length >= 3 && btn) {
        const g2 = (c[1].left + c[2].right) / 2;
        const y = Math.min(btn.cy, bottom + 44);
        const endX = btn.left - 36;
        if (endX > g2 + 80) {
          const exit = [[g2, bottom + 14], [g2 + (y - bottom - 14), y], [endX, y]];
          paths.push({ pts: exit });
          nodes.push({ at: [g2, bottom + 14], r: 4, mark: 'auto' }, { at: [endX + 3, y], r: 3, kind: 'dot' });
          signals.push(exit);
        }
      }
      stations.push({ key: 'competitions', trigger: q('.home-competitions .card-grid'), paths, nodes, signals, reveal });
    } else {
      const y0 = compTitle.cy;
      const reach = Math.max(36, Math.min(52, compTitle.left - 60));
      const inlet = [[0, y0], [reach, y0], [reach + 24, y0 + 24]];
      const paths = [{ pts: inlet }];
      const nodes = [{ at: [reach + 27, y0 + 27], r: 4, mark: 'auto' }];
      const signals = [inlet];
      if (btn) {
        const y = btn.bottom + 16;
        const exit = [[W, y], [W - 57, y]];
        paths.push({ pts: exit });
        nodes.push({ at: [W - 61, y], r: 3, kind: 'dot' });
      }
      stations.push({ key: 'competitions', trigger: q('.home-competitions .card-grid'), paths, nodes, signals, reveal });
    }
  }

  // Workshops — a data packet hands the session off into the empty side of the grid.
  const shop = q('.home-workshops .card-grid > li');
  if (shop) {
    const k = rect(shop);
    if (desktop) {
      const y = k.cy;
      const handoff = [[k.left - 24, y], [k.left - 200, y], [k.left - 224, y + 24], [k.left - 380, y + 24]];
      stations.push({
        key: 'workshops', trigger: shop, packet: true,
        paths: [{ pts: handoff, op: 0.38 }],
        nodes: [{ at: [k.left - 110, y], kind: 'packet' }, { at: [k.left - 384, y + 24], r: 3.5, mark: 'auto' }],
        signals: [handoff], reveal: [{ el: shop, mark: 0 }],
      });
    } else {
      const btn = rect(q('.home-workshops .home-section__action'));
      if (btn) {
        const y = btn.bottom + 22;
        const stub = [[W, y], [W - 64, y]];
        stations.push({
          key: 'workshops', trigger: shop, packet: true,
          paths: [{ pts: stub, op: 0.38 }],
          nodes: [{ at: [W - 30, y], kind: 'packet' }, { at: [W - 68, y], r: 3.5, mark: 'auto' }],
          signals: [stub], reveal: [{ el: shop, mark: 0 }],
        });
      }
    }
  }

  // Live Now — the live card is an active point; one nearby node wakes once.
  const live = qa('.home-live .card-grid > li').map(rect);
  const liveTitle = ink(q('.home-live .section-heading__title'));
  if (live.length && liveTitle) {
    const lc = live[0];
    let inlet;
    if (desktop && W - lc.right >= 72) {
      const y = lc.top + lc.height * 0.75;
      inlet = [[W, y], [W - 40, y], [W - 76, y - 36]];
    } else {
      const y = liveTitle.cy;
      const d = Math.max(10, Math.min(36, lc.top - 18 - y));
      inlet = [[0, y], [34, y], [34 + d, y + d]];
    }
    const [ex, ey] = inlet[inlet.length - 1];
    const dir = inlet[0][0] === 0 ? 1 : -1;
    stations.push({
      key: 'live', trigger: q('.home-live .card-grid'),
      paths: [{ pts: inlet }], nodes: [{ at: [ex + dir * 4, ey + 4 * (dir > 0 ? 1 : -1)], r: 4.5, mark: 'auto' }], signals: [inlet],
    });
  }

  // CTA — the signal enters the band and reaches its receiver; then the final fork pulses.
  const band = rect(q('.home-cta .cta-band'));
  if (band) {
    const content = rect(q('.home-cta .cta-band__content'));
    let R;
    let inlet;
    if (desktop) {
      R = [band.right - 160, band.top + 30];
      if (content && R[0] - 24 < content.right) R = [band.right - 36, band.top + 30];
      inlet = [[R[0] - 70, band.top - 56], [R[0] - 70, band.top - 40], R];
    } else {
      R = [band.left + 22, band.top + 22];
      inlet = [[0, R[1]], R];
    }
    stations.push({
      key: 'cta', trigger: q('.home-cta .cta-band'),
      paths: [{ pts: inlet, op: 0.38 }],
      nodes: [{ at: inlet[0], r: 2.5, kind: 'dot' }, { at: R, r: 4.5, mark: 'auto' }],
      signals: [inlet],
    });

    const X = desktop ? band.left + band.width * 0.72 : band.left + 90;
    const s = desktop ? { stem: 26, d: 24, w: 80 } : { stem: 12, d: 18, w: 50 };
    const b = band.bottom;
    const stem = [[X, b], [X, b + s.stem]];
    const west = [[X, b + s.stem], [X - s.d, b + s.stem + s.d], [X - s.w, b + s.stem + s.d]];
    const east = [[X, b + s.stem], [X + s.d, b + s.stem + s.d], [X + s.w, b + s.stem + s.d]];
    const yT = b + s.stem + s.d;
    stations.push({
      key: 'ending', trigger: q('.home__end'), rootMargin: '0px 0px -6% 0px',
      paths: [{ pts: stem }, { pts: west }, { pts: east }],
      nodes: [
        { at: [X, b + s.stem], r: 2.5, kind: 'dot' },
        { at: [X - s.w - 5, yT], r: desktop ? 5 : 4, kind: 'ring', pulse: true },
        { at: [X + s.w + 4, yT], r: desktop ? 4 : 3.5, kind: 'ring', pulse: true },
      ],
      signals: [[...stem, ...west.slice(1)], east],
    });
  }

  return { stations };
}

export default function HomeCircuit({ rootRef }) {
  return <CircuitLayer rootRef={rootRef} compose={compose} />;
}

