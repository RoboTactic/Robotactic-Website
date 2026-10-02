export const projectCategories = [
  { id: 'all', label: 'عرض الكل' },
  { id: 'defense', label: 'Defense Projects' },
  { id: 'invention', label: 'Invention Projects' },
];

const projectBase = {
  title: 'روبوت الفرز الذكي',
  teamName: 'فريق أثر',
  description: 'روبوت يتعرّف على أنواع المخلفات ويفرزها تلقائيًا للمساعدة في تحسين إعادة التدوير.',
  categoryLabel: 'Invention Projects',
  stage: 'مقبول ومؤكد — بيانات توضيحية',
  imageUrl: null,
  imageAlt: '',
};

export const projects = [
  {
    ...projectBase,
    id: 'illustrative-1',
    categoryId: 'invention',
    members: [
      { name: 'فلان الفلاني', linkedinUrl: '', xUrl: '', showLinkedIn: true, showX: true },
      { name: 'فلانة الفلانية', linkedinUrl: '', xUrl: '', showLinkedIn: true, showX: false },
    ],
  },
  {
    ...projectBase,
    id: 'illustrative-2',
    categoryId: 'invention',
    members: [
      { name: 'فلان الفلاني', linkedinUrl: '', xUrl: '', showLinkedIn: true, showX: false },
      { name: 'فلانة الفلانية', linkedinUrl: '', xUrl: '', showLinkedIn: true, showX: false },
    ],
  },
  {
    ...projectBase,
    id: 'illustrative-3',
    categoryId: 'invention',
    members: [
      { name: 'فلان الفلاني', linkedinUrl: '', xUrl: '', showLinkedIn: false, showX: true },
      { name: 'فلانة الفلانية', linkedinUrl: '', xUrl: '', showLinkedIn: false, showX: true },
    ],
  },
];

export const projectsEmptyState = {
  title: 'المشاريع قيد الاعتماد',
  description: 'سيتم تحديث هذه الصفحة بعد اعتماد المشاريع والتأكد من مشاركتها.',
};

export const projectsSearchEmptyState = {
  title: 'لا توجد نتائج مطابقة',
  description: 'جرّب البحث بكلمات أخرى أو امسح عبارة البحث لعرض المشاريع.',
};

export function filterProjects(projectList, categoryId, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ar');

  return projectList.filter((project) => {
    const matchesCategory = categoryId === 'all' || project.categoryId === categoryId;
    const searchableContent = [
      project.title,
      project.teamName,
      project.description,
      project.categoryLabel,
      project.stage,
      ...project.members.map((member) => member.name),
    ].join(' ').toLocaleLowerCase('ar');

    return matchesCategory && (!normalizedQuery || searchableContent.includes(normalizedQuery));
  });
}
