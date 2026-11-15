import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('_data/event-guides.json'),guides=data.guides,photos=read('_data/event-guide-photos.json').photos;
const html=url=>fs.readFileSync('_site'+url+'index.html','utf8');
const routes=read('docs/route-manifest.json');
const plain=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
test('guides are discovered from the existing important-days page, with one canonical route each',()=>{
 const hub=html('/nozimigas-dienas/');assert.equal((hub.match(/<h1\b/g)||[]).length,1);assert(hub.includes('data-events-directory'));
 assert.equal((hub.match(/data-event-card/g)||[]).length,guides.length);
 for(const guide of guides){assert(hub.includes(`href="${guide.url}"`));assert.equal(routes.filter(r=>r.url===guide.url).length,1);assert.equal((html(guide.url).match(/<h1\b/g)||[]).length,1);assert(html(guide.url).includes(`href="https://kalendars365.lv${guide.url}"`));}
 assert(!routes.some(r=>r.url==='/pasakumi/'),'No parallel category competes with the existing important-days page');
});
test('unannounced editions do not expose invented future dates or downloadable recurring events',()=>{
 for(const guide of guides){const page=html(guide.url);assert(guide.sections.length>=4);assert(guide.sources.length);assert.equal(new Set(guide.sections.map(s=>s.text)).size,guide.sections.length);assert(page.includes('Nākamā norise vēl jāizziņo')===guide.pending);
  const filename=`_site/kalendari/pasakumi/${guide.slug}.ics`;
  if(guide.pending){assert(!page.includes(`href="/kalendari/pasakumi/${guide.slug}.ics"`));assert(!fs.existsSync(filename));assert(page.includes(guide.start));}
  else {const raw=fs.readFileSync(filename,'utf8');assert(raw.startsWith('BEGIN:VCALENDAR\r\n'));assert(raw.endsWith('END:VCALENDAR\r\n'));assert(!raw.replaceAll('\r\n','').includes('\n'));assert(!raw.includes('RRULE'));for(const line of raw.split('\r\n'))assert(Buffer.byteLength(line)<=75);assert.equal((raw.match(/BEGIN:VEVENT/g)||[]).length,1);
   if(guide.startsAt){assert(raw.includes('DTSTART:'+guide.startsAt));assert(raw.includes('DTEND:'+guide.endsAt));}
   else {const d=new Date((guide.end||guide.start)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);assert(raw.includes('DTEND;VALUE=DATE:'+d.toISOString().slice(0,10).replaceAll('-','')));assert(page.includes('Visas dienas ieraksts'));}
  }
 }
 const earth=fs.readFileSync('_site/kalendari/pasakumi/zemes-stunda.ics','utf8');assert(earth.includes('20270320T183000Z'),'20:30 Riga before DST is 18:30 UTC');
});
test('sources, image credits and internal targets resolve in the built site',()=>{
 const credits=html('/pilsetas-un-fotografijas/');assert(credits.includes('id="pasakumu-foto"'));
 for(const guide of guides){const page=html(guide.url);const picture=photos[guide.photo];assert(picture?.alt);if(!guide.shopping)assert(plain(page).includes(picture.caption));assert(credits.includes(picture.author));assert(credits.includes(picture.licenseUrl));
  const local='_site'+picture.src;assert(fs.statSync(local).size>0);if(picture.sha256)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex'),picture.sha256);
  assert(page.includes(guide.sources[0].url.replaceAll('&','&amp;')));assert(!page.includes('guide-reference-section'));
  for(const [,href] of page.matchAll(/<a\b[^>]*href="(\/(?!\/)[^"]*)"/g)){const path=href.split(/[?#]/)[0];if(!path)continue;assert(fs.existsSync('_site'+path+(path.endsWith('/')?'index.html':'')),guide.url+' broken link '+href);}
 }
});
test('new guide titles, summaries and social covers are unique and sitemap URLs have no parameters',()=>{
 assert.equal(new Set(guides.map(g=>g.title)).size,guides.length);assert.equal(new Set(guides.map(g=>g.intro)).size,guides.length);
 const social=read('_data/social-images.json').pages;const sitemap=fs.readFileSync('_site/sitemap.xml','utf8');
 for(const guide of guides){assert(social[guide.url]);assert(html(guide.url).includes(social[guide.url].src));assert(routes.find(r=>r.url===guide.url).indexable);assert(sitemap.includes('https://kalendars365.lv'+guide.url)||fs.readFileSync('_site/sitemap-pages.xml','utf8').includes('https://kalendars365.lv'+guide.url));}
});

test('each event explains a visit sequence and distinguishes source status from the suggested plan',()=>{
 for(const g of guides){const html=htmlForGuide(g);assert(g.sections.length>=6);assert.equal(g.visitPlan.length,3);assert(g.faq.length>=2);assert(g.confirmed.length>=3);assert(g.toCheck.length>=2);assert(html.includes('class="event-visit-plan"'));assert(html.includes('class="event-status-grid"'));assert(html.includes('class="event-faq"'));}
});
function htmlForGuide(g){return html(g.url);}

test('Latvian date questions cover 2026–2030 without inventing future festival editions',()=>{
 for(const g of guides){const markup=html(g.url);assert(g.whenQuestion.startsWith('Kad '));assert(g.whereQuestion.startsWith('Kur '));assert(markup.includes(g.whenQuestion));assert(markup.includes(g.whereQuestion));assert.deepEqual(g.editionDates.map(r=>r.year),[2026,2027,2028,2029,2030]);for(const row of g.editionDates)assert(markup.includes(row.date));}
 const friday=guides.find(g=>g.slug==='melna-piektdiena');assert.deepEqual(friday.editionDates.map(r=>r.date),['27.11.2026.','26.11.2027.','24.11.2028.','23.11.2029.','29.11.2030.']);
 const cyber=guides.find(g=>g.slug==='kiberpirmdiena');assert.deepEqual(cyber.editionDates.map(r=>r.date),['30.11.2026.','29.11.2027.','27.11.2028.','26.11.2029.','02.12.2030.']);
 for(const g of guides.filter(g=>!g.shopping&&g.slug!=='18-novembris-riga'))for(const row of g.editionDates.filter(r=>r.year>Number(g.start.slice(0,4))))assert(['Vēl nav izziņots','Neattiecas'].includes(row.date),g.slug);
});
