/* Site-wide content shared by the Navbar, mobile menu and Footer.
   The approved public scope is exactly these seven pages. */

export const navLinks = [
  { label: 'الرئيسية', path: '/' },
  { label: 'عن الملتقى', path: '/about' },
  { label: 'المسابقات', path: '/competitions' },
  { label: 'ورش العمل', path: '/workshops' },
  { label: 'المشاريع', path: '/projects' },
  { label: 'الفريق', path: '/team' },
  { label: 'الجدول الزمني', path: '/timeline' },
];

export const brand = {
  name: 'RoboTactic',
  wordmark: 'ROBOTACTIC',
  slogan: 'ابتكار يقوده التفكير',
  copyright: '© 2026 RoboTactic',
  logoMark: '/logo/robotactic-mark-white.png', // official white mark, Brand Guideline §0.4
};

/* "سجّل الآن" never opens a form directly — each competition has its own
   Google Form, so registration starts on the Competitions page. */
export const registerCta = { label: 'سجّل الآن', path: '/competitions' };

export const languageSwitch = { label: 'English', lang: 'en' };
