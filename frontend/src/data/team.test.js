import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, allMembers, committeeCount, committeeHeadcount, committeeLeadsOf, committeeSize, departments, leadRolesOf, leadershipTiers, supervisorsOf, websiteCommittee } from './team.js';
import { ICONS } from '../components/Icon/icons.js';

const pair = (value) => Array.isArray(value) && value.length === 2 && value.every((s) => typeof s === 'string' && s.trim());
const dept = (key) => departments.find((d) => d.key === key);
const shape = (d) => d.committees.map((c) => [c.key, supervisorsOf(c).length, committeeSize(c)]);
const leadRoles = (c) => committeeLeadsOf(c).map((l) => l.role);
const allPairs = (d) => d.committees.every((c) => [c.name, ...committeeLeadsOf(c).map((l) => l.name), ...c.members].every(pair));

test('the structure includes the website committee without adding a department', () => {
  assert.equal(leadershipTiers.flatMap((t) => t.members).length, 5);
  assert.equal(departments.length, 7);
  const members = allMembers();
  assert.equal(members.length, 186);
  for (const lang of [0, 1]) assert.equal(new Set(members.map((m) => m.name[lang])).size, 186);
});

test('committee departments: Planning, Human Resources and Public Relations', () => {
  assert.deepEqual(departments.filter((d) => d.committees).map((d) => d.key), ['media-marketing', 'planning', 'programs', 'human-resources', 'technical', 'public-relations']);
  for (const d of departments.filter((x) => x.committees)) assert.ok(allPairs(d), d.key);
});

test('Programs: five committees plus unassigned members; the hackathon has a vice supervisor', () => {
  const programs = dept('programs');
  assert.deepEqual(shape(programs), [
    ['in-person-workshops', 1, 8], ['hackathon', 1, 9], ['entertainment', 1, 6], ['speakers', 1, 5], ['remote-workshops', 1, 6], ['unassigned', 0, 2],
  ]);
  assert.deepEqual(leadRoles(programs.committees[1]), [ROLES.supervisor, ROLES.viceSupervisor]);
  assert.equal(committeeHeadcount(programs), 36);
  assert.equal(committeeCount(programs), 5);
});

test('Media & Marketing: four committees (Design and Media without a supervisor) plus unassigned members', () => {
  const marketing = dept('media-marketing');
  assert.deepEqual(shape(marketing), [
    ['design', 0, 8], ['marketing', 1, 5], ['media-monitoring', 1, 5], ['media', 0, 5], ['unassigned', 0, 2],
  ]);
  assert.equal(committeeHeadcount(marketing), 25);
  assert.equal(committeeCount(marketing), 4);
});

test('Technical: three committees plus unassigned members; the Website Committee stays separate', () => {
  const technical = dept('technical');
  assert.deepEqual(shape(technical), [
    ['engineering', 1, 9], ['advanced-competition', 1, 9], ['beginner-competition', 1, 9], ['unassigned', 0, 5],
  ]);
  assert.equal(committeeHeadcount(technical), 32);
  assert.equal(committeeCount(technical), 3);
  assert.ok(!technical.committees.some((c) => c.key === 'website'));
});

test('Planning: five committees, one without a supervisor and one with two', () => {
  const planning = dept('planning');
  assert.deepEqual(shape(planning), [
    ['main-competitions', 1, 5], ['student-separation', 1, 6], ['defense-exhibition', 0, 5], ['innovation-exhibition', 2, 7], ['closing-ceremony', 1, 5],
  ]);
  assert.equal(committeeHeadcount(planning), 28);
  assert.equal(committeeCount(planning), 5);
});

test('Human Resources: five committees, each with one supervisor', () => {
  const hr = dept('human-resources');
  assert.deepEqual(shape(hr), [
    ['recruitment', 1, 4], ['training', 1, 4], ['scheduling', 1, 3], ['screening', 1, 5], ['recognition', 1, 5],
  ]);
  assert.equal(committeeHeadcount(hr), 21);
  assert.equal(committeeCount(hr), 5);
});

test('Public Relations: three committees plus unassigned members', () => {
  const pr = dept('public-relations');
  assert.deepEqual(shape(pr), [['sponsorships', 1, 9], ['guests', 1, 5], ['permits', 1, 4], ['unassigned', 0, 2]]);
  assert.equal(committeeHeadcount(pr), 20);
  assert.equal(committeeCount(pr), 3);
});

test('the website committee belongs to the technical department, which stays sixth; Ambassadors comes first', () => {
  assert.equal(departments[0].key, 'ambassadors');
  assert.equal(departments[3].key, 'programs');
  assert.equal(departments[5].key, 'technical');
  assert.equal(websiteCommittee.department, 'technical');
  // Names live in team.js; this test protects the committee structure.
  assert.deepEqual(websiteCommittee.branches.map(branch => [branch.key, branch.members.length]), [
    ['backend', 1],
    ['frontend', 2],
  ]);
});

test('every name, role and department label is a complete Arabic/English pair', () => {
  for (const m of allMembers()) { assert.ok(pair(m.name), m.name); assert.ok(pair(m.role), m.role); }
  for (const d of departments) { assert.ok(pair(d.name), d.key); assert.ok(ICONS[d.icon], `${d.key}: missing icon ${d.icon}`); }
});

test('role assignments follow the official list', () => {
  const programs = departments.find((d) => d.key === 'programs');
  assert.deepEqual(programs.leader, ['عبدالله السلمي', 'Abdullah Alsulami']);
  assert.deepEqual(programs.viceLeader, ['موضي القرعاوي', 'Moudi Algarawi']);
  assert.deepEqual(leadRolesOf(programs), [ROLES.programLeader, ROLES.programLeader]);
  assert.deepEqual(leadRolesOf(departments.find((d) => d.key === 'technical')), [ROLES.leader, ROLES.viceLeader]);
  assert.ok(allMembers().every((m) => !/Alj[ou]hani/.test(m.name[1])), 'الجهني is spelled Aljehani');
  assert.deepEqual(departments.find((d) => d.key === 'media-marketing').name, ['قسم التسويق', 'Media & Marketing']);
  assert.deepEqual(leadershipTiers[0].members.map((m) => m.role), [ROLES.director]);
  assert.deepEqual(leadershipTiers[1].members.map((m) => m.role), [ROLES.coDirector, ROLES.coDirector]);
  assert.deepEqual(leadershipTiers[2].members.map((m) => m.role), [ROLES.generalManager, ROLES.viceGeneralManager]);
});
