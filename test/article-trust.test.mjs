import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const blog=JSON.parse(read('_data/blog.json')).posts;
const routes=JSON.parse(read('docs/route-manifest.json'));
const fmt=d=>new Intl.DateTimeFormat('lv-LV',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
test('article dates show original publication and the same real revision date as structured data',()=>{
 for(const p of blog){const html=read('_site'+p.url+'index.html');const graph=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);const a=graph.find(n=>n['@type']==='BlogPosting');assert.equal(a.datePublished,p.date);assert(html.includes(`<time datetime="${p.date}">${fmt(p.date)}</time>`),p.url);if(a.dateModified!==p.date)assert(html.includes(`<time datetime="${a.dateModified}">${fmt(a.dateModified)}</time>`),p.url);assert.equal(a.dateModified,routes.find(r=>r.url===p.url).lastmod);}
});
test('each article has its own concise guide and a functioning relevant tool link',()=>{
 const seen=new Set();for(const p of blog){const html=read('_site'+p.url+'index.html');assert.equal(p.guide.points.length,3);const signature=p.guide.points.join('|');assert(!seen.has(signature));seen.add(signature);for(const point of p.guide.points)assert(html.includes(esc(point)),p.url);assert(routes.some(r=>r.url===p.guide.action.href),p.url);assert(html.includes(`href="${p.guide.action.href}" class="article-guide-action"`));assert(html.includes('id="article-quick-title"'));}
});
test('article source citations match visible sources and process details are reachable',()=>{
 for(const p of blog){const html=read('_site'+p.url+'index.html');const graph=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);const a=graph.find(n=>n['@type']==='BlogPosting');assert.deepEqual(a.citation,p.sources.map(s=>s.url));for(const s of p.sources)assert(html.includes(esc(s.url)));assert(html.includes('Raksta sagatavošanā izmantota mākslīgā intelekta palīdzība.'));assert(html.includes('href="/redakcijas-politika/"'));}
});
test('methodology displays recorded source dates without replacing them with the build date',()=>{
 const html=read('_site/avoti-un-metodika/index.html');const sources=JSON.parse(read('assets/calendar-data.json')).sources;for(const s of sources){assert(html.includes(`id="avots-${s.id}"`));if(s.checked)assert(html.includes(`<time datetime="${s.checked}">${s.checked}</time>`),s.id);}assert(html.includes('Apstiprinājums vēl nav publicēts'));assert(html.includes('href="/labojumi/"'));assert(html.includes('href="/redakcijas-politika/"'));
});
