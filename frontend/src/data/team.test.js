import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, allMembers, departments, leadershipTiers } from './team.js';
import { ICONS } from '../components/Icon/icons.js';

const pair = (value) => Array.isArray(value) && value.length === 2 && value.every((s) => typeof s === 'string' && s.trim());

test('the structure has 5 leaders, 7 departments and 19 people, each exactly once', () => {
  assert.equal(leadershipTiers.flatMap((t) => t.members).length, 5);
  assert.equal(departments.length, 7);
  const members = allMembers();
  assert.equal(members.length, 19);
  for (const lang of [0, 1]) assert.equal(new Set(members.map((m) => m.name[lang])).size, 19);
});

test('every name, role and department label is a complete Arabic/English pair', () => {
  for (const m of allMembers()) { assert.ok(pair(m.name), m.name); assert.ok(pair(m.role), m.role); }
  for (const d of departments) { assert.ok(pair(d.name), d.key); assert.ok(ICONS[d.icon], `${d.key}: missing icon ${d.icon}`); }
});

test('role assignments follow the official list', () => {
  const programs = departments.find((d) => d.key === 'programs');
  assert.deepEqual(programs.leader, ['عبدالله السلمي', 'Abdullah Alsulami']);
  assert.deepEqual(programs.viceLeader, ['موضي القرعاوي', 'Moudi Algarawi']);
  assert.deepEqual(departments.find((d) => d.key === 'media-marketing').name, ['قسم التسويق', 'Media & Marketing']);
  assert.deepEqual(leadershipTiers[0].members.map((m) => m.role), [ROLES.director]);
  assert.deepEqual(leadershipTiers[1].members.map((m) => m.role), [ROLES.coDirector, ROLES.coDirector]);
  assert.deepEqual(leadershipTiers[2].members.map((m) => m.role), [ROLES.generalManager, ROLES.viceGeneralManager]);
});
