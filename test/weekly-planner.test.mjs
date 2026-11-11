import test from 'node:test';
import assert from 'node:assert/strict';
import {weeklyScenes,weeklyDesigns,weeklyFilename,weeklyPeriod} from '../assets/weekly-planner.mjs';
import {plannerScenes} from '../assets/planner-exports.mjs';
import {textWidth} from '../assets/planner-font-metrics.mjs';
import C from '../assets/calendar-core.js';

test('weekly exports agree with the calendar ISO dates across every 2027–2030 day',()=>{
 for(let d=C.parseISO('2027-01-01');d<=C.parseISO('2030-12-31');d=C.addDays(d,1)){
  const date=C.dateISO(d),p=weeklyPeriod({start:date}),expected=C.isoWeek(date);
  assert.equal(p.year,expected.year,date);assert.equal(p.week,expected.week,date);
  assert.equal(p.dates.length,7);assert.equal(C.weekday(p.start),1);assert.equal(C.weekday(p.end),7);
  assert.equal(C.diffDays(p.start,p.end),6);assert(p.start<=date&&p.end>=date);
 }
 assert.equal(weeklyFilename({start:'2030-12-31'},1),'kalendars365-2031-01-nedela-01');
 assert.notEqual(weeklyFilename({start:'2027-01-04'},1),weeklyFilename({start:'2027-01-11'},1));
 assert.throws(()=>weeklyPeriod({start:'2027-02-29'}));
});
test('all fifteen weekly designs preserve Latvian text and keep it inside the paper',()=>{
 const dates=weeklyPeriod({start:'2028-02-28'}).dates,model={type:'week',start:dates[0],title:'9. nedēļa · 2028',rows:dates.map(date=>({date,text:'Tikšanās ar ģimeni 14:30'}))};
 assert.equal(new Set(weeklyDesigns.map(d=>d.name)).size,15);
 const shapes=new Set();
 for(const d of weeklyDesigns){const pages=plannerScenes(model,{design:d.id});assert(pages[0].includes('29'));assert(pages[0].includes('Kalendārs365™'));assert(pages[0].includes('kalendars365.lv'));assert.equal((pages[0].match(/Tikšanās ar ģimeni/g)||[]).length,7);assert(!pages.some(p=>/NaN|Infinity|undefined|<image|<script|<foreignObject/.test(p)));
  for(const svg of pages)for(const m of svg.matchAll(/<text\b([^>]+)>(.*?)<\/text>/g)){
   const a=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
   const value=m[2].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&apos;',"'").replaceAll('&quot;','"');
   const width=textWidth(value,+a['font-size'],a['font-weight']==='700'),start=+a.x-(a['text-anchor']==='end'?width:a['text-anchor']==='middle'?width/2:0);
   assert(start>=0&&start+width<=1001,`${d.name}: ${value}`);assert(+a.y>=0&&+a.y<=700);
  }
  shapes.add(d.layout);
 }
 assert.equal(shapes.size,4);
});
test('long notes are never discarded, and user text cannot become SVG markup',()=>{
 const original=Array.from({length:650},(_,i)=>`Ieraksts${i}`).join(' ')+' <script>alert("x")</script> & Ģimene';
 for(const design of [1,2,6,8,14]){
  const pages=weeklyScenes({type:'week',start:'2027-12-27',rows:[{date:'2027-12-27',text:original}]},{design});
  assert(pages.length>1);assert(pages[0].includes('Pilns teksts pielikumā'));
  const appendix=pages.slice(1).join('');for(let i=0;i<650;i++)assert(appendix.includes('Ieraksts'+i));
  assert(appendix.includes('&lt;script&gt;'));assert(!appendix.includes('<script>'));assert(appendix.includes('2028. gada 2. janvāris'));
 }
 const family=plannerScenes({type:'week',kind:'family',title:'Ģimene',year:2028,month:2,rows:[{date:'2028-02-28',text:''}]});
 assert(!family[0].includes('data-weekly-design'));
});
