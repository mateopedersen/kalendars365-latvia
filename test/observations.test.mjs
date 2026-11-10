import assert from 'node:assert/strict';
import {nearestObservation,distanceKm} from '../lib/observations.mjs';
import {currentForecast} from '../lib/weather-forecast.mjs';
import {onRequestGet} from '../functions/api/noverojumi.js';
const now=Date.parse('2026-11-10T10:00:00Z'),city={lat:56.95,lon:24.1},stations=[{id:'riga',name:'Rīga',...city},{id:'far',name:'Tāla stacija',lat:55,lon:26}];
const row=(value=7.6,time='2026-11-10T09:00:00')=>({STATION_ID:'riga',ABBREVIATION:'HTDRY',DATETIME:time,VALUE:value});
assert.equal(distanceKm(city,city),0);
assert(Math.abs(distanceKm({lat:0,lon:0},{lat:0,lon:1})-111.195)<.01);
const o=nearestObservation(city,stations,[row()],now);
assert.equal(o.temperature,7.6); // Never apply SCALE=0.01 to already physical values.
assert.equal(o.observedAt,'2026-11-10T09:00:00.000Z');
assert.equal(o.aggregation,'hourly_mean');assert.equal(o.ageMinutes,60);
assert.equal(nearestObservation(city,stations,[row(0)],now).temperature,0);
assert.equal(nearestObservation(city,stations,[row(-8.2)],now).temperature,-8.2);
assert.equal(nearestObservation(city,stations,[row(null)],now),null);
assert.equal(nearestObservation(city,stations,[row('')],now),null);
assert.equal(nearestObservation(city,stations,[row(100)],now),null);
assert.equal(nearestObservation(city,stations,[row(4,'2026-11-10T06:59:59')],now),null);
assert.equal(nearestObservation(city,stations,[row(4,'2026-11-10T10:06:00')],now),null);
assert.equal(nearestObservation(city,stations,[{...row(),STATION_ID:'far'}],now),null);
assert.equal(nearestObservation(city,stations,[row(3,'2026-11-10T08:00:00'),row(4)],now).temperature,4);
assert.equal(nearestObservation(city,stations,[{...row(),ABBREVIATION:'HPRAB'}],now),null);
const unknown=await onRequestGet({request:new Request('https://kalendars365.lv/api/noverojumi/?city=unknown')});assert.equal(unknown.status,404);
const original=globalThis.fetch;
try{globalThis.fetch=async()=>{throw Error('Offline')};const r=await onRequestGet({request:new Request('https://kalendars365.lv/api/noverojumi/?city=riga')});assert.equal(r.status,503);assert.equal((await r.json()).observation,null);}finally{globalThis.fetch=original;}
const fixture={properties:{meta:{updated_at:'2026-11-10T09:00:00Z'},timeseries:[{time:'2026-11-10T10:00:00Z',data:{instant:{details:{air_temperature:0}},next_6_hours:{summary:{symbol_code:'cloudy'},details:{precipitation_amount:2}}}}]}};
assert.equal(currentForecast(fixture,now).precipitationPeriodHours,6);assert.equal(currentForecast(fixture,now).temperature,0);
assert.throws(()=>currentForecast(fixture,now+40*3600000));assert.throws(()=>currentForecast(fixture,now+3*3600000));assert.throws(()=>currentForecast(fixture,now-2*3600000));
console.log('Weather: 24 checks passed (UTC, units, proximity, stale/future/missing data, provider failure).');
