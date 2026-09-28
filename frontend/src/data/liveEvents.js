/* ⚠ DEMO DATA — NOT OFFICIAL EVENT INFORMATION.
   These three events exist only so the Live Now layout can be reviewed.
   Replace them with the official schedule before launch, or export an empty
   array to show the empty state.

   status: 'live' | 'upcoming' */

export const LIVE_EVENTS_ARE_DEMO = true;

export const liveEvents = [
  { id: 'demo-1', status: 'live', title: 'التصفيات الأولى — مسابقة الروبوتات الجامعية', time: '10:30 ص', location: 'القاعة الرئيسية' },
  { id: 'demo-2', status: 'upcoming', title: 'ورشة تقنية مصاحبة', time: '12:00 م', location: 'قاعة الورش' },
  { id: 'demo-3', status: 'upcoming', title: 'جلسة تعريفية بالمسارات', time: '02:00 م', location: 'المنصة الرئيسية' },
];

export const liveEmptyState = {
  message: 'لا توجد فعاليات مباشرة الآن.',
  supporting: 'تابع الجدول لمعرفة الفعاليات القادمة.',
};
