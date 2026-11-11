const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../assets/calendar-collection.js');
const months=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const kinds=['kalendars','pdf-kalendari','meness-kalendars'];

test('all 156 year/month pages put the correct downloads first and expose every month',()=>{
 let count=0;
 for(const kind of kinds)for(let year=2027;year<=2030;year++)for(const month of [null,...Array.from({length:12},(_,i)=>i+1)]){
  const url=core.path(kind,year,month),html=fs.readFileSync('_site'+url+'index.html','utf8');
  const main=html.slice(html.indexOf('<div class="calendar-collection-main">'));
  const gallery=kind==='meness-kalendars'?'moon-print-section':'a3-year-gallery';
  assert.match(main,new RegExp('^<div class="calendar-collection-main"><section class="'+gallery));
  assert(main.indexOf('calendar-period-content')>main.indexOf(kind==='meness-kalendars'?'moon-print-card':'a3-design-card'));
  assert.equal((html.match(/class="collection-mini-month/g)||[]).length,12,url);
  assert.equal((html.match(/<article class="(?:a3-design-card|moon-print-card)"/g)||[]).length,kind==='meness-kalendars'?4:15,url);
  assert.equal((html.match(/class="calendar-collection-layout"/g)||[]).length,1,url);
  assert(html.includes('data-collection-year="'+year+'"'));
  for(let number=1;number<=12;number++){
   const mini=html.match(new RegExp('<section class="collection-mini-month[^>]*data-month="'+number+'">([\\s\\S]*?)</section>'))[1];
   assert(mini.includes('href="'+core.path(kind,year,number)+'"'));
   const dates=[...mini.matchAll(/<time datetime="(\d{4}-\d{2}-\d{2})">/g)].map(x=>x[1]).filter(x=>x.startsWith(year+'-'+String(number).padStart(2,'0')));
   assert.equal(dates.length,new Date(Date.UTC(year,number,0)).getUTCDate(),url+' month '+number);
   assert.equal(new Set(dates).size,dates.length);
  }
  if(month)assert(html.includes('data-month="'+month+'"><h3><a href="'+core.path(kind,year,month)+'" aria-current="page"'));
  assert(html.includes('/assets/calendar-collection.js?v='));count++;
 }
 assert.equal(count,156);
});

test('all download controls remain date-bound, complete and available on disk',()=>{
 for(const [file,kind] of [['downloads/gada-a3/manifest.json','kalendars'],['downloads/menesa-a3/manifest.json','kalendars'],['downloads/meness/manifest.json','meness-kalendars']]){
  const items=JSON.parse(fs.readFileSync(file)).items;
  for(const item of items.filter(row=>row.year>=2027&&row.year<=2030)){const html=fs.readFileSync('_site'+core.path(kind,item.year,item.month??null)+'index.html','utf8');for(const key of ['pdf','image','preview']){assert(html.includes(item[key]));assert(fs.statSync('.'+item[key]).isFile());}}
 }
});

test('period stepping keeps leap days, ISO crossings and supported year boundaries correct',()=>{
 assert.equal(core.step('2027-12-28','week',1),'2028-01-04');
 assert.equal(core.step('2028-02-28','day',1),'2028-02-29');
 assert.equal(core.step('2028-02-29','day',1),'2028-03-01');
 assert.equal(core.step('2027-01-01','month',-1),null);
 assert.equal(core.step('2030-12-01','month',1),null);
 assert.equal(core.step('2030-12-31','day',1),null);
 assert.equal(core.step('2028-03-31','month',-1),'2028-02-01');
 assert.equal(core.step('2027-02-29','day',1),null);
 assert.equal(core.step('2027-12-15','year',1),'2028-01-01');
 assert.equal(core.destination('kalendars',{view:'month',shown:'2028-02-29'}),'/kalendars/2028/februaris/');
 assert.equal(core.destination('kalendars',{view:'year',shown:'2028-02-29'}),'/kalendars/2028/');
 assert.equal(core.path('kalendars',2026,12),null);assert.equal(core.path('meness-kalendars',2031,1),null);assert.equal(core.path('other',2027),null);
});

test('print shells keep the full annual calendar while navigation stays outside the sheet',()=>{
 for(const kind of ['kalendars','pdf-kalendari'])for(let year=2027;year<=2030;year++){
  const html=fs.readFileSync('_site'+core.path(kind,year)+'index.html','utf8');const printable=html.slice(html.indexOf('<section class="collection-print-year">'));
  assert.equal((printable.match(/<section class="mini-calendar">/g)||[]).length,12);
  assert(!printable.includes('collection-month-list'));
 }
});
