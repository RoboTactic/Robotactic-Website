/* Site-wide content shared by the Navbar, mobile menu and Footer.
   The approved public scope is exactly these seven pages. */

export const navLinks = [
  { label: 'الرئيسية', path: '/', labelEn: 'Home' },
  { label: 'عن الملتقى', path: '/about', labelEn: 'About' },
  { label: 'المسابقات', path: '/competitions', labelEn: 'Competitions' },
  { label: 'ورش العمل', path: '/workshops', labelEn: 'Workshops' },
  { label: 'المشاريع', path: '/projects', labelEn: 'Projects' },
  { label: 'الفريق', path: '/team', labelEn: 'Team' },
  { label: 'الجدول الزمني', path: '/timeline', labelEn: 'Timeline' },
];

export const brand = {
  name: 'RoboTactic',
  wordmark: 'ROBOTACTIC',
  slogan: ['ابتكار يقوده التفكير', 'Innovation driven by ideas'],
  copyright: '© 2026 RoboTactic',
  logoMark: '/logo/robotactic-mark-white.png', // official white mark, Brand Guideline §0.4
};

/* "سجّل الآن" never opens a form directly — each competition has its own
   Google Form, so registration starts on the Competitions page. */
export const registerCta = { label: 'سجّل الآن', labelEn: 'Register Now', path: '/competitions' };

/* The switch names the language you can change to, written in that language. */
export const languageSwitch = {
  en: { label: 'English', lang: 'en', ariaLabel: 'Switch to English' },
  ar: { label: 'العربية', lang: 'ar', ariaLabel: 'التبديل إلى العربية' },
};
