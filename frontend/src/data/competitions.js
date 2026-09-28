/* The three official competition tracks. Only the track name, level and
   focus area are confirmed — nothing else is invented. Unconfirmed details
   stay as «يُحدَّد لاحقًا».

   ⚠ registrationUrl values are PLACEHOLDERS. Replace each with the track's
   official Google Form link. */

export const PLACEHOLDER_FORM_URL = 'https://forms.gle/REPLACE-WITH-OFFICIAL-FORM';
const TBD = 'يُحدَّد لاحقًا';

export const competitions = [
  {
    id: 'university',
    title: 'مسابقة الروبوتات الجامعية',
    level: 'جامعي',
    focus: 'المستشعرات',
    icon: 'sensor',
    audience: 'طلاب وطالبات الجامعات',
    teamSize: TBD,
    date: TBD,
    registrationUrl: PLACEHOLDER_FORM_URL,
  },
  {
    id: 'secondary',
    title: 'مسابقة الثانوي / المبتدئين',
    level: 'ثانوي',
    focus: 'وحدة التحكم',
    icon: 'controller',
    audience: 'طلاب وطالبات المرحلة الثانوية',
    teamSize: TBD,
    date: TBD,
    registrationUrl: PLACEHOLDER_FORM_URL,
  },
  {
    id: 'cansat',
    title: 'كانسات / الصواريخ',
    level: null, // audience not specified in the requirements — no level chip
    focus: 'المحاكاة',
    icon: 'simulation',
    audience: TBD,
    teamSize: TBD,
    date: TBD,
    registrationUrl: PLACEHOLDER_FORM_URL,
  },
];
