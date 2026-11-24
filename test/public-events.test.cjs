const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const {publicEventsForDate,publicEventMarkup}=require('../assets/app.js');
const source=JSON.parse(fs.readFileSync('_data/event-guides.json')).guides;
const records=source.filter(g=>!g.pending).map(g=>({id:'public-'+g.slug,title:g.title,date:g.start,end:g.end||g.start,url:g.url,place:g.place,schedule:g.time}));
test('confirmed festival dates appear from first through final day without changing holiday status',()=>{
 const first=publicEventsForDate(records,'2026-11-27');assert(first.some(e=>e.url.includes('melna-piektdiena')));assert(first.some(e=>e.url.includes('ziemassvetku-tirdzins')));assert(first.every(e=>e.publicEvent&&e.readonly&&e.dayOff===false));
 const last=publicEventsForDate(records,'2027-01-03');assert(last.some(e=>e.url.includes('ziemassvetku-tirdzins')&&e.continuation));assert(!publicEventsForDate(records,'2027-01-04').some(e=>e.url.includes('ziemassvetku-tirdzins')));
 assert(publicEventsForDate(records,'2026-11-30').some(e=>e.url.includes('kiberpirmdiena')));
 assert(!records.some(e=>/muzeju-nakts|zinatnieku-nakts|legendu-nakts|senas-uguns-nakts/.test(e.url)));
});
test('public event cards link to the guide and safely show the full date range',()=>{
 const event=publicEventsForDate(records,'2027-01-03').find(e=>e.url.includes('ziemassvetku-tirdzins'));
 const markup=publicEventMarkup(event);assert(markup.includes('Turpinās'));assert(markup.includes('2027'));assert(markup.includes(event.url));assert(!markup.includes('data-edit-event'));
 assert.equal(publicEventsForDate([{...event,url:'javascript:alert(1)'}],'2027-01-03').length,0);
 assert.equal(publicEventsForDate(records,'2027-02-30').length,0);
});
test('published runtime and server rendering use the same confirmed event collection',()=>{
 const data=JSON.parse(fs.readFileSync('assets/calendar-summary.json'));
 assert.equal(data.publicEvents.length,records.length+1);assert(data.publicEvents.some(e=>e.id==='public-staro-riga'));for(const g of records)assert(data.publicEvents.some(e=>e.id===g.id&&e.date===g.date&&e.end===g.end));
 const snapshots=JSON.parse(fs.readFileSync('_data/calendar-ssr.json')).pages;
 assert(snapshots['/kalendars/2027/janvaris/'].dayMarkup.includes('/pasakumi/ziemassvetku-tirdzins-riga/'));
});

test('month grids show official holidays while the day plan keeps public events',()=>{
 const snapshots=JSON.parse(fs.readFileSync('_data/calendar-ssr.json')).pages;
 const january=snapshots['/kalendars/2027/janvaris/'];
 const november=snapshots['/kalendars/2027/novembris/'];
 assert.match(january.markup,/Jaungada diena/);
 assert.doesNotMatch(january.markup,/Ziemassvētku tirdziņš/);
 assert.match(january.dayMarkup,/Ziemassvētku tirdziņš/);
 assert.match(november.markup,/Latvijas Republikas Proklamēšanas diena/);
 assert.doesNotMatch(november.markup,/Lāčplēša diena|Robežsargu diena/);
});

test('homepage selects ongoing events first and advances automatically using Riga dates',()=>{
 const {selectUpcoming,rigaParts}=require('../assets/upcoming-events.js');
 const events=[{id:'past',start:'2026-11-11',end:'2026-11-11'},{id:'staro',start:'2026-11-15',end:'2026-11-18',endTime:'23:00'},{id:'xmas',start:'2026-11-27',end:'2027-01-03'},{id:'black',start:'2026-11-27',end:'2026-11-27'},{id:'cyber',start:'2026-11-30',end:'2026-11-30'}];
 let list=selectUpcoming(events,new Date('2026-11-15T18:00:00Z'));assert.equal(list[0].id,'staro');assert.equal(list[0].status,'Turpinās');assert(!list.some(e=>e.id==='past'));
 list=selectUpcoming(events,new Date('2026-11-18T21:01:00Z'));assert(!list.some(e=>e.id==='staro'));
 list=selectUpcoming(events,new Date('2026-11-28T12:00:00Z'));assert.equal(list[0].id,'xmas');assert(!list.some(e=>e.id==='black'));
 assert.equal(rigaParts(new Date('2026-11-26T22:30:00Z')).day,'2026-11-27');
 assert.deepEqual(selectUpcoming(events,new Date('2027-01-04T12:00:00Z')),[]);
});


test('event calendar is read-only, separately filterable and never offered as a personal category',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');assert(app.includes("event:{label:'Pasākumi'"));assert(app.includes("!['holiday','event'].includes(k)"));assert(app.includes("!e.publicEvent&&e.time"));
 const upcoming=JSON.parse(fs.readFileSync('assets/upcoming-events.json'));assert.equal(upcoming.timeZone,'Europe/Riga');assert.equal(upcoming.events.length,17);assert(upcoming.events.some(e=>e.id==='staro-riga'));
});

test('homepage preview is linked to the registered confirmed guide catalog',()=>{
 const data=JSON.parse(fs.readFileSync('assets/upcoming-events.json'));
 const urls=new Set(JSON.parse(fs.readFileSync('_data/routes.json')).map(r=>r['URL path']));
 for(const e of data.events){assert(urls.has(e.url));assert(fs.existsSync('.'+e.image));assert(e.imageAlt);assert(e.imageCaption);}
 const html=fs.readFileSync('_site/index.html','utf8');assert(html.includes('data-upcoming-events'));assert(html.includes('data-upcoming-list'));assert(html.includes('/assets/upcoming-events.js'));
});
