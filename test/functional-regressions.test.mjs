import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const app=require('../assets/app.js');
const horoscope=require('../assets/pages.js');
const wrap=body=>'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n'+body+'\nEND:VEVENT\nEND:VCALENDAR';
const collectionSource=fs.readFileSync('assets/calendar-collection.js','utf8');

// Run the real collection controller against a minimal DOM boundary. Navigation
// is observed as an output; it is never implemented again by the test.
function collection({year,month=null,state},source=collectionSource){
 const assigned=[],observers=[],buttons=new Map();let current=state;
 const button=name=>{if(!buttons.has(name))buttons.set(name,{disabled:false,addEventListener(){}});return buttons.get(name);};
 const calendar={querySelector:s=>s==='#calendar-title'?{}:button(s),querySelectorAll:s=>s==='#calendar-year option'?[]:[button('prev'),button('next')]};
 const root={dataset:{collectionPrefix:'kalendars',collectionYear:String(year),collectionMonth:month==null?'':String(month)},querySelector:s=>s==='[data-calendar-explorer]'?{open:false}:s==='.collection-calendar-app'?calendar:null};
 const context={document:{querySelector:s=>s==='[data-calendar-collection]'?root:null},URL,URLSearchParams,location:{origin:'https://kalendars365.lv',assign:url=>assigned.push(url)},K365:{getState:()=>current},MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}},matchMedia:()=>({matches:false,addEventListener(){}})};
 context.window=context;vm.runInNewContext(source,context,{timeout:1000});
 return{assigned,update:state=>{current=state;for(const fn of observers)fn();}};
}

test('collection initialization is idempotent for each supported year period',()=>{
 for(let year=2027;year<=2030;year++){
  const state={shown:`${year}-01-01`,selected:`${year}-01-01`,view:'year'};
  const page=collection({year,state});assert.deepEqual(page.assigned,[]);
  page.update(state);assert.deepEqual(page.assigned,[]);
 }
});
test('monthly collection navigation occurs once only when the selected period actually changes',()=>{
 const current={shown:'2028-02-01',selected:'2028-02-29',view:'month'};
 const page=collection({year:2028,month:2,state:current});assert.deepEqual(page.assigned,[]);
 page.update({...current,shown:'2028-03-01',selected:'2028-03-01'});
 assert.equal(page.assigned.length,1);assert.equal(new URL(page.assigned[0]).pathname,'/kalendars/2028/marts/');
 page.update({...current,shown:'2028-03-02'});assert.equal(page.assigned.length,1);
 const year=collection({year:2028,month:2,state:{...current,view:'year'}});
 assert.equal(new URL(year.assigned[0]).pathname,'/kalendars/2028/');
});
test('URL dates honor the same supported year bounds as the calendar controls',()=>{
 for(const value of ['9999-12-31','0001-01-01','2101-01-01','1899-12-31','2028-02-30','nonsense',null])assert.equal(app.calendarRouteDate(value),null);
 for(const value of ['1900-01-01','2028-02-29','2100-12-31'])assert.equal(app.calendarRouteDate(value).toISOString().slice(0,10),value);
});
test('adjacent dates outside the four-year collection open the working general calendar',()=>{
 const page=collection({year:2030,month:12,state:{shown:'2031-01-01',selected:'2031-01-01',view:'month'}});
 assert.equal(page.assigned.length,1);const target=new URL(page.assigned[0]);assert.equal(target.pathname,'/');assert.equal(target.searchParams.get('date'),'2031-01-01');assert.equal(target.searchParams.get('view'),'month');
 const previous=collection({year:2027,month:1,state:{shown:'2026-12-31',selected:'2026-12-31',view:'day'}});
 assert.equal(new URL(previous.assigned[0]).pathname,'/');assert.equal(new URL(previous.assigned[0]).searchParams.get('date'),'2026-12-31');
});
test('ICS import/export preserves nonzero seconds in local, UTC and external time zones',()=>{
 for(const [spec,time,endTime] of [
  ['DTSTART:20290101T090045Z\nDTEND:20290101T100015Z','11:00:45','12:00:15'],
  ['DTSTART;TZID=Europe/Riga:20290101T090045\nDTEND;TZID=Europe/Riga:20290101T100015','09:00:45','10:00:15'],
  ['DTSTART;TZID=America/New_York:20290101T090045\nDTEND;TZID=America/New_York:20290101T100015','16:00:45','17:00:15']]){
  const event=app.parseICS(wrap(spec+'\nSUMMARY:Sekundes'))[0];assert.equal(event.time,time);assert.equal(event.endTime,endTime);
  const again=app.parseICS(app.exportICS([event]))[0];assert.equal(again.time,time);assert.equal(again.endTime,endTime);
 }
});
test('a second-precision UNTIL remains valid and clips actual recurrence starts',()=>{
 const event=app.parseICS(wrap('DTSTART;TZID=Europe/Riga:20290101T090045\nRRULE:FREQ=DAILY;UNTIL=20290103T070030Z'))[0];
 assert.equal(event.untilTime,'09:00:30');assert(app.occurs(event,'2029-01-02'));assert(!app.occurs(event,'2029-01-03'));
 assert(app.exportICS([event]).includes('UNTIL=20290103T070030Z'));
});
test('mixed all-day/timed endpoints reject without silently losing the end date',()=>{
 for(const spec of ['DTSTART;TZID=Europe/Riga:20290101T090000\nDTEND;VALUE=DATE:20290102','DTEND:20290102T090000Z\nDTSTART;VALUE=DATE:20290101'])assert.throws(()=>app.parseICS(wrap(spec)),/veidam/);
});
test('moving an imported event retains second-precision duration',()=>{
 const event={date:'2029-01-01',time:'09:30:45',endDate:'2029-01-01',endTime:'10:30:15',title:'Sekundes'};
 const updated=app.mergeEditedEvent(event,{date:'2029-02-01',time:'12:00:30'});
 assert.equal(updated.endDate,'2029-02-01');assert.equal(updated.endTime,'13:00');
 const roundtrip=app.parseICS(app.exportICS([updated]))[0];assert.equal(roundtrip.time,'12:00:30');assert.equal(roundtrip.endTime,'13:00');
});
test('converting timed events to all-day retains covered days and exclusive DTEND',()=>{
 for(const [endDate,endTime,expected] of [['2029-01-01','11:00','2029-02-02'],['2029-01-02','22:00','2029-02-03'],['2029-01-02','00:00','2029-02-02']]){
  const event={date:'2029-01-01',time:'09:00',endDate,endTime,title:'Visa diena'};
  const updated=app.mergeEditedEvent(event,{date:'2029-02-01',time:''});assert.equal(updated.endDate,expected);assert(!('endTime' in updated));
  assert.equal(app.parseICS(app.exportICS([updated]))[0].endDate,expected);
 }
});
test('malformed stored rows cannot break valid notes, events or tasks',()=>{
 const raw={events:[null,{date:'2028-02-29',title:'Saglabāts',external:'retain',time:'09:30:45'}],tasks:[null,7,{id:4,title:'Uzdevums',done:false},{id:'',title:'Vecais uzdevums',done:'false'}],notes:{'2028-02-29':'ĀČĒĢĪĶĻŅŠŪŽ',bad:42},layers:['personal',null,{toString:'invalid'},'unknown','personal'],preferredView:'week'};
 const value=app.normalizeCalendarStore(raw);assert.equal(value.events.length,1);assert.equal(value.events[0].external,'retain');assert.equal(value.events[0].time,'09:30:45');assert(value.events[0].id);
 assert.equal(value.tasks.length,2);assert.equal(value.tasks[0].id,'4');assert(value.tasks[1].id);assert.equal(value.tasks[1].done,false);
 assert.deepEqual(value.notes,{'2028-02-29':'ĀČĒĢĪĶĻŅŠŪŽ'});assert.deepEqual(value.layers,['personal']);assert.equal(value.preferredView,'week');assert.equal(raw.tasks[0],null);
 for(const raw of [null,7,[],true])assert.equal(app.normalizeCalendarStore(raw),null);
});
test('an empty imported UID gets a usable identity without changing its content',()=>{
 const event=app.parseICS(wrap('UID:\nDTSTART;VALUE=DATE:20290101\nSUMMARY:Nezaudēt'))[0];assert(event.id);assert.equal(event.title,'Nezaudēt');
});
test('daily updates follow Riga midnight across the 23-hour and 25-hour DST days',()=>{
 for(const [start,end,hours] of [['2025-03-29T22:00:00Z','2025-03-30T21:00:00Z',23],['2025-10-25T21:00:00Z','2025-10-26T22:00:00Z',25],['2026-11-10T22:00:00Z','2026-11-11T22:00:00Z',24]]){
  const now=new Date(start),delay=horoscope.midnightDelay(now);assert.equal(delay,hours*3600000);assert.equal(new Date(+now+delay).toISOString(),new Date(end).toISOString());
 }
 assert.equal(horoscope.midnightDelay(new Date('2026-11-11T21:59:59.500Z')),1000);
});
