import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Competitions from './pages/Competitions/Competitions';
import Workshops from './pages/Workshops/Workshops';
import Projects from './pages/Projects/Projects';
import Team from './pages/Team/Team';
import Timeline from './pages/Timeline/Timeline';

export default function App() {
  return (
    <>
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
