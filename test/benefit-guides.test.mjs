import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('_data/benefit-guides.json'),guides=data.guides, routes=read('docs/route-manifest.json');
const page=u=>fs.readFileSync('_site'+u+'index.html','utf8');
test('each benefit has one indexed route, accurate parent, sources and unique content',()=>{
 const nav=read('_data/internal-navigation.json').pages, text=new Set();
 assert.equal(guides.length,8);
 for(const g of guides){const html=page(g.url); assert.equal(routes.filter(r=>r.url===g.url).length,1);assert.equal(nav[g.url].parent,'/pabalstu-izmaksas/');assert(routes.find(r=>r.url===g.url).indexable);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes(`data-benefit-guide="${g.slug}"`));
  for(const c of g.sections){assert(!text.has(c.text));text.add(c.text);assert(html.includes(c.title));}
  for(const s of g.sources){assert(['www.vsaa.gov.lv','www.lm.gov.lv','www.nva.gov.lv','www.mk.gov.lv','ld.riga.lv'].includes(new URL(s.url).hostname));}
  for(const [,href] of html.matchAll(/<a\b[^>]*href="(\/(?!\/)[^"]*)"/g)){const path=href.split(/[?#]/)[0];if(path)assert(fs.existsSync('_site'+path+(path.endsWith('/')?'index.html':'')),g.url+' '+href);}
 }
});
test('existing payment hub discovers all guides without fabricated common payment dates',()=>{
 const html=page('/pabalstu-izmaksas/');assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/class="benefit-card"/g)||[]).length,8);
 for(const g of guides)assert(html.includes('href="'+g.url+'"'));
 assert(html.includes('data-payment-reminder="benefit"'));assert(html.includes('id="mans-atgadinajums"'));
 assert(html.includes('Par kārtējo mēnesi'));assert(html.includes('Par iepriekšējo mēnesi'));
 const pension=page('/pensiju-izmaksas/');assert(pension.includes('1589 eiro'));assert(pension.includes('jaunu kopīgu pensijas izmaksas datumu'));
});
test('date-sensitive amounts retain their applicability and exceptions',()=>{
 const childcare=page('/pabalstu-izmaksas/berna-kopsanas-pabalsts/');assert(childcare.includes('2. novembrim ieskaitot'));assert(childcare.includes('42,69'));assert(childcare.includes('3. novembrī'));
 const gmi=page('/pabalstu-izmaksas/gmi-pabalsts/');assert(gmi.includes('207'));assert(gmi.includes('145'));assert(gmi.includes('2027. gada 1. janvāra'));
 const parent=page('/pabalstu-izmaksas/vecaku-pabalsts/');assert(parent.includes('neuzdodam par apstiprinātu 2027. gada likmi'));
 const illness=page('/pabalstu-izmaksas/slimibas-pabalsts/');assert(illness.includes('noslēgta B lapa'));assert(illness.includes('nodokli'));
 const birth=page('/pabalstu-izmaksas/berna-piedzimsanas-pabalsts/');assert(birth.includes('600'));assert(birth.includes('2026. gada 1. janvārī'));
});

test('all new event and benefit guides expose reviewed links inside the explanatory paragraphs',()=>{
 const anchors=read('_data/guide-inline-links.json');
 assert.equal(Object.keys(anchors).length,28);
 for(const [url,rules] of Object.entries(anchors)){
  assert(rules.some(r=>r.url.startsWith('/')),url+' needs useful internal context');
  assert(rules.some(r=>r.url.startsWith('https://')),url+' needs direct original sources');
  const html=page(url),chapters=[...html.matchAll(/<section class="(?:event|benefit)-chapter"[\s\S]*?<\/section>/g)].map(m=>m[0]);
  for(const r of rules){const chapter=chapters[r.section];assert(chapter,url);assert(chapter.includes('href="'+r.url.replaceAll('&','&amp;')+'"'),url+' '+r.text);assert(chapter.includes(r.text));}
 }
});

test('expanded guides provide their own comparison, example and preparation detail',()=>{
 for(const g of guides){const html=page(g.url);assert(g.sections.length>=5);assert(g.table.rows.length>=2);assert(g.documents.length>=3);assert(g.example.text.length>120);assert(html.includes('class="benefit-comparison"'));assert(html.includes('class="benefit-example"'));assert(html.includes('class="benefit-documents"'));assert(html.includes('<caption>'));}
});

test('new guides omit duplicate source directories while retaining useful links and photo credits',()=>{
 const all=[...guides,...read('_data/event-guides.json').guides];
 for(const g of all){const html=page(g.url);assert(!html.includes('class="guide-reference-section"'),g.url);assert(!html.includes('href="#avoti"'),g.url);assert(html.includes('href="'+g.sources[0].url.replaceAll('&','&amp;')+'"'),g.url);}
 for(const g of read('_data/event-guides.json').guides.filter(g=>!g.shopping))assert(page(g.url).includes('/pilsetas-un-fotografijas/#pasakumu-foto'));
});

test('reviewed links never break a Latvian word at an inflection',()=>{
 const cyber=page('/pasakumi/kiberpirmdiena/');
 assert(!cyber.includes('kampaņa</a>s'), 'A shorter anchor must not split kampaņas');
 assert(cyber.includes('220.lv 2026. gada kampaņas lapā'), 'The original inflected sentence stays whole');
});
