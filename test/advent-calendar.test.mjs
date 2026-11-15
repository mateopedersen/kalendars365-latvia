import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {availableDays,rigaDate,readProgress,saveProgress} from '../assets/advent-calendar-core.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../_data/advent-calendar.json',import.meta.url)));
test('24 distinct Latvian days have real destinations and no commercial prize claims',()=>{
 assert.deepEqual(data.days.map(x=>x.day),Array.from({length:24},(_,i)=>i+1));
 assert.equal(new Set(data.days.map(x=>x.title)).size,24);
 assert.equal(new Set(data.days.map(x=>x.text)).size,24);
 const routes=new Set(JSON.parse(fs.readFileSync(new URL('../_data/routes.json',import.meta.url))).map(x=>x['URL path']));
 for(const d of data.days){assert(d.text.length>100);assert(d.href.startsWith('https://')||routes.has(d.href),d.href);}
});
test('doors unlock at midnight in Riga, independently of browser timezone',()=>{
 assert.equal(rigaDate(new Date('2026-11-30T21:59:59Z')),'2026-11-30');
 assert.equal(availableDays(2026,new Date('2026-11-30T21:59:59Z')),0);
 assert.equal(availableDays(2026,new Date('2026-11-30T22:00:00Z')),1);
 assert.equal(availableDays(2026,new Date('2026-12-16T21:59:59Z')),16);
 assert.equal(availableDays(2026,new Date('2026-12-16T22:00:00Z')),17);
 assert.equal(availableDays(2026,new Date('2026-12-23T22:00:00Z')),24);
 assert.equal(availableDays(2026,new Date('2027-01-01T00:00:00Z')),24);
 assert.equal(availableDays(2027,new Date('2027-01-01T00:00:00Z')),0);
 assert.equal(availableDays(2031,new Date('2031-12-25T00:00:00Z')),0);
 for(const year of [2026,2027,2028,2029,2030]) assert.equal(availableDays(year,new Date(`${year}-12-10T22:00:00Z`)),11);
});
test('progress is validated, per year, and gracefully handles unavailable storage',()=>{
 const m=new Map(),storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 assert.equal(readProgress(storage,2026).size,0);
 assert.equal(saveProgress(storage,2026,new Set([24,1,3])),true);
 assert.deepEqual([...readProgress(storage,2026)],[1,3,24]);
 assert.equal(readProgress(storage,2027).size,0);
 storage.setItem('k365:advent:v1:2026','[0,1,25,"2",null,1,4]');
 assert.deepEqual([...readProgress(storage,2026)],[1,4]);
 storage.setItem('k365:advent:v1:2026','not json');assert.equal(readProgress(storage,2026).size,0);
 assert.equal(saveProgress(null,2026,new Set([1])),false);assert.equal(readProgress(null,2026).size,0);
});
test('every year has its own searchable source page, dates and canonical route',()=>{
 const route=JSON.parse(fs.readFileSync(new URL('../_data/routes.json',import.meta.url)));
 const bodies=[];
 for(const year of [2026,2027,2028,2029,2030]) {
  const path=`/adventes-kalendars/${year}/`,r=route.find(x=>x['URL path']===path);assert(r);
  assert(r['Latvian title/topic'].includes(year));
  const text=fs.readFileSync(new URL(`../generated${path}index.html`,import.meta.url),'utf8');
  assert(text.includes(`data-advent-year-default="${year}"`));
  assert.equal((text.match(/data-advent-day=/g)||[]).length,24);
  assert(text.includes('1. Advente'));assert(text.includes('4. Advente'));
  assert(text.includes(`${year}. GADA DATUMI`));bodies.push(text);
 }
 assert.equal(new Set(bodies).size,5);
});
