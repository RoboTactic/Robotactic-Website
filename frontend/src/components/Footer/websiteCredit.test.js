import test from 'node:test';
import assert from 'node:assert/strict';
import { WEBSITE_COMMITTEE, websiteCredit } from './websiteCredit.js';

const group = (key) => WEBSITE_COMMITTEE.groups.find((g) => g.key === key);

test('the Website Committee credit shows two lead groups, each with the members who report to that lead', () => {
  const credit = websiteCredit();
  assert.deepEqual(credit.name, WEBSITE_COMMITTEE.name);
  assert.deepEqual(credit.groups.map((g) => g.key), ['frontend', 'backend']);
  for (const g of credit.groups) {
    assert.deepEqual(g.lead, group(g.key).lead);
    assert.deepEqual(g.members, group(g.key).members);
  }
  // Every person in the committee appears exactly once, under their own lead (no flat list, no duplicates).
  const people = credit.groups.flatMap((g) => [g.lead, ...g.members]).map((n) => n[1]);
  assert.equal(new Set(people).size, people.length);
  assert.equal(people.length, WEBSITE_COMMITTEE.groups.reduce((n, g) => n + 1 + g.members.length, 0));
});

test('both leads carry the same English title, with Arabic that agrees with each lead', () => {
  const [frontend, backend] = websiteCredit().groups;
  assert.deepEqual(frontend.title, ['قائدة لجنة الموقع', 'Website Lead']);
  assert.deepEqual(backend.title, ['قائد لجنة الموقع', 'Website Lead']);
});

test('the section is left out when the committee is missing', () => {
  assert.equal(websiteCredit(null), null);
  assert.equal(websiteCredit({ name: ['', ''], groups: [] }), null);
});
