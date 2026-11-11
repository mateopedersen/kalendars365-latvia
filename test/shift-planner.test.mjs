import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import C from '../assets/calendar-core.js';
import K from '../assets/category-core.js';
import {shiftModel,shiftScenes,shiftDesigns,shiftFilename} from '../assets/shift-planner.mjs';
import {plannerScenes} from '../assets/planner-exports.mjs';
import {textWidth} from '../assets/planner-font-metrics.mjs';
const state={version:1,anchor:'2027-01-01',name:'Darbs un atpūta',cycle:K.shiftPresets.rotating,overrides:{'2028-02-29':{kind:'night',note:'Paņemt atslēgas un ziņot dežurantam'}}};

test('all 48 monthly snapshots preserve actual cycle times, breaks, hours, notes and month boundaries',()=>{
 const before=structuredClone(state);
 for(let year=2027;year<=2030;year++)for(let month=1;month<=12;month++){
  const m=shiftModel(state,year,month,K),expected=K.shiftMonth(state,year,month);
  assert.equal(m.kind,'shift');assert.equal(m.title,state.name);assert.equal(m.rows.length,new Date(Date.UTC(year,month,0)).getUTCDate());
  assert.equal(new Set(m.rows.map(r=>r.date)).size,expected.length);
  assert.deepEqual(m.rows.map(({text,...r})=>r),expected);
  assert.deepEqual(state,before);assert.equal(m.cycle.length,4);assert.equal(m.anchor,state.anchor);
 }
 assert(shiftScenes(shiftModel(state,2027,1,K),{design:4})[0].includes('>Pk.</text>'));
 const leap=shiftModel(state,2028,2,K).rows.at(-1);assert.equal(leap.date,'2028-02-29');assert.equal(leap.endDate,'2028-03-01');assert.equal(leap.hours,11);assert.equal(leap.break,60);assert(leap.note.includes('atslēgas'));
 assert.notEqual(shiftFilename(shiftModel(state,2028,2,K),1),shiftFilename(shiftModel(state,2028,3,K),1));
});
test('15 original vector designs keep actual shift data, full notes, brand and safe text geometry',()=>{
 const model=shiftModel(state,2028,2,K);assert.equal(shiftDesigns.length,15);assert.equal(new Set(shiftDesigns.map(d=>d.name)).size,15);assert.equal(new Set(shiftDesigns.map(d=>d.motif)).size,15);assert.equal(new Set(shiftDesigns.map(d=>d.layout)).size,4);
 for(const d of shiftDesigns){const scenes=plannerScenes(model,{design:d.id}),all=scenes.join('');assert(scenes.length>1);assert(all.includes('data-shift-design'));assert(all.includes('Kalendārs365™'));assert(all.includes('kalendars365.lv'));assert(all.includes('29'));assert(all.includes('20:00-08:00'));assert(all.includes('Paņemt atslēgas'));assert(all.includes('2028-03-01'));assert(!/NaN|undefined|Infinity|<image|<script|<foreignObject/.test(all));
  for(const match of all.matchAll(/<text\b([^>]+)>(.*?)<\/text>/g)){
   const a=Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])),value=match[2].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'"),w=textWidth(value,+a['font-size'],a['font-weight']==='700'),left=+a.x-(a['text-anchor']==='end'?w:a['text-anchor']==='middle'?w/2:0);
   assert(left>=0&&left+w<=1000.1,`${d.name}: ${value}`);assert(+a.y>0&&+a.y<=700,d.name+': '+value);
  }
 }
});
test('long and escaped notes remain complete; monochrome design never rewrites user text',()=>{
 const model=shiftModel(state,2027,12,K),long=Array.from({length:650},(_,i)=>'Piezīme'+i).join(' ')+' <script>alert(1)</script> #123456';model.rows[0].note=long;
 for(const design of [1,2,3,4,6,15]){
  const pages=shiftScenes(model,{design}),all=pages.join('');assert(pages.length>1);for(let i=0;i<650;i++)assert(all.includes('Piezīme'+i));assert(all.includes('&lt;script&gt;'));assert(!all.includes('<script>'));assert(all.includes('#123456'));
  if(design===6)for(const m of all.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/g))assert(m[1].slice(1,3)===m[1].slice(3,5)&&m[1].slice(3,5)===m[1].slice(5,7));
 }
 assert.throws(()=>shiftScenes({...model,rows:[]}),/trūkst derīgu dienu/);
 assert.throws(()=>shiftScenes({...model,year:2031}),/2027.–2030/);
 assert.throws(()=>shiftScenes(model,{design:16}));
});
test('overnight and 24-hour shifts retain the true next-day end, including 2031',()=>{
 const custom={version:1,anchor:'2030-12-31',name:'Gadu mija',cycle:[{kind:'night',start:'20:00',end:'08:00',break:30}],overrides:{}},model=shiftModel(custom,2030,12,K);
 assert.equal(model.rows.at(-1).endDate,'2031-01-01');assert.equal(model.rows.at(-1).hours,11.5);
 for(const design of [1,2,3,4])assert(shiftScenes(model,{design}).join('').includes('2031-01-01 08:00'));
 const full=shiftModel({...custom,cycle:[{kind:'day',start:'08:00',end:'08:00',break:60}]},2027,1,K);assert.equal(full.rows[0].hours,23);assert.equal(full.rows[0].overnight,true);
 const holiday=shiftModel({...state,overrides:{}},2027,1,K).rows[0];assert(holiday.holiday.some(h=>h.dayOff));assert.equal(holiday.kind,'day','A public holiday does not silently change a personal shift cycle.');
 const carry=shiftModel({...state,cycle:[{kind:'night',start:'20:00',end:'08:00',break:30}],overrides:{}},2027,1,K);assert.equal(carry.previousShift.date,'2026-12-31');assert(carry.previousShift.overnight);assert(shiftScenes(carry,{design:2})[0].includes('data-carry-from="2026-12-31"'));
 const overridden=shiftModel({...state,overrides:{'2028-01-31':{kind:'night'}}},2028,2,K);assert.equal(overridden.previousShift.end,'08:00');assert(shiftScenes(overridden,{design:2})[0].includes('data-carry-from="2028-01-31"'));
});
test('static PDF and Image masters and previews have verified byte identities',()=>{
 const d=JSON.parse(fs.readFileSync('downloads/mainas/manifest.json'));assert.equal(d.items.length,15);assert.equal(d.source,'assets/shift-planner.mjs');
 for(const item of d.items)for(const format of ['pdf','image','preview']){
  const bytes=fs.readFileSync('.'+item[format]);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item[format+'Sha256']);
  assert(format==='pdf'?bytes.subarray(0,5).toString()==='%PDF-':bytes.subarray(0,4).toString()==='RIFF');
 }
 assert(d.items.every(r=>r.width===7016&&r.height===4961&&r.ppi===600&&r.pages===1));
});
test('the shift page ships all 15 real design options and preview cards before JavaScript runs',()=>{
 const html=fs.readFileSync('_site/mainu-grafiks/index.html','utf8'),select=html.match(/<select data-export-design>([\s\S]*?)<\/select>/)[1];
 assert.equal((select.match(/<option /g)||[]).length,15);assert.equal((html.match(/data-v2-design="/g)||[]).length,15);
 for(const d of shiftDesigns)assert(select.includes(d.name));
 assert(html.includes('shift-design-studio'));assert(html.includes('/downloads/mainas/'));assert(html.includes('7016 × 4961'));assert(html.includes('Pilnas piezīmes')||html.includes('Piezīmes nepazūd'));
});
