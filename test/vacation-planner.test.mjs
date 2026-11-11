import test from 'node:test';
import assert from 'node:assert/strict';
import C from '../assets/calendar-core.js';
import {createVacationCore} from '../assets/vacation-core.mjs';
const V=createVacationCore(C);

test('four annual calendars agree with the holiday source on every date and both workweeks',()=>{
 const totals={2027:252,2028:251,2029:251,2030:250};
 for(const year of [2027,2028,2029,2030])for(const weekLength of [5,6]){
  const rows=V.yearRows({year,weekLength});assert.equal(rows.length,year===2028?366:365);
  for(const r of rows)assert.equal(r.work,C.isWorkday(r.date,{weekLength}),r.date);
  if(weekLength===5)assert.equal(rows.filter(r=>r.work).length,totals[year]);
 }
 assert.equal(V.analyse('2028-02-28','2028-03-05',{year:2028,budget:10}).leave,5);
 assert.equal(V.analyse('2028-07-10','2028-07-10',{year:2028}).leave,0);
 assert.equal(V.analyse('2029-11-19','2029-11-19',{year:2029}).leave,0);
 assert.equal(V.analyse('2027-11-11','2027-11-11',{}).leave,1);
});
test('actual June dates cost three leave workdays, and schedule edits recompute saved plans',()=>{
 const r=V.analyse('2027-06-19','2027-06-27',{});
 assert.deepEqual([r.days,r.leave,r.holidayRest,r.weekendRest],[9,3,2,4]);
 assert.deepEqual(r.dates,['2027-06-21','2027-06-22','2027-06-25']);
 const raw=[{start:r.start,end:r.end,leave:999},{start:'2028-02-28',end:'2028-03-05'}],copy=structuredClone(raw);
 assert.equal(V.selection(raw,{}).leave,3);assert.equal(V.selection(raw,{weekLength:6}).leave,5);
 assert.equal(V.selection(raw,{off:'2027-06-25',on:'2027-06-19'}).leave,3);
 assert.equal(V.selection(raw,{off:'2027-06-25'}).leave,2);
 assert.equal(V.selection(raw,{year:2028,budget:5}).leave,5);
 assert.deepEqual(raw,copy);
});
test('validation localizes invalid and crossed-year dates and rejects contradictory overrides',()=>{
 for(const date of ['2027-02-29','2028-02-30','','nonsense'])assert.throws(()=>V.analyse(date,'2027-06-27',{}),/derīgu datumu/);
 assert.throws(()=>V.analyse('2027-12-29','2028-01-03',{}),/sadali pa gadiem/);
 assert.throws(()=>V.analyse('2027-06-27','2027-06-19',{}),/Beigu datums/);
 assert.throws(()=>V.settings({off:'2027-06-25',on:'2027-06-25'}),/gan darba diena/);
 assert.throws(()=>V.settings({off:'2027-06-25',overrides:{'2027-06-25':true}}),/gan darba diena/);
 for(const bad of [{budget:-1},{budget:1.5},{budget:61},{maxTrips:6},{year:2026},{month:13},{minRest:20,maxRest:10},{on:'2026-12-31'},{overrides:{'2031-01-01':false}}])assert.throws(()=>V.settings(bad));
 assert.equal(V.settings({off:'2027-06-25, 2027-06-26;2027-06-27'}).overrides['2027-06-26'],false);
});
test('saving never duplicates dates, overlaps, or exceeds budget; other-year records survive',()=>{
 const other={start:'2028-02-28',end:'2028-03-05'},r={start:'2027-06-19',end:'2027-06-27'};
 const saved=V.add([other],r,{});assert.deepEqual(saved,[other,r]);
 assert.throws(()=>V.add(saved,r,{}),/pārklājas/);
 assert.throws(()=>V.add(saved,{start:'2027-07-05',end:'2027-07-06'},{}),/atlikums ir 0/);
 const duplicate=V.selection([r,r],{});assert(duplicate.overlap);assert.equal(duplicate.leave,3);assert.equal(duplicate.days,9);
 const corrupt={start:'2027-13-01',end:'2027-13-02'};assert.equal(V.selection([corrupt],{}).invalid.length,1);
 assert.throws(()=>V.add([corrupt],r,{}),/nederīgos/);
});
test('candidate search matches exhaustive June ranges, budget limits, and blocked-date boundaries',()=>{
 for(const budget of [0,1,3,8])for(const weekLength of [5,6]){
  const s={month:6,budget,weekLength,minRest:2,maxRest:12},rows=V.yearRows(s).filter(r=>r.date.slice(5,7)==='06'),expected=[];
  for(let a=0;a<rows.length;a++)for(let b=a+1;b<rows.length&&b-a<12;b++)if(C.workdays(rows[a].date,rows[b].date,{weekLength})<=budget)expected.push(rows[a].date+'_'+rows[b].date);
  assert.deepEqual(V.candidates(s).map(r=>r.id),expected);
 }
 const blocked=[{start:'2027-06-19',end:'2027-06-23'}],list=V.candidates({month:6,budget:10,minRest:2,maxRest:5},{blocked});
 assert(list.every(r=>!V.overlaps(r,blocked[0])));
 assert(list.some(r=>r.start==='2027-06-24'&&r.end==='2027-06-28'));
 assert(list.some(r=>r.start==='2027-06-14'&&r.end==='2027-06-18'));
 assert(list.every(r=>r.start.slice(5,7)==='06'&&r.end.slice(5,7)==='06'));
});
test('optimizer matches an independent combination search, minimizing leave cost on equal rest',()=>{
 const small=V.candidates({month:6,budget:8,minRest:2,maxRest:4}).filter(r=>r.start>='2027-06-18'&&r.end<='2027-06-27');
 for(const budget of [0,1,2,3,4,8])for(const maxTrips of [1,2,3]){
  let best={days:0,leave:0,trips:0};
  function brute(at,chosen,days,leave){if(days>best.days||days===best.days&&(leave<best.leave||leave===best.leave&&chosen.length<best.trips))best={days,leave,trips:chosen.length};if(chosen.length===maxTrips)return;for(let i=at;i<small.length;i++){const r=small[i];if(leave+r.leave<=budget&&!chosen.some(x=>V.overlaps(x,r)))brute(i+1,[...chosen,r],days+r.days,leave+r.leave);}}
  brute(0,[],0,0);const result=V.optimize(small,budget,maxTrips);
  assert.deepEqual({days:result.reduce((n,r)=>n+r.days,0),leave:result.reduce((n,r)=>n+r.leave,0),trips:result.length},best,JSON.stringify({budget,maxTrips}));
 }
 assert.deepEqual(V.optimize(small,3,0),[]);
 assert.throws(()=>V.optimize([{start:'2027-06-01',end:'2027-06-05',days:5,leave:-1}],3),/nederīgs periods/);
});
test('full-year optimization respects limits, saved intervals, and six-day employer overrides',()=>{
 const s={year:2028,budget:20,maxTrips:3,weekLength:6,off:'2028-06-30',on:'2028-06-17'},saved=[{start:'2028-02-28',end:'2028-03-05'}],used=V.selection(saved,s),pool=V.candidates({...s,budget:used.remaining},{blocked:saved});
 const picked=V.optimize(pool,used.remaining,s.maxTrips-saved.length);let all=saved;
 for(const r of picked)all=V.add(all,r,s);
 const total=V.selection(all,s);assert(!total.overlap);assert(total.leave<=20);assert(total.rows.length<=3);assert(total.days>=used.days);assert.deepEqual(picked,V.optimize(pool,used.remaining,2));
});
test('CSV has real leave dates and both ICS formats retain exact inclusive boundaries',async()=>{
 const {default:K}=await import('../assets/category-core.js'),saved=[{start:'2027-06-19',end:'2027-06-27'}],t=V.selection(saved,{}),csv=V.planCSV(saved,{});
 assert(csv.startsWith('\ufeff"Sākums"'));assert(csv.includes('"2027-06-19","2027-06-27","9","3","2"'));assert(csv.includes('2027-06-21, 2027-06-22, 2027-06-25'));
 const work=K.ics(t.dates.map(date=>({date,title:'Atvaļinājums'})));
 assert.equal((work.match(/BEGIN:VEVENT/g)||[]).length,3);assert(!work.includes('DTSTART;VALUE=DATE:20270623'));
 const rest=K.ics([{date:t.rows[0].start,endDate:t.rows[0].end,title:'Atpūta'}]);assert(rest.includes('DTSTART;VALUE=DATE:20270619'));assert(rest.includes('DTEND;VALUE=DATE:20270628'));
});
