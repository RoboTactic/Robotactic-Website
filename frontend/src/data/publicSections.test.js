import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSections, isPublicPathVisible, isSectionVisible, canManageVisibility } from './publicSections.js';
import { navLinks, registerCta } from './site.js';

test('hiding a section removes navigation and registration targets while preserving Home and dashboard access', () => {
  const flags = Object.fromEntries(publicSections.map(item => [item.key, true]));
  for (const section of publicSections.filter(item => item.path)) {
    const hidden = { ...flags, [section.key]: false };
    const links = navLinks.filter(link => isPublicPathVisible(hidden, link.path));
    assert.ok(!links.some(link => link.path === section.path));
    assert.ok(links.some(link => link.path === '/'));
    assert.equal(isPublicPathVisible(hidden, section.path.toUpperCase() + '/?preview=1'), false);
    assert.equal(isPublicPathVisible(hidden, section.path + '/details'), false);
    assert.equal(isPublicPathVisible(hidden, '/dashboard/' + section.resource), true);
    assert.equal(isPublicPathVisible(flags, section.path), true);
  }
  assert.equal(isPublicPathVisible({ ...flags, competitions: false }, registerCta.path), false);
  assert.equal(isPublicPathVisible({ workshops: false }, '/work%73hops'), false);
});

test('loading and unavailable settings never expose optional public sections', () => {
  for (const data of [null, undefined, {}, { projects: 'true' }]) {
    assert.equal(isSectionVisible(data, 'projects'), false);
    assert.equal(isPublicPathVisible(data, '/projects'), false);
    assert.equal(isPublicPathVisible(data, '/'), true);
  }
});

test('visibility controls respect the editor permissions and reserve About, Team and Timeline for Super Admin', () => {
  for (const section of publicSections) {
    assert.equal(canManageVisibility({ role_code: 'super_admin' }, section), true);
    assert.equal(canManageVisibility(null, section), false);
    assert.equal(canManageVisibility({ role_code: 'team_member', permissions: [] }, section), false);
  }
  const manager = { role_code: 'workshop_manager', permissions: ['workshops', 'about', 'team-members', 'site-visibility'] };
  assert.deepEqual(publicSections.filter(section => canManageVisibility(manager, section)).map(item => item.key), ['workshops']);
});
