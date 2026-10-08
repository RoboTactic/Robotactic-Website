import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import CountdownSection from './sections/CountdownSection';
import CompetitionsPreview from './sections/CompetitionsPreview';
import WorkshopsPreview from './sections/WorkshopsPreview';
import LiveNowSection from './sections/LiveNowSection';
import CtaSection from './sections/CtaSection';
import HomeCircuit from './HomeCircuit';
import { useLayoutEffect, useRef } from 'react';
import './Home.css';

/* Home — section order follows the approved Figma Home:
   Hero → About → Countdown → Competitions → Workshops → Live Now → CTA
   (Navbar and Footer come from the app shell). */
export default function Home() {
  const rootRef = useRef(null);
  // Refined Dark (Phase 1): theme the shell (Navbar/Footer/tokens) only while Home is mounted.
  useLayoutEffect(() => {
    document.documentElement.classList.add('rt-refined');
    return () => document.documentElement.classList.remove('rt-refined');
  }, []);
  return (
    <div className="home" ref={rootRef}>
      <HomeCircuit rootRef={rootRef} />
      <HeroSection />
      <AboutSection />
      <CountdownSection />
      <CompetitionsPreview />
      <WorkshopsPreview />
      <LiveNowSection />
      <CtaSection />
      <div className="home__end" aria-hidden="true" />
    </div>
  );
}
