/* RoboTactic organizing structure.
   Executive leadership is fixed here. Departments, their leaders, committees and committee members
   are managed from the dashboard («الفريق») and arrive from GET /api/public/team; presentTeam()
   turns that response into the shape the Team page renders. Every text is an [Arabic, English] pair
   (resolved with useLanguage().t). No photos, bios or contact details by design. */
import { ICONS } from '../components/Icon/icons.js';

export const ROLES = {
  director: ['الرئيس', 'Director'],
  coDirector: ['نائب الرئيس', 'Co-Director'],
  generalManager: ['المدير العام', 'General Manager'],
  viceGeneralManager: ['نائب المدير العام', 'Vice General Manager'],
};

/* Executive leadership, top tier first. */
export const leadershipTiers = [
  { key: 'director', members: [{ role: ROLES.director, name: ['راشد آل حوته', 'Rashed Al Hota'] }] },
  {
    key: 'co-directors',
    members: [
      { role: ROLES.coDirector, name: ['سديم الجهني', 'Sadeem Aljehani'] },
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

const pairOf = (record, key) => [record?.[`${key}_ar`] || record?.[`${key}_en`] || '', record?.[`${key}_en`] || record?.[`${key}_ar`] || ''];
/* A deputy title («نائب …», "Vice …") gets the quieter highlight in the members dialog. */
export const isViceRole = (role) => /^نائب/.test(role?.[0] ?? '') || /^vice\b/i.test(role?.[1] ?? '');

/* API tree → view model. Unknown icons fall back to the generic team icon. */
export function presentTeam(tree) {
  return (Array.isArray(tree) ? tree : []).map((d) => ({
    key: `department-${d.id}`,
    icon: ICONS[d.icon] ? d.icon : 'users',
    name: pairOf(d, 'name'),
    leaders: (d.leaders ?? []).map((l) => ({ key: `leader-${l.id}`, role: pairOf(l, 'role'), name: pairOf(l, 'name') })),
    committees: (d.committees ?? []).map((c) => ({
      key: `committee-${c.id}`,
      name: pairOf(c, 'name'),
      unassigned: Boolean(c.is_general),
      rows: (c.members ?? []).map((m) => {
        const role = m.is_lead ? pairOf(m, 'role') : null;
        return { key: `member-${m.id}`, name: pairOf(m, 'name'), role, lead: Boolean(m.is_lead), vice: Boolean(m.is_lead) && isViceRole(role) };
      }),
    })),
  }));
}

export const committeeSize = (c) => c.rows.length;
export const committeeHeadcount = (dept) => dept.committees.reduce((n, c) => n + committeeSize(c), 0);
/* Real committees only: the department's general members group is not counted. */
export const committeeCount = (dept) => dept.committees.filter((c) => !c.unassigned).length;
/* Leader styling for the first leader and for any co-lead with the same title (e.g. two Program Leaders). */
export const isPrimaryLeader = (dept, index) => index === 0 || dept.leaders[index].role[1] === dept.leaders[0]?.role[1];
