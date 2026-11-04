import { useEffect, useLayoutEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Competitions from './pages/Competitions/Competitions';
import Workshops from './pages/Workshops/Workshops';
import Projects from './pages/Projects/Projects';
import Team from './pages/Team/Team';
import Timeline from './pages/Timeline/Timeline';
import Dashboard from './pages/Dashboard/Dashboard';
import NotFound from './pages/NotFound/NotFound';
import { useLanguage } from './services/api/publicContentLanguage';
import { PublicSectionState, useSectionVisibility } from './services/api/SectionVisibility';

/* Browser titles for the public routes; the 404 page sets its own, and the Dashboard is left alone. */
const pageTitles = {
  '/': ['RoboTactic 2026 — ابتكار يقوده التفكير', 'RoboTactic 2026 — Innovation driven by ideas'],
  '/about': ['من نحن | RoboTactic', 'About Us | RoboTactic'],
  '/competitions': ['المسابقات | RoboTactic', 'Competitions | RoboTactic'],
  '/workshops': ['ورش العمل | RoboTactic', 'Workshops | RoboTactic'],
  '/projects': ['معرض المشاريع | RoboTactic', 'Project Showroom | RoboTactic'],
  '/team': ['الفريق | RoboTactic', 'Team | RoboTactic'],
  '/timeline': ['الجدول الزمني | RoboTactic', 'Timeline | RoboTactic'],
};
const metaDescription = ['RoboTactic 2026 — ابتكار يقوده التفكير', 'RoboTactic 2026 — Innovation driven by ideas'];

// Start each page at the top when navigating between routes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PublicPage({ children }) {
  const { pathname } = useLocation();
  const { isPathVisible } = useSectionVisibility();
  return <PublicSectionState>{isPathVisible(pathname) ? children : <NotFound />}</PublicSectionState>;
}

export default function App() {
  const { pathname } = useLocation();
  const isDashboard = pathname.startsWith('/dashboard');
  const { isPathVisible } = useSectionVisibility();
  // Share the approved Refined Dark surface tokens with the dashboard; its
  // compact forms and navigation retain their own layout.
  useLayoutEffect(() => {
    document.documentElement.classList.add('rt-refined');
    // Public-only language styling (English typeface); the Dashboard has its own.
    document.documentElement.classList.toggle('rt-public', !isDashboard);
  }, [isDashboard]);
  const { language, t } = useLanguage();
  useEffect(() => {
    if (isDashboard || !isPathVisible(pathname)) return;
    const title = pageTitles[pathname.replace(/\/+$/, '') || '/'];
    if (title) document.title = t(title);
    document.querySelector('meta[name="description"]')?.setAttribute('content', t(metaDescription));
  }, [isDashboard, pathname, language, isPathVisible]);
  return (
    <>
      <ScrollToTop />
      {!isDashboard && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<PublicPage><About /></PublicPage>} />
          <Route path="/competitions" element={<PublicPage><Competitions /></PublicPage>} />
          <Route path="/workshops" element={<PublicPage><Workshops /></PublicPage>} />
          <Route path="/projects" element={<PublicPage><Projects /></PublicPage>} />
          <Route path="/team" element={<PublicPage><Team /></PublicPage>} />
          <Route path="/timeline" element={<PublicPage><Timeline /></PublicPage>} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          {/* Unknown public URLs only; /dashboard/* is matched above and keeps its own auth/access states. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </>
  );
}
