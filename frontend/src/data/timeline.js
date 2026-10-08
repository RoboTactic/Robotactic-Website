export const timelineDays = [
  { id: 'all', label: 'جميع الأيام' },
  { id: 'jan-1', label: 'اليوم الأول - 1 يناير' },
  { id: 'jan-2', label: 'اليوم الثاني - 2 يناير' },
  { id: 'jan-3', label: 'اليوم الثالث - 3 يناير' },
  { id: 'jan-4', label: 'اليوم الرابع - 4 يناير' },
];

export const timeline = [
  {
    id: 'jan-1', title: 'اليوم الأول', date: '1 يناير',
    events: [
      { id: 'robotics-fundamentals', type: 'ورشة عمل', title: 'أساسيات الروبوتات', time: '10:00 ص – 12:00 م', presenter: 'م. فلان الفلاني · م. فلانة الفلانية' },
      { id: 'microcontrollers', type: 'ورشة عمل', title: 'برمجة المتحكمات الدقيقة', time: '1:00 م – 3:00 م', presenter: 'م. فلان الفلاني' },
      { id: 'opening-session', type: 'جلسة حوارية', title: 'الابتكار في صناعة الروبوتات', time: '3:30 م – 4:30 م', presenter: 'د. فلانة الفلانية' },
      { id: 'sensor-challenge', type: 'تحدي تقني', title: 'تحدي المستشعرات والحركة', time: '5:00 م – 6:00 م', presenter: 'فريق المسابقات' },
      { id: 'project-pitch-one', type: 'عرض مشروع', title: 'من الفكرة إلى النموذج الأولي', time: '6:30 م – 7:30 م', presenter: 'فريق أثر' },
    ],
  },
  {
    id: 'jan-2', title: 'اليوم الثاني', date: '2 يناير',
    events: [
      { id: 'electronic-circuits', type: 'ورشة عمل', title: 'تصميم الدوائر الإلكترونية', time: '9:00 ص – 11:00 ص', presenter: 'م. فلانة الفلانية' },
      { id: 'controller-competition', type: 'مسابقة', title: 'مسابقة وحدة التحكم للمبتدئين', time: '11:30 ص – 1:30 م', presenter: 'لجنة تحكيم RoboTactic' },
      { id: 'robot-mechanics', type: 'ورشة عمل', title: 'الميكانيكا وتصميم هيكل الروبوت', time: '2:00 م – 4:00 م', presenter: 'م. فلان الفلاني' },
      { id: 'teamwork-panel', type: 'جلسة حوارية', title: 'بناء فريق تقني متكامل', time: '4:30 م – 5:30 م', presenter: 'قادة الفرق المشاركة' },
      { id: 'navigation-challenge', type: 'تحدي تقني', title: 'تحدي الملاحة وتجاوز العوائق', time: '6:00 م – 7:30 م', presenter: 'فريق المسابقات' },
    ],
  },
  {
    id: 'jan-3', title: 'اليوم الثالث', date: '3 يناير',
    events: [
      { id: 'robotics-ai', type: 'ورشة عمل', title: 'الذكاء الاصطناعي في الروبوتات', time: '9:00 ص – 11:00 ص', presenter: 'د. فلان الفلاني' },
      { id: 'computer-vision', type: 'ورشة عمل', title: 'الرؤية الحاسوبية وتتبع الأجسام', time: '11:30 ص – 1:30 م', presenter: 'م. فلانة الفلانية' },
      { id: 'university-robotics', type: 'مسابقة', title: 'مسابقة الروبوتات الجامعية', time: '2:00 م – 4:00 م', presenter: 'لجنة تحكيم RoboTactic' },
      { id: 'sustainable-robotics', type: 'جلسة حوارية', title: 'الروبوتات والاستدامة', time: '4:30 م – 5:30 م', presenter: 'خبراء التقنية والاستدامة' },
      { id: 'autonomous-mission', type: 'تحدي تقني', title: 'مهمة الروبوت المستقل', time: '6:00 م – 7:30 م', presenter: 'فريق المسابقات' },
    ],
  },
  {
    id: 'jan-4', title: 'اليوم الرابع', date: '4 يناير',
    events: [
      { id: 'cansat-simulation', type: 'مسابقة', title: 'محاكاة كانسات والصواريخ', time: '9:00 ص – 11:00 ص', presenter: 'لجنة تحكيم RoboTactic' },
      { id: 'prototype-testing', type: 'ورشة عمل', title: 'اختبار النماذج وتحسين الأداء', time: '11:30 ص – 1:00 م', presenter: 'م. فلان الفلاني' },
      { id: 'project-showcase', type: 'عرض مشروع', title: 'عرض المشاريع الطلابية', time: '1:30 م – 3:00 م', presenter: 'الفرق المشاركة' },
      { id: 'judges-panel', type: 'جلسة حوارية', title: 'ملاحظات المحكمين وتجارب الفرق', time: '3:30 م – 4:30 م', presenter: 'لجنة التحكيم وقادة الفرق' },
      { id: 'closing-ceremony', type: 'حفل ختامي', title: 'إعلان النتائج وتكريم الفائزين', time: '5:00 م – 6:30 م', presenter: 'فريق تنظيم RoboTactic' },
    ],
  },
];
