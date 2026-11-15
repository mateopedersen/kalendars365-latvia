import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const occasions=read('_data/occasions.json');
const culture=read('_data/latvia-extra-pages.json').culturalPages;
const rows=[...occasions,...culture].filter(r=>r.slug!=='staro-riga');
const slug=r=>r.slug||r.url.split('/').filter(Boolean).at(-1);
const profiles=read('_data/occasion-guides.json').topics;
const resolved=JSON.parse(execFileSync('ruby',['-rjson','-r./scripts/occasion_guide','-e',`
  rows=JSON.parse(File.read('_data/occasions.json'))+JSON.parse(File.read('_data/latvia-extra-pages.json'))['culturalPages']
  seasons=JSON.parse(File.read('assets/calendar-data.json'))['seasons']
  puts JSON.generate(rows.reject{|r|OccasionGuide.slug(r)=='staro-riga'}.to_h{|r|[OccasionGuide.slug(r),(2026..2030).to_h{|y|[y,OccasionGuide.dates(r,y,seasons:seasons)]}]})
`],{encoding:'utf8'}));

test('all 73 recurring day guides have their own location, planning and distinction copy',()=>{
 assert.deepEqual(Object.keys(profiles).sort(),rows.map(slug).sort());
 for(const field of ['where','plan','distinction']){
  const text=Object.values(profiles).map(p=>p[field]);
  assert.equal(text.length,new Set(text).size,field+' must be topic-specific');
  for(const value of text)assert(value.length>75);
 }
});

test('the date resolver preserves all accepted 2027–2030 dates and precise astronomical times',()=>{
 for(const r of occasions.filter(r=>r.slug!=='staro-riga'))for(const year of [2027,2028,2029,2030]){
  const expected=r.dates.filter(d=>d.date.startsWith(String(year)));
  assert.deepEqual(resolved[r.slug][year],expected,r.slug+' '+year);
 }
 assert.deepEqual(resolved['skolotaju-diena'][2026].map(r=>r.date),['2026-10-05']);
 assert.deepEqual(resolved['mates-diena'][2026].map(r=>r.date),['2026-05-10']);
 assert.deepEqual(resolved['lieldienas'][2026].map(r=>r.date),['2026-04-05','2026-04-06']);
 assert.deepEqual(resolved['advente'][2026].map(r=>r.date),['2026-11-29','2026-12-06','2026-12-13','2026-12-20']);
 assert.deepEqual(resolved['miruso-pieminas-diena'][2026].map(r=>r.date),['2026-11-02','2026-11-22']);
 for(const id of ['meteni','pavasara-tradicijas'])for(const year of [2026,2027,2028,2029,2030])assert.deepEqual(resolved[id][year],[]);
 assert.deepEqual(resolved['dziesmu-un-deju-svetki'][2027],[]);
});

test('every new day guide renders five years, four date answers and practical information without duplicate prose',()=>{
 for(const r of rows){
  const id=slug(r),html=fs.readFileSync('_site/svetki-un-tradicijas/'+id+'/index.html','utf8');
  assert(html.includes('data-occasion-guide="'+id+'"'),id);
  assert(html.includes('data-occasion-practical'),id);
  const faq=html.match(/<section class="occasion-faq"[\s\S]*?<\/section>/)?.[0];
  assert.equal((faq?.match(/<summary>/g)||[]).length,4,id);
  for(const year of [2027,2028,2029,2030])assert(faq.includes(year+'. gadā?'),id);
  assert(!html.includes('data-page-reading'),id+' duplicate generic guide');
  for(const year of [2026,2027,2028,2029,2030])for(const row of resolved[id][year]){
   const date=row.date,anchor='id="datums-'+date+'"';
   assert.equal(html.split(anchor).length-1,1,id+' '+date);
   assert(html.includes(year===2026?'href="/?date='+date+'&amp;view=day"':'?date='+date+'&amp;view=day#calendar-app"'),id+' calendar destination');
  }
 }
});
