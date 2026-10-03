/* The three official competition tracks, shared by the Competitions page and Home.
   Only track names, levels and focus areas are confirmed; everything else stays
   «يُحدَّد لاحقًا» until announced.

   ⚠ registrationUrl values are PLACEHOLDERS — replace each with the track's
   official Google Form link. */

export const PLACEHOLDER_FORM_URL = 'https://forms.gle/REPLACE-WITH-OFFICIAL-FORM';

export const competitions = [
  {
    id: 'university-robotics',
    title: 'مسابقة الروبوتات الجامعية',
    level: 'جامعي',
    focus: 'المستشعرات',
    icon: 'sensor',
    audience: 'طلاب وطالبات الجامعات',
    teamSize: 'يُحدَّد لاحقًا',
    date: 'يُحدَّد لاحقًا',
    registrationStatus: 'open',
    registrationUrl: PLACEHOLDER_FORM_URL,
  },
  {
    id: 'secondary-beginners',
    title: 'مسابقة الثانوي / المبتدئين',
    level: 'ثانوي',
    focus: 'وحدة التحكم',
    icon: 'controller',
    audience: 'طلاب وطالبات المرحلة الثانوية',
    teamSize: 'يُحدَّد لاحقًا',
    date: 'يُحدَّد لاحقًا',
    registrationStatus: 'open',
    registrationUrl: PLACEHOLDER_FORM_URL,
  },
  {
    id: 'cansat-rockets',
    title: 'كانسات / الصواريخ',
    level: 'جامعي',
    focus: 'المحاكاة',
    icon: 'cansat',
    audience: 'يُحدَّد لاحقًا',
    teamSize: 'يُحدَّد لاحقًا',
    date: 'يُحدَّد لاحقًا',
    registrationStatus: 'open',
    registrationUrl: PLACEHOLDER_FORM_URL,
  },
];
