(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.K365Search=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const months=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const monthRoots=['janvar','februar','mart','april','maij','junij','julij','august','septembr','oktobr','novembr','decembr'];
const groups={kalendars:['kalend','calendar'],saullekts:['saullek','sunrise'],saulriets:['saulriet','sunset'],meness:['meness','moon','lunar'],svetki:['svetk','holiday','holidays'],brivlaiks:['brivlaik','vacation'],brivdiena:['brivdien','weekend'],skola:['skol','school'],darbs:['darb','work'],vards:['vard','name','names'],diena:['dien'],seja:['seja','sejas','setven','plant','garden','darza','darzs','stadis'],pdf:['pdf','druk','print','download','lejupiel'],attels:['attel','image','webp','jpg','jpeg','png'],horoskops:['horoskop','zodiac'],nedela:['nedel','week'],gads:['gada','gads','gadi','year'],aprekin:['kalkulator','calculator','aprekin'],gimene:['gimen','family'],plans:['plan'],ascendents:['ascend','uzlecos','rising'],dzimsana:['dzimsan','birth'],laiks:['laik','time'],vieta:['vieta','vietas','vietu','place'],atvalinajums:['atvalin'],bezmaksas:['bezmaks','free'],zime:['zime','zimi','zimes']};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// A bounded single-edit comparison also recognises one adjacent transposition.
function near(a,b){
 if(a===b)return true;if(a.length<4||b.length<4||Math.abs(a.length-b.length)>1||/\d/.test(a+b))return false;
 if(a.length===b.length){let first=-1,second=-1;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){if(first<0)first=i;else if(second<0)second=i;else return false;}return second<0||second===first+1&&a[first]===b[second]&&a[second]===b[first];}
 if(a.length>b.length)[a,b]=[b,a];let i=0,j=0,skipped=false;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;}else{if(skipped)return false;skipped=true;j++;}}return true;
}
const tokenCache=new Map(),monthPatterns=monthRoots.map(root=>new RegExp('^'+root+'(?:is|s|a|i|im|am|u)?$'));
function token(s){s=normalize(s);if(tokenCache.has(s))return tokenCache.get(s);const result=canonicalToken(s);tokenCache.set(s,result);return result;}
function canonicalToken(s){for(let i=0;i<12;i++)if(monthPatterns[i].test(s))return months[i];for(const [key,list] of Object.entries(groups))if(list.some(p=>s===p||p.length>=4&&s.startsWith(p)))return key;if(s.length>=6&&near(s,'kalendars'))return 'kalendars';return s;}
const rawWords=s=>normalize(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const words=s=>rawWords(s).map(token);
const stop=new Set(['kad','ir','un','vai','ka','the','in','latvija','latvijas','latvia','gads','man','par','ar','kur','es','var','varu','cik','ko','to','tas','ta','no','uz','pie','pec','lidz','savu','sava','savas','savs','savi','saviem','mans','mana','mani','mus','velos','veletos','vajag','vajadzigs','vajadziga','atrast','atrod','mekleju','meklet','apskatit','uzzinat','luudzu','ludzu','atvert','butu','kads','kada','kadi','kadas','sis','so','saja','sai','viena','vieni']);
const compiled=new WeakMap();
function nameForms(name){
 const n=normalize(name);if(!/^[a-z]+$/.test(n))return[];
 if(n.endsWith('is'))return['a','im','i'].map(ending=>n.slice(0,-2)+ending);
 if(n.endsWith('s'))return['a','am','u'].map(ending=>n.slice(0,-1)+ending);
 if(n.endsWith('a'))return['as','ai','u'].map(ending=>n.slice(0,-1)+ending);
 if(n.endsWith('e'))return['es','ei','i'].map(ending=>n.slice(0,-1)+ending);
 return[];
}
function prepare(index){
 const rows=index.map(r=>({...r,_title:words(r.title),_keys:words(r.keywords||''),_body:words(r.description||''),_url:words(r.url),_years:[...new Set((r.title+' '+r.url).match(/(?:19|20|21)\d{2}/g)||[])]}));
 const postings=new Map();
 rows.forEach((r,id)=>{
  const terms=new Map();for(const [field,weight] of [[r._title,60],[r._keys,42],[words(r.headings),30],[r._body,12],[r._url,14],[words(r.content),5]])for(const word of field)terms.set(word,Math.max(terms.get(word)||0,weight));
  r._nameForms=r.kind==='Vārda diena'?nameForms(r.title).map(token):[];for(const form of r._nameForms)if(!terms.has(form))terms.set(form,52);
  r._terms=terms;for(const [word,weight] of terms){if(!postings.has(word))postings.set(word,new Map());postings.get(word).set(id,weight);}
 });
 compiled.set(rows,{postings,vocabulary:[...postings.keys()],byLength:new Map()});
 const data=compiled.get(rows);for(const word of data.vocabulary){if(!data.byLength.has(word.length))data.byLength.set(word.length,[]);data.byLength.get(word.length).push(word);}
 return rows;
}
function dateIntent(query,year){
 const q=normalize(query).trim();let y,m,d,match=q.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
 if(match)[,y,m,d]=match;else if(match=q.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?\.?$/)){[,d,m,y]=match;y=y||year;}
 else{const parts=q.replace(/[.,]/g,' ').split(/\s+/),mi=parts.findIndex(x=>months.includes(token(x)));if(mi>=0){m=months.indexOf(token(parts[mi]))+1;d=parts.find(x=>/^\d{1,2}$/.test(x));y=parts.find(x=>/^20\d{2}$/.test(x))||year;}}
 if(!d||!m||!y)return null;const date=new Date(Date.UTC(+y,+m-1,+d));if(date.getUTCFullYear()!==+y||date.getUTCMonth()!==+m-1||date.getUTCDate()!==+d||+y<2026||+y>2030)return null;
 return{year:+y,month:+m,day:+d,date:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`};
}
function matchesFor(term,data){
 const hits=new Map(),add=(word,factor)=>{for(const [id,weight] of data.postings.get(word)||[])hits.set(id,Math.max(hits.get(id)||0,weight*factor));};
 add(term,1);
 // One/two-letter inputs are real prefixes, never fuzzy guesses.
 if(!/^\d+$/.test(term))for(const word of data.vocabulary)if(word!==term&&word.startsWith(term))add(word,term.length<3?.68:.78);
 if(!hits.size&&term.length>=4&&!/\d/.test(term))for(let n=term.length-1;n<=term.length+1;n++)for(const word of data.byLength.get(n)||[])if(near(term,word))add(word,.55);
 return hits;
}
function search(index,query,options={}){
 const q=String(query||'').trim().slice(0,500),folded=normalize(q),allTokens=[...new Set(words(q))],meaningful=allTokens.filter(x=>!stop.has(x)),tokens=meaningful.length?meaningful:allTokens;
 if(!tokens.length)return{results:[],total:0,related:false};
 const rows=compiled.has(index)?index:prepare(index),data=compiled.get(rows),year=options.year||new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Europe/Riga'}).format(new Date());
 const terms=tokens.slice(0,64),years=terms.filter(t=>/^(?:19|20|21)\d{2}$/.test(t));
 const requestedMonths=months.filter(m=>terms.some(t=>t===m||t.length>=3&&m.startsWith(t))),month=requestedMonths.length===1?requestedMonths[0]:null;
 const scores=new Map();
 for(const term of terms){
  let hits;if(years.includes(term)){hits=new Map();rows.forEach((r,id)=>{if(r._years.includes(term))hits.set(id,85);});}
  else if(/^(?:19|20|21)\d$/.test(term)){hits=new Map();rows.forEach((r,id)=>{if(r._years.some(y=>y.startsWith(term)))hits.set(id,45);});}
  else hits=matchesFor(term,data);
  for(const [id,score] of hits){const item=scores.get(id)||{score:0,count:0,strong:0};item.score+=score;item.count++;if(score>=28)item.strong++;scores.set(id,item);}
 }
 const exact=[],related=[];
 for(const [id,match] of scores){
  const r=rows[id];if(years.some(y=>!r._years.includes(y)))continue;
  if(month&&r._url.some(t=>months.includes(t))&&!r._url.includes(month))continue;
  const isExact=match.count===terms.length;
  if(!isExact&&(terms.length<4||match.count<Math.ceil(terms.length*.75)||match.strong<2||month&&!r._terms.has(month)))continue;
  let score=match.score,title=normalize(r.title),short=terms.length===1;
  if(title===folded)score+=245;else if(title.includes(folded))score+=45;
  if(r.title.normalize('NFC').toLocaleLowerCase('lv')===q.normalize('NFC').toLocaleLowerCase('lv'))score+=125;
  if(!years.length&&r._years.length)score-=10;
  if(years.length&&years.some(y=>r.url.includes('/'+y+'/')))score+=20;
  if(month&&r.url.includes('/'+month+'/'))score+=45;
  if(!month&&r._url.some(t=>months.includes(t)))score-=45;
  score-=r._title.length*.75;score-=Math.min(15,r.url.split('/').length-2)*2;
  if(r.family==='blog_article'&&!terms.some(t=>['blog','blogs','raksts','raksti','rakstu'].includes(t)))score-=45;
  if(r.kind==='Vārda diena'){if(short&&(r._title[0]===terms[0]||near(r._title[0]||'',terms[0])))score+=100;else if(short)score-=35;}
  if(r.kind==='Vārda diena'&&terms.includes('vards')&&terms.some(t=>r._title.includes(t)||r._nameForms.includes(t)))score+=90;
  if(r.nameKind==='traditional')score+=5;
  if(short&&r.family==='hub')score+=18;
  if(terms.includes('pdf')&&/^print_/.test(r.family||''))score+=55;
  if(terms.includes('darbs')&&/^work_/.test(r.family||''))score+=30;
  if(years.length&&month&&r.family==='calendar_month'&&!terms.some(t=>['meness','pdf','darbs','svetki','vards'].includes(t)))score+=35;
  (isExact?exact:related).push({...r,score});
 }
 const date=dateIntent(q,year);if(date)exact.push({url:date.year<2027?`/?date=${date.date}&view=month`:`/kalendars/${date.year}/${months[date.month-1]}/?date=${date.date}`,title:new Intl.DateTimeFormat('lv-LV',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date.date+'T12:00:00Z')),description:'Atvērt šo dienu kalendārā.',kind:'Datums',score:1000});
 const found=exact.length?exact:related;found.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'lv'));
 const seen=new Set(),unique=found.filter(r=>{if(seen.has(r.url))return false;seen.add(r.url);return true;});
 return{results:unique.slice(0,Math.max(1,Math.min(rows.length+1,options.limit||40))),total:unique.length,related:!exact.length&&!!related.length};
}
return{normalize,token,near,prepare,search,dateIntent};
});
