const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const G=require('../assets/garden-core.js'),data=require('../_data/garden-crops.json'),crops=data.crops.map(G.resolveCrop);
const get=id=>crops.find(c=>c.id===id);
test('Latvia spring, autumn and harvest actions survive the shared resolver',()=>{
 assert.equal(crops.length,16);assert.ok(G.matchingActions(get('spinati'),{month:4,task:'sow'}).length);assert.ok(G.matchingActions(get('spinati'),{month:9,task:'sow'}).length);
 assert.ok(G.matchingActions(get('burkani'),{month:9,task:'harvest'}).length);assert.equal(G.matchingActions(get('burkani'),{month:1,task:'sow'}).length,0);
 assert.ok(G.matchingActions(get('kiploki'),{month:10,task:'plant'}).length);assert.ok(get('kiploki').actions.some(a=>a.task==='harvest'&&a.condition.includes('iepriekšējā')));
 assert.equal(G.matchingActions(get('tomati'),{task:'harvest'}).length,0);assert.equal(data.crops.find(c=>c.id==='tomati').harvest.daysFromSowing,null);
});
test('month, work and cultivation must match the same action',()=>{
 assert.equal(G.matches(get('salati'),{month:1,place:'field',task:'sow'}),false);
 assert.equal(G.matches(get('salati'),{month:1,place:'greenhouse',task:'sow'}),true);
 assert.equal(G.matches(get('salati'),{month:12,place:'greenhouse',task:'harvest'}),true);
 assert.equal(G.matches(get('salati'),{month:12,place:'field',task:'harvest'}),false);
 assert.equal(G.matches(get('burkani'),{query:'burkani'}),true);
 for(const crop of crops)for(const action of crop.actions){assert.ok(['sow','plant','harvest'].includes(action.task));assert.ok(action.sourceIds.length);for(const id of action.sourceIds)assert.ok(data.sources.some(s=>s.id===id));for(const month of action.months)assert.ok(month>=1&&month<=12);}
});
const item={id:'example',cropId:'burkani',cropName:'Burkāni',note:'Dobe 1, šķirne; pārbaude',date:'2028-02-29',task:'sow',place:'Atklātā laukā',region:'Vidzeme'};
test('backup merge preserves existing notes and never duplicates repeated imports',()=>{
 const a={saved:['burkani'],reminders:[item],place:item.place,region:item.region};
 const b={...a,saved:['tomati'],reminders:[{...item,date:'2028-03-01'}]};
 const merged=G.merge(a,G.parseBackup(G.backup(b)));assert.equal(merged.reminders.length,2);assert.equal(new Set(merged.reminders.map(r=>r.id)).size,2);assert.equal(G.merge(merged,b).reminders.length,2);assert.deepEqual(merged.saved,['burkani','tomati']);
 assert.throws(()=>G.parseBackup('{"schema":"other"}'));assert.throws(()=>G.reminder({...item,date:'2027-02-29'}));assert.throws(()=>G.parseBackup(G.backup(a).replace('2028-02-29','2028-02-30')));
});
test('ICS uses exclusive all-day endings, UTF-8 folding and safe literal notes',()=>{
 const text=G.ics({saved:[],reminders:[{...item,note:'Šķirne; '+('pārbaude '.repeat(10))+'\nBEGIN:VEVENT'}],place:item.place,region:item.region},new Date('2026-11-10T12:00:00Z'));
 assert.ok(text.includes('DTSTART;VALUE=DATE:20280229\r\n'));assert.ok(text.includes('DTEND;VALUE=DATE:20280301\r\n'));assert.equal((text.match(/\r\nBEGIN:VEVENT\r\n/g)||[]).length,1);for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
});
test('16 real reviewed photo sources and derivatives keep checksums and credits',()=>{
 const photos=require('../_data/garden-photos.json').photos;assert.equal(photos.length,16);
 for(const photo of photos){assert.equal(photo.visualReview.sourceSha256,photo.sourceSha256);assert.ok(photo.author&&photo.sourceUrl&&photo.license);assert.equal(crypto.createHash('sha256').update(fs.readFileSync('.'+photo.sourceFile)).digest('hex'),photo.sourceSha256);for(const file of photo.files)assert.equal(fs.statSync('.'+file.src).size,file.bytes);}
 assert.ok(photos.reduce((sum,p)=>sum+p.files[0].bytes,0)<300000);
});
test('garden hub, all monthly pages and crop profiles have the shared working experience',()=>{
 const manifest=require('../docs/route-manifest.json'),pages=manifest.filter(r=>r.family==='garden'||r.family==='garden_month');assert.equal(pages.length,29);
 for(const page of pages){const html=fs.readFileSync('_site'+page.url+'index.html','utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.ok(html.includes('garden-core.js?v='));if(page.family==='garden_month'||page.url==='/sejas-kalendars/'){assert.equal((html.match(/data-g-season-row="/g)||[]).length,16);assert.ok(html.includes('data-garden-import')&&html.includes('data-garden-task'));}}
});
