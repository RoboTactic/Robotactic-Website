import { useLayoutEffect, useRef, useState } from 'react';
import { signalBus, motionSupported, prefersReducedMotion } from './signalBus';
import { makeContext, toD, lengthOf, segLength } from './geometry';
import './motion.css';

/*
  CircuitLayer — the shared RoboTactic circuit/motion primitive.

  A page passes `compose(ctx)`, which measures its real layout (ctx.rect / ctx.ink) and
  returns { stations, ambient }. The layer renders every fragment as one decorative SVG
  behind the content and runs the shared behaviour:

    viewport entry → trace wakes (.32 → .9) → signal travels → nodes activate →
    endpoint pulse → circuit settles

  The circuit is DECORATIVE ONLY. Content is never hidden and never waits for a signal:
  `reveal` elements are visible from first paint and only get a short entry ease
  (opacity .85 → 1, 6px) when they enter the viewport, on an observer of their own.

  Station: {
    key, trigger: Element, rootMargin?,
    paths:   [{ pts, op?, cls? }]            static fragments (rest .32 / continuity .38–.45)
    nodes:   [{ at, r?, kind?, mark?, pulse? }]  kind: node | dot | ring | packet; mark 'auto' = where the signal passes
    signals: [pts]                          polylines the signal travels, in order (none = reveal-only station)
    packet?: true                           packet-style signal (Workshops)
    reveal:  [{ el, delay? }]               content that gets the entry ease (never hidden)
    domNodes:[{ el, mark? }]                page elements that get .is-active → .is-done
    dur?                                    travel time override (ms)
  }
  One major signal runs at a time (signalBus); a section scrolled past is simply settled.
  Reduced motion / no IntersectionObserver: static circuit, no entry ease.
*/

const HEAD = 28;
const PACKET = 10;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
export const REST = { trace: 0.32, continuity: 0.4, node: 0.42 };

function normalize(st) {
  const sigs = (st.signals || []).filter((p) => p && p.length > 1);
  let total = 0;
  const signals = sigs.map((pts) => { const len = lengthOf(pts); const s = { d: toD(pts), len, offset: total, pts }; total += len; return s; });
  const markOf = (at) => {
    if (!total) return 1;
    let best = Infinity;
    let mark = 1;
    signals.forEach((s) => { // project onto every segment: where does the signal pass closest to `at`?
      let cum = s.offset;
      for (let i = 1; i < s.pts.length; i += 1) {
        const [ax, ay] = s.pts[i - 1];
        const [bx, by] = s.pts[i];
        const len = segLength(s.pts[i - 1], s.pts[i]);
        const t = len ? Math.max(0, Math.min(1, ((at[0] - ax) * (bx - ax) + (at[1] - ay) * (by - ay)) / (len * len))) : 0;
        const d = segLength([ax + t * (bx - ax), ay + t * (by - ay)], at);
        if (d < best) { best = d; mark = (cum + t * len) / total; }
        cum += len;
      }
    });
    return mark;
  };
  const resolve = (m, at) => (m === 'auto' && at ? markOf(at) : typeof m === 'number' ? m : 1);
  return {
    key: st.key,
    trigger: st.trigger,
    rootMargin: st.rootMargin || '0px 0px -22% 0px',
    paths: (st.paths || []).filter((p) => p.pts?.length > 1).map((p) => ({ d: toD(p.pts), op: p.op ?? REST.trace, cls: p.cls || '' })),
    nodes: (st.nodes || []).map((n) => ({ ...n, r: n.r ?? 4, kind: n.kind || 'node', mark: n.mark !== undefined ? resolve(n.mark, n.at) : undefined })),
    signals,
    total,
    packet: Boolean(st.packet),
    reveal: (st.reveal || []).filter((r) => r?.el).map((r, i) => ({ el: r.el, mark: resolve(r.mark ?? 1, r.at), delay: r.delay ?? i * 80 })),
    domNodes: (st.domNodes || []).filter((n) => n?.el).map((n) => ({ el: n.el, mark: resolve(n.mark ?? 1, n.at) })),
    dur: st.dur,
    replay: st.replay,
  };
}

export default function CircuitLayer({ rootRef, compose, deps = [], replayKey, settleOnChange = false }) {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const [geo, setGeo] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const svgRef = useRef(null);
  const doneRef = useRef(new Set());
  const revealedRef = useRef(new WeakSet());
  const initRef = useRef(false);
  const replayRef = useRef(replayKey);
  const composeRef = useRef(compose);
  composeRef.current = compose;

  // Measure (and re-measure on resize / font load).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) { // the parent's ref attaches after this child's layout effect — retry next frame
      const f = requestAnimationFrame(() => setAttempt((n) => n + 1));
      return () => cancelAnimationFrame(f);
    }
    const measure = () => {
      const out = composeRef.current(makeContext(root));
      if (!out || !out.stations?.length) return null;
      return {
        W: root.offsetWidth,
        H: root.offsetHeight,
        stations: out.stations.filter(Boolean).map(normalize),
        ambient: out.ambient?.pts ? { d: toD(out.ambient.pts), len: lengthOf(out.ambient.pts), host: out.ambient.host } : null,
      };
    };
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setGeo(measure())); };
    setGeo(measure());
    const ro = new ResizeObserver(update);
    ro.observe(root);
    document.fonts?.ready.then(update);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  // Motion controller.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!geo || !svg) return undefined;
    const stations = geo.stations;
    const done = doneRef.current;
    const svgNodes = (st) => [...svg.querySelectorAll(`[data-key="${CSS.escape(st.key)}"] .rt-node[data-mark]`)];
    const markDone = (st) => {
      svgNodes(st).forEach((n) => n.classList.add('is-done'));
      st.domNodes.forEach(({ el }) => { el.classList.remove('is-active'); el.classList.add('is-done'); });
    };

    if (reducedMotion || !motionSupported()) return undefined;

    const owner = {};
    const timers = new Set();
    const anims = new Set();
    const inFlight = new Set();
    let alive = true;
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };
    const track = (a) => { anims.add(a); a.finished.catch(() => {}).finally(() => anims.delete(a)); return a; };
    const inView = (el) => { const r = el?.getBoundingClientRect(); return Boolean(r) && r.top < window.innerHeight && r.bottom > 0; };

    const replay = initRef.current && replayKey !== replayRef.current;
    replayRef.current = replayKey;
    if (initRef.current && (settleOnChange || replay)) {
      stations.forEach((st) => {
        if (replay && st.signals.length && st.replay !== false && inView(st.trigger)) done.delete(st.key);
        else done.add(st.key);
      });
    }
    initRef.current = true;

    stations.forEach((st) => { if (done.has(st.key)) markDone(st); });

    /* Content is NEVER hidden by the circuit. Each reveal element is fully visible from the
       first paint; when it enters the viewport it gets one short, self-contained entry ease
       (never from blank), on its own observer — it does not wait for any signal. */
    const revealed = revealedRef.current;
    const entries = stations.flatMap((st) => st.reveal).filter(({ el }) => !revealed.has(el));
    const revealIo = new IntersectionObserver((list) => list.forEach((e) => {
      if (!e.isIntersecting) return;
      revealIo.unobserve(e.target);
      if (revealed.has(e.target)) return;
      revealed.add(e.target);
      const item = entries.find((r) => r.el === e.target);
      track(e.target.animate([{ opacity: 0.85, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 280, delay: Math.min(item?.delay || 0, 160), easing: EASE, fill: 'backwards' }));
    }), { rootMargin: '0px 0px -4% 0px', threshold: 0 });
    entries.forEach(({ el }) => revealIo.observe(el));

    const settle = (st) => {
      inFlight.delete(st.key);
      if (done.has(st.key)) return;
      done.add(st.key);
      markDone(st);
    };

    function run(st, finish) {
      const g = svg.querySelector(`[data-key="${CSS.escape(st.key)}"]`);
      if (!g) { settle(st); finish(); return; }
      const dur = st.dur || Math.round(Math.min(700, Math.max(450, 250 + st.total * 0.45)));
      g.querySelectorAll('.rt-circuit__trace').forEach((p) => {
        const r = Number(p.dataset.rest);
        track(p.animate([{ opacity: r }, { opacity: 0.9, offset: 0.15 }, { opacity: 0.9, offset: 0.8 }, { opacity: r }], { duration: dur + 300, easing: 'ease-out' }));
      });
      g.querySelectorAll('.rt-circuit__signal').forEach((p) => {
        const len = Number(p.dataset.len);
        const head = Number(p.dataset.head);
        const share = st.total ? len / st.total : 1;
        const offset = st.total ? Number(p.dataset.offset) / st.total : 0;
        track(p.animate([
          { strokeDashoffset: head, opacity: 1 },
          { strokeDashoffset: -len, opacity: 1, offset: 0.97 },
          { strokeDashoffset: -len, opacity: 0 },
        ], { duration: Math.max(120, dur * share), delay: dur * offset, easing: 'linear' }));
      });
      svgNodes(st).forEach((n) => later(() => { n.classList.remove('is-done'); n.classList.add('is-active'); }, Number(n.dataset.mark) * dur));
      st.domNodes.forEach(({ el, mark }) => later(() => { el.classList.remove('is-done'); el.classList.add('is-active'); }, mark * dur));
      const pulses = [...g.querySelectorAll('.rt-node[data-pulse]')];
      pulses.forEach((n) => later(() => track(n.animate([{ opacity: REST.node }, { opacity: 0.85 }, { opacity: REST.node }], { duration: 600, easing: 'ease-in-out' })), dur));
      const tail = pulses.length ? 600 : 260;
      const overrun = Math.max(0, ...st.domNodes.map((n) => n.mark - 1)) * dur; // nodes lit after the trace ends
      later(() => { markDone(st); svgNodes(st).forEach((n) => n.classList.remove('is-active')); inFlight.delete(st.key); finish(); }, dur + Math.max(Math.min(tail, 700), overrun + 260));
    }

    const onEnter = (i) => {
      const st = stations[i];
      if (done.has(st.key) || inFlight.has(st.key)) return;
      for (let k = 0; k < i; k += 1) if (!done.has(stations[k].key) && !inFlight.has(stations[k].key)) settle(stations[k]);
      if (!st.signals.length) { // trace-less station: never waits for the bus
        done.add(st.key);
        st.domNodes.forEach(({ el, mark }) => { // sequential activation (e.g. values) without a trace
          later(() => { el.classList.remove('is-done'); el.classList.add('is-active'); }, mark * 500);
          later(() => { el.classList.remove('is-active'); el.classList.add('is-done'); }, mark * 500 + 520);
        });
        return;
      }
      done.add(st.key);
      inFlight.add(st.key);
      signalBus.request({ owner, run: (finish) => run(st, finish), settle: () => { done.delete(st.key); settle(st); }, isVisible: () => inView(st.trigger) });
    };

    const observers = [];
    const byMargin = new Map();
    stations.forEach((st, i) => {
      if (!st.trigger || done.has(st.key)) return;
      if (!byMargin.has(st.rootMargin)) byMargin.set(st.rootMargin, []);
      byMargin.get(st.rootMargin).push([st.trigger, i]);
    });
    byMargin.forEach((list, rootMargin) => {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        list.filter(([t]) => t === e.target).forEach(([, i]) => {
          if (e.isIntersecting) onEnter(i);
          else if (e.boundingClientRect.bottom < 0) settle(stations[i]); // scrolled past without seeing it
        });
      }), { rootMargin, threshold: 0 });
      list.forEach(([t]) => io.observe(t));
      observers.push(io);
    });

    // Ambient loop (header only): paused while a section signal runs, off-screen, or tab hidden.
    let ambient = null;
    let unsub = null;
    let hostIo = null;
    const amb = svg.querySelector('.rt-circuit__ambient');
    const onVis = () => sync();
    let hostVisible = true;
    const sync = () => { if (!ambient) return; if (!signalBus.busy && hostVisible && !document.hidden) ambient.play(); else ambient.pause(); };
    if (amb && geo.ambient) {
      const len = geo.ambient.len;
      ambient = amb.animate([
        { strokeDashoffset: HEAD, opacity: 0, offset: 0 },
        { opacity: 0.85, offset: 0.06 },
        { strokeDashoffset: -len, opacity: 0.85, offset: 0.6 },
        { strokeDashoffset: -len, opacity: 0, offset: 0.66 },
        { strokeDashoffset: -len, opacity: 0, offset: 1 },
      ], { duration: 9000, iterations: Infinity, easing: 'linear', delay: 1200 });
      unsub = signalBus.subscribe(sync);
      if (geo.ambient.host) {
        hostIo = new IntersectionObserver(([e]) => { hostVisible = e.isIntersecting; sync(); });
        hostIo.observe(geo.ambient.host);
      }
      document.addEventListener('visibilitychange', onVis);
      sync();
    }

    return () => {
      alive = false;
      observers.forEach((io) => io.disconnect());
      revealIo.disconnect();
      hostIo?.disconnect();
      unsub?.();
      document.removeEventListener('visibilitychange', onVis);
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.cancel());
      ambient?.cancel();
      signalBus.release(owner);
      inFlight.forEach((key) => done.delete(key)); // interrupted → may run again after re-measure
      stations.forEach((st) => {
        svgNodes(st).forEach((n) => n.classList.remove('is-active'));
        st.domNodes.forEach(({ el }) => el.classList.remove('is-active'));
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, replayKey, reducedMotion]);

  if (!geo) return null;
  return (
    <svg ref={svgRef} className="rt-circuit" width={geo.W} height={geo.H} viewBox={`0 0 ${geo.W} ${geo.H}`} aria-hidden="true" focusable="false">
      {geo.ambient && <path className="rt-circuit__ambient" d={geo.ambient.d} strokeDasharray={`${HEAD} ${geo.ambient.len + HEAD}`} strokeDashoffset={HEAD} />}
      {geo.stations.map((st) => (
        <g key={st.key} data-key={st.key}>
          {st.paths.map((p, i) => <path key={i} className={`rt-circuit__trace ${p.cls}`} d={p.d} data-rest={p.op} style={{ opacity: p.op }} />)}
          {st.nodes.map((n, i) => (n.kind === 'packet'
            ? <rect key={i} className="rt-circuit__packet" x={n.at[0] - 5} y={n.at[1] - 2} width="10" height="4" rx="1" />
            : <circle key={i} className={`rt-node rt-node--${n.kind}`} cx={n.at[0]} cy={n.at[1]} r={n.r}
                data-mark={n.mark !== undefined ? n.mark : undefined} data-pulse={n.pulse ? '' : undefined} />))}
          {st.signals.map((s, i) => {
            const head = st.packet ? PACKET : HEAD;
            return <path key={`s${i}`} className={`rt-circuit__signal${st.packet ? ' rt-circuit__signal--packet' : ''}`} d={s.d}
              data-len={s.len} data-offset={s.offset} data-head={head} strokeDasharray={`${head} ${s.len + head}`} strokeDashoffset={head} />;
          })}
        </g>
      ))}
    </svg>
  );
}
