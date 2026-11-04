import { useLanguage } from '../../services/api/publicContentLanguage';
import './LoadingScreen.css';

// Decorative circuitry, shared with the Team/Timeline visual language; no artificial progress.
export default function LoadingScreen({ compact = false }) {
  const { language, dir, t } = useLanguage();
  return (
    <div className={`loading-screen${compact ? ' loading-screen--compact' : ''}`} lang={language} dir={dir} role="status" aria-live="polite">
      <span className="sr-only">{t('جارٍ تحميل المحتوى', 'Loading content')}</span>
      <div className="loading-screen__content" aria-hidden="true">
        <p className="loading-screen__brand" lang="en" dir="ltr">RoboTactic</p>
        <svg className="loading-screen__circuit" viewBox="0 0 320 184" fill="none" focusable="false">
          <g className="loading-screen__traces">
            <path d="M8 92H66L90 68H112M208 116H230L254 92H312M54 142H86L108 120M212 64L234 42H266M160 8V30M160 154V176" />
            <circle cx="160" cy="92" r="62" />
            <path d="M160 42V50M160 134V142M110 92H118M202 92H210" />
          </g>
          <circle className="loading-screen__orbit" cx="160" cy="92" r="50" />
          <path className="loading-screen__signal" d="M8 92H66L90 68H112" pathLength="100" />
          <path className="loading-screen__signal loading-screen__signal--out" d="M208 116H230L254 92H312" pathLength="100" />
          <g className="loading-screen__nodes">
            <circle cx="8" cy="92" r="3" /><circle cx="312" cy="92" r="3" />
            <circle cx="54" cy="142" r="3" /><circle cx="266" cy="42" r="3" />
            <circle cx="160" cy="8" r="3" /><circle cx="160" cy="176" r="3" />
          </g>
          <rect className="loading-screen__chip" x="136" y="68" width="48" height="48" rx="12" />
          <path className="loading-screen__pins" d="M148 61V68M160 61V68M172 61V68M148 116V123M160 116V123M172 116V123M129 80H136M129 92H136M129 104H136M184 80H191M184 92H191M184 104H191" />
          <circle className="loading-screen__core-ring" cx="160" cy="92" r="10" />
          <circle className="loading-screen__core" cx="160" cy="92" r="4" />
        </svg>
        <p className="loading-screen__title">{t('لحظات وننطلق', 'Getting ready')}</p>
        {!compact && <p className="loading-screen__slogan">{t('ابتكار يقوده التفكير', 'Innovation driven by ideas')}</p>}
        <div className="loading-screen__rail"><span /></div>
      </div>
    </div>
  );
}
