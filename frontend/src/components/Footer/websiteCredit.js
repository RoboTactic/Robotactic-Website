/* The footer's Website Committee dialog: the people who built this site, grouped under their two leads
   (Front-end first, then Back-end). This is the site's authorship credit, so it stays fixed here; the
   Team page's committees are managed from the dashboard instead. Names are [Arabic, English]. */
export const WEBSITE_COMMITTEE = {
  name: ['لجنة الموقع', 'Website Committee'],
  groups: [
    { key: 'backend', name: ['الباك إند', 'Back-end'], lead: ['عبد الله السيروان', 'Abdullah Alseyrawan'], members: [['صالح باحكيم', 'Saleh Bahakim']] },
    { key: 'frontend', name: ['الفرونت إند', 'Front-end'], lead: ['ليان الحربي', 'Layan Alharbi'], members: [['معتز السيد', 'Motaz Alsayed'], ['شيماء وهيب', 'Shaima Waheeb']] },
  ],
};

const CREDIT_GROUPS = ['frontend', 'backend'];

/* The section's title for each lead, as given by the event team. Same English title for both; the
   Arabic agrees with each lead (قائدة for Layan, قائد for Abdullah). */
const LEAD_TITLES = {
  frontend: ['قائدة لجنة الموقع', 'Website Lead'],
  backend: ['قائد لجنة الموقع', 'Website Lead'],
};

/* Returns null when the committee or its groups are missing. */
export function websiteCredit(committee = WEBSITE_COMMITTEE) {
  const groups = CREDIT_GROUPS
    .map((key) => committee?.groups?.find((g) => g.key === key))
    .filter((g) => g?.lead)
    .map((g) => ({ key: g.key, title: LEAD_TITLES[g.key], lead: g.lead, members: g.members ?? [] }));
  return committee && groups.length ? { name: committee.name, groups } : null;
}
