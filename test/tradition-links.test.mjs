import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const registry=read('_data/tradition-links.json').topics;
const occasions=read('_data/occasions.json');
const cultural=read('_data/latvia-extra-pages.json').culturalPages;
const slugs=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const url=slug=>`/svetki-un-tradicijas/${slug}/`;
const htmlFor=slug=>fs.readFileSync('_site'+url(slug)+'index.html','utf8');
const block=(html,name)=>html.match(new RegExp(`<section\\b[^>]*\\bdata-tradition-${name}[^>]*>([\\s\\S]*?)</section>`))?.[1];
const routeSet=new Set(read('_data/routes.json').map(r=>r['URL path']));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');

test('all 73 directory topics have curated, published links without self-links or orphan topics',()=>{
 const expected=[...occasions.map(x=>x.slug),...cultural.map(x=>x.url.split('/').filter(Boolean).at(-1))].sort();
 assert.equal(expected.length,73);assert.deepEqual(Object.keys(registry).sort(),expected);
 const incoming=Object.fromEntries(expected.map(id=>[id,0]));
 for(const [id,e] of Object.entries(registry)){
  assert(e.related.length>0,id);assert.equal(e.related.length,new Set(e.related).size,id);
  for(const related of e.related){assert(registry[related],id+' -> '+related);assert.notEqual(related,id);incoming[related]++;}
  assert(e.context.some(p=>p.topic),id);
  for(const p of e.context)if(p.topic){assert(registry[p.topic]);assert.notEqual(p.topic,id);assert(p.label.trim());}
  for(const t of e.tools){assert(routeSet.has(new URL(t.url,'https://kalendars365.lv').pathname),id+' -> '+t.url);assert(t.label);}
 }
 assert(Object.values(incoming).every(n=>n>0),'All topics should also be reachable from a related topic');
});

test('all rendered articles contain their contextual anchors, curated related topics and useful tools',()=>{
 for(const [id,e] of Object.entries(registry)){
  const html=htmlFor(id),context=block(html,'context'),related=block(html,'related');
  assert(context,id+' context');assert(related,id+' related');
  for(const p of e.context)if(p.topic)assert(context.includes(`href="${url(p.topic)}"`),id+' context '+p.topic);
  for(const r of e.related)assert(related.includes(`href="${url(r)}"`),id+' related '+r);
  for(const t of e.tools)assert(html.includes(`href="${esc(t.url)}"`),id+' tool '+t.url);
  assert.doesNotMatch(html,/<div class="page-reading-sources">/,id+' repeated source panel');
 }
});

test('related topic photos resolve to existing responsive derivatives for every topic',()=>{
 let count=0;
 for(const id of Object.keys(registry)){
  const related=block(htmlFor(id),'related');
  for(const image of related.matchAll(/<img\b[^>]*>/g)){
   const src=image[0].match(/\bsrc="([^"]*)"/)?.[1];
   assert(src?.startsWith('/assets/'),id+' related photo source');
   assert(fs.existsSync('_site'+src),id+' '+src);
   assert.match(image[0],/\bsrcset="[^\"]+"/,id+' responsive related photo');
   count++;
  }
 }
 assert(count>150,'Related cards must retain their photos across the whole directory');
});

test('reader-facing primary sources are named, unique and synchronized with the topic directory data',()=>{
 const directory=read('assets/category-data.json').articles;assert.equal(directory.length,73);
 for(const [id,e] of Object.entries(registry)){
  const html=htmlFor(id),sources=block(html,'sources');assert(sources,id);
  assert.equal(e.sources.length,new Set(e.sources.map(s=>s.url)).size,id);
  for(const s of e.sources){
   assert.equal(new URL(s.url).protocol,'https:');assert(s.title.length>5);assert(!s.title.includes(' — pirmavots'));
   assert(sources.includes(`href="${esc(s.url)}"`),id+' source '+s.url);
  }
  assert.deepEqual(directory.find(a=>a.url===url(id)).sourceUrls,e.sources.map(s=>s.url),id+' exported sources');
 }
 assert(!registry['pasaules-dzivnieku-diena'].sources.some(s=>s.url==='https://www.worldanimalday.org.uk/about/'));
 assert(!registry['pasaules-bisu-diena'].sources.some(s=>s.url.includes('/en/events/beeday/')));
 assert(!Object.values(registry).flatMap(e=>e.sources).some(s=>s.url.includes('prefLang=uk')));
});

test('date links open their actual Latvia calendar day across all four years',()=>{
 let total=0;
 for(const id of Object.keys(registry)){
  const html=htmlFor(id);
  for(const m of html.matchAll(/class="tradition-date-link" href="([^"]+)"/g)){
   const dest=new URL(m[1].replaceAll('&amp;','&'),'https://kalendars365.lv'),date=dest.searchParams.get('date');assert.match(date,/^20(?:27|28|29|30)-\d{2}-\d{2}$/);assert.equal(dest.searchParams.get('view'),'day');assert.equal(dest.hash,'#calendar-app');
   const [year,month]=date.split('-').map(Number);assert.equal(dest.pathname,`/kalendars/${year}/${slugs[month-1]}/`);assert(routeSet.has(dest.pathname));total++;
  }
 }
 assert(total>250,'Actual dates should be linked across the whole catalog');
 for(const item of occasions)for(const date of item.dates)assert(htmlFor(item.slug).includes(`?date=${date.date}&amp;view=day#calendar-app"`),item.slug+' '+date.date);
});

test('existing article wording is linked without nested anchors or altered dates and status',()=>{
 let count=0;
 for(const id of Object.keys(registry)){
  const html=htmlFor(id);count+=(html.match(/class="tradition-inline-link"/g)||[]).length;
  assert.doesNotMatch(html,/<a\b[^>]*>[^<]*<a\b/,id);
 }
 assert(count>=35,'Reviewed existing phrases must become real links');
 for(const item of occasions.filter(a=>a.type==='commemoration')){
  const opening=htmlFor(item.slug).split('class="occasion-actions"')[1].split('</div>')[0];
  assert(opening.includes('/atceres-dienas/'),item.slug);assert(!opening.includes('/atvalinajuma-planotajs/'),item.slug);
 }
});

test('strong date distinctions and sensitive memorial relationships stay explicit',()=>{
 assert(registry['ligo-diena'].related.includes('janu-diena'));
 assert(registry['janu-diena'].related.includes('vasaras-saulgriezi'));
 assert(registry['holokausta-upuru-pieminas-diena'].related.includes('ebreju-tautas-genocida-upuru-pieminas-diena'));
 assert(registry['stalinisma-un-nacisma-upuru-atceres-diena'].related.includes('totalitaro-rezimu-upuru-pieminas-diena'));
 assert.equal(registry['zolitudes-tragedijas-atceres-diena'].related.length,1);
 assert(!registry['zolitudes-tragedijas-atceres-diena'].tools.some(t=>t.url.includes('atvalinajuma')));
});
