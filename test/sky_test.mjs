import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {citySky,dayBounds,dateKey,rigaInstant,formatTime,monthSky,sunPosition} from '../assets/sky-core.mjs';
const {cities}=JSON.parse(readFileSync(new URL('../_data/cities.json',import.meta.url)));
const riga=cities.find(c=>c.id==='riga'),liepaja=cities.find(c=>c.id==='liepaja');
assert.equal((dayBounds('2027-03-28').end-dayBounds('2027-03-28').start)/3600000,23);
assert.equal((dayBounds('2027-10-31').end-dayBounds('2027-10-31').start)/3600000,25);
assert.equal(dateKey(new Date('2027-01-01T22:30:00Z')),'2027-01-02');
assert.equal(rigaInstant('2027-06-21',12).toISOString(),'2027-06-21T09:00:00.000Z');
assert.equal(rigaInstant('2027-12-21',12).toISOString(),'2027-12-21T10:00:00.000Z');
const winterNoon=sunPosition(rigaInstant('2026-11-10',12),riga);
const summerNoon=sunPosition(rigaInstant('2027-06-21',12),riga);
assert(winterNoon.altitude>10&&winterNoon.altitude<20,`Riga November noon altitude: ${winterNoon.altitude}`);
assert(summerNoon.altitude>50&&summerNoon.altitude<65,`Riga June noon altitude: ${summerNoon.altitude}`);
assert(winterNoon.azimuth>170&&winterNoon.azimuth<190,`Riga noon azimuth: ${winterNoon.azimuth}`);
for(const [date,rise,set] of [['2027-06-21','2027-06-21T01:29:00Z','2027-06-21T19:22:00Z'],['2027-12-21','2027-12-21T07:00:00Z','2027-12-21T13:43:00Z']]) {
 const result=citySky(date,riga);
 assert(Math.abs(result.sun.sunrise-Date.parse(rise))<90000, `${date} sunrise`);
 assert(Math.abs(result.sun.sunset-Date.parse(set))<90000, `${date} sunset`);
}
for(const city of cities)for(const date of ['2027-03-28','2027-06-21','2027-10-31','2027-12-21']) {
 const sky=citySky(date,city);
 assert(sky.sun.sunrise<sky.sun.sunset);
 assert(sky.moon.fraction>=0&&sky.moon.fraction<=1);
 for(const event of [...Object.values(sky.sun),...sky.moon.rises,...sky.moon.sets].filter(Boolean))assert(event>=sky.start&&event<sky.end,`${city.id} ${date}`);
}
assert.equal(monthSky(2028,2,riga).length,29);
assert.notEqual(formatTime(citySky('2027-12-21',riga).sun.sunset),formatTime(citySky('2027-12-21',liepaja).sun.sunset));
console.log('Sky: Riga IANA date/DST, USNO solar controls, all 82 cities and leap month passed.');
