'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const catalog=json('_data/social-images.json'),rows=Object.values(catalog.pages),routes=json('docs/route-manifest.json');
function jpegSize(b){assert.equal(b[0],255);assert.equal(b[1],216);let i=2;while(i<b.length){while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;const length=b.readUInt16BE(i);if([192,193,194].includes(marker))return[b.readUInt16BE(i+5),b.readUInt16BE(i+3)];i+=length;}throw Error('No JPEG size');}
test('all routes have distinct finished covers and distinct subject panels',()=>{
 const expected=new Set([...routes.map(r=>r.url),'/404.html','/500.html','/nedelas-kalendars/2031/01/']);assert.equal(rows.length,expected.size);assert.deepEqual(new Set(rows.map(r=>r.url)),expected);
 for(const key of ['src','pixelSha256','panelSha256'])assert.equal(new Set(rows.map(r=>r[key])).size,expected.size,key);
 for(const r of rows){const b=read('.'+r.src);assert.equal(sha(b),r.sha256,r.url);assert.equal(b.length,r.bytes,r.url);assert.deepEqual(jpegSize(b),[1200,630],r.url);assert.ok(b.length<400000,r.url);assert.ok(r.alt.includes(r.title),r.url);assert.equal(r.type,'image/jpeg');}
 assert.equal(catalog.rendererSha256,sha(read('scripts/social_images.py')));assert.equal(catalog.prepareSha256,sha(read('tooling/social-cards/prepare.mjs')));
});
test('legacy preview addresses resolve directly to the corresponding reviewed JPEG', () => {
 const expected = new Map([['/assets/og/home.png', catalog.pages['/'].src]]);
 for (const cover of rows) {
  const routeHash = crypto.createHash('sha1').update(cover.url).digest('hex').slice(0, 16);
  const oldPath = '/assets/og/' + routeHash + '.webp';
  if (fs.existsSync('.' + oldPath)) expected.set(oldPath, cover.src);
 }
 const rules = read('_site/_redirects').toString().trim().split('\n')
  .map(line => line.trim().split(/\s+/)).filter(([from]) => from.startsWith('/assets/og/'));
 assert.equal(rules.length, expected.size);
 assert.equal(new Set(rules.map(([from]) => from)).size, expected.size);
 for (const [from, to, status] of rules) {
  assert.equal(to, expected.get(from), from);
  assert.equal(status, '302', from);
  assert.ok(fs.existsSync('_site' + to), to);
 }
});
test('all 901 pages expose coherent complete Open Graph and large-image Twitter metadata',()=>{
 const contracts=json('_data/seo-contract.json').pages;
 const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
 for(const r of rows){
  const html=read('_site'+r.url+(r.url.endsWith('/')?'index.html':'')).toString().split('</head>')[0],metadata=new Map();
  for(const tag of html.matchAll(/<meta\b[^>]*>/g)){
   const key=tag[0].match(/(?:property|name)="([^"]+)"/)?.[1],value=tag[0].match(/content="([^"]*)"/)?.[1];
   if(!key||value===undefined)continue;
   if(!metadata.has(key))metadata.set(key,[]);
   metadata.get(key).push(decode(value));
  }
  const c=contracts[r.url],image='https://kalendars365.lv'+r.src;
  const expected={'og:title':c.title,'og:description':c.description,'og:type':r.family==='blog_article'?'article':'website',
   'og:url':c.canonical,'og:locale':'lv_LV','og:site_name':'Kalendārs365','og:image':image,'og:image:secure_url':image,
   'og:image:width':'1200','og:image:height':'630','og:image:type':'image/jpeg','og:image:alt':r.alt,
   'twitter:card':'summary_large_image','twitter:title':c.title,'twitter:description':c.description,'twitter:image':image,'twitter:image:alt':r.alt};
  for(const [key,value]of Object.entries(expected))assert.deepEqual(metadata.get(key),[value],r.url+' '+key);
  assert.equal(new URL(image).protocol,'https:',r.url);
  if(r.family==='blog_article')assert.deepEqual(metadata.get('article:published_time'),[c.articlePublished],r.url);
 }
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
