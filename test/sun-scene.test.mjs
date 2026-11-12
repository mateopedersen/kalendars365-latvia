import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {citySky, dayBounds, sunPosition} from '../assets/sky-core.mjs';
import {direction, compass, discAltitude, geometricAltitude, projectSun, atmosphere, SUN_RADIUS} from '../assets/sun-scene-core.mjs';

const {cities} = JSON.parse(readFileSync(new URL('../_data/cities.json', import.meta.url)));
test('Solar directions use geographic north/east/up with a unit vector', () => {
  assert.deepEqual(direction(0, 0), [0, 0, 1]);
  assert(Math.abs(direction(0, 90)[0] - 1) < 1e-12);
  assert(Math.abs(direction(90, 275)[1] - 1) < 1e-12);
  for (let a = 0; a < 360; a += 13) for (let h = -90; h <= 90; h += 9) {
    assert(Math.abs(Math.hypot(...direction(h, a)) - 1) < 1e-12);
  }
  assert.equal(compass(359), 'Z'); assert.equal(compass(90), 'A'); assert.equal(compass(-90), 'R');
});
test('Perspective projects by azimuth, not elapsed time; north wrapping is continuous', () => {
  const middle = projectSun(0, 90, 90, 80, 800, 450);
  assert.equal(middle.x, 400); assert(middle.visible);
  assert(projectSun(0, 95, 90, 80, 800, 450).x > middle.x);
  assert(projectSun(0, 85, 90, 80, 800, 450).x < middle.x);
  assert(Math.abs(projectSun(0, 1, 359, 80, 800, 450).x - projectSun(0, 361, 359, 80, 800, 450).x) < 1e-9);
  assert.equal(projectSun(-10, 90, 90, 80, 800, 450).visible, false);
  assert.equal(projectSun(0, 270, 90, 80, 800, 450).visible, false);
  assert.equal(projectSun(60, 90, 90, 80, 800, 450).visible, false); // high Sun is honestly outside the camera frame
});
test('The standard upper-limb contact agrees with rise/set events for every Latvian city', () => {
  for (const city of cities) for (const date of ['2027-03-28', '2027-06-21', '2027-10-31', '2027-12-21']) {
    const sky = citySky(date, city);
    for (const event of [sky.sun.sunrise, sky.sun.sunset]) {
      const p = sunPosition(event, city);
      assert(Math.abs(discAltitude(p.altitude) + SUN_RADIUS) < .015, city.id + ' ' + date);
    }
    for (const event of [sky.sun.dawn, sky.sun.dusk]) {
      const p = sunPosition(event, city);
      assert(Math.abs(geometricAltitude(p.altitude) + 6) < .015, city.id + ' civil twilight boundary');
    }
    const night = sunPosition(sky.start, city);
    if (night.altitude < -1) assert(discAltitude(night.altitude) + SUN_RADIUS < 0);
  }
});
test('A selected instant has different solar direction in eastern and western cities', () => {
  const instant = new Date('2027-06-21T17:00:00Z');
  const a = sunPosition(instant, cities.find(c => c.id === 'daugavpils'));
  const b = sunPosition(instant, cities.find(c => c.id === 'liepaja'));
  assert(Math.abs(a.altitude - b.altitude) > 1);
  assert(Math.abs(a.azimuth - b.azimuth) > 1);
});
test('Date boundaries support the advertised final day and 23/25 hour playback', () => {
  assert.equal((dayBounds('2027-03-28').end - dayBounds('2027-03-28').start) / 60000, 1380);
  assert.equal((dayBounds('2027-10-31').end - dayBounds('2027-10-31').start) / 60000, 1500);
  assert.equal(dayBounds('2099-12-31').end.toISOString(), '2099-12-31T22:00:00.000Z');
  assert.equal(citySky('2099-12-31', cities[0]).date, '2099-12-31');
  assert.throws(() => dayBounds('2100-01-01'));
});
test('Atmosphere changes continuously through dawn/noon/night without permanent dark skies', () => {
  assert.notEqual(atmosphere(40).sky, atmosphere(-18).sky);
  assert.equal(atmosphere(-18).daylight, 0);
  assert.equal(atmosphere(40).daylight, 1);
  assert.equal(atmosphere(-10).label, 'Nautiskā krēsla');
  assert.equal(atmosphere(-15).label, 'Astronomiskā krēsla');
  assert.equal(atmosphere(-20).label, 'Nakts');
  for (let h = -90; h <= 90; h++) for (const key of ['sky','horizon','land','building','water','green','sun']) assert.match(atmosphere(h)[key], /^#[0-9a-f]{6}$/);
});

test('fitted player leaves room for every control on portrait and short landscape screens',async()=>{
 const {fitSunViewport}=await import('../assets/sun-player-core.mjs');
 for(const viewportHeight of [320,390,568,667,844,900])for(const chromeHeight of [160,205,255]){
  const stage=fitSunViewport({viewportHeight,chromeHeight});
  assert(stage>0);assert(stage<=540);assert(stage+chromeHeight+24<=viewportHeight+.01,`${viewportHeight}/${chromeHeight}`);
 }
 assert.throws(()=>fitSunViewport({viewportHeight:NaN,chromeHeight:200}));
});
test('day playback stops at the real final minute and never jumps after a stalled frame',async()=>{
 const {advanceSunPlayback}=await import('../assets/sun-player-core.mjs');
 for(const end of [1379,1439,1499]){
  assert.deepEqual(advanceSunPlayback(end-1,100,30,end),{minute:end,ended:true});
  assert.equal(advanceSunPlayback(60,100,30,end).minute,63);
  assert(advanceSunPlayback(60,60000,30,end).minute<70);
 }
 assert.throws(()=>advanceSunPlayback(0,16,0,1439));
});
