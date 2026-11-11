import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spacingPlan,reminderEvent,safeJournal,sourceMatches,isoWeekDates} from '../assets/useful-core.mjs';
import {citySky,dayBounds} from '../assets/sky-core.mjs';
test('bed planning respects edge margins and packet germination without inventing crop spacing',()=>{
 const plan=spacingPlan({length:3,width:1.2,rows:30,plants:10,germination:80});assert(Math.abs(plan.area-3.6)<1e-9);assert.deepEqual({...plan,area:3.6},{area:3.6,rowCount:4,perRow:30,total:120,seeds:150});
 assert.equal(spacingPlan({length:.1,width:.1,rows:30,plants:30,germination:100}).total,0);
 for(const change of [{length:0},{germination:101},{width:Infinity},{rows:-1}])assert.throws(()=>spacingPlan({length:3,width:1,rows:30,plants:10,germination:80,...change}));
});
test('event reminders cross leap days and years while keeping actual event and scope',()=>{
 const r=reminderEvent({date:'2028-03-01',title:'Avota datums',scope:'Konfesijas kalendārs'},1,'Notikums','https://kalendars365.lv/test/');
 assert.equal(r.date,'2028-02-29');assert(r.description.includes('2028-03-01'));assert(r.description.includes('Konfesijas'));
 assert.equal(reminderEvent({date:'2027-01-01'},7,'Diena','x').date,'2026-12-25');
 assert.throws(()=>reminderEvent({date:'2027-02-29'},0,'Diena','x'));assert.throws(()=>reminderEvent({date:'2028-03-01'},-1,'Diena','x'));
});
test('source search preserves Latvian names, matches diacritics and requires all terms',()=>{
 const rows=[{text:'Rīga · Māris · CC BY-SA 4.0',url:'https://commons.wikimedia.org/x'},{text:'USNO Mēness fāzes',url:'https://aa.usno.navy.mil'}];
 assert.equal(sourceMatches(rows,'riga cc').length,1);assert.equal(sourceMatches(rows,'mēness usno')[0],rows[1]);assert.equal(sourceMatches(rows,'riga usno').length,0);
});
test('journal rejects malformed containers and unbounded records',()=>{
 assert.deepEqual(safeJournal({note:'x'}),[]);assert.deepEqual(safeJournal([null,{date:'x',note:'test'}]),[]);
 assert.equal(safeJournal([{date:'2028-02-29',note:'Mans konkrētais solis'}]).length,1);
 assert.equal(safeJournal([{date:'2028-02-29',note:'x'.repeat(2001)}]).length,0);
});
test('city comparisons use real coordinates and stay inside Latvia civil days on DST transitions',()=>{
 const cities=JSON.parse(fs.readFileSync('_data/cities.json')).cities,a=cities.find(c=>c.id==='riga'),b=cities.find(c=>c.id==='liepaja');
 for(const date of ['2027-03-28','2027-10-31','2028-02-29'])for(const city of [a,b]){const r=citySky(date,city),bounds=dayBounds(date);for(const t of [r.sun.sunrise,r.sun.sunset,...r.moon.rises,...r.moon.sets].filter(Boolean)){assert(t>=bounds.start&&t<bounds.end);}assert(r.daylightMinutes>0);}
 assert.notEqual(+citySky('2027-06-21',a).sun.sunset,+citySky('2027-06-21',b).sun.sunset);
});

test('ISO reverse lookup supports boundary weeks without inventing week 53',()=>{assert.equal(isoWeekDates(2026,53).days[4],'2027-01-01');assert.equal(isoWeekDates(2027,1).days[0],'2027-01-04');assert.throws(()=>isoWeekDates(2027,53));assert.equal(isoWeekDates(2028,9).days[1],'2028-02-29');});
