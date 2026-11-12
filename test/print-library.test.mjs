import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {normalizePrintFilters,filterPrintLibrary,printPeriodLink,printDesignCount} from '../assets/print-library-core.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const accepted=[...read('downloads/gada-a3/manifest.json').items.map(item=>({...item,period:'year'})),...read('downloads/menesa-a3/manifest.json').items.map(item=>({...item,period:'month'}))];

test('calendar selection stays inside the accepted four years and twelve months',()=>{
  assert.equal(printPeriodLink({year:2028,period:'month',month:2}),'/pdf-kalendari/2028/februaris/');
  assert.equal(printPeriodLink({year:2030,period:'month',month:12}),'/pdf-kalendari/2030/decembris/');
  assert.equal(printPeriodLink({year:2029,period:'year',month:4}),'/pdf-kalendari/2029/');
  assert.equal(printPeriodLink({year:2031,period:'../../',month:-1}),'/pdf-kalendari/2027/');
  assert.deepEqual(normalizePrintFilters({year:'2028',period:'month',month:'2',holidays:'yes'}),{year:2028,period:'month',month:2,orientation:'all',holidays:'yes',query:''});
});

test('every annual and monthly selection resolves to its own fifteen accepted designs',()=>{
  assert.equal(accepted.length,780);
  for(const year of [2027,2028,2029,2030]) {
    assert.equal(filterPrintLibrary(accepted,{year,period:'year'}).length,15);
    for(let month=1;month<=12;month++) {
      const matching=filterPrintLibrary(accepted,{year,period:'month',month});
      assert.equal(matching.length,15,`${year}-${month}`);
      assert(matching.every(item=>item.year===year&&item.month===month));
    }
  }
});

test('orientation and holiday filters intersect without mixing unrelated periods',()=>{
  for(const period of ['year','month']) for(const orientation of ['portrait','landscape']) for(const holidays of ['yes','no']) {
    const state={year:2028,period,month:2,orientation,holidays};
    const actual=filterPrintLibrary(accepted,state);
    const expected=accepted.filter(item=>item.year===2028&&item.period===period&&(period==='year'||item.month===2)&&item.orientation===orientation&&item.holidays===(holidays==='yes'));
    assert.deepEqual(actual,expected);
  }
});

test('Latvian names are found with or without diacritics and all search terms matter',()=>{
  const riga=filterPrintLibrary(accepted,{query:'rigas silueti'});
  assert.equal(riga.length,1);assert.equal(riga[0].title,'Rīgas silueti');
  assert.deepEqual(filterPrintLibrary(accepted,{query:'RĪGAS   silueti'}),riga);
  assert(filterPrintLibrary(accepted,{query:'mezs'}).some(item=>item.title.includes('mežs')));
  assert.equal(filterPrintLibrary(accepted,{query:'Riga neeksistejoss'}).length,0);
  assert.equal(filterPrintLibrary(accepted,{query:'<script>alert(1)</script>'}).length,0);
});

test('the lazy catalog preserves all accepted PDF and Image destinations and uses small local previews',()=>{
  const catalog=read('assets/print-library-data.json');assert.equal(catalog.version,1);assert.equal(catalog.items.length,780);
  assert.equal(new Set(catalog.items.map(item=>item.id)).size,780);
  const byPdf=new Map(accepted.map(item=>[item.pdf,item]));
  for(const item of catalog.items) {
    const original=byPdf.get(item.pdf);assert(original,item.pdf);
    for(const key of ['image','year','orientation','holidays','title'])assert.equal(item[key],original[key],`${item.id}: ${key}`);
    assert(fs.existsSync('.'+item.preview));assert(item.width<=509&&item.width>=396,item.preview);assert(item.height>0);
  }
});

test('year collection illustrations remain separate self-contained vector originals',()=>{
  const art=read('_data/print-library-art.json').artworks;assert.equal(art.length,5);assert.equal(new Set(art.map(row=>row.sha256)).size,5);
  for(const row of art) {
    const bytes=fs.readFileSync('.'+row.src);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256);
    assert(!/<image\b|<script\b|<foreignObject\b|data:image|NaN|Infinity/.test(bytes.toString()));
  }
});

test('result count wording handles Latvian singulars and teen numbers',()=>{
  assert.equal(printDesignCount(0),'0 dizaini');assert.equal(printDesignCount(1),'1 dizains');
  assert.equal(printDesignCount(11),'11 dizaini');assert.equal(printDesignCount(15),'15 dizaini');assert.equal(printDesignCount(21),'21 dizains');
});
