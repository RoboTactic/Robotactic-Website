import CircuitLayer, { REST } from '../../motion/CircuitLayer';

/*
  About — identity / system story, the calmest page:
  Header → Idea (signal leaves the header, lands above the panel) →
  Actions → open endpoint before the Footer.
  Circuits stay in negative space; nothing outlines the panels.
*/
const DESKTOP_MIN = 768; // InfoPages.css breakpoint

function compose(ctx) {
  const { W, q, qa, rect } = ctx;
  const hero = rect(q('.info-page__hero'));
  const panels = qa('.info-page__panel');
  const linksEl = q('.info-page__links');
  if (!hero || !panels.length || !linksEl) return null;
  const idea = rect(panels[0]);
  const desktop = ctx.vw >= DESKTOP_MIN;
  const heroB = hero.bottom;
  const stations = [];
  const container = rect(q('.info-page__body'));

  // Header → Idea
  const pts = [[0, heroB - 20], [44, heroB - 20], [64, heroB], [64, idea.top - 20]];
  stations.push({
    key: 'idea', trigger: panels[0],
    paths: [{ pts, op: REST.continuity }],
    nodes: [{ at: [64, idea.top - 16], r: 4, mark: 'auto' }],
    signals: [pts],
  });

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
