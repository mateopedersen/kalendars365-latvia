'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const manifest=json('docs/route-manifest.json');
const meta=(html,key)=>html.match(new RegExp('<meta (?:property|name)="'+key.replaceAll(':','\\:')+'" content="([^\"]*)"'))?.[1];
const physical=url=>'_site'+url+(url.endsWith('/')?'index.html':'');
function dimensions(file){
 const b=fs.readFileSync(file);
 if(b.subarray(1,4).toString()==='PNG')return[b.readUInt32BE(16),b.readUInt32BE(20)];
 assert.equal(b.subarray(8,12).toString(),'WEBP',file);
 const kind=b.subarray(12,16).toString();
 if(kind==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
 if(kind==='VP8L'){const n=b.readUInt32LE(21);return[1+(n&0x3fff),1+((n>>>14)&0x3fff)];}
 assert.equal(kind,'VP8 ',file);return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
}
test('ready pages are indexable, listed in the sitemap and discoverable through search',()=>{
 const sitemap=read('_site/sitemap.xml'),search=json('assets/search-index.json');
 const rows=Array.isArray(search)?search:search.pages||search.entries||search.items;
 for(const p of manifest){
  const html=read(physical(p.url));
  if(p.status==='ready'){
   assert.equal(p.indexable,true,p.url);
   assert.equal(meta(html,'robots'),'index,follow',p.url);
   assert.ok(sitemap.includes('https://kalendars365.lv'+p.url),p.url);
   assert.ok(rows.some(r=>r.url===p.url),p.url);
  }else assert.equal(meta(html,'robots'),'noindex,follow',p.url);
 }
});
test('all social image dimensions match their actual bytes and blog alt text follows its photo',()=>{
 const posts=new Map(json('_data/blog.json').posts.map(p=>[p.url,p]));
 for(const p of manifest){
  const html=read(physical(p.url)),image=meta(html,'og:image'),u=new URL(image);
  const file=path.join(root,'_site',decodeURIComponent(u.pathname));
  assert.deepEqual([Number(meta(html,'og:image:width')),Number(meta(html,'og:image:height'))],dimensions(file),p.url);
  if(posts.has(p.url))assert.equal(meta(html,'og:image:alt').replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"'),posts.get(p.url).photo.alt,p.url);
  assert.equal(meta(html,'twitter:image'),image,p.url);
 }
});
test('every page has source-bound critical CSS and reuses its full stylesheet without unrelated scripts',()=>{
 const bundles=new Map();
 for(const p of manifest){
  const html=read(physical(p.url)),head=html.split('</head>')[0];
  const critical=head.match(/<style data-critical-source="([^"]+)" data-critical-sha="([^"]+)">([\s\S]*?)<\/style>/);assert.ok(critical,p.url);
  assert.equal(crypto.createHash('sha256').update(critical[3]).digest('hex'),critical[2],p.url);
  const activeHead=head.replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
  const styles=[...activeHead.matchAll(/<link rel="stylesheet" href="([^\"]+)"/g)].map(m=>m[1]);
  assert.equal(styles.length,1,p.url);
  assert.ok(activeHead.includes('data-critical-deferred'),p.url);assert.ok(activeHead.includes('/assets/critical-css-loader.js?v='),p.url);
  const name=styles[0];assert.equal(name,critical[1],p.url);assert.match(name,/^\/static\/css\/[a-f0-9]{24}\.css$/);
  if(!bundles.has(name))bundles.set(name,read('_site'+name));
  assert.ok(name.includes(crypto.createHash('sha256').update(bundles.get(name)).digest('hex').slice(0,24)),p.url);
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
