import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import K from '../assets/category-core.js';
const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const html = fs.readFileSync('_site/svetki-un-tradicijas/index.html', 'utf8');
const model = JSON.parse(html.match(/<script type="application\/json" data-traditions-guide-data>(.*?)<\/script>/s)[1]);

test('all 73 topics are readable and linked before JavaScript; the directory has no heavy category/catalog/sky dependency', () => {
  assert.equal((html.match(/data-tradition-url=/g)||[]).length,73);
  assert.equal((html.match(/<a class="tradition-story-media tradition-story-media--photo"/g)||[]).length,73);
  assert(!html.includes('tradition-story-media--illustration'));
  for (const name of ['category-tools.mjs','category-redesign.mjs','category-advanced.mjs','cities.js','sky-ui.mjs','category-data.json']) assert(!html.includes(name),name);
  assert(html.includes('traditions-guide.mjs'));
  assert(!html.includes('id="i-month-'), 'unused month SVG images must not be requested by this guide');
  assert(!html.includes('href="#i-month-'));
  assert.equal(model.length,73);
  assert(Buffer.byteLength(JSON.stringify(model)) < 75000);
  for (const a of model) {
    assert(html.includes('href="'+a.url+'"'));
    assert(fs.existsSync('_site'+a.url+'index.html'));
    assert.deepEqual(Object.keys(a).sort(),['url','title','description','type','dayOff','dates'].sort());
  }
  const script=fs.readFileSync('assets/traditions-guide.mjs','utf8');
  assert(!/\b(?:fetch|import)\s*\(/.test(script));
});

test('small guide model preserves every date, type and filter result for all four years', () => {
  const full=json('assets/category-data.json').articles;
  for(const year of [2027,2028,2029,2030]) for(const month of Array.from({length:13},(_,i)=>i)) for(const kind of ['all','holiday','commemoration','observance','culture','astronomy']) {
    const simplify=items=>items.map(a=>({url:a.url,dates:a.dates,type:a.type,dayOff:a.dayOff}));
    assert.deepEqual(simplify(K.traditions(model,{year,month,kind})),simplify(K.traditions(full,{year,month,kind})));
  }
  assert(K.traditions(model,{query:'janu'}).some(a=>a.url.endsWith('/janu-diena/')));
  assert.equal(K.traditions(model,{query:'nonexistent-xyz'}).length,0);
});

test('all 25 new photographs have reviewed, checksum-bound source copies and valid credit destinations', () => {
  const photos=json('_data/tradition-photos.json').photos;
  const topics=json('_data/latvia-extra-pages.json').culturalPages.map(a=>a.url.split('/').filter(Boolean).at(-1));
  assert.deepEqual(photos.map(p=>p.slug).sort(),topics.sort());
  assert.equal(new Set(photos.map(p=>p.sourceUrl)).size,25);
  const credits=fs.readFileSync('_site/pilsetas-un-fotografijas/index.html','utf8');
  for(const p of photos){
    assert.equal(sha(p.sourceCopy),p.sourceSha256,p.slug);
    assert.equal(p.visualReview.sourceSha256,p.sourceSha256);
    assert(p.visualReview.evidence.length>20);
    assert.match(p.sourceUrl,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
    assert.match(p.license,/^(CC BY|Public domain)/);
    assert.match(p.licenseUrl,/^https?:\/\/creativecommons.org\//);
    assert(p.author.length>2);
    assert(credits.includes('id="occasion-photo-'+p.id+'"'),p.slug);
    const page=fs.readFileSync('_site/svetki-un-tradicijas/'+p.slug+'/index.html','utf8');
    assert(page.includes('class="tradition-topic-photo"'),p.slug);
    assert(page.includes('#occasion-photo-'+p.id),p.slug);
  }
});

test('all 73 distinct real photographs have small, immutable responsive cover files with exact hashes', () => {
  const covers=json('_data/tradition-covers.json');
  assert.equal(Object.keys(covers).length,73);
  for(const [id,p] of Object.entries(covers)){
    assert(p.files.length>=3,id);
    for(const f of p.files){
      const path=f.src.slice(1);assert.equal(sha(path),f.sha256,id);
      assert.equal(fs.statSync(path).size,f.bytes);
      assert(path.includes(f.sha256.slice(0,12)));
      assert(f.bytes <= (f.width<=320 ? 30000 : f.width<=640 ? 90000 : f.width<=960 ? 200000 : 260000),id+' '+f.width+'px cover');
      assert.equal(f.height,Math.round(f.width*9/16));
      assert(fs.existsSync('_site'+f.src));
    }
  }
  for(const p of json('assets/category-data.json').articles){assert(p.photo?.srcset,p.url);assert(!p.illustration,p.url);}
});
