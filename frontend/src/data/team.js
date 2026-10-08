const createMembers = (departmentId, count = 8) => Array.from({ length: count }, (_, index) => ({
  id: `${departmentId}-${index + 1}`,
  name: 'الاسم الكامل',
  role: index === 0 ? 'قائد' : 'عضو',
  gender: index % 2 === 0 ? 'male' : 'female',
  socials: {},
}));

export const teamSections = [
  {
    id: 'directors',
    title: 'المديرون',
    featured: true,
    members: [
      { id: 'director-1', name: 'الاسم الكامل', role: 'قائد', gender: 'male', socials: {} },
      { id: 'director-2', name: 'الاسم الكامل', role: 'قائد', gender: 'female', socials: {} },
    ],
  },
  { id: 'technical', title: 'القسم التقني', members: createMembers('technical') },
  { id: 'programs', title: 'قسم البرامج', members: createMembers('programs') },
  { id: 'media', title: 'قسم الإعلام والتسويق', members: createMembers('media') },
  { id: 'planning', title: 'قسم التخطيط', members: createMembers('planning') },
  { id: 'hr', title: 'قسم الموارد البشرية', members: createMembers('hr') },
];
