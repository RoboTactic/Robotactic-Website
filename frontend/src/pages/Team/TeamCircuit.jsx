import CircuitLayer from '../../motion/CircuitLayer';
import { elbow } from '../../motion/geometry';

/*
  Team — one network, measured from the real layout:
  · header: a loose peer mesh in the header's empty side;
  · ≥768px: a single central trunk leaves the Director, branches on a short bus to each tier
    (Co-Directors, then General Management), pauses at the Departments heading and feeds one
    bus per row of department cards. The trunk only runs through gaps, never behind a card;
  · <768px: a rail on the inline-start side with a stub into every card.
  Every connector ends on a card's port (styled in Team.css), so lines never cross content.
*/
const DESKTOP_MIN = 768;
const BUS = 22;    // bus height above a row of cards
const PORT_Y = 30; // mobile: stub height inside a card

function heroMesh({ q, rect, ink, vw }, trigger) {
  const hero = rect(q('.info-page__hero'));
  const heading = ink(q('.info-page__hero .section-heading'));
  if (!hero || !heading) return null;
  const pattern = rect(q('.info-page__pattern'));
  const container = rect(q('.info-page__hero .container'));
  if (vw >= DESKTOP_MIN) {
    // RTL copy sits on the right, so the mesh takes the left side (and vice versa).
    const rtl = heading.right > container.cx;
    const box = rtl
      ? { left: Math.max(container.left, (pattern?.right ?? 0) + 40), right: heading.left - 64 }
      : { left: heading.right + 64, right: Math.min(container.right, (pattern?.left ?? Infinity) - 40) };
    const w = Math.min(box.right - box.left, 520);
    if (w < 220) return null;
    const top = hero.top + 36;
    const h = hero.bottom - 28 - top;
    const at = (fx, fy) => [box.left + fx * w, top + fy * h];
    const p1 = at(0.06, 0.3); const hub = at(0.4, 0.62); const p3 = at(0.8, 0.28); const p4 = at(0.62, 0.95);
    const l1 = elbow(p1, hub); const l2 = elbow(hub, p3, true); const l3 = elbow(hub, p4, true);
    return {
      key: 'mesh', trigger,
      paths: [{ pts: l1 }, { pts: l2 }, { pts: l3 }],
      nodes: [{ at: p1, r: 3.5, mark: 0 }, { at: hub, r: 5, mark: 'auto' }, { at: p3, r: 3.5, mark: 'auto' }, { at: p4, r: 3.5, mark: 'auto' }],
      signals: [l1, l2, l3],
    };
  }
  const y = hero.bottom - 18;
  const inlet = [[0, y], [28, y], [46, y - 18], [92, y - 18]];
  return {
    key: 'mesh', trigger,
    paths: [{ pts: inlet }, { pts: [[46, y - 18], [46, y - 34]] }],
    nodes: [{ at: [46, y - 18], r: 3.5, mark: 'auto' }, { at: [46, y - 37], r: 2.5, kind: 'dot' }, { at: [92, y - 18], r: 3.5, mark: 'auto' }],
    signals: [inlet],
  };
}

/* Rows of cards (same top) → a bus above each row, fed by the trunk at x. */
function branch(x, cards, rect) {
  const rows = [];
  cards.forEach((el) => {
    const r = rect(el);
    const row = rows.find((rw) => Math.abs(rw.top - r.top) < 4);
    if (row) { row.items.push({ el, r }); row.top = Math.min(row.top, r.top); } else rows.push({ top: r.top, items: [{ el, r }] });
  });
  return rows.map((row) => {
    const y = row.top - BUS;
    const xs = [x, ...row.items.map(({ r }) => r.cx)];
    return {
      y,
      bus: [[Math.min(...xs), y], [Math.max(...xs), y]],
      drops: row.items.map(({ el, r }) => ({ el, pts: [[r.cx, y], [r.cx, r.top]], half: [[x, y], [r.cx, y], [r.cx, r.top]] })),
    };
  });
}

function desktopNetwork(ctx) {
  const { q, qa, rect } = ctx;
  const directorEl = q('.team-person--director');
  const director = rect(directorEl);
  const head = rect(q('.team-section--departments .team-section__head'));
  const deptEls = qa('.team-dept');
  if (!director || !head || !deptEls.length) return [];
  const x = director.cx;

  // Leadership: Director → Co-Directors → General Management.
  const tiers = ['co-directors', 'management'].flatMap((k) => branch(x, qa(`.team-tier--${k} .team-person`), rect));
  const leadEnd = [x, head.top - 18];
  const leadTrunk = [[x, director.bottom], leadEnd];
  const leadSignals = [];
  let from = director.bottom;
  tiers.forEach((tier) => { leadSignals.push([[x, from], [x, tier.y]], ...tier.drops.map((d) => d.half)); from = tier.y; });
  leadSignals.push([[x, from], leadEnd]);

  // Departments: resume below the heading, one bus per row.
  const rows = branch(x, deptEls, rect);
  const start = [x, head.bottom + 14];
  const committee = rect(q('.team-committee'));
  // When the committee occupies its own row, keep the department trunk in the gaps.
  const trunkParts = (fromY, toY) => {
    if (!committee || toY <= committee.top || fromY >= committee.bottom) return [[[x, fromY], [x, toY]]];
    return [
      fromY < committee.top - 10 && [[x, fromY], [x, committee.top - 10]],
      toY > committee.bottom + 10 && [[x, committee.bottom + 10], [x, toY]],
    ].filter(Boolean);
  };
  const deptTrunk = trunkParts(start[1], rows[rows.length - 1].y);
  const deptSignals = [];
  let y = start[1];
  rows.forEach((row) => { deptSignals.push(...trunkParts(y, row.y), ...row.drops.map((d) => d.half)); y = row.y; });

  const junctions = (list) => list.map((row) => ({ at: [x, row.y], r: 3.5, mark: 'auto' }));
  return [
    {
      key: 'leadership', trigger: directorEl,
      paths: [{ pts: leadTrunk }, ...tiers.flatMap((t) => [{ pts: t.bus }, ...t.drops.map((d) => ({ pts: d.pts }))])],
      nodes: [...junctions(tiers), { at: leadEnd, r: 4.5, kind: 'ring', mark: 'auto' }],
      signals: leadSignals,
      domNodes: [{ el: directorEl, mark: 0 }, ...tiers.flatMap((t) => t.drops.map((d) => ({ el: d.el, at: d.pts[1], mark: 'auto' })))],
      reveal: qa('.team-person').map((el, i) => ({ el, delay: i * 60 })),
    },
    {
      key: 'departments', trigger: q('.team-departments'),
      paths: [...deptTrunk.map((pts) => ({ pts })), ...rows.flatMap((r) => [{ pts: r.bus }, ...r.drops.map((d) => ({ pts: d.pts }))])],
      nodes: [{ at: start, r: 4.5, kind: 'ring', mark: 0 }, ...junctions(rows)],
      signals: deptSignals,
      domNodes: rows.flatMap((r) => r.drops.map((d) => ({ el: d.el, at: d.pts[1], mark: 'auto' }))),
      reveal: deptEls.map((el, i) => ({ el, delay: (i % 4) * 60 })),
      dur: 1100,
    },
  ];
}

/* A dedicated branch leaves the Technical Department and lands on the committee's port. */
function websiteBranch({ q, rect }) {
  const technical = rect(q('.team-dept--technical'));
  const el = q('.team-committee');
  const committee = rect(el);
  if (!technical || !committee || committee.top <= technical.bottom) return null;
  const y = technical.bottom + (committee.top - technical.bottom) / 2;
  const pts = [[technical.cx, technical.bottom], [technical.cx, y], [committee.cx, y], [committee.cx, committee.top]];
  return {
    key: 'website-committee', trigger: el,
    paths: [{ pts }], signals: [pts],
    nodes: [{ at: [technical.cx, technical.bottom], r: 3, kind: 'dot', mark: 0 }],
    domNodes: [{ el, at: pts[pts.length - 1], mark: 'auto' }],
    reveal: [{ el }],
  };
}

/* Mobile: one rail on the inline-start side, a stub into each card's port. */
function mobileRail(ctx) {
  const { q, qa, rect, root } = ctx;
  const rtl = root.dir === 'rtl';
  const lead = qa('.team-person');
  const depts = qa('.team-dept');
  const tiers = rect(q('.team-tiers'));
  if (!lead.length || !depts.length || !tiers) return [];
  const x = rtl ? tiers.right - 10 : tiers.left + 10;
  const stub = (el) => { const r = rect(el); const y = r.top + PORT_Y; return { el, y, pts: [[x, y], [rtl ? r.right : r.left, y]] }; };
  const headNode = (sel) => { const h = rect(q(`${sel} .team-section__head h2`)); return h ? [x, h.cy] : null; };
  const section = (key, els, headSel, trigger) => {
    const stubs = els.map(stub);
    const top = headNode(headSel);
    const rail = [top || [x, stubs[0].y], [x, stubs[stubs.length - 1].y]];
    return {
      key, trigger,
      paths: [{ pts: rail }, ...stubs.map((s) => ({ pts: s.pts }))],
      nodes: [...(top ? [{ at: top, r: 4.5, kind: 'ring', mark: 0 }] : []), ...stubs.map((s) => ({ at: [x, s.y], r: 3, mark: 'auto' }))],
      signals: [rail],
      domNodes: stubs.map((s) => ({ el: s.el, at: [x, s.y], mark: 'auto' })),
      reveal: els.map((el) => ({ el })),
    };
  };
  return [
    section('leadership', lead, '.team-section--leadership', lead[0]),
    section('departments', depts, '.team-section--departments', q('.team-departments')),
  ];
}

/* Two contributions converge on one shared endpoint below the closing statement. */
function ending({ q, rect, vw }) {
  const el = q('.team-closing');
  const panel = rect(el);
  if (!panel) return null;
  const X = panel.cx;
  const y = panel.bottom + (vw >= DESKTOP_MIN ? 34 : 28);
  const west = [[X - 64, panel.bottom + 12], [X - 42, y], [X - 7, y]];
  const east = [[X + 64, panel.bottom + 12], [X + 42, y], [X + 7, y]];
  return {
    key: 'ending', trigger: el, rootMargin: '0px 0px -30% 0px',
    paths: [{ pts: west }, { pts: east }], signals: [west, east],
    nodes: [{ at: [X, y], r: 6, kind: 'ring', pulse: true }],
  };
}

function compose(ctx) {
  const network = ctx.vw >= DESKTOP_MIN ? desktopNetwork(ctx) : mobileRail(ctx);
  if (!network.length) return null;
  return { stations: [heroMesh(ctx, ctx.q('.info-page__hero')), ...network, websiteBranch(ctx), ending(ctx)].filter(Boolean) };
}

export default function TeamCircuit({ rootRef }) {
  return <CircuitLayer rootRef={rootRef} compose={compose} />;
}
