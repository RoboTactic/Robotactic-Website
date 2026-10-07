/* Geometry helpers for measured circuit compositions (physical px, relative to the layer root). */

export const segLength = ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1);

export const toD = (pts) => pts
  .map(([x, y], i) => `${i ? 'L' : 'M'}${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`)
  .join(' ');

export function lengthOf(pts) {
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) total += segLength(pts[i - 1], pts[i]);
  return total;
}

/* A 45° elbow from a to b: run along the long axis, bend for the short one. */
export function elbow([x1, y1], [x2, y2], bendFirst = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.min(Math.abs(dx), Math.abs(dy));
  const sx = Math.sign(dx) * d;
  const sy = Math.sign(dy) * d;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return bendFirst ? [[x1, y1], [x1 + sx, y1 + sy], [x2, y2]] : [[x1, y1], [x2 - sx, y1], [x2, y2]];
  }
  return bendFirst ? [[x1, y1], [x1 + sx, y1 + sy], [x2, y2]] : [[x1, y1], [x1, y2 - sy], [x2, y2]];
}

/* Sum of translate() currently applied to el and its ancestors (e.g. a reveal in flight),
   so compositions always measure the settled layout. */
function liveShift(el, root) {
  let x = 0;
  let y = 0;
  for (let n = el; n && n !== root && n.nodeType === 1; n = n.parentElement) {
    const t = getComputedStyle(n).transform;
    if (t && t !== 'none') { const m = new DOMMatrixReadOnly(t); x += m.m41; y += m.m42; }
  }
  return [x, y];
}

export function makeContext(root) {
  const base = root.getBoundingClientRect();
  const settled = (el, r) => {
    const [x, y] = liveShift(el, root);
    return x || y ? { left: r.left - x, right: r.right - x, top: r.top - y, bottom: r.bottom - y, width: r.width, height: r.height } : r;
  };
  const box = (r) => (r && r.width + r.height > 0 ? {
    left: r.left - base.left, right: r.right - base.left, top: r.top - base.top, bottom: r.bottom - base.top,
    width: r.width, height: r.height, cx: (r.left + r.right) / 2 - base.left, cy: (r.top + r.bottom) / 2 - base.top,
  } : null);
  return {
    root,
    W: root.offsetWidth,
    H: root.offsetHeight,
    vw: window.innerWidth,
    q: (sel) => root.querySelector(sel),
    qa: (sel) => [...root.querySelectorAll(sel)],
    rect: (el) => (el ? box(settled(el, el.getBoundingClientRect())) : null),
    /* Bounds of the text ink only (RTL-aligned text rarely fills its box). */
    ink: (el) => {
      if (!el) return null;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let u = null;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim()) continue;
        range.selectNodeContents(n);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        u = u ? { left: Math.min(u.left, r.left), right: Math.max(u.right, r.right), top: Math.min(u.top, r.top), bottom: Math.max(u.bottom, r.bottom) } : { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }
      return u ? box(settled(el, { ...u, width: u.right - u.left, height: u.bottom - u.top })) : null;
    },
  };
}
