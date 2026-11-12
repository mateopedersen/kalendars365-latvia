import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {initialState,normalize,dimensions} from '../assets/studio/engine.mjs';
import {crc32,zipStore,pngDpi,jpegDpi} from '../assets/studio/binary-exports.mjs';
import {createDocx,createXlsx,excelDate,selectedEvents} from '../assets/studio/office-exports.mjs';
import {makeExport,rasterDimensions,exportName} from '../assets/studio/export-pipeline.mjs';
const PNG=new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'));
const JPEG=new Uint8Array([255,216,255,224,0,16,74,70,73,70,0,1,1,0,0,1,0,1,0,0,255,217]);
const image={width:1,height:1,bytes:pngDpi(PNG,600)},decode=value=>new TextDecoder().decode(value);
function unzip(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),entries={};let at=0;
 while(view.getUint32(at,true)===0x04034b50){const method=view.getUint16(at+8,true),size=view.getUint32(at+18,true),nameLength=view.getUint16(at+26,true),extraLength=view.getUint16(at+28,true),name=decode(bytes.subarray(at+30,at+30+nameLength)),start=at+30+nameLength+extraLength;assert.equal(method,0);entries[name]=bytes.subarray(start,start+size);at=start+size;}
 assert.equal(view.getUint32(at,true),0x02014b50);return entries;
}
const text=(files,name)=>decode(files[name]);

test('PNG and JPG carry true 600 dpi metadata without recompressing their image payloads',()=>{
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 const png=pngDpi(PNG,600);let at=8,count=0;
 while(at<png.length){const size=new DataView(png.buffer,at,4).getUint32(0),type=decode(png.subarray(at+4,at+8));if(type==='pHYs'){count++;assert.equal(new DataView(png.buffer,at+8,4).getUint32(0),23622);assert.equal(png[at+16],1);assert.equal(new DataView(png.buffer,at+17,4).getUint32(0),crc32(png.subarray(at+4,at+17)));}at+=size+12;}
 assert.equal(count,1);assert.deepEqual(pngDpi(png,600),png);
 const jpg=jpegDpi(JPEG,600);assert.equal(jpg[13],1);assert.equal((jpg[14]<<8)|jpg[15],600);assert.equal((jpg[16]<<8)|jpg[17],600);assert.deepEqual(jpg.subarray(20),JPEG.subarray(20));
 assert.equal(jpegDpi(new Uint8Array([255,216,255,217]),600).length,22);
 assert.throws(()=>pngDpi(new Uint8Array(10),600));assert.throws(()=>pngDpi(PNG,900));assert.throws(()=>jpegDpi(PNG,600));
});

test('ZIP uses UTF-8 paths, valid checksums and rejects unsafe or unsupported archives',()=>{
 const bytes=zipStore({'mēnesis/kalendārs.txt':'Āboliņš un ģimene','proof.bin':new Uint8Array([0,1,255])}),files=unzip(bytes);
 assert.equal(text(files,'mēnesis/kalendārs.txt'),'Āboliņš un ģimene');assert.deepEqual(files['proof.bin'],new Uint8Array([0,1,255]));
 for(const path of ['/root','../escape','a/../escape','a\\escape','./a','a//b'])assert.throws(()=>zipStore({[path]:'bad'}));assert.throws(()=>zipStore({}));
});

test('new calendars default to 600 dpi and preserve every supported physical paper size',()=>{
 assert.equal(initialState().quality,600);assert.equal(normalize({...initialState(),quality:300}).quality,300);
 for(const paper of ['a4','a3','letter'])for(const orientation of ['landscape','portrait'])for(const quality of [150,300,600]){
  const s={...initialState(),paper,orientation,quality},d=dimensions(s),r=rasterDimensions(s);
  assert.equal(r.width,Math.round(d.mmWidth/25.4*quality));assert.equal(r.height,Math.round(d.mmHeight/25.4*quality));
 }
 assert.deepEqual(rasterDimensions({...initialState(),paper:'a3'}),{width:9921,height:7016});
});

test('Word is a real DOCX package with intact design images, physical pages and editable complete personal records',()=>{
 const s=initialState(2028);s.view='month';s.month=2;s.title='Mūsu ģimene & draugi';s.showNotes=true;s.notes='Āboliņš '.repeat(34);s.events=[{id:'a',date:'2024-02-29',annual:true,title:'Pilns ģimenes jubilejas apraksts'.repeat(3)}];
 const files=unzip(createDocx(s,[image],{scope:'current'})),xml=text(files,'word/document.xml');
 assert(text(files,'[Content_Types].xml').includes('wordprocessingml.document.main+xml'));
 assert.equal(createHash('sha256').update(files['word/media/kalendars-1.png']).digest('hex'),createHash('sha256').update(image.bytes).digest('hex'));
 assert(xml.includes('w:w="16838" w:h="11906" w:orient="landscape"'));assert(xml.includes('29.02.2028'));assert(xml.includes(s.events[0].title));assert(xml.includes(s.notes));assert(xml.includes('Mūsu ģimene &amp; draugi'));
 assert(text(files,'word/settings.xml').includes('doNotAutoCompressPictures'));assert(text(files,'word/styles.xml').includes('lv-LV'));
 assert(!Object.values(files).some(value=>/TargetMode="External"|<w:object\b|<w:altChunk\b/.test(decode(value))));
 assert(!xml.includes('NaN'));s.includeAgenda=false;assert(!text(unzip(createDocx(s,[image])),'word/document.xml').includes('Notikumi un piezīmes'));
});

test('Excel has real typed dates, editable calendars, complete notes and safe literal user text',()=>{
 const s=initialState(2028);s.showHolidays=false;s.title='=HYPERLINK("https://example.invalid","Āboliņš")';s.notes='Pilnas piezīmes ģimenei. '.repeat(12);s.events=[{id:'personal',date:'2028-02-29',title:'=WEBSERVICE("https://example.invalid")',annual:false}];
 const files=unzip(createXlsx(s,[image])),workbook=text(files,'xl/workbook.xml'),calendar=text(files,'xl/worksheets/sheet1.xml'),events=text(files,'xl/worksheets/sheet2.xml'),notes=text(files,'xl/worksheets/sheet3.xml');
 assert(workbook.includes('Gada kalendārs'));assert(workbook.includes('Drukas dizains'));assert(workbook.includes('autoCompressPictures="0"'));
 assert.equal([...calendar.matchAll(/<c r="[A-Z]+\d+" s="(?:5|6|7|8)"[^>]*><v>/g)].length,366);
 assert(events.includes(`<v>${excelDate('2028-02-29')}</v>`));assert(events.includes('=WEBSERVICE'));assert(notes.includes(s.notes));assert(calendar.includes('horizontalDpi="600" verticalDpi="600"'));
 for(const [name,value] of Object.entries(files))if(name.endsWith('.xml'))assert(!/<f(?:\s|>)/.test(decode(value)),name+' must not interpret user text as a formula');
 assert.deepEqual(files['xl/media/kalendars-1.png'],image.bytes);assert(text(files,'xl/drawings/drawing1.xml').includes('cx="10692000" cy="7560000"'));
 const multiline=text(unzip(createXlsx({...s,notes:'Pirmā rinda\nOtrā rinda\nTrešā rinda'},[image])),'xl/worksheets/sheet3.xml');
 assert(multiline.includes('Pirmā rinda\nOtrā rinda\nTrešā rinda'));
 assert(Number(multiline.match(/<row r="6" ht="([\d.]+)"/)[1])>=44,'three explicit note lines must fit the visible row');
});

test('monthly office exports obey scope, Latvia year boundaries and leap-day recurrence',()=>{
 const s=initialState(2028);s.view='month';s.month=2;s.events=[{id:'leap',date:'2024-02-29',title:'Ģimenes svētki',annual:true},{id:'march',date:'2028-03-03',title:'Marta pasākums'}];
 assert.deepEqual(selectedEvents(s,'current',false).map(e=>e.title),['Ģimenes svētki']);
 assert.equal((text(unzip(createXlsx(s,[image])),'xl/workbook.xml').match(/<sheet /g)||[]).length,4);
 const all=unzip(createXlsx(s,Array(12).fill(image),{scope:'all'}));assert.equal((text(all,'xl/workbook.xml').match(/<sheet /g)||[]).length,15);
 assert(Object.keys(all).includes('xl/media/kalendars-12.png'));assert(text(all,'xl/worksheets/sheet13.xml').includes('Marta pasākums'));
 const word=text(unzip(createDocx(s,Array(12).fill(image),{scope:'all'})),'word/document.xml');assert.equal((word.match(/<wp:anchor /g)||[]).length,12);assert.equal((word.match(/<w:pageBreakBefore\/>/g)||[]).length,12);
});

test('the download pipeline returns matching real formats, packages multiple images and cancels without changing a project',async()=>{
 const state=initialState(2028),copy=structuredClone(state),calls=[];
 const raster=async(svg,s,mime)=>{calls.push({svg,mime,quality:s.quality});return {width:1,height:1,bytes:mime==='image/jpeg'?jpegDpi(JPEG,600):image.bytes};};
 for(const [format,mime] of [['pdf','application/pdf'],['docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],['xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],['jpg','image/jpeg'],['png','image/png'],['svg','image/svg+xml;charset=utf-8']]){
  const result=await makeExport(state,format,{raster});assert(result.name.endsWith('.'+format));assert.equal(result.blob.type,mime);assert(result.blob.size>20);
 }
 const monthly={...state,view:'month',month:2,includeAgenda:false};const result=await makeExport(monthly,'png',{scope:'all',raster});assert.equal(result.blob.type,'application/zip');assert.equal(result.pages,12);assert.equal(Object.keys(unzip(new Uint8Array(await result.blob.arrayBuffer()))).length,12);
 assert.equal(exportName({...monthly,title:'Ģimenes plāns 2028'}),'Gimenes-plans-2028-02');
 const controller=new AbortController();await assert.rejects(makeExport(monthly,'png',{scope:'all',signal:controller.signal,raster:async(...args)=>{controller.abort();return raster(...args);}}),error=>error.name==='AbortError');
 await assert.rejects(makeExport(state,'html',{raster}));assert.deepEqual(state,copy);assert(calls.every(c=>c.quality===600));
});

test('all six format controls use distinct native SVG illustrations and truthful Latvian descriptions',()=>{
 const html=fs.readFileSync('_includes/calendar-studio.html','utf8'),hashes=new Set();
 for(const format of ['pdf','docx','xlsx','jpg','png','svg']){
  assert(html.includes(`data-export="${format}"`));const svg=fs.readFileSync(`assets/studio/formats/${format}.svg`,'utf8');assert(svg.includes('<title>'));assert(!/<image\b|data:image/.test(svg));hashes.add(createHash('sha256').update(svg.split('</defs>')[1]).digest('hex'));
 }
 assert.equal(hashes.size,6);assert(html.includes('Word dokumentā kalendāra lapas ievietotas augstas izšķirtspējas attēlos'));assert(html.includes('Excel ietver rediģējamus datus'));
 const pipeline=fs.readFileSync('assets/studio/export-pipeline.mjs','utf8');assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon/.test(pipeline));assert(pipeline.includes('canvas.width=canvas.height=1'));
});
