(function(root){
'use strict';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validDate(s){if(!/^20\d\d-\d\d-\d\d$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s&&d.getUTCFullYear()>=2026&&d.getUTCFullYear()<=2030;}
function inPeriod(date,start,end){const md=date.slice(5);return start<=end?md>=start&&md<=end:md>=start||md<=end;}
function following(s){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
function result(data,date,speciesId,waterId){
 if(!validDate(date))throw Error('Izvēlies derīgu datumu no 2026. līdz 2030. gadam.');
 const f=data.fish.find(f=>f.id===speciesId);if(!f)throw Error('Izvēlies zivju sugu.');
 const w=data.waters.find(w=>w.id===waterId);const closed=!!f.start&&inPeriod(date,f.start,f.end),md=date.slice(5),notes=[];let blocked=closed;
 if(f.start)notes.push('Valsts sugas liegums: '+f.start.slice(3)+'.'+f.start.slice(0,2)+'.–'+f.end.slice(3)+'.'+f.end.slice(0,2)+'. Pirmā diena pēc tā: '+f.opening.slice(3)+'.'+f.opening.slice(0,2)+'.');
 if(closed)notes.push('Šo sugu šajā datumā nedrīkst paturēt lomā. Nejauši noķertu zivi saudzīgi un nekavējoties atlaid.');
 if(inPeriod(date,'03-01','04-30'))notes.push('Iekšējos ūdeņos ir spēkā valsts makšķerēšanas liegums no laivām un citiem peldošiem līdzekļiem, kā arī zivju ēsmas liegums. Norādītajos kanālos un caurtecēs aizliegta pati makšķerēšana.');
 if(w){
  notes.push(w.detail);
  if(w.id==='aluksne'){
   const boats=md>='05-10'||md<='02-28';if(!boats)notes.push('Šajā datumā Alūksnes ezerā no laivas makšķerēt nedrīkst: vietējā sezona ir 10. maijs–28. februāris.');
   if(md>='05-01'&&md<='05-31'&&f.id==='lidaka')notes.push('Maijā līdaku paturēšanai vajadzīga īpašā vienas dienas maija licence; parastā vai bezmaksas krasta licence to neaizstāj.');
   if(md>='05-10'&&md<='06-30')notes.push('Alūksnē šajā periodā aizliegta velcēšana un dabīgu ēsmas zivju vai to daļu izmantošana.');
  }
  if(w.id==='burtnieks'&&inPeriod(date,'05-01','06-15'))notes.push('Burtnieka piecās uzskaitītajās nārsta vietās pašlaik aizliegta makšķerēšana. Izvēlies atļautu ezera daļu pēc oficiālās kartes.');
  if(w.id==='usma'&&date.slice(0,4)>'2030')notes.push('Pārbaudi jaunāko Usmas nolikumu.');
  if(w.id==='liepaja'&&inPeriod(date,'03-01','04-30'))notes.push('Liepājas ezerā aizliegta arī spiningošana no krasta vai ar iebriešanu ūdenī.');
  if(w.id==='liepaja'&&inPeriod(date,'03-15','06-20'))notes.push('Liepājas ezera sezonas lieguma zonā ir uzturēšanās aizliegums ar tikai nolikumā noteiktajiem izņēmumiem.');
  notes.push(w.licence+'. Precīzo atļauto lomu un piekļuves zonu nosaka izvēlētās vietas nolikums.');
 }else notes.push(f.limit+'. '+(f.minLength?'Minimālais garums '+f.minLength+' cm.':'Nav atsevišķa valsts minimālā garuma šai sugai iekšējos ūdeņos.'));
 if(date.slice(0,4)>'2026')notes.push('Nākotnes datuma plāns pēc 16.11.2026. pārbaudītajiem noteikumiem. Pirms brauciena pārbaudi grozījumus un licences derīgumu.');
 return{closed,blocked,fish:f,water:w,notes,heading:closed?'Šajā datumā ir sugas paturēšanas liegums.':'Šajā datumā nav šīs sugas valsts paturēšanas lieguma.',opening:f.start?date.slice(0,4)+'-'+f.opening:null};
}
function fold(s){let out='',bytes=0;for(const c of s){const n=new TextEncoder().encode(c).length;if(bytes+n>75){out+='\r\n ';bytes=1;}out+=c;bytes+=n;}return out;}
function escapeICS(s){return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
function makeICS(data,year){year=Number(year);if(!Number.isInteger(year)||year<2026||year>2030)throw Error('Gads nav atbalstīts');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalendars365//Copes liegumi//LV','CALSCALE:GREGORIAN','X-WR-CALNAME:Copes liegumu atgādinājumi '+year];
 for(const c of data.closures){for(const type of ['start','end']){const date=type==='start'?year+'-'+c.start:following(year+'-'+c.end);const title=c.title+(type==='start'?' sākas liegums':' pirmā diena pēc pamatlieguma');lines.push('BEGIN:VEVENT','UID:cope-'+c.id+'-'+year+'-'+type+'@kalendars365.lv','DTSTAMP:20261116T000000Z','DTSTART;VALUE=DATE:'+date.replaceAll('-',''),'DTEND;VALUE=DATE:'+following(date).replaceAll('-',''),'SUMMARY:'+escapeICS(title),'DESCRIPTION:'+escapeICS(c.kind+'. '+c.scope+'. '+c.note+' Plāns pēc 16.11.2026. noteikumiem. Vietējās licences un dabas zonas var būt stingrākas. Pārbaudi: https://kalendars365.lv/copes-kalendars/'),'URL:https://kalendars365.lv/copes-kalendars/','TRANSP:TRANSPARENT','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-P1D','DESCRIPTION:Pārbaudi copes noteikumus pirms brauciena','END:VALARM','END:VEVENT');}}
 return lines.concat('END:VCALENDAR','').map(fold).join('\r\n');
}
const api={validDate,inPeriod,result,makeICS,following};if(typeof module==='object'&&module.exports)module.exports=api;
if(!root.document)return;const init=()=>{const form=document.querySelector('[data-fish-check]'),node=document.getElementById('fish-guide-data');if(!form||!node)return;const data=JSON.parse(node.textContent),target=document.querySelector('[data-fish-result]');
const update=()=>{try{const r=result(data,form.elements.date.value,form.elements.species.value,form.elements.water.value);target.classList.toggle('is-closed',r.closed);target.innerHTML='<span class="fish-result-status">'+safe(r.closed?'Paturēšana aizliegta':'Pārbaudi arī vietējos noteikumus')+'</span><h3>'+safe(r.heading)+'</h3><p><b>'+safe(r.fish.name)+' · '+new Intl.DateTimeFormat('lv-LV',{dateStyle:'long',timeZone:'UTC'}).format(new Date(form.elements.date.value+'T12:00:00Z'))+'</b></p><ul>'+r.notes.map(n=>'<li>'+safe(n)+'</li>').join('')+'</ul>'+(r.water?'<a href="#udens-'+safe(r.water.id)+'">Skatīt ūdenstilpes ceļvedi</a>':'<a href="#liegumu-kalendars">Skatīt visu liegumu kalendāru</a>');}catch(e){target.textContent=e.message;}};
const now=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Riga'}).format(new Date());if(validDate(now))form.elements.date.value=now;update();form.addEventListener('submit',e=>{e.preventDefault();update();});form.addEventListener('change',update);
document.querySelectorAll('[data-fish-select]').forEach(b=>b.addEventListener('click',()=>{form.elements.species.value=b.dataset.fishSelect;update();document.getElementById('copes-parbaude').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});form.elements.date.focus({preventScroll:true});}));
document.querySelector('[data-fish-export]').addEventListener('click',()=>{const year=document.querySelector('[data-fish-year]').value,blob=new Blob([makeICS(data,year)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='copes-liegumi-'+year+'.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);document.querySelector('[data-fish-export-status]').textContent='Sagatavots '+year+'. gada ICS fails. Pārbaudi vietējos nolikumus pirms katra brauciena.';});};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})(typeof window!=='undefined'?window:globalThis);
