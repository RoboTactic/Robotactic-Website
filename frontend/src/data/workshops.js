export const workshopDays = [
  { id: 'all', label: 'عرض الكل' },
  { id: 'jan-1', label: 'اليوم الأول - 1 يناير', heading: 'اليوم الأول - 1 يناير' },
  { id: 'jan-2', label: 'اليوم الثاني - 2 يناير', heading: 'اليوم الثاني - 2 يناير' },
  { id: 'jan-3', label: 'اليوم الثالث - 3 يناير', heading: 'اليوم الثالث - 3 يناير' },
  { id: 'jan-4', label: 'اليوم الرابع - 4 يناير', heading: 'اليوم الرابع - 4 يناير' },
];

export const workshops = [
  {
    id: 'robotics-fundamentals', dayId: 'jan-1', title: 'أساسيات الروبوتات',
    presenter: 'م. فلان الفلاني · م. فلانة الفلانية',
    description: 'تعرّف على أجزاء الروبوت، ثم طبّق مبادئ الحركة والاستشعار في نشاط عملي عن بُعد.',
    date: '1 يناير', time: '10:00 ص – 12:00 م', availableSeats: 20,
    registrationStatus: 'open', registrationUrl: '#',
  },
  {
    id: 'microcontrollers', dayId: 'jan-1', title: 'برمجة المتحكمات الدقيقة',
    presenter: 'م. فلان الفلاني',
    description: 'تعلّم توصيل المتحكمات بالحساسات وكتابة برنامج بسيط للتحكم في حركة الروبوت.',
    date: '1 يناير', time: '1:00 م – 3:00 م', availableSeats: 5,
    registrationStatus: 'open', registrationUrl: '#',
  },
  {
    id: 'electronic-circuits', dayId: 'jan-2', title: 'تصميم الدوائر الإلكترونية',
    presenter: 'م. فلانة الفلانية',
    description: 'تعرّف على مكوّنات الدوائر وقراءة مخططاتها، ثم صمّم دائرة بسيطة لمشروع روبوت.',
    date: '2 يناير', time: '11:00 ص – 1:00 م', availableSeats: 0,
    registrationStatus: 'closed', registrationUrl: '#',
  },
  {
    id: 'robotics-ai', dayId: 'jan-3', title: 'الذكاء الاصطناعي في الروبوتات',
    presenter: 'د. فلان الفلاني',
    description: 'استكشف كيف يستخدم الروبوت الرؤية الحاسوبية لاتخاذ قرارات بسيطة في بيئته.',
    date: '3 يناير', time: '4:00 م – 6:00 م', availableSeats: 15,
    registrationStatus: 'open', registrationUrl: '#',
  },
];

export const workshopEmptyState = {
  title: 'لا توجد ورش معلنة لهذا اليوم حتى الآن',
  description: 'تابع الصفحة لمعرفة الورش ومواعيد التسجيل عند اعتمادها.',
};
