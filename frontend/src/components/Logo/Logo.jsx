import { brand } from '../../data/site';
import './Logo.css';

const MARK_RATIO = 529 / 493; // official artwork, never stretched

/* Official RoboTactic lockup (white monochrome, Brand Guideline §0.4).
   horizontal — mark → wordmark (§0.1 order, not mirrored for RTL): navbar, menu, footer.
   stacked    — wordmark under the mark (§0.4): hero emblem.
   Proportions follow the guideline, so only the mark height is set. */
export default function Logo({ layout = 'horizontal', markHeight, className = '' }) {
  // markHeight → fixed size; omit it to size the logo from CSS (--logo-mark-h / --logo-mark-w)
  const style = markHeight ? { '--logo-mark-h': `${markHeight}px`, '--logo-mark-w': `${markHeight * MARK_RATIO}px` } : undefined;
  return (
    <span className={`logo logo--${layout} ${className}`} style={style}>
      <img className="logo__mark" src={brand.logoMark} alt="" width={markHeight ? Math.round(markHeight * MARK_RATIO) : undefined} height={markHeight} />
      <span className="logo__wordmark" lang="en">{brand.wordmark}</span>
    </span>
  );
}
