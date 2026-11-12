'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const manifest=json('docs/route-manifest.json');
const meta=(html,key)=>html.match(new RegExp('<meta (?:property|name)="'+key.replaceAll(':','\\:')+'" content="([^\"]*)"'))?.[1];
const physical=url=>'_site'+url+(url.endsWith('/')?'index.html':'');
function dimensions(file){
 const b=fs.readFileSync(file);
 if(b.subarray(1,4).toString()==='PNG')return[b.readUInt32BE(16),b.readUInt32BE(20)];
 if(b[0]===0xff&&b[1]===0xd8){
  let offset=2;while(offset<b.length){while(b[offset]===0xff)offset++;const marker=b[offset++];if(marker===0xd9||marker===0xda)break;const n=b.readUInt16BE(offset);if([0xc0,0xc1,0xc2].includes(marker))return[b.readUInt16BE(offset+5),b.readUInt16BE(offset+3)];offset+=n;}
  throw new Error('Missing JPEG frame: '+file);
 }
 assert.equal(b.subarray(8,12).toString(),'WEBP',file);
 const kind=b.subarray(12,16).toString();
 if(kind==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
 if(kind==='VP8L'){const n=b.readUInt32LE(21);return[1+(n&0x3fff),1+((n>>>14)&0x3fff)];}
 assert.equal(kind,'VP8 ',file);return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
}
test('every content page except photo licensing is indexable, in the sitemap and searchable',()=>{
 const sitemap=read('_site/sitemap.xml'),search=json('assets/search-index.json');
 const rows=Array.isArray(search)?search:search.pages||search.entries||search.items;
 for(const p of manifest){
  const html=read(physical(p.url));
  if(p.url!=='/pilsetas-un-fotografijas/'){
   assert.equal(p.indexable,true,p.url);
   assert.equal(meta(html,'robots'),'index,follow,max-image-preview:large',p.url);
   assert.ok(sitemap.includes(new URL('https://kalendars365.lv'+p.url).href),p.url);
   assert.ok(rows.some(r=>r.url===p.url),p.url);
  }else {assert.equal(p.indexable,false,p.url);assert.equal(meta(html,'robots'),'noindex,follow',p.url);}
 }
});
test('all social covers are unique page-bound JPEGs and match their actual dimensions',()=>{
 const covers=json('_data/social-images.json').pages,seen=new Set();
 for(const p of manifest){
  const html=read(physical(p.url)),image=meta(html,'og:image'),u=new URL(image);
  const file=path.join(root,'_site',decodeURIComponent(u.pathname));
  assert.deepEqual([Number(meta(html,'og:image:width')),Number(meta(html,'og:image:height'))],dimensions(file),p.url);
  assert.equal(image,'https://kalendars365.lv'+covers[p.url].src,p.url);assert.ok(!seen.has(image),p.url);seen.add(image);
  assert.equal(meta(html,'og:image:type'),'image/jpeg',p.url);
  assert.equal(meta(html,'og:image:alt').replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"'),covers[p.url].alt,p.url);
  assert.equal(meta(html,'twitter:image'),image,p.url);
 }
});
test('photo licensing page stays accessible and searchable while excluded from search engines',()=>{
 const url='/pilsetas-un-fotografijas/',entry=manifest.find(p=>p.url===url);
 assert.equal(entry.indexable,false);
 assert.equal(meta(read(physical(url)),'robots'),'noindex,follow');
 assert.ok(!read('_site/sitemap.xml').includes('<loc>https://kalendars365.lv'+url+'</loc>'));
 assert.ok(json('assets/search-index.json').some(p=>p.url===url));
 assert.ok(!/Disallow:\s*\/(?:\s|pilsetas-un-fotografijas(?:\/|\s))/.test(read('_site/robots.txt')));
});
test('every page uses one source-bound complete stylesheet without duplicate inline CSS or unrelated scripts',()=>{
 const bundles=new Map();
 for(const p of manifest){
  const html=read(physical(p.url)),head=html.split('</head>')[0];
  const digest=meta(html,'style-bundle-sha256');assert.match(digest,/^[a-f0-9]{64}$/,p.url);
  assert.ok(!head.includes('data-critical-source'),p.url+' must not duplicate the blocking stylesheet inline');
  const activeHead=head.replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
  const styles=[...activeHead.matchAll(/<link rel="stylesheet" href="([^\"]+)"/g)].map(m=>m[1]);
  assert.equal(styles.length,1,p.url);
  assert.ok(!activeHead.includes('data-critical-deferred'),p.url);assert.ok(!activeHead.includes('/assets/critical-css-loader.js?v='),p.url);
  assert.ok(activeHead.includes(`<link rel="stylesheet" href="${styles[0]}">`),p.url+' must apply the complete stylesheet on first render');
  const name=styles[0];assert.match(name,/^\/static\/css\/[a-f0-9]{24}\.css$/);
  if(!bundles.has(name))bundles.set(name,read('_site'+name));
  assert.ok(name.includes(crypto.createHash('sha256').update(bundles.get(name)).digest('hex').slice(0,24)),p.url);
  assert.equal(digest,crypto.createHash('sha256').update(bundles.get(name)).digest('hex'),p.url);
  const city=html.includes('id="city-select"');
  for(const script of ['location.js','location-core.js','city-card.js','weather.js','observations.js'])
   assert.equal(html.includes('/assets/'+script+'?'),city,p.url+' '+script);
  if(p.family.startsWith('blog_')){
   assert.ok(!html.includes('id="i-crop-'),p.url);
   assert.ok(!html.includes('/assets/sky-ui.mjs?'),p.url);
  }
 }
 assert.ok(bundles.size<manifest.length/3,'Shared page families must reuse stylesheets.');
});
