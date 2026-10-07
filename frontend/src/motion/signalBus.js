/*
  Page-wide signal coordinator — "only one major signal at a time".
  A job is { owner, run(done), settle(), isVisible() }. While a job runs, at most one
  more waits; a newer request settles (instantly reveals) the waiting one, and a waiting
  job whose section has left the viewport is settled instead of played. Content never
  waits behind more than one animation.
*/
let running = null;
let queued = null;
const listeners = new Set();

const notify = () => {
  document.documentElement.classList.toggle('rt-busy', running !== null);
  listeners.forEach((fn) => fn(running !== null));
};

function start(job) {
  running = job;
  notify();
  let finished = false;
  job.run(() => {
    if (finished || running !== job) return;
    finished = true;
    running = null;
    notify();
    const next = queued;
    queued = null;
    if (next) { if (next.isVisible()) start(next); else next.settle(); }
  });
}

export const signalBus = {
  request(job) {
    if (!running) { start(job); return; }
    if (queued) queued.settle();
    queued = job;
  },
  /* Drop every job of an unmounting layer (its own timers/animations are cancelled by the owner). */
  release(owner) {
    if (queued?.owner === owner) queued = null;
    if (running?.owner === owner) {
      running = null;
      notify();
      const next = queued;
      queued = null;
      if (next) { if (next.isVisible()) start(next); else next.settle(); }
    }
  },
  get busy() { return running !== null; },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

export const prefersReducedMotion = () => typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const motionSupported = () => typeof window !== 'undefined'
  && 'IntersectionObserver' in window && Boolean(Element.prototype.animate) && !prefersReducedMotion();
