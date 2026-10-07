import CircuitLayer, { REST } from '../../motion/CircuitLayer';

/*
  About — identity / system story, the calmest page:
  Header → Idea (signal leaves the header, lands in the gap above the panels) →
  Values (chips light one after another) → Actions → open endpoint before the Footer.
  Circuits stay in negative space; nothing outlines the panels.
*/
const DESKTOP_MIN = 768; // InfoPages.css breakpoint

function compose(ctx) {
  const { W, q, qa, rect } = ctx;
  const hero = rect(q('.info-page__hero'));
  const panels = qa('.info-page__panel');
  const linksEl = q('.info-page__links');
  if (!hero || panels.length < 2 || !linksEl) return null;
  const [idea, values] = panels.map(rect);
  const desktop = ctx.vw >= DESKTOP_MIN;
  const heroB = hero.bottom;
  const stations = [];
  const container = rect(q('.info-page__body'));

  // Header → Idea
  if (desktop && idea.left > values.right) {
    const gapX = (idea.left + values.right) / 2;
    const x0 = container.left + 40;
    const pts = [[x0, heroB - 30], [x0, heroB + 20], [gapX - 16, heroB + 20], [gapX, heroB + 36]];
    stations.push({
      key: 'idea', trigger: panels[0],
      paths: [{ pts, op: REST.continuity }],
      nodes: [{ at: pts[0], r: 3, kind: 'dot' }, { at: [gapX, heroB + 40], r: 4.5, mark: 'auto' }],
      signals: [pts],
    });
  } else {
    const pts = [[0, heroB - 20], [44, heroB - 20], [64, heroB], [64, idea.top - 20]];
    stations.push({
      key: 'idea', trigger: panels[0],
      paths: [{ pts, op: REST.continuity }],
      nodes: [{ at: [64, idea.top - 16], r: 4, mark: 'auto' }],
      signals: [pts],
    });
  }

  // Values — a short inlet from the page margin (when there is one), then the chips light in reading order.
  const chips = qa('.info-page__values li');
  const valuesTitle = rect(panels[1].querySelector('h2'));
  const margin = values.left;
  const chipNodes = chips.map((el, i) => ({ el, mark: 1 + i * 0.28 }));
  if (desktop && margin >= 72 && valuesTitle) {
    const y = valuesTitle.cy;
    const pts = [[margin - 72, y], [margin - 20, y]];
    stations.push({
      key: 'values', trigger: panels[1],
      paths: [{ pts }], nodes: [{ at: pts[0], r: 2.5, kind: 'dot' }, { at: [margin - 16, y], r: 4, mark: 'auto' }],
      signals: [pts], domNodes: chipNodes, dur: 450,
    });
  } else {
    // No trace room: the chips still light in order, but only after the idea has had the stage.
    stations.push({ key: 'values', trigger: panels[1], domNodes: chips.map((el, i) => ({ el, mark: 1.2 + i * 0.3 })) });
  }

  // Actions → endpoint
  const links = qa('.info-page__links a').map(rect);
  if (links.length) {
    const lastLeft = Math.min(...links.map((r) => r.left));
    const lb = rect(linksEl);
    let pts;
    let ring;
    if (desktop && lastLeft - 240 > container.left) {
      const y = links[links.length - 1].cy;
      pts = [[lastLeft - 20, y], [lastLeft - 140, y], [lastLeft - 168, y + 28], [lastLeft - 216, y + 28]];
      ring = [lastLeft - 222, y + 28];
    } else {
      const y = lb.bottom + 28;
      pts = [[W, y], [W - 48, y], [W - 68, y + 20]];
      ring = [W - 72, y + 24];
    }
    stations.push({
      key: 'ending', trigger: linksEl, rootMargin: '0px 0px -12% 0px',
      paths: [{ pts }], signals: [pts],
      nodes: [{ at: ring, r: 5.5, kind: 'ring', pulse: true }],
      reveal: qa('.info-page__links a').map((el, i) => ({ el, mark: 0, delay: i * 80 })),
    });
  }
  return { stations };
}

export default function AboutCircuit({ rootRef }) {
  return <CircuitLayer rootRef={rootRef} compose={compose} />;
}
