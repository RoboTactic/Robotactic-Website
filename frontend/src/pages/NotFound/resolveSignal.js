import { matchPath } from 'react-router-dom';
import { navLinks } from '../../data/site';

/*
  "إعادة الاتصال" — re-resolves the requested URL against the real public routes.
  1. exact: the path now matches a route (e.g. the route table changed) → safe to open.
  2. near: a recognisable alias, Arabic slug or small typo of a real route → offered, never opened automatically.
  3. none: still unresolved.
  Only real routes from the shared navigation are ever suggested.
*/
const englishLabels = {
  '/': 'Home', '/about': 'About', '/competitions': 'Competitions', '/workshops': 'Workshops',
  '/projects': 'Projects', '/team': 'Team', '/timeline': 'Timeline', '/dashboard': 'Dashboard',
};
export const destinations = [
  ...navLinks.map(({ label, path }) => ({ path, label: [label, englishLabels[path]] })),
];
const dashboard = { path: '/dashboard', label: ['لوحة التحكم', 'Dashboard'] };
const known = [...destinations, dashboard];
const byPath = Object.fromEntries(known.map((item) => [item.path, item]));

const aliases = {
  '': '/', home: '/', index: '/', main: '/', 'الرئيسية': '/',
  about: '/about', 'about-us': '/about', aboutus: '/about', event: '/about', 'عن-الملتقى': '/about', 'عن': '/about',
  competitions: '/competitions', competition: '/competitions', contests: '/competitions', contest: '/competitions', challenges: '/competitions', register: '/competitions', registration: '/competitions', 'المسابقات': '/competitions', 'مسابقات': '/competitions',
  workshops: '/workshops', workshop: '/workshops', sessions: '/workshops', 'ورش-العمل': '/workshops', 'الورش': '/workshops', 'ورش': '/workshops',
  projects: '/projects', project: '/projects', showroom: '/projects', showcase: '/projects', exhibition: '/projects', 'المشاريع': '/projects', 'معرض-المشاريع': '/projects',
  team: '/team', 'team-members': '/team', members: '/team', organizers: '/team', organisers: '/team', 'الفريق': '/team', 'فريق-الملتقى': '/team',
  timeline: '/timeline', schedule: '/timeline', agenda: '/timeline', program: '/timeline', programme: '/timeline', 'الجدول-الزمني': '/timeline', 'الجدول': '/timeline',
  dashboard: '/dashboard', admin: '/dashboard', login: '/dashboard', 'sign-in': '/dashboard', 'لوحة-التحكم': '/dashboard',
};

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

function firstSegment(pathname) {
  let path = pathname;
  try { path = decodeURIComponent(pathname); } catch { /* keep the raw path */ }
  return path.toLowerCase().replace(/\/{2,}/g, '/').replace(/\.(html?|php|aspx?)$/, '').replace(/\/index$/, '')
    .split('/').filter(Boolean)[0]?.replace(/[\s_]+/g, '-').replace(/[^\p{L}\p{N}-]+$/u, '') ?? '';
}

export function resolveSignal(pathname) {
  const exact = known.find(({ path }) => matchPath({ path, end: path !== '/dashboard' }, pathname));
  if (exact) return { kind: 'exact', ...exact };
  const segment = firstSegment(pathname);
  if (segment in aliases) return { kind: 'near', ...byPath[aliases[segment]] };
  const slugs = Object.keys(aliases).filter((key) => /^[a-z-]{4,}$/.test(key));
  let best = null;
  for (const slug of slugs) {
    const d = distance(segment, slug);
    if (d <= Math.max(1, Math.floor(slug.length / 4)) && (!best || d < best.d)) best = { d, slug };
  }
  return best ? { kind: 'near', ...byPath[aliases[best.slug]] } : { kind: 'none' };
}
