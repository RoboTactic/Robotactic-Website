/* Home page copy — taken verbatim from the approved Figma Home design. */

export const hero = {
  eyebrow: 'ملتقى روبوتاكتيك · 2026',
  title: 'ابتكار يقوده التفكير',
  description:
    'ملتقى تقني يجمع بين الابتكار والتقنية والتفكير الاستراتيجي، ويضم مسابقات الروبوتات ومعرض المشاريع لطلاب وطالبات المرحلتين الثانوية والجامعية.',
  primaryAction: { label: 'استكشف المسابقات', path: '/competitions' },
  secondaryAction: { label: 'تعرّف على الملتقى', path: '/about' },
};

export const about = {
  overline: 'ABOUT ROBOTACTIC',
  title: 'عن الملتقى',
  subtitle: 'تجربة متكاملة تجمع بين التنافس والتعلّم واستعراض الابتكارات في بيئة تفاعلية ملهمة.',
  body:
    'يرتكز الملتقى على مسابقات الروبوتات التي تستهدف طلاب وطالبات المرحلتين الثانوية والجامعية، بهدف تنمية مهارات التصميم والبرمجة وحل المشكلات والعمل الجماعي والتفكير الاستراتيجي من خلال تحديات عملية تحاكي مواقف واقعية. ويصاحب الملتقى معرض للمشاريع والابتكارات ذات العلاقة بالقطاعات الدفاعية في المملكة.',
  values: ['الابتكار والإبداع', 'التفكير الاستراتيجي', 'التميّز والجودة', 'الاحترافية', 'التعاون والعمل الجماعي'],
};

export const countdown = {
  overline: 'COUNTDOWN',
  title: 'انطلاق الملتقى',
  note: 'الموعد الرسمي يُعلَن لاحقًا — القيم المعروضة توضيحية.',
  /* The official date isn't announced yet. Set `targetDate` to an ISO date
     (e.g. '2026-11-19T09:00:00+03:00') and the countdown will tick live;
     until then the MOCK values below are shown. */
  targetDate: null,
  mockValues: { days: 7, hours: 6, minutes: 18, seconds: 42 },
};

export const sections = {
  competitions: { overline: 'COMPETITIONS', title: 'المسابقات', action: { label: 'عرض كل المسابقات', path: '/competitions' } },
  workshops: { overline: 'WORKSHOPS', title: 'ورش العمل', action: { label: 'عرض كل الورش', path: '/workshops' } },
  liveNow: { overline: 'LIVE NOW', title: 'مباشر الآن' },
};

export const cta = {
  title: 'مستعدّ للمنافسة؟',
  description: 'اختر مسارك وسجّل فريقك عبر نموذج التسجيل الرسمي.',
  action: { label: 'استعرض المسابقات', path: '/competitions' },
};
