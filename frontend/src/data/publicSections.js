export const publicSections = [
  { key: 'competitions', resource: 'competitions', path: '/competitions', label: ['المسابقات', 'Competitions'] },
  { key: 'workshops', resource: 'workshops', path: '/workshops', label: ['ورش العمل', 'Workshops'] },
  { key: 'projects', resource: 'projects', path: '/projects', label: ['معرض المشاريع', 'Project showcase'] },
  { key: 'announcements', resource: 'announcements', label: ['الإعلانات', 'Announcements'] },
  { key: 'about', resource: 'about', path: '/about', label: ['من نحن', 'About Us'] },
  { key: 'team', resource: 'team-members', path: '/team', label: ['الفريق', 'Team'] },
  { key: 'timeline', resource: 'site-visibility', path: '/timeline', label: ['الجدول الزمني', 'Timeline'] },
];

export function isSectionVisible(visibility, section) {
  return visibility?.[section] === true;
}

export function isPublicPathVisible(visibility, path) {
  let pathname = String(path || '/').split(/[?#]/)[0];
  try { pathname = decodeURIComponent(pathname); } catch { /* Keep malformed URLs unavailable to the route table. */ }
  pathname = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const section = publicSections.find(item => item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`)));
  return !section || isSectionVisible(visibility, section.key);
}

export function canManageVisibility(admin, section) {
  if (!admin) return false;
  if (admin.role_code === 'super_admin') return true;
  return !['about', 'team-members', 'site-visibility'].includes(section.resource) && admin.permissions?.includes(section.resource) === true;
}
