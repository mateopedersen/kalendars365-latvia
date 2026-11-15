const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const api=require('../assets/pension-guide.js');
test('retirement milestones use current age rules without asserting pension eligibility',()=>{
 const r=api.calculate('1962-05-17','31','2026-11-15');assert.equal(r.standard.date,'2027-05-17');assert.equal(r.early.date,'2025-05-17');assert.equal(r.service,31);
 assert.equal(api.calculate('1960-01-01','','2026-11-15').standardHistory,false);assert.equal(api.calculate('1959-01-01','','2026-11-15').standardHistory,true);
 assert.equal(api.calculate('1964-02-29','20','2026-11-15').standard.leapBoundary,true);assert.equal(api.calculate('1964-02-29','20','2026-11-15').standard.date,null);
 assert.throws(()=>api.calculate('2027-01-01','','2026-11-15'));assert.throws(()=>api.calculate('1962-02-30','','2026-11-15'));assert.throws(()=>api.calculate('1962-01-01','-1','2026-11-15'));
});
test('planning export contains review reminders, valid dates and bounded UTF-8 lines',()=>{
 assert.equal(api.subtractMonth('2027-03-31'),'2027-02-28');const ics=api.makeICS('2027-05-17');assert(ics.includes('DTSTART;VALUE=DATE:20270417'));assert(ics.includes('DTSTART;VALUE=DATE:20270517'));assert(ics.includes('BEGIN:VALARM'));assert(!ics.includes('RRULE'));for(const l of ics.split('\r\n'))assert(Buffer.byteLength(l)<=75);
});
test('pension guide preserves personal payment reminder and names source-specific boundaries',()=>{
 const html=fs.readFileSync('_site/pensiju-izmaksas/index.html','utf8');assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes('data-pension-calculator'));assert(html.includes('data-payment-reminder="pension"'));assert(html.includes('2026–2030'));for(const topic of ['Priekšlaicīga pensija','1589','1000 eiro','pensiju līmeņi','ES sociālās drošības'])assert(html.includes(topic),topic);assert(!html.includes('data-useful-page'));
});

test('pension illustration has reviewed source bytes and visible license credit',()=>{
 const crypto=require('node:crypto'),data=JSON.parse(fs.readFileSync('_data/pension-guide.json','utf8')),photo=data.photo;
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(photo.sourceCopy)).digest('hex'),photo.sourceSha256);
 assert.equal(photo.visualReview.sourceSha256,photo.sourceSha256);
 for(const f of photo.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('.'+f.src)).digest('hex'),f.sha256);
 const html=fs.readFileSync('_site/pensiju-izmaksas/index.html','utf8'),licenses=fs.readFileSync('_site/pilsetas-un-fotografijas/index.html','utf8');
 assert(html.includes('pension-hero-photo'));assert(html.includes('pension-age-track'));assert(html.includes('pension-key-facts'));
 assert(html.includes('/pilsetas-un-fotografijas/#pensiju-foto'));assert(licenses.includes(photo.sourceUrl));assert(licenses.includes(photo.licenseUrl));
 assert(!html.includes('class="guide-reference-section"'));assert(html.includes('www.vsaa.gov.lv'));
});
