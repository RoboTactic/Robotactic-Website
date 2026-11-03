/* Home page copy — taken verbatim from the approved Figma Home design. */

import { PLACEHOLDER_FORM_URL } from './competitions';

/* Text fields are [Arabic, English] pairs, resolved with useLanguage().t. */
export const hero = {
  eyebrow: ['ملتقى روبوتاكتيك · 2026', 'RoboTactic Forum · 2026'],
  title: ['ابتكار يقوده التفكير', 'Innovation driven by ideas'],
  description: [
    'ملتقى تقني يجمع بين الابتكار والتقنية والتفكير الاستراتيجي، ويضم مسابقات الروبوتات ومعرض المشاريع لطلاب وطالبات المرحلتين الثانوية والجامعية.',
    'A technology forum exploring innovation and strategic thinking through robotics competitions and a student project showcase for secondary-school and university students.',
  ],
  primaryAction: { label: ['استكشف المسابقات', 'Explore competitions'], path: '/competitions' },
  secondaryAction: { label: ['من نحن', 'About Us'], path: '/about' },
};

export const about = {
  overline: 'About Us',
  title: 'من نحن',
  subtitle: 'تجربة متكاملة تجمع بين التنافس والتعلّم واستعراض الابتكارات في بيئة تفاعلية ملهمة.',
  body:
    'يرتكز الملتقى على مسابقات الروبوتات التي تستهدف طلاب وطالبات المرحلتين الثانوية والجامعية، بهدف تنمية مهارات التصميم والبرمجة وحل المشكلات والعمل الجماعي والتفكير الاستراتيجي من خلال تحديات عملية تحاكي مواقف واقعية. ويصاحب الملتقى معرض للمشاريع والابتكارات ذات العلاقة بالقطاعات الدفاعية في المملكة.',
  values: ['الابتكار والإبداع', 'التفكير الاستراتيجي', 'التميّز والجودة', 'الاحترافية', 'التعاون والعمل الجماعي'],
};

export const countdown = {
  overline: 'COUNTDOWN',
  title: ['انطلاق الملتقى', 'Forum launch'],
  note: ['الموعد الرسمي يُعلَن لاحقًا — القيم المعروضة توضيحية.', 'The official date will be announced later — the values shown are illustrative.'],
  /* The official date isn't announced yet. Set `targetDate` to an ISO date
     (e.g. '2026-11-19T09:00:00+03:00') and the countdown will tick live;
     until then the MOCK values below are shown. */
  targetDate: null,
  mockValues: { days: 7, hours: 6, minutes: 18, seconds: 42 },
};

export const sections = {
  competitions: { overline: 'COMPETITIONS', title: ['المسابقات', 'Competitions'], action: { label: ['عرض كل المسابقات', 'View all competitions'], path: '/competitions' } },
  workshops: { overline: 'WORKSHOPS', title: ['ورش العمل', 'Workshops'], action: { label: ['عرض كل الورش', 'View all workshops'], path: '/workshops' } },
  liveNow: { overline: 'LIVE NOW', title: ['مباشر الآن', 'Live now'] },
};

/* Home's Workshops preview shows only the currently confirmed workshop.
   (data/workshops.js holds the Workshops page's schedule mock-up, which is
   not announced yet — don't surface it on Home.) */
export const confirmedWorkshop = {
  id: 'technical-workshops',
  title: 'ورش تقنية مصاحبة',
  description: 'جلسات عملية ضمن برنامج الملتقى. العناوين والمواعيد تُحدَّد لاحقًا.',
  date: 'يُحدَّد لاحقًا',
  time: 'يُحدَّد لاحقًا',
  registrationStatus: 'open',
  registrationUrl: PLACEHOLDER_FORM_URL, // ⚠ placeholder — replace with the official Google Form
};

export const cta = {
  title: ['مستعدّ للمنافسة؟', 'Ready to compete?'],
  description: ['اختر مسارك وسجّل فريقك عبر نموذج التسجيل الرسمي.', 'Choose your track and register your team through the official registration form.'],
  action: { label: ['استعرض المسابقات', 'Browse competitions'], path: '/competitions' },
};
