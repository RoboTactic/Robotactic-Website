import { NavLink } from 'react-router-dom';
import { navLinks } from '../../data/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <strong>ROBOTACTIC</strong>
          <p>© 2026 RoboTactic</p>
        </div>

        <nav aria-label="روابط الفوتر">
          {navLinks.map(({ label, path }) => (
            <NavLink key={path} to={path}>{label}</NavLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
