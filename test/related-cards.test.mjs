import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditRelated} from '../tooling/related/audit.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

test('every public content page has relevant visual discovery, all links and image bytes verified',()=>{
 const audit=auditRelated();
 assert.deepEqual(audit.errors,[]);
 assert.equal(audit.totals.htmlPages,901);
 assert.equal(audit.totals.contentPages,899);
 assert.equal(audit.totals.contextualPages,898);
 assert.equal(audit.totals.homeDiscoveryPages,1);
 assert.equal(audit.totals.recoveryPages,2);
 assert.equal(audit.totals.imageFiles,1802);
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
