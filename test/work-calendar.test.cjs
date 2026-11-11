const {test}=require('node:test');
const assert=require('node:assert/strict');
const W=require('../assets/work-calendar-core.js');
const C=require('../assets/calendar-core.js');
const fs=require('node:fs');
test('Latvia annual work totals and pre-holiday hours agree across every month',()=>{
  const known={2027:[252,2009,7],2028:[251,2004,4],2029:[251,2004,4],2030:[250,1995,5]};
  for(const [year,expected] of Object.entries(known)){
    const r=W.annual(year);
    assert.deepEqual([r.work,r.hours,r.shortened],expected);
    assert.equal(r.days,Number(year)===2028?366:365);
    for(const field of ['days','work','rest','hours','shortened','excludedHolidays'])assert.equal(r[field],r.months.reduce((sum,m)=>sum+m[field],0));
    assert.equal(r.work+r.rest,r.days);
    for(const row of r.rows){assert.equal(row.work,C.isWorkday(row.date));assert.equal(row.hours,C.workHours(row.date));}
  }
});
test('weekend holidays and commemorations do not get subtracted twice',()=>{
  assert.equal(W.period('2027-05-01','2027-05-01').excludedHolidays,0);
  assert.equal(W.day('2027-11-11').work,true);
  assert.equal(W.period('2027-05-01','2027-05-01',{weekdays:[6]}).excludedHolidays,1);
  assert.equal(W.day('2029-11-19').work,false);
  assert.equal(W.day('2028-07-10').holiday[0].type,'substitute');
  assert.equal(W.day('2028-07-07').shortened,false);
  assert.equal(W.day('2027-12-30').hours,7);
});
test('custom weekdays, partial hours and no-day schedules recalculate honestly',()=>{
  const all=W.annual(2028,{weekdays:[1,2,3,4,5,6,7],holidays:false,shorten:false,hours:4});assert.equal(all.work,366);assert.equal(all.hours,1464);
  const none=W.annual(2027,{weekdays:[]});assert.equal(none.work,0);assert.equal(none.hours,0);assert.equal(none.rest,365);
  assert.equal(W.day('2027-03-25',{hours:4,shorten:false}).hours,4);
  assert.equal(W.day('2027-03-25',{hours:4,shorten:true}).hours,3);
  assert.equal(W.period('2027-01-04','2027-01-06',{weekdays:[1,3],shorten:false}).work,2);
});
test('explicit employer dates override the base calendar and reject conflicts',()=>{
  const overrides=W.parseOverrides('2027-06-25','2027-06-19');
  assert.equal(W.day('2027-06-25',{overrides}).work,false);
  assert.equal(W.day('2027-06-19',{overrides}).hours,8);
  assert.equal(W.day('2027-01-01',{overrides:{'2027-01-01':true}}).excludedHoliday,false);
  assert.throws(()=>W.parseOverrides('2027-06-25','2027-06-25'));
  assert.throws(()=>W.parseOverrides('2027-02-29'));
});
test('range boundaries are inclusive and invalid settings are rejected',()=>{
  assert.equal(W.period('2027-01-04','2027-01-04').work,1);
  assert.equal(W.period('2027-12-31','2028-01-02').days,3);
  assert.throws(()=>W.period('2027-03-02','2027-03-01'));
  assert.throws(()=>W.day('2026-12-31'));
  assert.throws(()=>W.day('2031-01-01'));
  assert.throws(()=>W.annual(2028,{weekdays:[0]}));
  assert.throws(()=>W.annual(2028,{hours:''}));
  assert.throws(()=>W.annual(2028,{hours:25}));
});
test('CSV exports actual selected rows with safe Latvian values',()=>{
  const text=W.csv(W.period('2027-03-25','2027-03-29'));
  assert.ok(text.startsWith('\ufeff"Datums";'));
  assert.equal(text.trim().split('\r\n').length,6);
  assert.ok(text.includes('"2027-03-25";"ceturtdiena";"Saīsināta darba diena";"7"'));
  assert.ok(text.includes('Otrās Lieldienas'));
});
test('date shifts clamp month endings and handle leap days, negative moves and limits',()=>{
  assert.equal(W.shiftDate('2027-01-31',1,'months').date,'2027-02-28');
  assert.equal(W.shiftDate('2028-01-31',1,'months').date,'2028-02-29');
  assert.equal(W.shiftDate('2028-02-29',12,'months').date,'2029-02-28');
  assert.equal(W.shiftDate('2028-03-31',-1,'months').date,'2028-02-29');
  assert.equal(W.shiftDate('2027-12-31',1,'days').date,'2028-01-01');
  assert.equal(W.shiftDate('2027-04-01',-2,'weeks').date,'2027-03-18');
  assert.equal(W.shiftDate('2027-03-27',2,'days').days,2);
  assert.equal(W.shiftDate('2030-12-31',1,'days').date,'2031-01-01');
  assert.throws(()=>W.shiftDate('2100-12-31',1,'days'));
  assert.throws(()=>W.shiftDate('2027-01-01',1.5,'days'));
  assert.throws(()=>W.shiftDate('2027-01-01','','days'));
  assert.throws(()=>W.shiftDate('2027-01-01',1,'hours'));
});
test('date difference keeps calendar months distinct from inclusive day counts',()=>{
  const leap=W.difference('2028-02-28','2028-03-01');assert.equal(leap.days,2);
  assert.equal(W.difference('2027-03-28','2027-03-29').days,1);
  assert.equal(W.difference('2027-01-01','2027-01-01').days,0);
  assert.equal(W.difference('2027-01-01','2027-01-01',true).days,1);
  const month=W.difference('2027-01-31','2027-02-28',true);assert.equal(month.days,29);assert.equal(month.months,1);assert.equal(month.monthDays,0);
  const reverse=W.difference('2027-03-01','2027-02-01');assert.equal(reverse.reverse,true);assert.equal(reverse.days,28);assert.equal(reverse.months,1);
  for(const [from,to] of [['2027-01-31','2027-03-30'],['2028-02-29','2029-03-01'],['1900-01-01','2100-12-31']]){
    const r=W.difference(from,to);assert.equal(C.dateISO(C.addDays(W.shiftDate(from,r.months,'months').date,r.monthDays)),to);
  }
  assert.throws(()=>W.difference('2027-02-29','2028-01-01'));
});
test('work range endpoints are independently selectable without changing holiday rules',()=>{
  const from='2027-01-04',to='2027-01-06';
  assert.equal(W.workPeriod(from,to).work,3);
  assert.equal(W.workPeriod(from,to,{}, {includeStart:false}).work,2);
  assert.equal(W.workPeriod(from,to,{}, {includeEnd:false}).work,2);
  assert.equal(W.workPeriod(from,to,{}, {includeStart:false,includeEnd:false}).work,1);
  assert.equal(W.workPeriod(from,from,{}, {includeEnd:false}).days,0);
  assert.equal(W.workPeriod('2027-03-25','2027-03-29',{}, {includeEnd:false}).hours,7);
  assert.equal(W.workPeriod('2028-07-10','2028-07-10').excludedHolidays,1);
});
test('all 53 work pages share the new UI and useful server-rendered results',()=>{
  const manifest=JSON.parse(fs.readFileSync('docs/route-manifest.json','utf8'));
  const pages=manifest.filter(page=>page.url.startsWith('/darba-dienu-kalendars/'));
  assert.equal(pages.length,53);
  for(const {url} of pages){
    const html=fs.readFileSync('_site'+url+'index.html','utf8');
    const year=Number(url.match(/\/(202[7-9]|2030)\//)?.[1]||2027),expected=W.annual(year);
    assert.equal((html.match(/data-work-calendar /g)||[]).length,1,url);
    assert.equal((html.match(/data-work-pick-month="/g)||[]).length,12,url);
    assert.ok(html.includes(`data-work-total="work">${expected.work}<`),url);
    assert.ok(html.includes(`data-work-total="hours">${expected.hours}<`),url);
    assert.ok(!html.includes('data-planning="work"'),url+' no duplicate calculator');
    assert.ok(html.includes('data-work-range-form')&&html.includes('data-work-csv="year"'),url);
    assert.equal((html.match(/data-work-tool-tab="/g)||[]).length,3,url);
    assert.equal((html.match(/data-work-settings/g)||[]).length,1,url+' only one shared schedule');
    assert.ok(html.includes('data-work-copy="link"')&&html.includes('data-work-copy="result"'),url);
    assert.ok(html.includes('work-calendar-core.js?v='),url);
    assert.ok(!html.includes('/darba-dienu-kalendars/2026/'),url);
  }
});
