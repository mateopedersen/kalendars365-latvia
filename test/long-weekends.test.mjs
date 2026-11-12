import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import C from '../assets/calendar-core.js';
import {createLongWeekendCore} from '../assets/long-weekends-core.mjs';
import {renderPage,renderCard} from '../assets/long-weekends-markup.mjs';
const L=createLongWeekendCore(C);
test('natural long weekends match the holiday calendar and contain no vacation workdays',()=>{
 const counts={2027:3,2028:6,2029:5,2030:5};
 for(const year of L.years){const rows=L.periods({year});assert.equal(rows.length,counts[year]);
  for(const [i,r]of rows.entries()){assert(r.days>=3);assert.equal(r.leave,0);assert.equal(r.days,C.diffDays(r.start,r.end)+1);assert(r.rows.some(d=>d.holidays.length));assert(r.rows.every(d=>!C.isWorkday(d.date)));assert(r.start.startsWith(String(year))&&r.end.startsWith(String(year)));assert(!rows.slice(i+1).some(q=>r.start<=q.end&&r.end>=q.start));}
 }
 const christmas=L.periods({year:2029}).find(r=>r.start==='2029-12-22');assert.equal(christmas.end,'2029-12-26');assert.equal(christmas.days,5);
});
test('holiday-connected suggestions use the requested leave budget and maximize the longest alternative',()=>{
 for(const year of L.years)for(const budget of [1,2,3,4,5]){
  const result=L.periods({year,budget,mode:'leave',sort:'longest'}),rows=L.yearRows(year);let expected=0;
  // Independent bounded search over every start/end, without the production
  // boundary pruning, ranking or non-overlap selection.
  for(let start=0;start<rows.length;start++){let cost=0,holiday=false;for(let end=start;end<Math.min(rows.length,start+20);end++){const date=rows[end].date;cost+=Number(C.isWorkday(date));holiday ||= C.weekday(date)<=5&&C.holidays(year).some(h=>h.date===date&&h.dayOff);if(cost>budget)break;const length=end-start+1;if(cost>0&&holiday&&length-cost>=3)expected=Math.max(expected,length);}}
  assert.equal(result[0]?.days||0,expected,year+'/'+budget);
  for(const [i,r]of result.entries()){assert(r.leave>=1&&r.leave<=budget);assert(r.rest>=3);assert.equal(r.leave,C.workdays(r.start,r.end));assert.deepEqual(r.dates,r.rows.filter(d=>C.isWorkday(d.date)).map(d=>d.date));assert(r.rows.some(d=>d.holidays.length&&d.weekday<=5));assert(!result.slice(i+1).some(q=>r.start<=q.end&&r.end>=q.start));}
 }
 const june=L.periods({year:2027,mode:'leave',budget:3}).find(r=>r.title==='Līgo un Jāņi');assert.deepEqual([june.start,june.end,june.days,june.leave],['2027-06-19','2027-06-27',9,3]);assert.deepEqual(june.dates,['2027-06-21','2027-06-22','2027-06-25']);
});
test('substitute holidays stay free, while commemoration days remain workdays',()=>{
 const july=L.periods({year:2028}).find(r=>r.title==='Dziesmu un deju svētki');assert.equal(july.end,'2028-07-10');assert.equal(july.days,3);assert.equal(july.leave,0);
 const november=L.periods({year:2029}).find(r=>r.title==='Novembra svētki');assert.equal(november.end,'2029-11-19');assert.equal(november.days,3);
 assert.equal(L.yearRows(2027).find(r=>r.date==='2027-11-11').work,true);
 assert(!L.periods({year:2027}).some(r=>r.start<='2027-11-11'&&r.end>='2027-11-11'));
});
test('sort changes preserve periods, exact dates and the chosen year',()=>{
 for(const year of L.years)for(const mode of ['free','leave']){const a=L.periods({year,mode}),b=L.periods({year,mode,sort:'longest'});assert.deepEqual(a.map(r=>r.id).sort(),b.map(r=>r.id).sort());assert(a.every((r,i)=>!i||a[i-1].start<=r.start));assert(b.every((r,i)=>!i||b[i-1].days>=r.days));}
 for(const input of [{year:2026},{budget:0},{budget:6},{year:2028.5},{mode:'unknown'},{sort:'unknown'}])assert.throws(()=>L.periods(input));
});
test('calendar exports retain an inclusive date range, actual leave dates and UTF-8 line limits',()=>{
 for(const year of L.years)for(const mode of ['free','leave'])for(const r of L.periods({year,mode})){
  const file=L.ics(r,new Date('2026-11-12T08:00:00Z')),unfolded=file.replace(/\r\n /g,'');
  assert(file.endsWith('END:VCALENDAR\r\n'));assert.equal((file.match(/BEGIN:VEVENT/g)||[]).length,1);assert(unfolded.includes('DTSTART;VALUE=DATE:'+r.start.replaceAll('-','')));assert(unfolded.includes('DTEND;VALUE=DATE:'+C.dateISO(C.addDays(r.end,1)).replaceAll('-','')));assert(unfolded.includes('SUMMARY:'+r.title));for(const d of r.dates)assert(unfolded.includes(C.dateLabel(d)));for(const line of file.split('\r\n'))assert(new TextEncoder().encode(line).length<=75);
 }
 const yearEnd=L.periods({year:2029}).find(r=>r.end==='2029-12-31');assert(L.ics(yearEnd).includes('DTEND;VALUE=DATE:20300101'));
});
test('server content is useful without JavaScript and does not reintroduce the large planning form',()=>{
 for(const year of L.years){const page=renderPage({year},L,{heading:year+'. gada garās brīvdienas',root:false}),expected=L.periods({year});assert.equal((page.match(/<h1>/g)||[]).length,1);assert(page.includes(year+'. gada garās brīvdienas'));assert.equal((page.match(/data-weekend-card=/g)||[]).length,expected.length);assert(!page.includes('planning-form'));assert(!page.includes('Stundas darba dienā'));assert(page.includes('Piecu dienu darba nedēļai'));assert(page.includes('/atvalinajuma-planotajs/'));
  for(const r of expected){assert(page.includes(r.start));assert(page.includes(L.calendarLink(r)));}
 }
 const r=L.periods({year:2027,mode:'leave'})[0],html=renderCard({...r,title:'<script>bad</script>'},{year:2027},L);assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
});
test('all five built routes use the same simplified experience without unrelated work-hour widgets', {skip:!fs.existsSync('_site/garas-brivdienas/index.html')},()=>{
 for(const suffix of ['',...L.years.map(y=>y+'/')]){const html=fs.readFileSync('_site/garas-brivdienas/'+suffix+'index.html','utf8');assert(html.includes('data-long-weekends'));assert(html.includes('long-weekends.mjs'));assert(!html.includes('data-planning'));assert(!html.includes('data-useful-outline'));assert(!html.includes('work-calendar-filters'));assert.equal((html.match(/data-weekend-card=/g)||[]).length,L.periods({year:suffix?Number(suffix.slice(0,4)):2027}).length);}
});
