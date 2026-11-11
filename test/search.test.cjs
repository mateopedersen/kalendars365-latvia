const assert=require('node:assert/strict'),fs=require('node:fs'),S=require('../assets/search-core.js');
const idx=S.prepare(JSON.parse(fs.readFileSync('assets/search-index.json')));
const cases=[['2028 februāris','/kalendars/2028/februaris/'],['kalendrs 2028','/kalendars/2028/'],['2027 kalendars','/kalendars/2027/'],['PDF 2027','/pdf-kalendari/2027/'],['saullēkts Rīga','/saullekts-saulriets/riga/'],['sunrise liepaja','/saullekts-saulriets/liepaja/'],['saulriets rigaa','/saullekts-saulriets/riga/'],['Jānis','/varda-dienas/?q=J%C4%81nis'],['Jannis','/varda-dienas/?q=J%C4%81nis'],['skolas brīvlaiki','/skolas-brivlaiki/'],['mainu grafiks','/mainu-grafiks/'],['datumu kalkulators','/datumu-kalkulators/'],['darba dienas 2027','/darba-dienu-kalendars/2027/'],['meness 2029 janvaris','/meness-kalendars/2029/janvaris/'],['18.11.2027','/kalendars/2027/novembris/?date=2027-11-18'],['2028-02-29','/kalendars/2028/februaris/?date=2028-02-29']];
for(const [q,url] of cases)assert.equal(S.search(idx,q,{year:2026}).results[0]?.url,url,q);
assert.equal(S.dateIntent('31.02.2028',2026),null);assert.equal(S.dateIntent('18 novembra 2027',2026).date,'2027-11-18');
assert.equal(S.search(idx,'zzzzqqqqq').total,0);assert.equal(S.search(idx,'').total,0);
for(const q of ['2027','2028 februaris','2029 PDF','2030 meness'])for(const r of S.search(idx,q).results)assert((r.title+' '+r.url).includes(q.match(/20\d{2}/)[0]),q);
const names=JSON.parse(fs.readFileSync('assets/calendar-data.json')).names;
const indexedNames=new Set(idx.filter(r=>r.kind==='Vārda diena').map(r=>r.title));
for(const n of names)assert(indexedNames.has(n.name),'Missing indexed name: '+n.name);
const samples=names.filter((n,i)=>i%71===0||['Jānis','Janis','Emīlija','Olivers','Daniēls'].includes(n.name));
for(const n of samples)assert(S.search(idx,n.name,{limit:5}).results.some(r=>r.title===n.name),n.name);
assert.equal(S.search(idx,'Janis').results[0].title,'Janis','A distinct exact spelling precedes accent-folded alternatives');
assert.equal(S.token('maiņu'),'mainu');assert.equal(S.token('mēneša'),'menesa');
console.log(`Search: ${cases.length} ranked intents, ${names.length} indexed names, ${samples.length} distributed name queries, strict years, dates, typos and diacritics passed.`);

assert(S.search(idx,'saullēkts Rīga').results.some(r=>r.family==='blog_article'),'Useful guides remain discoverable below the city tool');
assert.equal(S.search(idx,'Kāpēc saullēkts Rīgā un Liepājā nav vienā laikā').results[0].family,'blog_article');
