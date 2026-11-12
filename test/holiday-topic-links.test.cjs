const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {holidayTopicURL,holidayTitleMarkup}=require('../assets/app.js');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('assets/calendar-summary.json');
const occasions=read('_data/occasions.json');
const records=data.holidays.filter(r=>r.date>='2027-01-01'&&r.date<='2030-12-31');
const slugs=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'",'&#39;');
const expected=record=>{
 const matches=occasions.filter(a=>a.verified&&a.dates.some(d=>d.date===record.date&&d.title===record.title));
 assert.equal(matches.length,1,record.date+' '+record.title);
 return '/svetki-un-tradicijas/'+matches[0].slug+'/#datums-'+record.date;
};

test('every 2027–2030 holiday record reaches its exact article date, with a real photograph and primary sources',()=>{
 assert.equal(records.length,197);
 const checked=new Set();
 for(const record of records){
  const target=expected(record);assert.equal(holidayTopicURL(record,data.holidayTopics),target);
  const [path,fragment]=target.split('#'),html=fs.readFileSync('_site'+path+'index.html','utf8');
  assert.equal((html.match(new RegExp('id="'+fragment+'"','g'))||[]).length,1,target);
  assert(html.includes('datetime="'+record.date+'"'),target);
  if(checked.has(path))continue;checked.add(path);
  const hero=html.match(/<header class="page-heading tradition-photo-hero"[\s\S]*?<\/header>/)?.[0];
  assert(hero,path);assert.match(hero,/<img[^>]*src="\/assets\/[^"?]+\.webp/);
  const image=hero.match(/<img[^>]*src="([^"?]+)/)?.[1];assert(fs.statSync('_site'+image).size>0,path+' photograph');
  assert(html.includes('data-tradition-sources'),path+' source links');
  assert(html.includes('data-tradition-related'),path+' related reading');
  assert.match(html,/<section[^>]*data-tradition-sources[\s\S]*?href="https:\/\//);
 }
 assert(checked.size>40);
 const coincident=records.filter(r=>r.date==='2029-06-17');assert.equal(coincident.length,2);
 assert.equal(new Set(coincident.map(r=>holidayTopicURL(r,data.holidayTopics))).size,2);
});

test('all 60 annual, holiday and remembrance tables expose date and title links without changing labels or status',()=>{
 const routes=read('_data/routes.json').filter(r=>['year','holiday_year','holiday_month','memorial_year'].includes(r['Page family']));
 assert.equal(routes.length,60);let linkedRows=0;
 for(const route of routes){
  const year=Number(route.Year),family=route['Page family'],month=family==='holiday_month'?slugs.indexOf(route['URL path'].split('/').filter(Boolean).at(-1))+1:null;
  const selected=records.filter(r=>r.date.startsWith(String(year))&&(!month||Number(r.date.slice(5,7))===month)&&(family!=='memorial_year'||!r.dayOff));
  const html=fs.readFileSync('_site'+route['URL path']+'index.html','utf8'),table=html.match(/<table class="data-table holiday-topic-table">([\s\S]*?)<\/table>/)?.[1];
  assert(table,route['URL path']);const rows=[...table.matchAll(/<tr data-holiday-date="([^"]+)">([\s\S]*?)<\/tr>/g)];assert.equal(rows.length,selected.length,route['URL path']);
  rows.forEach((row,index)=>{
   const record=selected[index],target=expected(record);assert.equal(row[1],record.date);
   assert.equal((row[2].match(new RegExp('href="'+target+'"','g'))||[]).length,2,route['URL path']+' '+record.title);
   assert(row[2].includes('<span>'+escape(record.title)+'</span>'));linkedRows++;
  });
 }
 assert(linkedRows>700);
});

test('calendar day details use the same story links, while unknown and unsafe destinations remain escaped text',()=>{
 const snapshots=read('_data/calendar-ssr.json').pages;
 let links=0;for(const page of Object.values(snapshots)){links+=(page.dayMarkup.match(/class="holiday-story-link"/g)||[]).length;}
 assert(links>25);
 assert.equal(holidayTopicURL({title:'Unknown',date:'2029-01-01'},data.holidayTopics),null);
 assert.equal(holidayTopicURL({title:'Unknown'},null),null);
 for(const url of ['javascript:alert(1)','//evil.example/a/','https://evil.example/','/svetki-un-tradicijas/../']){
  assert.equal(holidayTitleMarkup({title:'<script>x</script>'},{'<script>x</script>':{url,dates:[]}}),'&lt;script&gt;x&lt;/script&gt;');
 }
 const record=records.find(r=>r.title==='Vasarsvētki'&&r.date.startsWith('2029'));
 assert(holidayTitleMarkup(record,data.holidayTopics).includes('href="'+expected(record)+'"'));
 assert.equal(holidayTopicURL({...record,date:'2031-06-01'},data.holidayTopics),'/svetki-un-tradicijas/vasarsvetki/#datumi');
});
