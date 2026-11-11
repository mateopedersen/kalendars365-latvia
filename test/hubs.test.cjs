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
  for (const ending of Object.values(school.endByGrade)) assert.ok(page.includes(ending));
  const photos = JSON.parse(fs.readFileSync(path.join(root, '_data/school-break-images.json'), 'utf8')).photos;
  const hash = file => require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  for (const photo of photos) {
    assert.ok(page.includes(`src="${photo.src}"`));
    assert.ok(page.includes(`srcset="${photo.srcset}"`));
    assert.equal(hash(photo.source), photo.sourceSha256);
    for (const file of photo.files) assert.equal(hash(file.src), file.sha256);
  }
  assert.equal((page.match(/<link[^>]+rel="preload"[^>]+as="image"[^>]+imagesrcset=/g) || []).length, 0, 'Offscreen school cards do not compete with the hero');
  assert.equal((page.match(/class="hub-school-photo"[^]*?<img[^>]+loading="lazy"/g)||[]).length,4);
  assert.match(page, /<img[^>]+class="[^"]*v2-scene-photo[^>]+fetchpriority="high"/);
  const sourceBytes = photos.reduce((total, photo) => total + fs.statSync(path.join(root, photo.source)).size, 0);
  const cardBytes = photos.reduce((total, photo) => total + photo.files.at(-1).bytes, 0);
  assert.ok(cardBytes < sourceBytes * 0.5, 'School card photos should cost less than half the former transfer');
  assert.equal((page.match(/Ilustratīvs attēls/g) || []).length, 4);
  assert.ok(page.includes('365210-noteikumi-par-20262027'));
  assert.ok(page.includes('/studiju-kalendars/'));
});
