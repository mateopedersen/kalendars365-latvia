const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),S=require('../assets/search-core.js');
const source=JSON.parse(fs.readFileSync('assets/search-index.json')),index=S.prepare(source);
const queries=[
 ['lūdzu '.repeat(35)+'2028 gada februara kalendaru PDF','/pdf-kalendari/2028/februaris/'],['pd','/pdf-kalendari/'],['sk','/skolas-brivlaiki/'],['ho','/horoskops/'],['rig','/saullekts-saulriets/riga/'],['2028 jan','/kalendars/2028/janvaris/'],
 ['kur var lejupielādēt bezmaksas ģimenes nedēļas plānu','/gimenes-kalendars/'],
 ['kā aprēķināt savu ascendenta zīmi pēc dzimšanas laika un vietas','/horoskopa-zimes-kalkulators/'],
 ['man vajag 2028 gada februara kalendaru PDF','/pdf-kalendari/2028/februaris/'],
 ['cik darba dienu ir 2028. gada februārī','/darba-dienu-kalendars/2028/februaris/'],
 ['2030. gada 19. nedēļa','/nedelas-kalendars/2030/19/'],['2029. gada 21. nedēļa','/nedelas-kalendars/2029/21/']
];
test('short prefixes and natural Latvian questions rank the intended page first',()=>{for(const [query,url] of queries)assert.equal(S.search(index,query,{year:2026}).results[0]?.url,url,query);});
test('every content page is discoverable by its own title',()=>{for(const page of source.filter(r=>r.family))assert(S.search(index,page.title,{limit:20}).results.some(r=>r.url===page.url),page.url);});
test('every indexed Latvian name retains its exact spelling and destination',()=>{for(const name of source.filter(r=>r.kind==='Vārda diena'))assert(S.search(index,name.title,{limit:5}).results.some(r=>r.url===name.url),name.title);});
test('Latvian name inflections still lead to the real calendar name',()=>{for(const query of ['kad ir Jānim vārda diena','Jāņa vārda diena'])assert(S.search(index,query,{limit:5}).results.some(r=>r.title==='Jānis'),query);assert(S.search(index,'Annas vārda diena',{limit:5}).results.some(r=>r.title==='Anna'));});
test('explicit years and months never leak unrelated monthly destinations from article prose',()=>{
 for(const query of ['cik darba dienu ir 2028. gada februārī','man vajag 2028 gada februara kalendaru PDF'])for(const row of S.search(index,query,{limit:7000}).results){assert((row.title+' '+row.url).includes('2028'));const scoped=row.url.match(/\/(janvaris|februaris|marts|aprilis|maijs|junijs|julijs|augusts|septembris|oktobris|novembris|decembris)\//);if(scoped)assert.equal(scoped[1],'februaris',row.url);}
});
test('article body words are searchable; unrelated phrases and invalid dates do not invent exact results',()=>{
 const small=S.prepare([{url:'/raksts/',title:'Dārza pieraksti',content:'Permakultūra komposts siltumnīca.'},{url:'/cits/',title:'Pulkstenis',description:'Pašreizējais laiks'}]);
 assert.equal(S.search(small,'permakultūra komposts').results[0].url,'/raksts/');assert.equal(S.search(small,'permakultura komposts').results[0].url,'/raksts/');
 assert.equal(S.search(index,'zzzzqqqqq').total,0);assert.equal(S.search(index,'31.02.2028').results.some(r=>r.kind==='Datums'),false);
 assert(source.filter(r=>r.family==='blog_article').every(r=>r.content.length>2000),'Complete articles must be indexed, not descriptions alone');
});
test('result pagination can reach all matches without duplicate destinations or a fixed 500-item ceiling',()=>{
 const all=S.search(index,'diena',{limit:10000});assert(all.total>500);assert.equal(all.results.length,all.total);assert.equal(new Set(all.results.map(r=>r.url)).size,all.total);
 const fixture=S.prepare([{url:'/a/',title:'Ģimenes kalendārs',content:'nedēļas plāns'},{url:'/b/',title:'Darba laiks'}]);const related=S.search(fixture,'gimenes kalendars nedelas zzzzqqqq');assert.equal(related.related,true);assert.equal(related.results[0].url,'/a/');
});
