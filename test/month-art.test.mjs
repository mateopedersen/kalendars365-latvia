import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const catalog=JSON.parse(fs.readFileSync('_data/month-art.json','utf8'));
const slugs=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const hash=value=>createHash('sha256').update(value).digest('hex');
test('all 48 year/month drawings exist, are distinct and match their source-bound metadata',()=>{
  assert.equal(catalog.periods.length,48);
  const ids=new Set(),geometry=new Set();
  for(const item of catalog.periods){
    assert(item.year>=2027&&item.year<=2030);assert(item.month>=1&&item.month<=12);
    const key=item.year+'-'+item.month;assert(!ids.has(key));ids.add(key);
    const svg=fs.readFileSync('.'+item.file,'utf8');
    assert.equal(hash(svg),item.sha256);assert.equal(Buffer.byteLength(svg),item.bytes);assert(item.bytes<80000);
    assert(svg.includes('>'+item.label+'</title>'));
    assert.doesNotMatch(svg,/<(?:image|foreignObject|script)\b|data:image|\b(?:NaN|Infinity|undefined)\b|\son\w+=/);
    const names=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(names.length,new Set(names).size);
    for(const ref of svg.matchAll(/url\(#([^\)]+)\)/g))assert(names.includes(ref[1]),key+' '+ref[1]);
    // Titles, IDs and year tags cannot make a repeated composition count as unique.
    const visual=svg.replace(/<(?:title|desc)\b[^>]*>[\s\S]*?<\/(?:title|desc)>/g,'').replace(/kv-month-20\d\d-\d+/g,'art').replace(/data-month-composition="[^"]+"/g,'');
    geometry.add(hash(visual));
  }
  assert.equal(ids.size,48);assert.equal(geometry.size,48);
});
test('all 48 calendar month headers and reading guides use the matching year/month artwork',()=>{
  for(const item of catalog.periods){
    const html=fs.readFileSync(`_site/kalendars/${item.year}/${slugs[item.month-1]}/index.html`,'utf8');
    const heading=html.split('<header class="page-heading ')[1].split('</header>')[0];
    assert(heading.includes('src="'+item.file+'?v='),item.id);
    const illustration=heading.match(/class="page-heading-art-icon" src="([^"]+)"/)[1];assert(illustration.startsWith(item.file+'?v='));
    const guide=html.split('data-page-reading>')[1];assert(guide.includes('src="'+item.file+'?v='),item.id+' guide');
  }
});
test('year indexes and shared month navigators select the correct 12 illustrations for all four years',()=>{
  for(let year=2027;year<=2030;year++){
    for(const prefix of ['menesa-kalendars','kalendars','pdf-kalendari','meness-kalendars','darba-dienu-kalendars']){
      const html=fs.readFileSync(`_site/${prefix}/${year}/index.html`,'utf8');
      for(let month=1;month<=12;month++)assert(html.includes(`/assets/category-vector/month-${year}-${month}.svg?v=`),`${prefix} ${year} ${month}`);
    }
  }
});
test('generic month symbols remain full-frame vector fallbacks without the old cropped viewBox',()=>{
  const sprite=fs.readFileSync('_includes/icons.html','utf8');
  for(let month=1;month<=12;month++){
    assert(sprite.includes(`<symbol id="i-month-${month}" viewBox="0 0 320 260">`));
    const a=fs.readFileSync(`assets/category-art/month-${month}.svg`),b=fs.readFileSync(`assets/category-vector/month-${month}.svg`);assert.equal(hash(a),hash(b));
  }
});
