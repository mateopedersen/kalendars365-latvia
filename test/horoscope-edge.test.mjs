import assert from 'node:assert/strict';
import {onRequestGet,editionCacheControl} from '../functions/api/horoskops/dienas.js';
const RealDate=Date;
let checks=0;
for(const [stamp,expected] of [
 ['2026-11-10T21:59:59Z','2026-11-10'],
 ['2026-11-10T22:00:00Z','2026-11-11'],
 ['2027-07-01T20:59:59Z','2027-07-01'],
 ['2027-07-01T21:00:00Z','2027-07-02'],
 ['2027-03-28T20:59:59Z','2027-03-28'],
 ['2027-03-28T21:00:00Z','2027-03-29']
]){
 globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[stamp]));}static now(){return new RealDate(stamp).getTime();}};
 const r=await onRequestGet({request:new Request('https://kalendars365.lv/api/horoskops/dienas')});
 const d=await r.json();
 assert.equal(r.status,200);assert.equal(d.date,expected);assert.equal(Object.keys(d.entries).length,12);
 assert.ok(Object.values(d.entries).every(x=>x.date===expected));checks+=4;
 if(stamp.includes('59:59')){assert.match(editionCacheControl(),/max-age=1, s-maxage=1/);checks++;}
 const future=await onRequestGet({request:new Request('https://kalendars365.lv/api/horoskops/dienas?date=2099-01-01')});
 assert.equal(future.status,400);checks++;
 const sign=await onRequestGet({request:new Request('https://kalendars365.lv/api/horoskops/dienas?sign=unknown')});
 assert.equal(sign.status,404);checks++;
}
globalThis.Date=RealDate;
console.log(checks+' edge horoscope assertions passed across Riga midnight and DST.');
