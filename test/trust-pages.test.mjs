import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {normalizeSearch,matchesQuestion} from '../assets/trust-core.mjs';
const require=createRequire(import.meta.url),privacy=require('../assets/privacy-choice.js');
const read=name=>fs.readFileSync(name,'utf8'),json=name=>JSON.parse(read(name));
const data=json('_data/trust-pages.json'),pages=data.pages,manifest=json('docs/route-manifest.json'),faq=json('_data/site-faq.json');
const htmlFor=url=>read('_site'+url+'index.html');

test('all six requested information pages have their own complete Latvian content, canonical and open indexing',()=>{
 assert.equal(Object.keys(pages).length,6);
 for(const [url,page] of Object.entries(pages)){
  const row=manifest.find(row=>row.url===url),html=htmlFor(url);assert(row?.indexable,url);
  assert(html.includes(`data-trust-page="${page.kind}"`),url);assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,url);
  assert(html.includes('<html lang="lv">'),url);assert(html.includes(`rel="canonical" href="https://kalendars365.lv${url}"`),url);
  assert(html.includes('content="index,follow,max-image-preview:large"'),url);
  assert(!html.includes('data-page-reading'),url);assert(!html.includes('class="useful-outline"'),url);
  assert(!html.includes('2027. gada kalendārs Latvijai'),url+' must not show an irrelevant calendar-year badge');
  assert.equal((html.match(/class="trust-directory"/g)||[]).length,page.kind==='contact'?0:1,url);
  for(const target of Object.keys(pages))assert(html.includes(`href="${target}"`),url+' -> '+target);
  for(const section of page.sections){assert(html.includes(`id="${section.id}"`),url);for(const text of section.paragraphs||[])assert(html.includes(text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;')),section.id);}
 }
});

test('FAQ answers are unique, work as native disclosures, and have relevant routes that actually exist',()=>{
 const html=htmlFor('/biezak-uzdotie-jautajumi/'),all=faq.groups.flatMap(group=>group.items);
 assert.equal(all.length,25);assert.equal(new Set(all.map(item=>item.question)).size,all.length);
 assert.equal((html.match(/<details\b[^>]*\bdata-trust-faq-item(?:\s|>)/g)||[]).length,all.length);
 for(const group of faq.groups){assert(html.includes(`id="${group.id}"`));for(const item of group.items){assert(item.answer.length>100);for(const link of item.links)assert(manifest.some(row=>row.url===link.url.split(/[?#]/)[0]),link.url);}}
 const controller=read('assets/trust-pages.mjs');assert(!/\b(?:fetch|sendBeacon|localStorage|sessionStorage)\b/.test(controller));
 assert(html.includes('type="search" data-trust-query'));assert(html.includes('data-trust-empty hidden'));
 assert.equal(normalizeSearch('  SĪKDATNES un VĀRDI  '),'sikdatnes un vardi');
 assert(matchesQuestion('Kā izdrukāt attēlu?','izdrukat attelu'));assert(!matchesQuestion('PDF un Attēls','PDF pilsēta'));
});

test('contact embeds the configured public form and offers direct email without a submit proxy',()=>{
 const html=htmlFor('/kontakti/'),config=json('_data/contact.json');
 assert.equal(config.email,'kalendars365@gmail.com');
 assert.equal(new URL(config.embedUrl).origin,'https://docs.google.com');
 assert(html.includes(config.embedUrl.replaceAll('&','&amp;')));
 assert(html.includes('title="Saziņas veidlapa ar Kalendārs365"'));
 assert(html.includes('loading="lazy"'));
 assert(html.includes('mailto:kalendars365@gmail.com'));
 assert(!html.includes('data-trust-contact'));
 assert(!html.includes('Sagatavot e-pastu'));
 assert(read('_headers').includes("frame-src 'self' https://docs.google.com"));
 assert(!read('assets/trust-pages.mjs').includes('contactDraft'));
 for(const url of ['/privatuma-politika/','/kontakti/'])assert(htmlFor(url).includes('Google Forms'));
});

test('the static public build excludes server function source and internal tooling',()=>{
 for(const directory of ['functions','scripts','test','node_modules','tooling'])assert(!fs.existsSync('_site/'+directory),directory);
 assert(fs.existsSync('functions/api/laikapstakli.js'),'server handlers remain available to the deployment build');
});

test('weather proxies do not forward visitor identifiers, cookies, authorization or unrelated private query values',async()=>{
 const originalFetch=globalThis.fetch,requests=[],now=new Date().toISOString();
 try{
  globalThis.fetch=async(value,options)=>{
   const url=new URL(value),headers=new Headers(options.headers);requests.push(url.hostname);
   for(const name of ['cookie','authorization','cf-connecting-ip','x-forwarded-for','x-real-ip'])assert.equal(headers.has(name),false,name);
   assert(!url.href.includes('sample-secret'));assert(![...headers.values()].some(value=>value.includes('sample-secret')));
   if(url.hostname==='api.met.no'){
    assert.deepEqual([...url.searchParams.keys()].sort(),['lat','lon']);
    return Response.json({properties:{meta:{updated_at:now},timeseries:[{time:now,data:{instant:{details:{air_temperature:5}},next_1_hours:{summary:{symbol_code:'cloudy'}}}}]}});
   }
   assert.equal(url.hostname,'data.gov.lv');return Response.json({success:true,result:{records:[]}});
  };
  for(const file of ['laikapstakli','noverojumi']){
   const api=await import(`../functions/api/${file}.js?trust-data-flow`);
   const request=new Request(`https://kalendars365.lv/api/${file}/?city=riga&message=sample-secret`,{headers:{Cookie:'private=sample-secret',Authorization:'Bearer sample-secret','CF-Connecting-IP':'198.51.100.42','X-Real-IP':'198.51.100.42'}});
   const response=await api.onRequestGet({request});assert.equal(response.status,200);
  }
  assert.deepEqual(requests,['api.met.no','data.gov.lv']);
 }finally{globalThis.fetch=originalFetch;}
});

test('privacy notice acknowledgement expires without authorizing trackers or treating legacy all as fresh consent',()=>{
 const time=Date.parse('2026-11-12T10:00:00Z'),value=privacy.acknowledge(time);
 assert.equal(Date.parse(value.expiresAt)-time,180*86400000);assert.equal(value.choice,'necessary');assert.equal(value.analytics,false);assert.equal(value.advertising,false);
 assert.deepEqual(privacy.normalize(value,time),value);assert(privacy.normalize(value,time+180*86400000-1));assert.equal(privacy.normalize(value,time+180*86400000),null);
 for(const bad of [{...value,choice:'all'},{...value,advertising:true},{...value,analytics:true},{...value,version:1},{...value,date:'bad'},[],null])assert.equal(privacy.normalize(bad,time),null);
 assert.equal(privacy.normalize(value,time-1),null);
 const banner=read('_includes/consent-banner.html');assert(!banner.includes('data-consent="all"'));assert(!banner.includes('Piekrītu'));assert(banner.includes('Sapratu'));
});

test('storage inventory is bound to real implementation keys and explains all three storage mechanisms',()=>{
 const entries=json('_data/privacy-storage.json').entries;assert.equal(entries.length,9);
 for(const entry of entries){const code=entry.sources.map(read).join('\n');for(const key of entry.keys)assert(code.includes(key),key);assert(entry.duration);}
 const mechanisms=new Set(entries.map(entry=>entry.technology));assert.deepEqual(mechanisms,new Set(['Lokālā krātuve','Sesijas krātuve','IndexedDB']));
 const html=htmlFor('/sikdatnu-politika/');for(const entry of entries)for(const key of entry.keys)assert(html.includes(key),key);
 assert(read('assets/weather.js').includes('TTL=5*60*1000'));assert(read('assets/observations.js').includes('TTL=3*60*1000'));
});

test('legal content links primary sources and does not manufacture addresses, audits or future law status',()=>{
 assert.equal(data.reviewedAt,'2026-11-12');
 for(const [id,source] of Object.entries(data.sources))assert.match(new URL(source.url).hostname,/^(?:www\.)?(?:eur-lex\.europa\.eu|likumi\.lv|dvi\.gov\.lv|ptac\.gov\.lv|w3\.org|cloudflare\.com|openfreemap\.org|api\.met\.no|policies\.google\.com)$/,id);
 assert(data.sources['access-law'].note.includes('2026. gada 5. jūnija'));
 const access=htmlFor('/pieklustamiba/');assert(access.includes('nav pabeigts'));assert(access.includes('neatkarīgas sertifikācijas'));assert(access.includes('PDF/UA'));
 assert(!htmlFor('/kontakti/').includes('class="trust-owner-address"')||typeof data.ownerAddress==='string');
 const privacyHtml=htmlFor('/privatuma-politika/');for(const text of ['Cloudflare','Gmail','OpenFreeMap','MET Norway','pasts@dvi.gov.lv','viena mēneša laikā'])assert(privacyHtml.includes(text),text);
});

test('original purpose-specific SVG illustrations are distinct and footer routes remain directly discoverable',()=>{
 const hashes=new Set();
 for(const page of Object.values(pages)){const svg=read(`assets/trust/${page.kind}.svg`);assert(svg.includes('viewBox="0 0 320 260"'));assert(!/<image\b|data:image|https?:\/\/[^" ]+\.(png|jpg|webp)/.test(svg));hashes.add(crypto.createHash('sha256').update(svg).digest('hex'));}
 assert.equal(hashes.size,6);
 const footer=htmlFor('/').split('<footer id="site-footer"')[1].split('</footer>')[0];for(const url of Object.keys(pages))assert(footer.includes(`href="${url}"`),url);
});
