const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../assets/school-core.js');
const school={...require('../_data/latvia-verified-data.json').education.school,end:'2027-08-31'};
const holidays=require('../assets/calendar-data.json').holidays;
const universities=require('../_data/university-calendars.json');

test('school periods respect graduation grades and inclusive dates',()=>{
  for(let grade=1;grade<=12;grade++){
    const periods=C.periods(school,grade);
    assert.equal(periods.length,[9,12].includes(grade)?3:4);
    assert.equal(periods[0].days,5);assert.equal(periods[1].days,12);
    if(![9,12].includes(grade))assert.equal(periods[3].days,92);
  }
  assert.equal(C.gradeEnd(school,9),'2027-06-11');assert.equal(C.gradeEnd(school,12),'2027-06-18');
  assert.throws(()=>C.periods(school,13));assert.throws(()=>C.periods(school,0));
});
test('free-day planner unions holidays and weekends without double counting',()=>{
  assert.deepEqual(C.countRange(school,8,'2026-12-19','2027-01-03',holidays),{total:16,free:16,study:0,unknown:0});
  assert.deepEqual(C.countRange(school,8,'2027-03-06','2027-03-14',holidays),{total:9,free:9,study:0,unknown:0});
  assert.deepEqual(C.countRange(school,8,'2027-06-01','2027-08-31',holidays),{total:92,free:92,study:0,unknown:0});
  assert.deepEqual(C.countRange(school,9,'2027-06-01','2027-06-18',holidays),{total:18,free:4,study:9,unknown:5});
  assert.deepEqual(C.countRange(school,12,'2027-06-01','2027-06-18',holidays),{total:18,free:4,study:14,unknown:0});
  assert.throws(()=>C.countRange(school,8,'2026-08-31','2026-09-03',holidays));
  assert.throws(()=>C.countRange(school,8,'2027-02-30','2027-03-03',holidays));
  assert.throws(()=>C.countRange(school,8,'2027-03-15','2027-03-14',holidays));
});
test('countdown uses real dates and switches away from finished periods',()=>{
  const next=C.nextBreak(school,8,'2026-11-10');assert.equal(next.start,'2026-12-21');assert.equal(next.daysUntil,41);
  assert.equal(C.nextBreak(school,8,'2026-12-25').ongoing,true);
  assert.equal(C.nextBreak(school,9,'2027-06-01'),null);
  assert.equal(C.nextBreak(school,8,'2027-06-01').days,92);
});
test('ICS exports retain all-day boundaries, Latvian characters and safe folded text',()=>{
  const winter=C.periods(school,8)[1];
  const text=C.makeICS([{...winter,id:'winter',label:'Ziemas brīvdienas, ģimenei; kopā\r\nBEGIN:VEVENT',source:'https://likumi.lv/'}],'Mācību kalendārs',new Date('2026-11-10T12:00:00Z'));
  assert.ok(text.includes('DTSTART;VALUE=DATE:20261221\r\n'));
  assert.ok(text.includes('DTEND;VALUE=DATE:20270102\r\n'));
  assert.equal((text.match(/\r\nBEGIN:VEVENT\r\n/g)||[]).length,1);
  assert.ok(text.includes('brīvdienas\\, ģimenei\\;'));
  for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
  assert.throws(()=>C.makeICS([],'Nav datumu'));
});
test('university dates do not turn exams or unpublished summer dates into holidays',()=>{
  const lbtu=universities.calendars.find(item=>item.id==='lbtu');
  assert.ok(!lbtu.events.some(item=>item.kind==='holiday'&&item.start>='2027-06-01'));
  const du=universities.calendars.find(item=>item.id==='du');
  assert.equal(du.events.find(item=>item.start==='2026-12-21').kind,'exam');
  assert.equal(universities.stateUniversities.length,11);
  assert.equal(universities.calendars.filter(item=>item.id==='lu-doctoral').length,1);
});
test('same-page university explorer includes sources and local campus derivatives',()=>{
  const page=fs.readFileSync(path.join(__dirname,'../_site/skolas-brivlaiki/index.html'),'utf8');
  assert.equal((page.match(/data-university="/g)||[]).length,11);
  assert.ok(page.includes('data-school-counter'));assert.ok(page.includes('data-school-month-grid'));
  assert.ok(page.includes('data-uni-search-input'));assert.ok(page.includes('data-uni-verified-only'));
  for(const photo of require('../_data/university-card-images.json').photos){
    assert.ok(page.includes(photo.src));
    for(const file of photo.files){const bytes=fs.readFileSync(path.join(__dirname,'..',file.src));assert.equal(bytes.length,file.bytes);}
  }
});
