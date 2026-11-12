import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const catalog=read('_data/page-guides.json'),notes=catalog.pages,manifest=read('docs/route-manifest.json');
const data=read('assets/calendar-data.json'),trustPages=read('_data/trust-pages.json').pages;
const dates=(first,last)=>{let days=[];for(let d=new Date(first+'T12:00:00Z'),end=new Date(last+'T12:00:00Z');d<=end;d.setUTCDate(d.getUTCDate()+1))days.push(d.toISOString().slice(0,10));return days;};
const isWeekday=date=>![0,6].includes(new Date(date+'T12:00:00Z').getUTCDay());
const offDates=new Set(data.holidays.filter(x=>x.dayOff).map(x=>x.date));
const isoWeek=value=>{let d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const year=d.getUTCFullYear(),start=new Date(Date.UTC(year,0,1,12));return{year,week:Math.ceil((((d-start)/86400000)+1)/7)};};

test('every published page has two or three substantive notes with no duplicated paragraph',()=>{
  const expected=new Set([...manifest.filter(x=>!x.family.startsWith('blog_')).map(x=>x.url),'/nedelas-kalendars/2031/01/','/404.html','/500.html']);
  assert.deepEqual(new Set(Object.keys(notes)),expected);
  assert.equal(Object.keys(notes).length,expected.size);
  const paragraphs=new Set();
  for(const [url,note] of Object.entries(notes)){
    assert.ok([2,3].includes(note.paragraphs.length),url);
    const words=note.paragraphs.join(' ').split(/\s+/).length;
    // The homepage uses the concise introduction requested by the owner.
    assert.ok(words>=(url==='/'?40:60),url);
    if(url==='/')assert.ok(words<=80,'Keep the homepage introduction concise.');
    for(const text of note.paragraphs){
      assert.ok(!paragraphs.has(text),'duplicate paragraph: '+url);paragraphs.add(text);
      assert.doesNotMatch(text,/<[^>]+>|lorem ipsum|takvima|gezgininde|yerine|AdSense|koledar365|Slovenija|Slovenia/i,url);
    }
    assert.ok(fs.existsSync(path.join(root,'assets/category-vector',note.icon+'.svg')),url);
    for(const link of [...note.related,...note.sources]){
      assert.ok(link.title&&link.url,url);
      if(link.url.startsWith('/'))assert.ok(expected.has(link.url),url+' -> '+link.url);
      else assert.equal(new URL(link.url).protocol,'https:',url);
    }
  }
  assert.equal(catalog.editorial.nativeEditorReviewed,false);
});

test('calendar, work and ISO-week notes use actual date boundaries and deduplicated holiday dates',()=>{
  for(const [url,note] of Object.entries(notes)){
    const b=note.basis;if(!b?.first||!Object.hasOwn(b,'workdays'))continue;
    const span=dates(b.first,b.last);
    if(b.workdays===null){assert.equal(url,'/nedelas-kalendars/2031/01/');continue;}
    assert.equal(b.workdays,span.filter(d=>isWeekday(d)&&!offDates.has(d)).length,url);
    if(b.days)assert.equal(b.days,span.length,url);
    if(b.isoYear){
      assert.equal(span.length,7,url);assert.equal(new Date(span[0]+'T12:00:00Z').getUTCDay(),1,url);
      for(const d of span)assert.deepEqual(isoWeek(d),{year:b.isoYear,week:b.week},url);
    }
  }
  assert.equal(notes['/kalendars/2028/februaris/'].basis.days,29);
  assert.match(notes['/kalendars/2028/februaris/'].paragraphs.join(' '),/2028\. gada 29\. februāris/);
  assert.equal(notes['/kalendars/2027/'].basis.workdays,252);
});

test('lunar notes retain the precise local source dates and phase counts',()=>{
  for(const [url,note] of Object.entries(notes)){
    const b=note.basis;if(!Object.hasOwn(b||{},'phaseCount'))continue;
    const prefix=String(b.year)+(b.month?'-'+String(b.month).padStart(2,'0'):'');
    const rows=data.moon.filter(x=>x.date.startsWith(prefix));
    assert.equal(b.phaseCount,rows.length,url);
    assert.equal(b.fullMoonCount,rows.filter(x=>x.phaseKey==='Full Moon').length,url);
    assert.equal(b.newMoonCount,rows.filter(x=>x.phaseKey==='New Moon').length,url);
    for(const row of rows.slice(0,b.month?5:2))assert.ok(note.paragraphs[0].includes(row.time),url);
  }
  assert.match(notes['/meness-kalendars/2028/februaris/'].paragraphs[0],/2028\. gada 10\. februārī plkst\. 17:04/);
});

test('all 164 city explanations match the same astronomy model and catalog coordinates',()=>{
  const sky=JSON.parse(execFileSync(process.execPath,['scripts/render_reading_sky.mjs'],{cwd:root,encoding:'utf8'}));
  const cities=read('_data/cities.json').cities;
  for(const city of cities)for(const prefix of ['saullekts-saulriets','meness-lekts-un-riets']){
    const url=`/${prefix}/${city.id}/`,note=notes[url],b=note.basis;
    assert.equal(b.lat,city.lat,url);assert.equal(b.lon,city.lon,url);
    assert.ok(note.paragraphs[0].includes(city.name),url);
    for(const date of b.exampleDates){
      const sample=sky[city.id][date];
      const values=prefix==='saullekts-saulriets'?[sample.sunrise,sample.sunset]:[...sample.moonrise,...sample.moonset];
      for(const value of values)assert.ok(note.paragraphs[1].includes(value),url+' '+date+' '+value);
    }
  }
});

test('name notes preserve traditional and extended source scopes',()=>{
  for(const [url,note] of Object.entries(notes)){
    const b=note.basis;if(!Object.hasOwn(b||{},'traditionalRecords'))continue;
    const rows=data.names.filter(r=>b.name?r.name===b.name:Number(r.month)===b.month);
    assert.equal(b.traditionalRecords,rows.filter(r=>r.kind==='traditional').length,url);
    assert.equal(b.extendedRecords,rows.filter(r=>r.kind!=='traditional').length,url);
    assert.equal(note.sources.length,2,url);
  }
});

test('garden month notes follow resolved source windows, including protected winter production',()=>{
  const garden=JSON.parse(execFileSync(process.execPath,['scripts/render_garden_calendar.cjs'],{cwd:root,encoding:'utf8'}));
  for(const note of Object.values(notes)){
    const b=note.basis;if(!b?.sowingCropIds)continue;
    const sow=garden.crops.filter(c=>c.actions.some(a=>['sow','plant'].includes(a.task)&&a.months.includes(b.month))).map(x=>x.id);
    const harvest=garden.crops.filter(c=>c.actions.some(a=>a.task==='harvest'&&a.months.includes(b.month))).map(x=>x.id);
    assert.deepEqual(b.sowingCropIds,sow);assert.deepEqual(b.harvestCropIds,harvest);
  }
  assert.match(notes['/sejas-kalendars/menesis/decembris/'].paragraphs[1],/siltumnīcas/);
  assert.match(notes['/sejas-kalendars/menesis/decembris/'].paragraphs[1],/nevis lauka ražas/);
});

test('unpublished school pages and the 2031 boundary stay indexable without fabricating confirmed schedules',()=>{
  const pending=Object.entries(notes).filter(([,n])=>n.basis?.status==='not-published');
  assert.equal(pending.length,8);
  for(const [url,note] of pending){
    const page=manifest.find(x=>x.url===url);
    assert.equal(page.indexable,true,url);
    assert.equal(page.status,'school_dates_pending',url);
    assert.match(note.paragraphs[0],/vēl nav publicēts/,url);
  }
  assert.equal(notes['/nedelas-kalendars/2031/01/'].basis.workdays,null);
  assert(manifest.find(x=>x.url==='/nedelas-kalendars/2031/01/').indexable);
});

test('built HTML contains the notes as visible, escaped main content without disturbing template order',()=>{
  for(const [url,note] of Object.entries(notes)){
    const file=url==='/'?'index.html':url.endsWith('.html')?url:url.slice(1)+'index.html';
    const html=fs.readFileSync(path.join(root,'_site',file.replace(/^\//,'')),'utf8');
    if(trustPages[url]){
      assert(html.includes('data-trust-page='),url+' has a purpose-built information page');
      assert(!html.includes('data-page-reading'),url+' must not append the superseded generic notes');
      assert.equal(html.includes('class="trust-directory"'),trustPages[url].kind!=='contact',url);
      continue;
    }
    if(url==='/pdf-kalendari/') {
      const guide=html.match(/<section class="print-library-guide"[\s\S]*?<\/section>/)?.[0];
      assert(guide&&guide.includes('id="print-guide-title"'),'PDF discovery has its own visible print guide');
      assert((guide.match(/<p>/g)||[]).length>=2);assert(guide.includes('/izveidot-kalendaru/'));assert(guide.includes('/svetku-dienas/'));
      assert.equal((html.match(/data-page-reading/g)||[]).length,0,'Avoid a second, duplicated guide below the custom print guide');
      continue;
    }
    assert.equal((html.match(/data-page-reading/g)||[]).length,1,url);
    const start=html.indexOf('data-page-reading'),end=html.indexOf('</main>',start);
    assert.ok(start>html.indexOf('<main id="main">')&&end>start,url);
    // Recommendations follow the guide inside main and may have their own copy.
    // Count only the visible paragraphs in the guide being tested.
    const part=html.match(/<section class="page-reading"[\s\S]*?<\/section>/)?.[0];
    assert(part,url+' must render its own guide section');
    assert.equal((part.match(/<p>/g)||[]).length,note.paragraphs.length,url);
    assert.ok(!/\shidden(?:\s|>)/.test(part),url);
    if(url.startsWith('/kalendars/202')||url.startsWith('/pdf-kalendari/202'))assert.ok(html.indexOf('a3-year-gallery')<start,url);
  }
});
