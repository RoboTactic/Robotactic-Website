import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import { contentLanguage } from '../../services/api/publicContentLanguage';
import { prefersReducedMotion } from '../../motion/signalBus';
import SignalArt from './SignalArt';
import { destinations, resolveSignal } from './resolveSignal';
import './NotFound.css';

const copy = {
  ar: {
    title: 'يبدو أننا فقدنا الإشارة!',
    body: 'الصفحة التي تبحث عنها خرجت عن نطاق التغطية، لكن طريق العودة ما زال متاحًا.',
    home: 'العودة للرئيسية', back: 'الرجوع للخلف', retry: 'إعادة الاتصال', retrying: 'جارٍ إعادة الاتصال…',
    requested: 'العنوان المطلوب',
    noBack: 'لا توجد صفحة سابقة داخل الموقع. يمكنك العودة للرئيسية أو اختيار قسم.',
    found: (label) => `التقطنا إشارة قريبة: هل تقصد صفحة «${label}»؟`, go: (label) => `الانتقال إلى ${label}`,
    none: (n) => `ما زالت الإشارة مفقودة لهذا العنوان${n > 1 ? ` (المحاولة ${n})` : ''}. اختر وجهة من الأقسام المتاحة:`,
    sections: 'أقسام الموقع', docTitle: 'الإشارة مفقودة — 404 | RoboTactic',
  },
  en: {
    title: 'Looks like we lost the signal!',
    body: 'The page you’re looking for is out of coverage, but the way back is still open.',
    home: 'Back to home', back: 'Go back', retry: 'Reconnect', retrying: 'Reconnecting…',
    requested: 'Requested address',
    noBack: 'There is no previous page on this site. Go home or choose a section.',
    found: (label) => `We picked up a nearby signal: did you mean the “${label}” page?`, go: (label) => `Go to ${label}`,
    none: (n) => `The signal is still lost for this address${n > 1 ? ` (attempt ${n})` : ''}. Choose one of the sections:`,
    sections: 'Site sections', docTitle: 'Signal lost — 404 | RoboTactic',
  },
};

/* Desktop only: nearby nodes brighten as the pointer approaches. Work happens only on
   pointer movement (one rAF per frame at most) — nothing renders continuously. */
function usePointerNodes(rootRef, artRef) {
  useEffect(() => {
    const root = rootRef.current; const art = artRef.current;
    if (!root || !art || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const nodes = [...art.querySelectorAll('.nf-node')];
    let centres = null; let frame = 0; let point = null;
    const measure = () => { centres = nodes.map((node) => { const r = node.querySelector('.nf-node-core').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); };
    const invalidate = () => { centres = null; };
    const paint = () => {
      frame = 0; if (!centres) measure();
      nodes.forEach((node, i) => {
        const near = point ? Math.max(0, 1 - Math.hypot(point[0] - centres[i][0], point[1] - centres[i][1]) / 150) ** 2 : 0;
        const value = near < 0.02 ? '0' : near.toFixed(2);
        if (node.style.getPropertyValue('--near') !== value) node.style.setProperty('--near', value);
      });
    };
    const move = (event) => { point = [event.clientX, event.clientY]; if (!frame) frame = requestAnimationFrame(paint); };
    const leave = () => { point = null; if (!frame) frame = requestAnimationFrame(paint); };
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', leave);
    window.addEventListener('resize', invalidate);
    window.addEventListener('scroll', invalidate, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave);
      window.removeEventListener('resize', invalidate); window.removeEventListener('scroll', invalidate);
    };
  }, [rootRef, artRef]);
}

export default function NotFound() {
  const location = useLocation(); const navigate = useNavigate();
  const language = contentLanguage(); const ar = language === 'ar'; const text = copy[language];
  const rootRef = useRef(null); const artRef = useRef(null); const timer = useRef(0);
  const [run, setRun] = useState(0); const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState({ kind: 'idle' }); // idle | reconnecting | near | none | noBack
  usePointerNodes(rootRef, artRef);

  useEffect(() => {
    const previous = document.title; document.title = text.docTitle;
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex'; document.head.append(robots);
    return () => { document.title = previous; robots.remove(); };
  }, [text.docTitle]);
  useEffect(() => { clearTimeout(timer.current); setStatus({ kind: 'idle' }); setAttempts(0); }, [location.pathname]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else setStatus({ kind: 'noBack' });
  };
  const reconnect = () => {
    if (status.kind === 'reconnecting') return;
    setStatus({ kind: 'reconnecting' }); setRun((value) => value + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const result = resolveSignal(location.pathname);
      setAttempts((value) => value + 1);
      if (result.kind === 'exact') navigate(`${result.path}${location.search}${location.hash}`, { replace: true });
      else setStatus(result);
    }, prefersReducedMotion() ? 250 : 1350);
  };

  const artState = status.kind === 'reconnecting' ? 'reconnecting' : status.kind === 'near' ? 'found' : status.kind === 'none' ? 'failed' : 'lost';
  const requested = `${location.pathname}${location.search}`;

  return (
    <section ref={rootRef} className="nf" lang={language} dir={ar ? 'rtl' : 'ltr'} aria-labelledby="nf-title">
      <svg className="nf-backdrop" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <g className="nf-backdrop-traces" fill="none">
          <path d="M0 150H230L270 190H430" /><path d="M0 230H120L150 260H260" /><path d="M1440 130H1250L1210 170H1060" />
          <path d="M1440 250H1330L1300 280H1180" /><path d="M0 720H170L220 670H370" /><path d="M1440 760H1270L1220 710H1090" />
          <path d="M620 0V50L660 90H780" /><path d="M820 900V840L860 800H980" /><path d="M300 900V820L340 780" /><path d="M1150 0V70L1110 110" />
        </g>
        <g className="nf-backdrop-nodes">
          {[[430, 190], [260, 260], [1060, 170], [1180, 280], [370, 670], [1090, 710], [780, 90], [980, 800], [340, 780], [1110, 110]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" />)}
        </g>
        <path className="nf-backdrop-packet" d="M0 720H170L220 670H370" pathLength="1" fill="none" />
        <path className="nf-backdrop-packet nf-backdrop-packet--late" d="M1440 130H1250L1210 170H1060" pathLength="1" fill="none" />
      </svg>

      <div className="nf-inner">
        <p className="nf-overline" lang="en" dir="ltr"><span>ERROR 404</span><i aria-hidden="true" /><span>SIGNAL LOST</span></p>
        <div className="nf-art-wrap"><SignalArt ref={artRef} run={run} state={artState} /></div>

        <div className="nf-copy">
          <h1 id="nf-title">{text.title}</h1>
          <p className="nf-body">{text.body}</p>
          <p className="nf-requested"><span>{text.requested}:</span> <bdi dir="ltr">{requested.length > 64 ? `${requested.slice(0, 61)}…` : requested}</bdi></p>

          <div className="nf-actions">
            <Button to="/" variant="primary" className="nf-btn nf-btn--home">{text.home}</Button>
            <button type="button" className="button button--outline button--large t-button nf-btn" onClick={goBack}>{text.back}</button>
            <button type="button" className="button button--secondary button--large t-button nf-btn nf-btn--retry" onClick={reconnect}
              aria-describedby="nf-status" aria-disabled={status.kind === 'reconnecting'} data-busy={status.kind === 'reconnecting' || undefined}>
              <span className="nf-retry-icon" aria-hidden="true" />
              <span>{status.kind === 'reconnecting' ? text.retrying : text.retry}</span>
            </button>
          </div>

          <div id="nf-status" className={`nf-status nf-status--${status.kind}`} role="status" aria-live="polite">
            {status.kind === 'reconnecting' && <p>{text.retrying}</p>}
            {status.kind === 'noBack' && <p>{text.noBack}</p>}
            {status.kind === 'near' && <>
              <p>{text.found(status.label[ar ? 0 : 1])}</p>
              <Link className="nf-suggest" to={status.path}>{text.go(status.label[ar ? 0 : 1])}<span aria-hidden="true" className="nf-arrow" /></Link>
            </>}
            {(status.kind === 'none' || status.kind === 'noBack') && <>
              {status.kind === 'none' && <p>{text.none(attempts)}</p>}
              <nav aria-label={text.sections}><ul className="nf-sections">
                {destinations.filter(({ path }) => path !== '/').map(({ path, label }) => <li key={path}><Link to={path}>{label[ar ? 0 : 1]}</Link></li>)}
              </ul></nav>
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}
