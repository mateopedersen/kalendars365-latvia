import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import C from '../assets/calendar-core.js';
import {PRESETS,applyPreset,STUDIO_PHOTOS,LOCALES,initialState,normalize,moveMonth,monthGrid,validDate,isoWeek,holidays,eventsFor,renderCalendar,exportPages,parseEvents,eventsICS,createPDF} from '../assets/studio/engine.mjs';

test('studio uses the same Latvia holiday dates, including substitute days',()=>{
  for(const year of [2027,2028,2029,2030])assert.deepEqual(holidays(year).map(h=>[h.date,h.title]),C.holidays(year).filter(h=>h.dayOff).map(h=>[h.date,h.title]));
  assert(holidays(2028).some(h=>h.date==='2028-07-10'));
  assert(!holidays(2027).some(h=>h.date==='2027-01-02'));
  assert.equal(initialState().locale,'lv');assert.deepEqual(Object.keys(LOCALES),['lv']);
  assert.equal(monthGrid(2028,2).filter(d=>d.current).length,29);
  assert.equal(monthGrid(2027,1,1)[0].date,'2026-12-28');
  assert.equal(monthGrid(2027,1,0)[0].date,'2026-12-27');
  assert.equal(isoWeek('2027-01-01'),53);
});
test('studio project normalization preserves safe content and rejects remote image injection',()=>{
  const state=normalize({...initialState(),year:2026,quality:600,locale:'sl',title:'<script>alert(1)</script>',photo:'https://example.org/private.jpg',layers:[{id:'layer-safe',type:'image',src:'https://example.org/a.jpg'},{id:'text-safe',type:'text',text:'Latvija <3',x:500,y:-5}]});
  assert.equal(state.year,2027);assert.equal(state.quality,600);assert.equal(state.locale,'lv');assert.equal(state.photo,'');assert.equal(state.layers.length,1);assert.equal(state.layers[0].id,'text-safe');assert.equal(state.layers[0].x,100);assert.equal(state.layers[0].y,0);
  const svg=renderCalendar(state);assert(!svg.includes('<script>'));assert(svg.includes('&lt;script&gt;'));assert(!svg.includes('example.org'));
  assert.throws(()=>normalize({version:999}));
});
test('personal dates recur only on valid calendar days and export complete pages',()=>{
  const state=initialState(2027);state.events=[{id:'anniversary',date:'2024-02-29',title:'Ģimenes svētki',annual:true,color:'#8a2946'}];
  assert.equal(eventsFor(state,null,false).length,0);state.year=2028;assert.equal(eventsFor(state,2,false).length,1);
  state.view='month';assert.equal(exportPages(state,'all').length,13);state.includeAgenda=false;assert.equal(exportPages(state,'all').length,12);
  assert.equal(validDate('2027-02-29'),false);assert.equal(validDate('2028-02-29'),true);
});
test('Latvian CSV and ICS preserve Unicode, safe lines, recurrence and stable event IDs',()=>{
  const events=parseEvents('datums,nosaukums,katru gadu,krāsa\n2028-02-29,"Ģimene, draugi",jā,#8a2946\n2027-02-29,Kļūda,nē,#000000');
  assert.equal(events.length,1);assert.equal(events[0].annual,true);
  const state=initialState(2028);state.events=[{...events[0],id:'stable-event',title:'Āboliņš '.repeat(18)+', ģimene; draugi\\prieks\nBEGIN:VEVENT'}];
  const ics=eventsICS(state);assert(ics.includes('UID:stable-event@kalendars365.lv'));assert(ics.includes('DTEND;VALUE=DATE:20280301'));
  assert.equal(ics.split('\r\n').filter(line=>line==='BEGIN:VEVENT').length,1);
  assert(ics.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
  assert.equal(parseEvents(ics,'ics')[0].title,state.events[0].title.slice(0,120).replace(/\n/g,' '));
  assert.equal(normalize(state).events[0].id,'stable-event');
});
test('all ready designs render Latvia month and year layouts without foreign labels',()=>{
  assert.equal(PRESETS.length,6);assert.equal(new Set(PRESETS.map(p=>p.id)).size,6);
  for(const preset of PRESETS)for(const paper of ['a4','a3','letter'])for(const orientation of ['portrait','landscape'])for(const view of ['year','month']){
    const state={...initialState(2028),template:preset.id,colors:preset.colors,font:preset.font,paper,orientation,view,month:2,showWeekNumbers:true};
    const svg=renderCalendar(state);assert(!/NaN|undefined|Infinity|Sloven|Koledar|januar(?!s)|februar(?!is)/.test(svg));assert(svg.includes('KALENDARS365.LV'));assert.equal((svg.match(/<svg /g)||[]).length,1);
  }
});
test('PDF objects use the chosen physical page size and valid byte offsets',()=>{
  const pdf=createPDF([{width:2,height:2,bytes:new Uint8Array([255,216,255,217])}],297,210),text=new TextDecoder().decode(pdf);
  assert(text.startsWith('%PDF-1.4'));assert(text.includes('/Count 1'));assert(text.includes('/MediaBox [0 0 841.8897637795276 595.2755905511812]'));
  const offset=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(pdf.slice(offset,offset+4)),'xref');
});
test('the published creator contains one editor, six controls and only Latvian interface labels',()=>{
  const html=fs.readFileSync('_site/izveidot-kalendaru/index.html','utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.equal((html.match(/data-tab="/g)||[]).length,6);
  assert(html.includes('/assets/studio/studio.mjs?v='));assert(!/Ustvarite|Predloge|Postavitev|Slovenski|Slovenščina|Prenesi|KOLEDAR365/.test(html));assert(html.includes('600 dpi'));
});

test('the home creator card navigates directly to the full editor without JavaScript',()=>{
  const html=fs.readFileSync('_site/index.html','utf8');
  const card=html.match(/<a\b([^>]*\bclass="[^"]*\bhero-create\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/);
  assert(card,'The home creator must be a native navigation link');
  assert.match(card[1],/\bhref="\/izveidot-kalendaru\/"/);
  assert.doesNotMatch(card[1],/data-action=/);
  assert.match(card[2],/Izveido savu kalendāru/);
  assert.doesNotMatch(html,/<button\b[^>]*\bclass="[^"]*\bhero-create\b/);
});

test('month navigation stays within published years',()=>{
 assert.deepEqual(moveMonth({year:2027,month:1},-1),{year:2027,month:1});
 assert.deepEqual(moveMonth({year:2030,month:12},1),{year:2030,month:12});
 assert.deepEqual(moveMonth({year:2027,month:12},1),{year:2028,month:1});
 assert.deepEqual(moveMonth({year:2028,month:1},-1),{year:2027,month:12});
});

test('ready templates use distinct page layouts while preserving personal content',()=>{
 const s=initialState(2029);s.title='Mūsu ģimene';s.events=[{id:'birthday',title:'Dzimšanas diena',date:'2029-01-01'}];s.photo='data:image/png;base64,YQ==';
 assert.equal(applyPreset(s,'photo').view,'month');assert.equal(applyPreset(s,'editorial').orientation,'portrait');
 assert.equal(applyPreset(s,'business').showWeekNumbers,true);assert.equal(applyPreset(s,'minimal').titleAlign,'center');
 for(const p of PRESETS){const r=applyPreset(s,p.id);assert.equal(r.title,s.title);assert.equal(r.year,2029);assert.deepEqual(r.events,s.events);assert.equal(r.photo,s.photo);}
});

test('sample photograph attribution travels inside the project and exported calendar',()=>{
 for(const sample of Object.values(STUDIO_PHOTOS)){assert(sample.credit.includes('Foto:'));assert(sample.sourceUrl.startsWith('https://'));}
 const s=initialState();s.photo='data:image/png;base64,YQ==';s.photoCredit=STUDIO_PHOTOS['/assets/cities/riga-960.webp'].credit;
 assert.equal(normalize(s).photoCredit,s.photoCredit);assert(renderCalendar(s).includes('Diego Delso'));assert(renderCalendar(s).includes('CC BY-SA 3.0'));
});
test('independent preview and print photo clip paths never collide',()=>{
 const s=initialState();s.photo='data:image/png;base64,YQ==';const a=renderCalendar(s,{idPrefix:'studio-preview'}),b=renderCalendar(s);
 assert(a.includes('url(#studio-preview-photo-clip-1)'));assert(b.includes('url(#studio-art-photo-clip-1)'));assert(!b.includes('url(#studio-preview'));
});
