const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),api=require('../assets/tax-guide.js');
test('salary matches the VID no-book example and independently calculated 2026 salary cases',()=>{
 const no=api.salary(900,{book:false});assert.equal(no.employee,94.5);assert.equal(no.income,205.4);assert.equal(no.net,600.1);
 const r=api.salary(1500);assert.equal(r.net,1140.41);assert.equal(r.income,202.09);assert.equal(r.total,1854.21);
 assert.equal(api.salary(1500,{dependents:1}).net,1204.16);
 assert.equal(api.salary(780).net,660.33);
 assert.equal(api.salary(500,{dependents:2}).income,0);
 const p=api.salary(1500,{status:'oldage'});assert.equal(p.employee,138.75);assert.equal(p.minimum,500);assert.equal(p.income,219.62);assert.equal(p.net,1141.63);assert.equal(p.employer,311.55);
 assert.equal(api.salary(1500,{status:'disability'}).employee,157.5);
 assert.equal(api.salary(1500,{status:'service'}).employee,146.4);
 assert.equal(api.salary(1500,{book:false,dependents:2,extra:154}).relief,0);
 assert.equal(api.salary(1500,{extra:120}).income,171.49);
 assert.throws(()=>api.salary(-1));assert.throws(()=>api.salary(9000));assert.throws(()=>api.salary(1500,{extra:999}));
});
test('inverse salary yields target cents and preserves the salary arithmetic across brackets',()=>{
 for(const status of ['standard','oldage','disability','service'])for(const book of [true,false])for(const dependents of [0,1,5])for(const gross of [0,250,550,780,1000,1500,3500,8775]){
 const o={status,book,dependents},r=api.salary(gross,o),inv=api.grossForNet(r.net,o);assert.equal(inv.net,r.net);assert(inv.gross<=gross);assert.equal(Math.round((r.net+r.employee+r.income)*100),Math.round(gross*100));assert(r.net>=0);}
});
test('VAT adds to base and correctly divides included VAT',()=>{
 assert.deepEqual(api.vat(100,.21,'add'),{net:100,vat:21,total:121});assert.deepEqual(api.vat(121,.21,'remove'),{net:100,vat:21,total:121});assert.equal(api.vat(100,.12,'add').total,112);assert.equal(api.vat(100,.05,'add').total,105);assert.equal(api.vat(100,0,'add').total,100);assert.throws(()=>api.vat(-1,.21,'add'));
});
test('deadline calculations distinguish declaration rules, weekends and midsummer holidays',()=>{
 const holidays=JSON.parse(fs.readFileSync('assets/calendar-data.json','utf8')).holidays.filter(h=>h.dayOff).map(h=>h.date);
 const annual=api.deadlines(2027,'annual',holidays);assert.equal(annual[0].date,'2027-06-01');assert.equal(annual[1].date,'2027-06-25');
 const self=api.deadlines(2027,'self',holidays),jan=self.find(r=>r.base==='2027-01-17');assert.equal(jan.date,'2027-01-17');assert.equal(jan.reminderDate,'2027-01-15');assert(jan.note);assert.equal(self.find(r=>r.base==='2027-01-23').date,'2027-01-25');
 const pvn=api.deadlines(2026,'pvnmonth',holidays);assert.equal(pvn.length,24);assert.equal(pvn.find(r=>r.base==='2026-06-20').date,'2026-06-25');
 assert.equal(api.deadlines(2027,'employee',holidays).length,0);assert.throws(()=>api.deadlines(2030,'annual'));
 const ics=api.calendar(self);assert(ics.includes('DTSTART;VALUE=DATE:20270115'));assert(ics.includes('BEGIN:VALARM'));assert(!ics.includes('RRULE'));
});
test('tax page is discoverable, canonical, local, and connected to official payment and form sources',()=>{
 const h=fs.readFileSync('_site/nodoklu-kalkulators/index.html','utf8');assert.equal((h.match(/<h1\b/g)||[]).length,1);assert(h.includes('href="https://kalendars365.lv/nodoklu-kalkulators/"'));assert(h.includes('href="https://eds.vid.gov.lv/"'));assert(h.includes('data-tax-dates'));assert(h.includes('VID veidlapu katalogs'));assert(h.includes('mēneša algas modelis'));
 const js=fs.readFileSync('assets/tax-guide.js','utf8');assert(!/fetch\(|localStorage|sendBeacon/.test(js));
 assert(fs.readFileSync('_site/sitemap.xml','utf8').includes('/nodoklu-kalkulators/'));assert(fs.readFileSync('_site/visi-riki/index.html','utf8').includes('/nodoklu-kalkulators/'));
});
