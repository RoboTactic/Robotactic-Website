import { NavLink } from 'react-router-dom';
import { navLinks } from '../../data/site';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="logo" aria-label="RoboTactic">
          ROBOTACTIC
        </NavLink>

        <nav aria-label="التنقل الرئيسي">
          {navLinks.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
