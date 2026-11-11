import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {schoolModel,schoolScenes,schoolDesigns,schoolFilename} from '../assets/school-planner.mjs';
import {plannerScenes} from '../assets/planner-exports.mjs';
import {textWidth} from '../assets/planner-font-metrics.mjs';
import {schoolDisplayWidth} from '../assets/school-display-metrics.mjs';
import {weeklyVectorPDF} from '../assets/planner-vector-pdf.mjs';
const lesson={id:'math',subject:'Matemātika',weekday:1,start:'08:15',end:'09:00',room:'204',teacher:'Līga Ķirše',from:'2028-02-28',until:'2028-03-06',color:'#852843'};
const data={version:1,template:4,lessons:[lesson,{...lesson,id:'sunday',subject:'Mūzika',weekday:0}],tasks:[{id:'task',title:'Izlasīt stāstu',date:'2028-02-29',type:'homework',subject:'Latviešu valoda',priority:'high',done:true},{id:'later',title:'Nākamā nedēļa',date:'2028-03-06',type:'test',priority:'normal',done:false}]};
const values=svg=>[...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(m=>m[1].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'")).join(' ');
test('selected week obeys recurrence bounds, leap day, Sunday and ISO year, preserving all lesson and task fields',()=>{
 const before=structuredClone(data),m=schoolModel(data,'2028-02-29');assert.deepEqual(data,before);assert.equal(m.start,'2028-02-28');assert.equal(m.rows.length,7);assert.equal(m.rows[6].date,'2028-03-05');assert.equal(m.rows[0].lessons[0].teacher,'Līga Ķirše');assert.equal(m.rows[1].tasks[0].done,true);assert.equal(m.rows[6].lessons[0].subject,'Mūzika');assert.equal(m.rows.flatMap(r=>r.tasks).length,1);assert.equal(schoolModel(data,'2028-03-13').rows.flatMap(r=>r.lessons).length,0);assert.equal(schoolModel(data,'2028-02-21').rows.flatMap(r=>r.lessons).length,0);assert(schoolFilename(schoolModel({},'2030-12-31'),15).includes('2031-01-15'));assert.throws(()=>schoolModel({},'2028-02-30'));
});
test('15 original designs, four layouts, all personal information, brand, text bounds and safe vector geometry',()=>{
 assert.equal(schoolDesigns.length,15);assert.equal(new Set(schoolDesigns.map(d=>d.layout)).size,4);const m=schoolModel(data,'2028-02-29'),distinct=new Set();
 for(const d of schoolDesigns){const scenes=plannerScenes(m,{design:d.id}),svg=scenes.join(''),copy=values(svg);distinct.add(scenes[0]);for(const s of ['Matemātika','Līga Ķirše','Telpa: 204','08:15 līdz 09:00','Mūzika','Izlasīt stāstu','Latviešu valoda','Paveikts','Svarīga','Kalendārs365™','kalendars365.lv'])assert(copy.includes(s),d.name+': '+s);assert(!copy.includes('Nākamā nedēļa'));assert(!/NaN|Infinity|undefined|<image|<script|<foreignObject/.test(svg));assert(!/[–—-]/.test(copy));
  for(const match of svg.matchAll(/<text\b([^>]+)>(.*?)<\/text>/g)){const a=Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]])),v=values(match[0]);const w=a['font-family']==='K365 Literata'?schoolDisplayWidth(v,+a['font-size']):textWidth(v,+a['font-size'],a['font-weight']==='700'),x=+a.x-(a['text-anchor']==='end'?w:a['text-anchor']==='middle'?w/2:0);assert(x>=0&&x+w<=1001,d.name+' bounds: '+v);assert(+a.y<=700);}
 }assert.equal(distinct.size,15);
});
test('many lessons and tasks paginate intact, escape markup and brand every appendix',()=>{
 const large={lessons:Array.from({length:22},(_,i)=>({...lesson,id:'l'+i,subject:`Priekšmets${i} `+'garš nosaukums '.repeat(8),room:'Telpa'+i,teacher:'Skolotājs'+i})),tasks:Array.from({length:32},(_,i)=>({id:'t'+i,date:'2028-02-29',title:'Darbs'+i+' <script>saturs</script>',subject:'Literatūra',priority:'low',type:'project',done:i%2===0}))};
 for(const d of schoolDesigns){const scenes=schoolScenes(schoolModel(large,'2028-02-29'),{design:d.id}),all=scenes.join(''),copy=values(all);assert(scenes.length>1);for(let i=0;i<22;i++){assert(copy.includes('Priekšmets'+i));assert(copy.includes('Telpa'+i));assert(copy.includes('Skolotājs'+i));}for(let i=0;i<32;i++)assert(copy.includes('Darbs'+i));for(const s of scenes)assert(s.includes('Kalendārs365™'));assert(!all.includes('<script>'));assert(all.includes('&lt;script&gt;'));}
});
test('PDF keeps embedded Latvian fonts and vector content instead of a page-sized bitmap',async()=>{
 const require=createRequire(import.meta.url),PDFLib=require('../assets/vendor/pdf-lib.min.js'),fontkit=require('../assets/vendor/fontkit.umd.min.js');
 const bytes=await weeklyVectorPDF(schoolScenes(schoolModel(data,'2028-02-29'),{design:1}),{PDFLib,fontkit,regular:fs.readFileSync('assets/fonts/DM-Sans-Regular.ttf'),bold:fs.readFileSync('assets/fonts/DM-Sans-Bold.ttf'),display:fs.readFileSync('assets/fonts/Literata-Display.ttf'),title:'Stundu saraksts'}),doc=await PDFLib.PDFDocument.load(bytes);
 assert.equal(doc.getTitle(),'Stundu saraksts | Kalendārs365');assert.equal(doc.getAuthor(),'Kalendārs365');assert(doc.getPages().every(p=>Math.abs(p.getWidth()-841.8898)<.01&&Math.abs(p.getHeight()-595.2756)<.01));assert(!Buffer.from(bytes).toString('latin1').includes('/Subtype /Image'));
});
test('all 15 local print masters, images and thumbnails match their recorded checksums',async()=>{
 const crypto=await import('node:crypto'),{items}=JSON.parse(fs.readFileSync('downloads/stundas/manifest.json'));assert.equal(items.length,15);
 for(const item of items){assert.equal(item.width,7016);assert.equal(item.height,4961);assert.equal(item.ppi,600);for(const key of ['pdf','image','preview']){const bytes=fs.readFileSync('.'+item[key]);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item[key+'Sha256']);}}
});
test('school gallery ships complete unique preview cards and has no retired duplicate color swatches',()=>{
 const html=fs.readFileSync('_site/stundu-saraksts/index.html','utf8');assert.equal((html.match(/data-v2-design="\d+"/g)||[]).length,15);for(const item of schoolDesigns)assert(html.includes(item.name));assert(html.includes('school-design-studio'));assert(html.includes('school-print-guide-title'));assert(!html.includes('data-class-templates'));assert(!html.includes('Papīra balts'));assert(html.includes('7016 × 4961'));
});
