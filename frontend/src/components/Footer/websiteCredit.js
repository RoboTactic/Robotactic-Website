import { departments } from '../../data/team.js';

/* The footer's Website Committee dialog, read from the team data (the single source of truth for
   names and structure): the committee's name and its two groups, each with its lead and the members
   who report to that lead (Front-end first, then Back-end). Returns null when the committee or its
   groups are missing. */
const CREDIT_GROUPS = ['frontend', 'backend'];

/* The section's title for each lead, as given by the event team. Same English title for both; the
   Arabic agrees with each lead (قائدة for Layan, قائد for Abdullah). */
const LEAD_TITLES = {
  frontend: ['قائدة لجنة الموقع', 'Website Lead'],
  backend: ['قائد لجنة الموقع', 'Website Lead'],
};

export function websiteCredit(list = departments) {
  const committee = list.find((d) => d.key === 'technical')?.committees?.find((c) => c.key === 'website');
  const groups = CREDIT_GROUPS
    .map((key) => committee?.groups?.find((g) => g.key === key))
    .filter((g) => g?.lead)
    .map((g) => ({ key: g.key, title: LEAD_TITLES[g.key], lead: g.lead, members: g.members ?? [] }));
  return committee && groups.length ? { name: committee.name, groups } : null;
}
