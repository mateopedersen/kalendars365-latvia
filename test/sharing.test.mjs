import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {shareServices,findShareServices} from '../assets/share-services.mjs';
import {safePublicUrl,safeShareImage,safeTemplateUrl,shareComposer,shareText,copyPayload} from '../assets/share-core.mjs';
import {qrcode} from '../assets/vendor/share-qrcode.mjs';
import {horoscopeShare,schoolBreakShare,universityShare} from '../assets/share-context.mjs';
import {createEdition,renderCollectionMarkup,renderDailyMarkup} from '../lib/horoscope-edition.mjs';
const service=id=>shareServices.find(s=>s.id===id);
const context={title:'Mēness kalendārs 2028. gada februārim',url:'https://kalendars365.lv/meness-kalendars/2028/februaris/',image:'https://kalendars365.lv/assets/test.jpg'};
test('55 distinct options, with explicit manual handoffs and Latvian discovery',()=>{
 assert.equal(shareServices.length,55);assert.equal(new Set(shareServices.map(s=>s.id)).size,55);
 assert.equal(shareServices.filter(s=>s.group!=='tools').length,48);
 assert.equal(findShareServices('draugiem')[0].id,'draugiem');assert.equal(findShareServices('kopet saiti')[0].id,'copy-link');
 assert.equal(findShareServices('whatsapp','social').length,0);assert.equal(findShareServices('whatsapp','messages').length,1);
 for(const id of ['instagram','tiktok','snapchat','signal','threads','teams']){assert.equal(service(id).method,'manual');assert.equal(shareComposer(service(id),context),null);}
 assert(!shareServices.some(s=>['pocket','skype'].includes(s.id)));
});
test('links disclose only supported public settings, never private fields or tracking',()=>{
 const u=new URL(safePublicUrl('http://127.0.0.1:4007/menesa-kalendars/?date=2028-02-29&view=week&event=SECRET&note=PRIVATE&token=KEY&utm_source=abc#secret'));
 assert.equal(u.origin,'https://kalendars365.lv');assert.equal(u.pathname,'/kalendars/2028/februaris/');assert.equal(u.search,'?date=2028-02-29&view=week');assert.equal(u.hash,'');
 const bad=new URL(safePublicUrl('https://foreign.test//evil.test/hi?date=2027-02-29&from=2028-13-01&year=2031&month=13&view=evil&city=\u003cscript\u003e'));
 assert.equal(bad.origin,'https://kalendars365.lv');assert.equal(bad.search,'');
 for(const input of ['javascript:alert(1)','data:text/html,hello','file:///tmp/a'])assert.throws(()=>safePublicUrl(input));
 assert.equal(new URL(safePublicUrl('/varda-dienas/?q=Mārtiņš')).searchParams.get('q'),'Mārtiņš');
 assert.equal(new URL(safePublicUrl('/varda-dienas/?q=private@example.com')).search,'');assert.equal(new URL(safePublicUrl('/horoskops/auns/?q=PRIVATE')).search,'');
});
test('calendar state survives month changes, leap days and yearly sharing',()=>{
 assert.equal(new URL(safePublicUrl('/',{date:'2028-02-29',view:'month',year:'2028',month:'2'})).pathname,'/kalendars/2028/februaris/');
 assert.equal(new URL(safePublicUrl('/',{date:'2030-12-01',view:'year',year:'2030',month:'12'})).pathname,'/kalendars/2030/');
 assert.equal(new URL(safePublicUrl('/nedelas-kalendars/',{date:'2028-01-01',view:'week'})).searchParams.get('date'),'2028-01-01');
 assert.equal(new URL(safePublicUrl('/',{date:'2026-11-11',view:'month'})).pathname,'/');
 assert.equal(new URL(safePublicUrl('/kalendars/2027/janvaris/',{date:'2028-02-29',view:'month',year:'2028',month:'2'})).pathname,'/kalendars/2028/februaris/');
});
test('each horoscope shares its own sign and displayed edition, including dynamically rendered archive days',()=>{
 const edition=createEdition(),markup=renderCollectionMarkup(edition);
 assert.equal((markup.match(/data-share-kind="horoscope"/g)||[]).length,12);
 const urls=new Set();
 for(const entry of Object.values(edition.entries)){
  const context=horoscopeShare(entry),url=new URL(context.url);urls.add(url.pathname);
  assert.equal(url.pathname,`/horoskops/${entry.slug}/`);assert.equal(url.searchParams.get('date'),entry.date);
  assert(context.title.includes(entry.genitive+' horoskops'));assert(markup.includes(`data-share-sign="${entry.slug}"`));
  const previous=new Date(entry.date+'T12:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);
  const earlier=createEdition(previous.toISOString().slice(0,10)),daily=renderDailyMarkup(earlier.entries[entry.slug],earlier.method);
  assert(daily.includes(`data-share-date="${earlier.date}"`));assert.equal((daily.match(/data-share-open/g)||[]).length,1);
 }
 assert.equal(urls.size,12);assert.throws(()=>horoscopeShare({slug:'wrong',date:edition.date}));
});
test('school sharing identifies the exact break and grade without carrying private or unrelated state',()=>{
 const winter={schoolYear:'2026-27',grade:'9',id:'winter',label:'Ziemas brīvdienas',start:'2026-12-21',end:'2027-01-01'};
 const context=schoolBreakShare(winter),url=new URL(context.url);
 assert.equal(url.pathname,'/skolas-brivlaiki/');assert.equal(url.search,'?macibu-gads=2026-27&klase=9');assert.equal(url.hash,'#brivlaiks-winter');
 assert(context.title.includes('9. klase'));assert(context.title.includes('21. decembris'));assert(context.title.includes('1. janvāris'));
 assert.notEqual(schoolBreakShare({...winter,id:'spring',label:'Pavasara brīvdienas',start:'2027-03-15',end:'2027-03-19'}).url,context.url);
 const dirty=new URL(safePublicUrl(context.url.replace('#','&note=PRIVATE&student=SECRET&utm_source=x#')));
 assert.equal(dirty.href,context.url);
 for(const change of [{grade:0},{grade:13},{grade:'PRIVATE'},{id:'private'},{start:'2027-02-29'},{end:'2026-12-01'},{path:'/other/'},{id:'summer',grade:9}])assert.throws(()=>schoolBreakShare({...winter,...change}));
 assert.equal(new URL(safePublicUrl('/privacy/?klase=9&macibu-gads=2026-27#brivlaiks-winter')).search,'');
 assert.equal(new URL(safePublicUrl('/skolas-brivlaiki/#PRIVATE')).hash,'');
});
test('university sharing preserves the institution and its specific published schedule',()=>{
 const context=universityShare({path:'/studiju-kalendars/',id:'lu',calendar:'lu-doctoral',institution:'Latvijas Universitāte',variant:'Doktorantūras skola'}),url=new URL(context.url);
 assert.equal(url.searchParams.get('augstskola'),'lu');assert.equal(url.searchParams.get('grafiks'),'lu-doctoral');assert.equal(url.hash,'#study-lu');assert(context.title.includes('Doktorantūras skola'));
 assert.equal(new URL(safePublicUrl('/skolas-brivlaiki/?augstskola=lu&grafiks=rtu#study-rtu')).searchParams.has('grafiks'),false);
 assert.throws(()=>universityShare({path:'/studiju-kalendars/',id:'lu',calendar:'rtu'}));
});
test('sharing is attached to subject controls rather than a universal floating counter',()=>{
 const include=fs.readFileSync('_includes/sharing.html','utf8'),entry=fs.readFileSync('assets/share-entry.js','utf8'),css=fs.readFileSync('assets/share-entry.css','utf8');
 assert(!include.includes('data-share-open'));assert(!include.includes('55'));assert(!css.includes('position:fixed'));assert(!css.includes('share-fab'));
 for(const file of ['_includes/app.html','_includes/collection-calendar.html','_includes/calendar-workbench.html'])assert(fs.readFileSync(file,'utf8').includes('include share-button.html'));
 assert(entry.includes('share-template-row'));assert(!entry.includes('share-template-button'));assert(!entry.includes('useful-actions'));assert(!entry.includes('v2-preview-downloads'));
});
test('download links preserve the exact selected file and reject third-party or executable assets',()=>{
 const input='/downloads/kalendars-2028-februaris-04.pdf?token=PRIVATE#x';
 assert.equal(safeTemplateUrl(input),'https://kalendars365.lv/downloads/kalendars-2028-februaris-04.pdf');
 assert.equal(safeShareImage('/assets/a.jpg?token=PRIVATE#x'),'https://kalendars365.lv/assets/a.jpg');
 for(const input of ['https://evil.test/downloads/a.pdf','/assets/a.pdf','/downloads/a.js','javascript:alert(1)'])assert.throws(()=>safeTemplateUrl(input));
 for(const input of ['https://evil.test/assets/a.jpg','/private/a.png','/assets/a.html'])assert.throws(()=>safeShareImage(input));
});
test('all direct composers carry the exact public link with Unicode correctly encoded',()=>{
 for(const s of shareServices.filter(s=>s.method==='direct')){
  const target=new URL(shareComposer(s,context)),values=[...target.searchParams.values()].join('\n');
  assert(['https:','mailto:'].includes(target.protocol),s.id);assert(values.includes(context.url),s.id);
  assert(!target.href.includes('127.0.0.1'));if(!['facebook','linkedin','line'].includes(s.id))assert(values.includes(context.title),s.id);
 }
 const long={...context,title:'Āboli 🍎 '.repeat(40)};const text=new URL(shareComposer(service('bluesky'),long)).searchParams.get('text');
 assert([...new Intl.Segmenter('lv',{granularity:'grapheme'}).segment(text)].length<=300);assert(text.endsWith(context.url));
 assert.equal(new URL(shareComposer(service('draugiem'),context)).searchParams.get('link'),context.url);
});
test('Mastodon accepts a domain and rejects script, credentials, ports, paths and IP hosts',()=>{
 assert.equal(new URL(shareComposer(service('mastodon'),context,'https://mastodon.social/')).hostname,'mastodon.social');
 for(const instance of ['javascript:alert(1)','https://user:pass@server.example','https://a.example/path','127.0.0.1','localhost','a..example','-a.example','server.example:443','foo.example?x=1'])assert.throws(()=>shareComposer(service('mastodon'),context,instance));
});
test('copied HTML and Markdown escape user-visible titles and keep actual file extensions',()=>{
 const c={...context,title:'<script>alert("x")</script> [test]',url:'https://kalendars365.lv/downloads/a(1).pdf'};
 const html=copyPayload('embed',c);assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(!html.includes('<iframe'));assert(html.includes('a(1).pdf'));
 assert(!copyPayload('markdown',c).includes('(1).pdf'));assert.equal(copyPayload('copy-link',context),context.url);assert.equal(copyPayload('copy-text',context),shareText(context));
});
test('QR payloads round-trip from actual pixels, including template links',async()=>{
 const {default:jsQR}=await import('../tooling/sharing/node_modules/jsqr/dist/jsQR.js');
 for(const url of [context.url,'https://kalendars365.lv/downloads/lunar/2030/decembris/04.pdf','https://kalendars365.lv/varda-dienas/?q=M%C4%81rti%C5%86%C5%A1']){
  const qr=qrcode(0,'M');qr.addData(url);qr.make();const scale=6,quiet=4,size=(qr.getModuleCount()+quiet*2)*scale,data=new Uint8ClampedArray(size*size*4);data.fill(255);
  for(let r=0;r<qr.getModuleCount();r++)for(let c=0;c<qr.getModuleCount();c++)if(qr.isDark(r,c))for(let y=0;y<scale;y++)for(let x=0;x<scale;x++){const i=(((r+quiet)*scale+y)*size+(c+quiet)*scale+x)*4;data[i]=data[i+1]=data[i+2]=0;}
  assert.equal(jsQR(data,size,size).data,url);assert(qr.createSvgTag({cellSize:6,margin:24,scalable:true}).includes('viewBox'));
 }
});
test('every sprite symbol is distinct and dependency license hashes remain bound',()=>{
 const sprite=fs.readFileSync('assets/share-icons.svg','utf8'),art=JSON.parse(fs.readFileSync('_data/share-art.json'));
 for(const s of shareServices)assert.equal(sprite.split(`id="s-${s.id}"`).length,2,s.id);
 const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 assert.equal(art.spriteSha256,sha('assets/share-icons.svg'));assert.equal(art.qr.sha256,sha('assets/vendor/share-qrcode.mjs'));assert.equal(art.qr.license,'MIT');assert(fs.existsSync('assets/vendor/share-icons.LICENSE.txt'));
});
test('initial page load is small and defers the modal, catalog, social composers and QR library',()=>{
 assert(fs.statSync('assets/share-entry.js').size<4500);assert(fs.statSync('assets/share-entry.css').size<4000);
 const entry=fs.readFileSync('assets/share-entry.js','utf8'),module=fs.readFileSync('assets/share-dialog.mjs','utf8');
 assert(entry.includes("import('/assets/share-dialog.mjs"));assert(!entry.includes('share-pages.json'));assert(module.includes("import('./vendor/share-qrcode.mjs"));
 for(const code of [entry,module,fs.readFileSync('assets/share-poster.mjs','utf8')])assert(!/localStorage|eventsForDate|noteForDate|getState\(/.test(code));
 assert(fs.readFileSync('assets/share-entry.css','utf8').includes('@media print'));assert(fs.readFileSync('_layouts/default.html','utf8').includes('include sharing.html'));
});
