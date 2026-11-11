import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import C from '../assets/calendar-core.js';
import K from '../assets/category-core.js';
import S from '../assets/search-core.js';
import O from '../assets/organizer-core.js';
import {plannerScenes} from '../assets/planner-exports.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),fontkit=require('../assets/vendor/fontkit.umd.min.js');

test('current name edition and source disclosures agree everywhere',()=>{
 const data=JSON.parse(fs.readFileSync('assets/calendar-data.json'));
 assert.equal(data.assumptions.nameEdition,data.assumptions.namesEdition);
 assert.equal(data.assumptions.namesEdition,'2026');assert.equal(data.names.length,5652);
 assert(data.names.every(n=>n.edition===data.assumptions.namesEdition));
 assert.equal(data.sources.find(s=>s.id==='names').status,'verified');
 assert(!data.sources.some(s=>s.id==='names-snapshot'));
 assert(!fs.readFileSync('assets/app.js','utf8').includes('VVC 2018'));
 const names=[{name:'Janis',month:8,day:27,kind:'extended'},{name:'Jānis',month:6,day:24,kind:'traditional'}];
 assert.equal(K.names(names,{query:'Jānis'})[0].name,'Jānis');
 assert.equal(K.names(names,{query:'Janis'})[0].name,'Janis');
});

test('current-year date searches use the functioning calendar and every indexed URL exists',()=>{
 const index=S.prepare(JSON.parse(fs.readFileSync('assets/search-index.json')));
 assert.equal(S.search(index,'18.11.2026').results[0].url,'/?date=2026-11-18&view=month');
 assert.equal(S.search(index,'18.11.',{year:2026}).results[0].url,'/?date=2026-11-18&view=month');
 for(const row of index){const path=decodeURIComponent(row.url.split(/[?#]/)[0]);assert(fs.existsSync('_site'+path+'index.html')||fs.existsSync('_site'+path),row.url);}
});

test('month filters and exported dates have the same scope, including Advent',()=>{
 const data=JSON.parse(fs.readFileSync('assets/category-data.json')),advent=data.articles.find(a=>a.url.includes('/advente/'));
 assert(advent);const all=advent.dates.filter(d=>d.date.startsWith('2027'));
 assert.deepEqual(all.map(d=>d.date),['2027-11-28','2027-12-05','2027-12-12','2027-12-19']);
 const november=K.traditions([advent],{year:2027,month:11});
 assert.deepEqual(november[0].dates.map(d=>d.date),['2027-11-28']);
 assert.equal(K.traditions([advent],{year:2027,month:12})[0].dates.length,3);
 assert.equal(advent.dates.filter(d=>d.date.startsWith('2028')).at(-1).date,'2028-12-24');
 const palm=data.articles.find(a=>a.url.includes('/pupolu-svetdiena/'));
 assert.equal(C.diffDays(palm.dates.find(d=>d.date.startsWith('2027')).date,C.dateISO(C.easter(2027))),7);
 const meteni=data.articles.find(a=>a.url.includes('/meteni/'));assert.equal(meteni.dates.length,0,'No invented universal Meteņi event');
});

test('day, list and ISO week exports preserve their actual selected period',()=>{
 assert.equal(K.periodRange('2028-02-29','day').end,'2028-02-29');
 assert.equal(K.periodRange('2028-02-29','day').type,'day');
 assert.equal(K.periodRange('2028-02-29','list').start,'2028-02-01');
 assert.equal(K.periodRange('2028-02-29','list').end,'2028-02-29');
 const week=K.periodRange('2030-12-30','week');assert.equal(week.title,'1. nedēļa · 2031');assert.equal(week.end,'2031-01-05');
});

test('real font bounds and full notes survive every planner view and design',()=>{
 const fonts=['Regular','Bold'].map(style=>fontkit.create(fs.readFileSync(`assets/fonts/DM-Sans-${style}.ttf`)));
 for(const type of ['month','week','day','list'])for(const design of Array.from({length:15},(_,i)=>i+1)){
  const model={...K.periodRange('2028-02-29',type),title:'W'.repeat(70),rows:[{date:'2028-02-29',text:'W'.repeat(200)+'\nĀboli, Čiekuri, ģimene un dienas piezīme '.repeat(90)}]};
  const pages=plannerScenes(model,{design});assert(pages.length>1);
  for(const page of pages)for(const match of page.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="([\d.]+)"([^>]*)>(.*?)<\/text>/g)){
   const content=match[5].replace(/&amp;/g,'&').replace(/&apos;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),f=fonts[match[4].includes('700')?1:0],width=f.layout(content).positions.reduce((n,p)=>n+p.xAdvance,0)/f.unitsPerEm*Number(match[3]);
   const x=Number(match[1]),left=x-(match[4].includes('text-anchor="end"')?width:match[4].includes('text-anchor="middle"')?width/2:0);
   const pageHeight=Number(page.match(/viewBox="[\d.]+ [\d.]+ [\d.]+ ([\d.]+)"/)[1]),scale=Number(match[3])/f.unitsPerEm,y=Number(match[2]);
   assert(left>=0&&left+width<=961,content);assert(y-f.ascent*scale>=0&&y-f.descent*scale<=pageHeight,content);
  }
  assert(pages.every(p=>p.includes('KALENDARS365.LV')));
 }
});

test('lesson conflicts require a real shared occurrence, including mixed imported weekday types',()=>{
 const lesson={weekday:'1',from:'2027-09-01',until:'2027-09-30',start:'08:00',end:'09:00'};
 assert.equal(O.firstLessonDate(lesson),'2027-09-06');
 assert.equal(O.firstLessonDate({...lesson,from:'2027-09-07',until:'2027-09-10'}),null);
 assert.equal(O.lessonsOverlap(lesson,{...lesson,weekday:1,start:'08:30',end:'09:30'}),true);
 assert.equal(O.lessonsOverlap(lesson,{...lesson,from:'2027-09-07',until:'2027-09-10'}),false);
 assert.equal(O.lessonsOverlap(lesson,{...lesson,start:'09:00',end:'10:00'}),false);
 assert.equal(O.validDate('2027-99-99'),false);assert.equal(O.validDate('2028-02-29'),true);assert.equal(O.validDate('2027-02-29'),false);
});
