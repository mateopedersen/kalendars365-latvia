const W=require('../assets/work-calendar-core.js');
process.stdout.write(JSON.stringify(Object.fromEntries([2027,2028,2029,2030].map(year=>[year,W.annual(year)]))));
