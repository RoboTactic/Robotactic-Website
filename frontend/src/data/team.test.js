import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, committeeCount, committeeHeadcount, committeeSize, isPrimaryLeader, isViceRole, leadershipTiers, presentTeam } from './team.js';

const pair = (value) => Array.isArray(value) && value.length === 2 && value.every((s) => typeof s === 'string' && s.trim());

// Shape of GET /api/public/team (fictional names).
const tree = [{
  id: 4, icon: 'calendar', name_ar: 'قسم البرامج', name_en: 'Programs Department',
  leaders: [
    { id: 1, role_ar: 'قائد', role_en: 'Program Leader', name_ar: 'أ', name_en: 'A' },
    { id: 2, role_ar: 'قائد', role_en: 'Program Leader', name_ar: 'ب', name_en: 'B' },
  ],
  committees: [
    { id: 10, name_ar: 'لجنة البرمجان', name_en: 'Hackathon', is_general: false, members: [
      { id: 100, name_ar: 'ج', name_en: 'C', role_ar: 'المشرف', role_en: 'Supervisor', is_lead: true },
      { id: 101, name_ar: 'د', name_en: 'D', role_ar: 'نائب المشرف', role_en: 'Vice Supervisor', is_lead: true },
      { id: 102, name_ar: 'هـ', name_en: 'E', role_ar: null, role_en: null, is_lead: false },
    ] },
    { id: 11, name_ar: 'أعضاء القسم', name_en: 'Department Members', is_general: true, members: [
      { id: 103, name_ar: 'و', name_en: '', role_ar: null, role_en: null, is_lead: false },
    ] },
  ],
}, { id: 5, icon: 'retired-icon', name_ar: 'قسم', name_en: 'Dept', leaders: [], committees: [] }];

test('executive leadership: five people in three tiers with the official titles', () => {
  assert.equal(leadershipTiers.flatMap((t) => t.members).length, 5);
  assert.deepEqual(leadershipTiers[0].members.map((m) => m.role), [ROLES.director]);
  assert.deepEqual(leadershipTiers[1].members.map((m) => m.role), [ROLES.coDirector, ROLES.coDirector]);
  assert.deepEqual(leadershipTiers[2].members.map((m) => m.role), [ROLES.generalManager, ROLES.viceGeneralManager]);
  for (const m of leadershipTiers.flatMap((t) => t.members)) { assert.ok(pair(m.name)); assert.ok(pair(m.role)); }
  assert.ok(leadershipTiers.flatMap((t) => t.members).every((m) => !/Alj[ou]hani/.test(m.name[1])), 'الجهني is spelled Aljehani');
});

test('presentTeam turns the API tree into bilingual department cards and committee rows', () => {
  const [programs, empty] = presentTeam(tree);
  assert.equal(programs.key, 'department-4');
  assert.deepEqual(programs.name, ['قسم البرامج', 'Programs Department']);
  assert.deepEqual(programs.leaders.map((l) => l.role), [['قائد', 'Program Leader'], ['قائد', 'Program Leader']]);
  // Two co-leads with the same title are both styled as leaders.
  assert.deepEqual(programs.leaders.map((_l, i) => isPrimaryLeader(programs, i)), [true, true]);
  const [hackathon, general] = programs.committees;
  assert.deepEqual(hackathon.rows.map((r) => [r.lead, r.vice, r.role]), [
    [true, false, ['المشرف', 'Supervisor']], [true, true, ['نائب المشرف', 'Vice Supervisor']], [false, false, null],
  ]);
  assert.equal(general.unassigned, true);
  // A missing translation falls back to the other language instead of rendering blank.
  assert.deepEqual(general.rows[0].name, ['و', 'و']);
  assert.equal(committeeSize(hackathon), 3);
  assert.equal(committeeHeadcount(programs), 4);
  assert.equal(committeeCount(programs), 1);
  assert.equal(empty.icon, 'users');
  assert.deepEqual(empty.committees, []);
});

test('presentTeam tolerates a missing or malformed response', () => {
  for (const value of [null, undefined, {}, 'x']) assert.deepEqual(presentTeam(value), []);
});

test('deputy titles are recognised in either language', () => {
  assert.equal(isViceRole(['نائب القائد', 'Vice-Leader']), true);
  assert.equal(isViceRole(['', 'Vice Supervisor']), true);
  assert.equal(isViceRole(['المشرف', 'Supervisor']), false);
  assert.equal(isViceRole(null), false);
});
