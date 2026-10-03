import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDashboardRecords, getDashboardSection } from './dashboard.js';

test('unknown and inherited section names do not resolve to dashboard pages', () => {
  for (const section of ['unknown', '__proto__', 'constructor', 'toString']) {
    assert.equal(getDashboardSection(section), null);
    assert.deepEqual(filterDashboardRecords(section), []);
  }
});

test('search tolerates surrounding whitespace and both display languages', () => {
  assert.deepEqual(filterDashboardRecords('competitions', { search: '  الحربية  ' }).map(item => item.id), ['combat']);
  assert.deepEqual(filterDashboardRecords('competitions', { search: '  COMBAT  ' }).map(item => item.id), ['combat']);
  assert.equal(filterDashboardRecords('competitions', { search: '   ' }).length, 4);
});

test('status and category filters combine without depending on UI language', () => {
  assert.deepEqual(filterDashboardRecords('competitions', { status: 'Open', category: 'Combat' }).map(item => item.id), ['combat']);
  assert.equal(filterDashboardRecords('competitions', { status: 'Closed', category: 'Combat' }).length, 0);
});

test('parent filters apply to registrations and not unrelated pages', () => {
  assert.deepEqual(filterDashboardRecords('teams', { parentId: 'combat' }).map(item => item.id), ['team-0', 'team-2']);
  assert.deepEqual(filterDashboardRecords('participants', { parentId: 'coding' }).map(item => item.id), ['participant-1', 'participant-2']);
  assert.equal(filterDashboardRecords('competitions', { parentId: 'combat' }).length, 4);
});

test('workshop date filtering works alongside status filters', () => {
  assert.deepEqual(filterDashboardRecords('workshops', { status: 'Open', date: '2026-01-20' }).map(item => item.id), ['ai']);
  assert.equal(filterDashboardRecords('workshops', { date: '2099-01-01' }).length, 0);
});
