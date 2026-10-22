const assert=require('node:assert/strict');
const C=require('../assets/calendar-core.js'),P=require('../assets/planning.js'),{parseICS}=require('../assets/app.js');
let checks=0;function ok(v){assert.ok(v);checks++;}
for(const year of [2027,2028,2029,2030])for(const weekLength of [5,6])for(const budget of [0,1,3,5,10,20]){
 const options={weekLength},days=P.period(`${year}-01-01`,`${year}-12-31`,options).rows;
 let longest=0;
 for(let i=0;i<days.length;i++){let used=0;for(let j=i;j<days.length;j++){used+=Number(days[j].work);if(used>budget)break;longest=Math.max(longest,j-i+1);}}
 const result=P.suggestions(year,budget,options);ok(result.length>0);ok(result[0].days===longest);
 for(let i=0;i<result.length;i++){const r=result[i];ok(r.leave<=budget);ok(C.diffDays(r.start,r.end)+1===r.days);ok(P.period(r.start,r.end,options).work===r.leave);ok(r.dates.every(d=>C.isWorkday(d,options)));ok(!result.slice(i+1).some(x=>x.start<=r.end&&x.end>=r.start));}
}
const defaults=P.period('2028-01-01','2028-12-31');ok(defaults.work===251&&defaults.hours===2004);
const custom=P.period('2028-01-01','2028-12-31',{overrides:{'2028-07-11':false}});ok(custom.work===250&&custom.hours===1996);
const noShortening=P.period('2028-01-01','2028-12-31',{shorten:false});ok(noShortening.hours===2008);
assert.throws(()=>P.period('2029-02-30','2029-03-01'));checks++;
assert.throws(()=>P.period('2030-12-31','2029-01-01'));checks++;
assert.throws(()=>P.period('2026-12-31','2027-01-01'));checks++;
assert.throws(()=>P.suggestions(2030,-1));checks++;
assert.throws(()=>P.overrides('2028-02-30',false));checks++;
const imported=parseICS(P.calendarFile(['2028-07-11','2028-07-12']));ok(imported.length===2);ok(imported.every(x=>x.title==='Atvaļinājuma plāns'));
console.log(`Planning: ${checks} assertions passed; exhaustive longest-interval comparisons across 4 years, 2 workweeks, 6 budgets.`);
