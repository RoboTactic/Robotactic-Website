import { useEffect } from 'react';
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

// Start each page at the top when navigating between routes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/workshops" element={<Workshops />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/team" element={<Team />} />
          <Route path="/timeline" element={<Timeline />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
