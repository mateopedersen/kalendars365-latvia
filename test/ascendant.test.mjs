import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ascendantAt, assessUncertainty, describeLongitude, resolveCivil, parseCivil, formatOffset, SIGNS, timeZoneVersion} from '../assets/ascendant-core.mjs';
import {timeZoneNames} from '../assets/vendor/ascendant-timezones.mjs';
const read = path => JSON.parse(fs.readFileSync(path));

test('tropical rising longitude agrees with 1,492 independent Swiss Ephemeris cases', () => {
  const source = read('test/fixtures/ascendant-swiss.json');
  assert.equal(source.samples.length, 1492);
  let max = 0, maxLatvia = 0;
  for (const sample of source.samples) {
    const actual = ascendantAt(Date.parse(sample.utc), sample.lat, sample.lon);
    const error = Math.abs(((actual.longitude - sample.ascendant + 540) % 360) - 180) * 3600;
    assert(error < 10, `${sample.label}: ${error} arcsec`);
    assert.equal(actual.signIndex, Math.floor(sample.ascendant / 30), sample.label);
    max = Math.max(max, error);
    if (sample.label.startsWith('Latvia/')) maxLatvia = Math.max(maxLatvia, error);
  }
  const report = {date: '2026-11-11', samples: source.samples.length, latviaSamples: 492, worldSamples: 1000,
    maxErrorArcseconds: max, maxLatviaErrorArcseconds: maxLatvia,
    toleranceArcseconds: 10, reference: source.reference,
    fixtureSha256: createHash('sha256').update(fs.readFileSync('test/fixtures/ascendant-swiss.json')).digest('hex'),
    scope: 'Numerical regression comparison, not expert certification or an absolute accuracy guarantee.'};
  fs.writeFileSync('docs/ASCENDANT_REFERENCE_RESULTS.json', JSON.stringify(report, null, 2) + '\n');
});

test('historical seconds, DST gaps, folds, half-hour changes and skipped dates match independent zoneinfo', () => {
  const fixture = read('test/fixtures/ascendant-timezones.json');
  assert.equal(fixture.cases.length, 13);
  for (const sample of fixture.cases) assert.deepEqual(
    resolveCivil(sample.date, sample.time, sample.zone).map(value => ({utc: new Date(value.utc).toISOString().replace('.000Z', 'Z'), offsetSeconds: value.offsetSeconds})),
    sample.candidates, `${sample.zone} ${sample.date} ${sample.time}`);
  assert.equal(timeZoneVersion, '2026f');
});

test('strict date and time validation rejects silent rollover, absent values and unknown zones', () => {
  for (const date of ['2023-02-29', '1900-02-29', '2000-04-31', '2024-13-01', '2024-00-01', '1899-12-31', '2101-01-01', '', '2024-1-1'])
    assert.throws(() => parseCivil(date, '12:00'), {code: 'input'});
  for (const time of ['', '24:00', '12:60', '12:01:60', '1:00', '12:00Z', '12:00:00.5'])
    assert.throws(() => parseCivil('2000-02-29', time), {code: 'input'});
  assert.equal(parseCivil('2000-02-29', '00:00:01').second, 1);
  assert.throws(() => resolveCivil('2000-01-01', '12:00', 'NOT/A_ZONE'), {code: 'zone'});
  assert.throws(() => resolveCivil('2000-01-01', '12:00', 'riga'), {code: 'zone'});
});

test('longitude sign boundaries use unrounded geometry and do not display 30° in the previous sign', () => {
  for (let i = 0; i < 12; i++) {
    assert.equal(describeLongitude(i * 30).signIndex, i);
    const before = describeLongitude((i + 1) * 30 - 1e-7);
    assert.equal(before.signIndex, i); assert.equal(before.degrees, 29); assert.equal(before.minutes, 59);
  }
  assert.equal(describeLongitude(360).sign.slug, 'auns');
  assert.equal(describeLongitude(-1).sign.slug, 'zivis');
  assert.throws(() => describeLongitude(NaN));
  assert.equal(SIGNS.length, 12);
});

test('geographic inputs preserve western and southern signs, reject poles and nonnumeric values', () => {
  const instant = Date.UTC(2000, 0, 1, 10);
  for (const [lat, lon] of [[90, 0], [-90, 0], [89.999, 0], [0, 180.1], [NaN, 0], [null, 0], ['', 0], [0, Infinity]])
    assert.throws(() => ascendantAt(instant, lat, lon), {code: 'coordinates'});
  for (const [lat, lon] of [[0, -180], [0, 180], [-56.9, -24.1], [85, 0], [-85, 0]]) {
    const result = ascendantAt(instant, lat, lon);
    assert(result.longitude >= 0 && result.longitude < 360);
  }
  assert.throws(() => ascendantAt(NaN, 0, 0), {code: 'input'});
  assert.throws(() => ascendantAt(Date.UTC(2200, 0, 1), 0, 0), {code: 'input'});
});

test('time uncertainty detects sign changes rather than guaranteeing a single result', () => {
  const instant = Date.parse('2000-01-01T10:00:00Z');
  const exact = assessUncertainty(instant, 56.9475, 24.106944, 0);
  assert.equal(exact.signs.length, 1); assert.equal(exact.center.sign.slug, 'auns');
  const broad = assessUncertainty(instant, 56.9475, 24.106944, 60);
  assert(broad.signs.length > 1);
  for (const edge of [-3600000, 3600000]) assert(broad.signs.some(sign => sign.slug === ascendantAt(instant + edge, 56.9475, 24.106944).sign.slug));
  assert.throws(() => assessUncertainty(instant, 0, 0, -1), {code: 'uncertainty'});
  assert.throws(() => assessUncertainty(instant, 0, 0, 61), {code: 'uncertainty'});
});

test('UTC offset labels retain unusual minutes and historical seconds', () => {
  assert.equal(formatOffset(5794), 'UTC+01:36:34');
  assert.equal(formatOffset(-12600), 'UTC−03:30');
  assert.equal(formatOffset(20700), 'UTC+05:45');
  assert.equal(formatOffset(0), 'UTC+00:00');
});

test('birthplace catalogue retains all reviewed Latvian cities, valid zones and local sources', () => {
  const boot = read('_data/ascendant-places.json'), latvia = read('_data/cities.json').cities;
  assert.equal(boot.latvia.length, 82);
  for (const city of latvia) {
    const place = boot.latvia.find(place => place.id === city.id);
    assert.equal(place.name, city.name); assert.equal(place.lat, city.lat); assert.equal(place.lon, city.lon); assert.equal(place.zone, city.timeZone);
  }
  const validZones = new Set(timeZoneNames()); let total = 0;
  for (const country of boot.countries) {
    assert.match(country.code, /^[A-Z]{2}$/);
    const rows = read(`assets/ascendant-places/${country.code}.json`);
    assert.equal(rows.length, country.count);
    for (const place of rows) { assert(validZones.has(place.zone), place.zone); assert(Number.isFinite(place.lat) && Math.abs(place.lat) <= 90); assert(Number.isFinite(place.lon) && Math.abs(place.lon) <= 180); assert(place.aliases.length); }
    total += rows.length;
  }
  assert.equal(total, 34281);
  const receipt = read('docs/sources/ascendant/geonames-receipt.json');
  for (const [file, meta] of Object.entries(receipt.files)) assert.equal(createHash('sha256').update(fs.readFileSync(`docs/sources/ascendant/${file}`)).digest('hex'), meta.sha256);
});

test('calculator does not persist birth data or send them to a network service', () => {
  const code = fs.readFileSync('assets/ascendant-ui.mjs', 'utf8');
  assert.doesNotMatch(code, /localStorage|sessionStorage|URLSearchParams|history\.replaceState|navigator\.sendBeacon/);
  assert.equal((code.match(/\bfetch\(/g) || []).length, 1);
  assert.match(code, /fetch\(`\/assets\/ascendant-places\//);
  assert.match(code, /const token = generation/); assert.match(code, /token !== generation/);
  assert.match(code, /request !== cityLoad/);
});

test('built horoscope pages include the calculator and lazy modules without affecting other pages', {skip: !fs.existsSync('_site/horoskops/index.html')}, () => {
  for (const route of ['horoskops', 'horoskopa-zimes-kalkulators']) {
    const html = fs.readFileSync(`_site/${route}/index.html`, 'utf8');
    assert.match(html, /data-ascendant-calculator/); assert.match(html, /ascendant-ui\.mjs/);
    assert.equal((html.match(/id="ascendenta-kalkulators"/g) || []).length, 1);
    assert.doesNotMatch(html, /<script[^>]+src="[^\"]*ascendant-(?:core|timezones)/);
    assert.match(html, /Vasaras laiku pielāgosim automātiski/);
    assert.match(html, /CC BY 4\.0/);
  }
  const home = fs.readFileSync('_site/index.html', 'utf8');
  assert.doesNotMatch(home, /ascendant-ui\.mjs|ascendant-core\.mjs|ascendant-timezones\.mjs/);
  for (const sign of SIGNS) assert.match(fs.readFileSync(`_site/horoskops/${sign.slug}/index.html`, 'utf8'), /href="\/horoskops\/#ascendenta-kalkulators"/);
});
