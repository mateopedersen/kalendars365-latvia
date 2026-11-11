'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const catalog=json('_data/social-images.json'),rows=Object.values(catalog.pages),routes=json('docs/route-manifest.json');
function jpegSize(b){assert.equal(b[0],255);assert.equal(b[1],216);let i=2;while(i<b.length){while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;const length=b.readUInt16BE(i);if([192,193,194].includes(marker))return[b.readUInt16BE(i+5),b.readUInt16BE(i+3)];i+=length;}throw Error('No JPEG size');}
test('900 routes have distinct finished covers and distinct subject panels',()=>{
 assert.equal(rows.length,900);assert.deepEqual(new Set(rows.map(r=>r.url)),new Set([...routes.map(r=>r.url),'/404.html','/500.html','/nedelas-kalendars/2031/01/']));
 for(const key of ['src','pixelSha256','panelSha256'])assert.equal(new Set(rows.map(r=>r[key])).size,900,key);
 for(const r of rows){const b=read('.'+r.src);assert.equal(sha(b),r.sha256,r.url);assert.equal(b.length,r.bytes,r.url);assert.deepEqual(jpegSize(b),[1200,630],r.url);assert.ok(b.length<400000,r.url);assert.ok(r.alt.includes(r.title),r.url);assert.equal(r.type,'image/jpeg');}
 assert.equal(catalog.rendererSha256,sha(read('scripts/social_images.py')));assert.equal(catalog.prepareSha256,sha(read('tooling/social-cards/prepare.mjs')));
});
test('exact dates survive leap days and ISO year crossings in the depicted calendar data',()=>{
 let weeks=0,months=0;
 for(const r of rows){const f=r.semanticFacts;
  if(r.family==='iso_week'){
   weeks++;assert.equal(f.dates.length,7,r.url);const jan4=new Date(Date.UTC(f.isoYear,0,4)),monday=new Date(+jan4-((jan4.getUTCDay()+6)%7)*86400000+(f.week-1)*7*86400000);
   assert.deepEqual(f.dates,Array.from({length:7},(_,i)=>new Date(+monday+i*86400000).toISOString().slice(0,10)),r.url);
  }else if(['calendar_month','print_month','work_month','lunar_month'].includes(r.family)){
   months++;assert.equal(f.days,new Date(Date.UTC(f.year,f.month,0)).getUTCDate(),r.url);assert.equal(f.firstWeekday,(new Date(Date.UTC(f.year,f.month-1,1)).getUTCDay()+6)%7,r.url);
   if(r.family==='lunar_month'){assert.equal(Object.keys(f.noonSamples).length,f.days,r.url);for(const [day,v] of Object.entries(f.noonSamples)){assert.ok(day.startsWith(`${f.year}-${String(f.month).padStart(2,'0')}-`));assert.ok(v.phase>=0&&v.phase<=1);assert.ok(v.illumination>=0&&v.illumination<=1);}}
  }
 }
 assert.equal(weeks,209);assert.equal(months,192);
 assert.ok(catalog.pages['/meness-kalendars/2028/februaris/'].semanticFacts.noonSamples['2028-02-29']);
});
test('photographs retain explicit attribution and all bound assets still match their reviewed inputs',()=>{
 const hashes=new Map(),photos=json('assets/social-cards/credits.json').photos;
 for(const r of rows){for(const [p,h] of Object.entries(r.inputs)){if(!hashes.has(p))hashes.set(p,sha(read('.'+p)));assert.equal(hashes.get(p),h,r.url+' '+p);}for(const s of r.sources){assert.ok(s.author||s.credit,r.url);assert.match(s.sourceUrl,/^https?:\/\//,r.url);assert.ok(s.license,r.url);if(!/public domain/i.test(s.license))assert.match(s.licenseUrl,/^https?:\/\//,r.url);}}
 assert.ok(photos.length>100);assert.equal(new Set(photos.map(p=>p.sourceUrl)).size,photos.length);
 for(const p of photos)for(const c of p.covers)assert.ok(catalog.pages[c.url].sources.some(s=>s.sourceUrl===p.sourceUrl));
});
