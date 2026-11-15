import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditRelated} from '../tooling/related/audit.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

test('every public content page has relevant visual discovery, all links and image bytes verified',()=>{
 const manifest=read('docs/route-manifest.json'),supportPages=['/404.html','/500.html'];
 const expected=new Set([...manifest.map(row=>row.url),...supportPages]);
 assert.equal(expected.size,manifest.length+supportPages.length,'Content and recovery routes must be unique');
 for(const catalog of ['internal-navigation','related-cards','related-previews','social-images'])assert.deepEqual(new Set(Object.keys(read('_data/'+catalog+'.json').pages)),expected,catalog+' must cover the complete route inventory');
 const audit=auditRelated();
 assert.deepEqual(audit.errors,[]);
 assert.deepEqual(new Set(audit.pages.map(page=>page.route)),expected,'Every expected page must be audited');
 assert.equal(audit.totals.htmlPages,expected.size);
 assert.equal(audit.totals.contentPages,manifest.length);
 const contextual=new Set(manifest.filter(row=>!['/','/nozimigas-dienas/','/pabalstu-izmaksas/'].includes(row.url)).map(row=>row.url));
 assert.deepEqual(new Set(audit.pages.filter(page=>page.mode==='contextual').map(page=>page.route)),contextual,'Content pages use contextual cards except the complete custom home and event directories');
 assert.equal(audit.totals.contextualPages,contextual.size);
 assert.deepEqual(audit.pages.filter(page=>page.mode==='directory').map(page=>page.route).sort(),['/nozimigas-dienas/','/pabalstu-izmaksas/']);
 assert.deepEqual(audit.pages.filter(page=>page.mode==='home').map(page=>page.route),['/']);
 assert.deepEqual(new Set(audit.pages.filter(page=>page.mode==='recovery').map(page=>page.route)),new Set(supportPages));
 assert.equal(audit.totals.homeDiscoveryPages,1);
 assert.equal(audit.totals.recoveryPages,supportPages.length);
 assert.equal(audit.totals.sourceCoverPages,expected.size);
 assert.equal(audit.totals.imageFiles,expected.size*2,'Every route retains its 240px and 480px preview variants');
 assert(audit.totals.renderedCards>3000);
});

test('recommendation cards describe matching periods and cities instead of generic duplicated labels',()=>{
 const cards=read('_data/related-cards.json').pages,months=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
 const roots=['kalendars','pdf-kalendari','svetku-dienas','darba-dienu-kalendars','meness-kalendars'];
 for(let year=2027;year<=2030;year++)for(const month of months){
  const matching=roots.map(root=>cards[`/${root}/${year}/${month}/`]);
  assert.equal(new Set(matching.map(c=>c.description)).size,5);
  assert.equal(new Set(matching.map(c=>c.image.src)).size,5);
  assert.equal(new Set(matching.map(c=>c.scope)).size,1);
  assert(matching.every(c=>c.description.includes(String(year))));
 }
 for(const city of read('_data/cities.json').cities)for(const root of ['saullekts-saulriets','meness-lekts-un-riets']){
  const card=cards[`/${root}/${city.id}/`];assert.equal(card.scope,city.name);assert(card.description.includes(city.locative));
 }
 for(const url of ['/privatuma-politika/','/sikdatnu-politika/','/lietošanas-noteikumi/','/redakcijas-politika/'])assert.equal(cards[url].type,'information');
 const source=fs.readFileSync('_includes/related-card.html','utf8');
 assert(!source.includes('onclick'));
 assert(!source.includes('<button'));
 assert(!source.includes('target="_blank"'));
});
