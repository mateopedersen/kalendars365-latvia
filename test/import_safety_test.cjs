'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {occurs,parseICS}=require('../assets/app.js');
const {validFamily,familyState,makeCalendar,icsDate}=require('../assets/organizers.js');
let checks=0;
const check=(name,fn)=>{fn();checks++;};
const wrap=body=>'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n'+body+'\nEND:VEVENT\nEND:VCALENDAR';
const family=entry=>({version:1,members:[],entries:[{id:'entry',title:'Appointment',date:'2026-11-10',start:'09:00',end:'10:00',type:'event',member:'',repeat:'none',doneDates:[],...entry}],meals:[],shopping:[]});

check('legacy version-one family backup remains valid',()=>{
 const value=family({});assert(validFamily(value));
 const state=familyState(value);assert.equal(state.entries[0].title,'Appointment');
 const result=makeCalendar(state.entries,'Family');
 assert(result.includes('DTSTART;TZID=Europe/Riga:20261110T090000'));
 assert(result.includes('DTEND;TZID=Europe/Riga:20261110T100000'));
});
check('family date cannot add an ICS property',()=>{
 const value=family({endDate:'2026-11-10T100000\r\nCOMMENT:UNEXPECTED'});
 assert.equal(validFamily(value),false);
 assert.throws(()=>makeCalendar(value.entries,'Family'));
 for(const date of ['2026-02-30','2026-11-09',7,null])assert.equal(validFamily(family({endDate:date})),false);
 assert.equal(validFamily(family({date:['2026-11-10']})),false);
 assert.equal(validFamily(family({start:['09:00'],end:['10:00']})),false);
});
check('valid optional end dates survive; unsupported fields do not',()=>{
 const value=family({endDate:'2026-11-11',unrelated:{hidden:true}});
 assert(validFamily(value));const state=familyState(value);
 assert.equal(state.entries[0].endDate,'2026-11-11');
 assert.equal(Object.hasOwn(state.entries[0],'unrelated'),false);
 assert(makeCalendar(state.entries,'Family').includes('DTEND;TZID=Europe/Riga:20261111T100000'));
});
check('all text fields neutralize CR, LF and CRLF',()=>{
 for(const separator of ['\r','\n','\r\n']){
  const marker='COMMENT:UNEXPECTED';
  const value=family({title:'Title'+separator+marker,location:'Place'+separator+marker,description:'Text'+separator+marker});
  assert(validFamily(value));const output=makeCalendar(familyState(value).entries,'Name'+separator+marker);
  assert(!output.includes('\r'+marker));assert(!output.includes('\n'+marker));
  assert.equal(output.split('\r\n').filter(line=>line==='BEGIN:VEVENT').length,1);
 }
});
check('defensive writer rejects a time separator and escapes a UID separator',()=>{
 assert.throws(()=>icsDate('2026-11-10','09:00\r\nCOMMENT:UNEXPECTED'));
 const output=makeCalendar(family({id:'entry\r\nCOMMENT:UNEXPECTED'}).entries,'Family');
 assert(!output.includes('\r\nCOMMENT:UNEXPECTED'));
 assert.equal(validFamily(family({location:{toString:'not callable'}})),false);
});
check('long historical recurrence uses a fixed computation budget',()=>{
 const NativeDate=Date;let constructions=0;
 class BudgetDate extends NativeDate{constructor(...args){if(++constructions>200)throw Error('Date work budget exceeded');super(...args);}}
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8'),{module,console,Date:BudgetDate,Intl,TextEncoder,crypto:{randomUUID:()=> 'bounded-fixture'}},{timeout:1000});
 const app=module.exports;
 const event=app.parseICS(wrap('UID:span\nDTSTART;VALUE=DATE:10000101\nDTEND;VALUE=DATE:99991231\nRRULE:FREQ=DAILY;UNTIL=10000101\nSUMMARY:Span'))[0];
 constructions=0;
 for(const repeat of ['daily','weekly','monthly','yearly'])assert(app.occurs({...event,repeat},'2026-11-10'));
 assert(constructions<=100);
});
check('multi-day tails remain visible after UNTIL and COUNT',()=>{
 const weekly={date:'2029-01-01',endDate:'2029-01-04',repeat:'weekly',until:'2029-01-08',time:''};
 assert(occurs(weekly,'2029-01-10'));assert(!occurs(weekly,'2029-01-11'));
 const counted={...weekly,until:undefined,count:2};
 assert(occurs(counted,'2029-01-10'));assert(!occurs(counted,'2029-01-17'));
 const timed={date:'2029-01-01',time:'09:00',endDate:'2029-01-03',endTime:'10:00',repeat:'daily',until:'2029-01-02',untilTime:'08:30:00'};
 assert(occurs(timed,'2029-01-03'));assert(!occurs(timed,'2029-01-04'));
 const midnight={date:'2029-01-01',time:'20:00',endDate:'2029-01-02',endTime:'00:00:00',repeat:'weekly'};
 assert(occurs(midnight,'2029-01-08'));assert(!occurs(midnight,'2029-01-09'));
 const once={date:'2029-01-01',time:'09:00',endDate:'2029-01-03',endTime:'10:00',repeat:'none'};
 assert(occurs(once,'2029-01-02',false));
});
check('leap dates and sparse 25-year COUNT retain actual occurrences',()=>{
 for(const repeat of ['monthly','yearly']){
  const event={date:'2000-02-29',repeat,interval:repeat==='monthly'?300:25,count:2};
  assert(occurs(event,'2000-02-29'));assert(occurs(event,'2400-02-29'));
  assert(!occurs(event,'2100-02-28'));assert(!occurs(event,'2800-02-29'));
 }
 const monthly={date:'2029-01-31',repeat:'monthly',count:3};
 assert(occurs(monthly,'2029-05-31'));assert(!occurs(monthly,'2029-07-31'));
 const quarterly={date:'2029-01-31',endDate:'2029-02-03',repeat:'monthly',interval:3,count:2};
 assert(occurs(quarterly,'2029-08-02'));assert(!occurs(quarterly,'2029-08-03'));
 const century={date:'2096-02-29',repeat:'yearly',interval:4,count:2};
 assert(occurs(century,'2104-02-29'));assert(!occurs(century,'2108-02-29'));
 const centuryMonths={date:'2000-02-29',repeat:'monthly',interval:1200,count:2};
 assert(occurs(centuryMonths,'2400-02-29'));assert(!occurs(centuryMonths,'2800-02-29'));
});
check('UNTIL time clips starts while retaining the previous long tail',()=>{
 const event={date:'2029-01-01',time:'20:00',endDate:'2029-01-12',endTime:'00:00',repeat:'weekly',until:'2029-01-08',untilTime:'19:59:59'};
 assert(occurs(event,'2029-01-09'));assert(!occurs(event,'2029-01-15'));
 assert(occurs({...event,untilTime:'20:00:00'},'2029-01-15'));
 assert(occurs({...event,untilTime:'20:00'},'2029-01-15'));
});

// Small explicit enumerations provide an independent oracle for bounded samples.
const DAY=86400000,iso=date=>date.toISOString().slice(0,10);
function reference(event,date){
 const start=new Date(event.date+'T00:00:00Z'),target=new Date(date+'T00:00:00Z');
 const end=event.endDate?new Date(event.endDate+'T00:00:00Z'):start;
 const span=event.endDate?Math.max(0,Math.round((end-start)/DAY)-(event.time&&event.endTime!=='00:00'&&event.endTime!=='00:00:00'?0:1)):0;
 const interval=event.interval||1;let count=0;
 for(let slot=0;slot<600;slot++){
  const candidate=event.repeat==='monthly'?new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+slot*interval,start.getUTCDate())):event.repeat==='yearly'?new Date(Date.UTC(start.getUTCFullYear()+slot*interval,start.getUTCMonth(),start.getUTCDate())):new Date(start.getTime()+slot*interval*(event.repeat==='weekly'?7:1)*DAY);
  if(candidate>target)return false;
  if((event.repeat==='monthly'||event.repeat==='yearly')&&(candidate.getUTCDate()!==start.getUTCDate()||(event.repeat==='yearly'&&candidate.getUTCMonth()!==start.getUTCMonth())))continue;
  const text=iso(candidate);if(event.until&&text>event.until)return false;
  if(event.until===text&&event.untilTime&&event.time&&(event.time.length===5?event.time+':00':event.time)>event.untilTime)return false;
  if(event.count&&++count>event.count)return false;
  if(target-candidate<=span*DAY)return true;
 }
 throw Error('reference fixture exceeded its small bound');
}
check('bounded independent enumeration agrees across recurrence kinds',()=>{
 const cases=[];
 for(const repeat of ['daily','weekly','monthly','yearly'])for(const interval of [1,2,5])for(const count of [0,2,5]){
  cases.push({date:'2028-01-31',endDate:'2028-02-03',time:'',repeat,interval,count});
 }
 const dates=['2028-01-30','2028-01-31','2028-02-01','2028-02-03','2028-02-29','2028-03-31','2028-04-02','2028-05-31','2028-06-02','2029-01-31'];
 for(const event of cases)for(const date of dates)assert.equal(occurs(event,date),reference(event,date),JSON.stringify({event,date}));
});
console.log(JSON.stringify({status:'passed',checks,referenceComparisons:360,liveRequests:0}));
