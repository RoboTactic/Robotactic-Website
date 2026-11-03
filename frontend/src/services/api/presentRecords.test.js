import test from 'node:test';
import assert from 'node:assert/strict';
import { presentCompetition } from './presentRecords.js';

globalThis.document = { documentElement: { lang: 'ar' } };

test('competition details follow the active language without inventing missing team sizes or dates', () => {
  const row = { name_ar: 'الدرون', name_en: 'Drones', description_ar: 'الوصف المعتمد', description_en: 'Approved description', category_code: 'drones' };
  document.documentElement.lang = 'ar';
  const arabic = presentCompetition(row);
  assert.equal(arabic.title, 'الدرون');
  assert.equal(arabic.description, 'الوصف المعتمد');
  assert.equal(arabic.teamSize, 'يُحدَّد لاحقًا');
  assert.equal(arabic.date, 'يُحدَّد لاحقًا');
  assert.equal(arabic.icon, 'drone');
  document.documentElement.lang = 'en';
  const english = presentCompetition(row);
  assert.equal(english.title, 'Drones');
  assert.equal(english.description, 'Approved description');
  assert.equal(english.teamSize, 'To be announced');
  assert.equal(english.date, 'To be announced');
});

test('dashboard start and end dates display as a range in Riyadh time in both languages', () => {
  const row = { start_at: '2026-11-03T22:30:00Z', end_at: '2026-11-06T22:30:00Z', team_size_min: 2, team_size_max: 4 };
  for (const lang of ['ar', 'en']) {
    document.documentElement.lang = lang;
    const result = presentCompetition(row);
    const locale = lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory';
    const expected = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Riyadh' })
      .formatRange(new Date('2026-11-04T09:00:00+03:00'), new Date('2026-11-07T09:00:00+03:00'));
    assert.equal(result.date, expected);
    assert.equal(result.teamSize, '2–4');
  }
});

test('single-day competitions display once and descriptions fall back to the available language', () => {
  document.documentElement.lang = 'en';
  const row = { description_ar: 'وصف المسابقة', start_at: '2026-11-04T09:00:00+03:00', end_at: '2026-11-04T17:00:00+03:00' };
  assert.equal(presentCompetition(row).description, row.description_ar);
  assert.equal(presentCompetition(row).date, presentCompetition({ ...row, end_at: null }).date);
});
