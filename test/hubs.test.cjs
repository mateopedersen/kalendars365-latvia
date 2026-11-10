'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const html = name => fs.readFileSync(path.join(root, '_site', name, 'index.html'), 'utf8');

test('calendar hub exposes every published month and no removed 2026 route', () => {
  const page = html('kalendars');
  const slugs = ['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
  for (const year of [2027, 2028, 2029, 2030]) {
    for (const slug of slugs) {
      const route = `/kalendars/${year}/${slug}/`;
      assert.ok(page.includes(`href="${route}"`), route);
      assert.ok(fs.existsSync(path.join(root, '_site', route, 'index.html')), route);
    }
  }
  assert.equal((page.match(/data-hub-month="\d+"/g) || []).length, 12);
  assert.ok(page.includes('data-hub-year-filter'));
  assert.ok(page.includes('data-hub-month-filter'));
  assert.ok(!page.includes('href="/kalendars/2026/"'));
});

test('holiday hub counts agree with the published Latvia day-off data', () => {
  const page = html('svetku-dienas');
  const holidays = JSON.parse(fs.readFileSync(path.join(root, 'assets/calendar-data.json'), 'utf8')).holidays;
  for (const year of [2027, 2028, 2029, 2030]) {
    const dates = [...new Set(holidays.filter(item => item.date.startsWith(`${year}-`) && item.dayOff).map(item => item.date))];
    assert.match(page, new RegExp(`href="/svetku-dienas/${year}/"[\\s\\S]*?<b>${dates.length}</b> brīvdienu datumi`));
  }
  assert.ok(page.includes('likumi.lv/ta/id/72608'));
});

test('school hub uses verified dates, distinct licensed Latvia photos and class endings', () => {
  const page = html('skolas-brivlaiki');
  const school = JSON.parse(fs.readFileSync(path.join(root, '_data/latvia-verified-data.json'), 'utf8')).education.school;
  for (const item of school.breaks) {
    assert.ok(page.includes(item.start), item.label);
    assert.ok(page.includes(item.end), item.label);
  }
  for (const ending of Object.values(school.endByGrade)) assert.ok(page.includes(`value="${ending}"`));
  for (const photo of ['preili','iecava']) assert.ok(page.includes(`/assets/cities/${photo}-960.webp`));
  for (const photo of ['winter','summer']) assert.ok(page.includes(`/assets/occasions/${photo}-960.webp`));
  assert.equal((page.match(/Ilustratīvs attēls/g) || []).length, 4);
  assert.ok(page.includes('365210-noteikumi-par-20262027'));
  assert.ok(page.includes('/studiju-kalendars/'));
});
