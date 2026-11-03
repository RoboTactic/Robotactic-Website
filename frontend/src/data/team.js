/* RoboTactic organizing structure — the single place to update when the team changes.
   Every text is an [Arabic, English] pair (resolved with useLanguage().t). The Arabic list is
   the source of truth for role assignments. No photos, bios or contact details by design. */

export const ROLES = {
  director: ['المدير', 'Director'],
  coDirector: ['المدير المشارك', 'Co-Director'],
  generalManager: ['المدير العام', 'General Manager'],
  viceGeneralManager: ['نائب المدير العام', 'Vice General Manager'],
  leader: ['القائد', 'Leader'],
  viceLeader: ['نائب القائد', 'Vice-Leader'],
};

/* Executive leadership, top tier first. */
export const leadershipTiers = [
  { key: 'director', members: [{ role: ROLES.director, name: ['راشد آل حوته', 'Rashed Al Hota'] }] },
  {
    key: 'co-directors',
    members: [
      { role: ROLES.coDirector, name: ['سديم الجهني', 'Sadeem Aljuhani'] },
      { role: ROLES.coDirector, name: ['سارة الزهراني', 'Sarah Alzahrani'] },
    ],
  },
  {
    key: 'management',
    members: [
      { role: ROLES.generalManager, name: ['نواف الغامدي', 'Nawaf Alghamdi'] },
      { role: ROLES.viceGeneralManager, name: ['أسعد صدقه', 'Assad Sdaqh'] },
    ],
  },
];

/* `icon` names come from components/Icon/icons.js. */
export const departments = [
  { key: 'technical', icon: 'chip', name: ['القسم التقني', 'Technical Department'], leader: ['ريماس محمود', 'Rimas Mahmoud'], viceLeader: ['ليان المتعب', 'Layan Al Meteb'] },
  { key: 'media-marketing', icon: 'megaphone', name: ['قسم التسويق', 'Media & Marketing'], leader: ['أسماء وهيب', 'Asmaa Waheeb'], viceLeader: ['رزان السلمي', 'Razan Alsulami'] },
  { key: 'planning', icon: 'route', name: ['قسم التخطيط', 'Planning Department'], leader: ['زينب عبدالحليم', 'Zainab Abdulhalim'], viceLeader: ['جوري الغامدي', 'Juri Alghamdi'] },
  { key: 'ambassadors', icon: 'globe', name: ['قسم السفراء', 'Ambassadors Department'], leader: ['عبدالعزيز الزهراني', 'Abdulaziz Alzahrani'], viceLeader: ['حلا عسيري', 'Hala Asiri'] },
  { key: 'human-resources', icon: 'users', name: ['قسم الموارد البشرية', 'Human Resources'], leader: ['رنده بخاري', 'Randa Bukhari'], viceLeader: ['تالا جبريل', 'Tala Jabril'] },
  { key: 'programs', icon: 'calendar', name: ['قسم البرامج', 'Programs Department'], leader: ['عبدالله السلمي', 'Abdullah Alsulami'], viceLeader: ['موضي القرعاوي', 'Moudi Algarawi'] },
  { key: 'public-relations', icon: 'chat', name: ['قسم العلاقات العامة', 'Public Relations'], leader: ['عبدالرحمن رجب', 'Abdulrahman Rajab'], viceLeader: ['وليد زكي', 'Waleed Zaki'] },
];

/* Every person once, with their role — used by tests and anything that needs a flat list. */
export const allMembers = () => [
  ...leadershipTiers.flatMap((tier) => tier.members),
  ...departments.flatMap((d) => [
    { role: ROLES.leader, name: d.leader, department: d.key },
    { role: ROLES.viceLeader, name: d.viceLeader, department: d.key },
  ]),
];
