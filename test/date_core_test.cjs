'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const C=require('../assets/calendar-core.js');
let checks=0;
function equal(a,b){assert.deepEqual(a,b);checks++;}
const ruby=JSON.parse(execFileSync('ruby',['-I'+path.resolve(__dirname,'../lib'),'-rcalendar','-rjson','-e','puts JSON.generate((Date.new(2027,1,1)..Date.new(2030,12,31)).map { |d| {date:d.iso8601,iso:Calendar365.iso_week(d),work:Calendar365.is_workday(d),hours:Calendar365.work_hours(d)} })'],{encoding:'utf8'}));
equal(ruby.length,1461);
for(const row of ruby){equal(C.dateISO(C.parseISO(row.date)),row.date);equal(C.isoWeek(row.date),row.iso);equal(C.isWorkday(row.date),row.work);equal(C.workHours(row.date),row.hours);}
for(let year=2027;year<=2030;year++)for(let month=1;month<=12;month++){
  const grid=C.monthGrid(year,month),days=grid.flatMap(w=>w.days).filter(d=>d.inMonth);
  equal(days.length,new Date(Date.UTC(year,month,0)).getUTCDate());
  equal(new Set(days.map(d=>d.date)).size,days.length);
  for(const w of grid){equal(w.days.length,7);equal(w.days[0].weekday,1);equal(w.days[6].weekday,7);}
}
for(const value of ['2030-02-29','2029-02-29','2027-02-30','2027-13-01','2027-2-01','bad']){assert.throws(()=>C.parseISO(value));checks++;}
equal(C.dateISO(C.easter(2029)),'2029-04-01');equal(C.dateISO(C.easter(2030)),'2030-04-21');
equal(C.workdays('2027-01-01','2027-12-31'),252);equal(C.workdays('2027-01-05','2027-01-04'),-2);equal(C.workdays('2027-01-04','2027-01-04',{includeEnd:false}),0);
equal(C.workdays('2027-01-04','2027-01-05',{includeEnd:false}),1);
equal(C.diffDays('2028-02-28','2028-03-01'),2);
equal(C.todayRiga(new Date('2027-01-01T22:30:00Z')),'2027-01-02');
equal(C.todayRiga(new Date('2027-07-01T21:30:00Z')),'2027-07-02');
equal(C.todayRiga(new Date('2027-03-28T00:30:00Z')),'2027-03-28');
const data=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/calendar-data.json'),'utf8'));
equal(C.isWorkday('2028-07-10'),false);
equal(C.holidays(2028).find(r=>r.date==='2028-07-09').type,'holiday');
for(let year=2027;year<=2030;year++){
  const rows=data.holidays.filter(r=>r.date.startsWith(year+'-'));
  equal(C.holidays(year).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),rows.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
}
for(const s of data.seasons){equal(C.todayRiga(new Date(s.utc)),s.date);equal(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Riga',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s.utc)),s.time);}
equal(data.seasons.filter(s=>s.phenomenon==='Solstice').length,8);
equal(C.monthGrid(2027,1).flatMap(w=>w.days).find(d=>d.date==='2026-12-31').holiday[0].title,'Vecgada diena');
const leapMoon=data.moon.find(m=>m.utc==='2027-02-20T23:23:00Z');equal(leapMoon.date,'2027-02-21');equal(leapMoon.time,'01:23');
for(const m of data.moon){equal(C.todayRiga(new Date(m.utc)),m.date);assert.ok(/^[0-2]\d:[0-5]\d$/.test(m.time));checks++;}
console.log(JSON.stringify({status:'passed',checks,dates:ruby.length,months:48,isoWeeks:208,moonEvents:data.moon.length,timezone:'Europe/Riga'}));
