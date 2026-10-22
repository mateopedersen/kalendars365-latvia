/* Date-only planning; official holidays plus explicit employer overrides. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./calendar-core.js'):root.CalendarCore);if(typeof module==='object'&&module.exports)module.exports=api;else{root.CalendarPlanning=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
function period(from,to,options={}){
 const a=C.parseISO(from),b=C.parseISO(to);if(a>b)throw Error('Beigu datumam jābūt pēc sākuma datuma.');
 if(a.getUTCFullYear()<2027||b.getUTCFullYear()>2030)throw Error('Izvēlieties datumus no 2027. līdz 2030. gadam.');
 let days=0,work=0,hours=0,shortened=0;const rows=[];
 for(let d=a;d<=b;d=C.addDays(d,1)){const date=C.dateISO(d),isWork=C.isWorkday(d,options),h=C.workHours(d,options),full=C.workHours(d,{...options,shorten:false});days++;if(isWork)work++;hours+=h;if(h<full)shortened++;rows.push({date,work:isWork,hours:h,shortened:h<full});}
 return{days,work,rest:days-work,hours,shortened,rows};
}
function suggestions(year,budget,options={}){
 year=Number(year);budget=Number(budget);if(!Number.isInteger(year)||year<2027||year>2030||!Number.isInteger(budget)||budget<0||budget>20)throw Error('Pārbaudiet gadu un atvaļinājuma dienu skaitu (0–20).');
 const rows=period(year+'-01-01',year+'-12-31',options).rows,candidates=[];
 for(let start=0;start<rows.length;start++){
  // A later start inside an existing rest interval is always dominated.
  if(start&& !rows[start-1].work)continue;
  let used=0;for(let end=start;end<rows.length;end++){
   used+=Number(rows[end].work);if(used>budget)break;
   if(end+1<rows.length&&!rows[end+1].work)continue;
   const length=end-start+1;if(length<3)continue;
   candidates.push({start:rows[start].date,end:rows[end].date,days:length,leave:used,dates:rows.slice(start,end+1).filter(r=>r.work).map(r=>r.date)});
  }
 }
 candidates.sort((a,b)=>b.days-a.days||a.leave-b.leave||a.start.localeCompare(b.start));
 const chosen=[];for(const r of candidates){if(chosen.some(x=>r.start<=x.end&&r.end>=x.start))continue;chosen.push(r);if(chosen.length===12)break;}return chosen;
}
function overrides(text,value){const result={};for(const date of String(text||'').split(/[\s,;]+/).filter(Boolean)){C.parseISO(date);if(date<'2027-01-01'||date>'2030-12-31')throw Error('Īpašajiem datumiem jābūt 2027.–2030. gadā.');result[date]=value;}return result;}
function escape(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function settings(fd){const off=overrides(fd.get('off'),false),on=overrides(fd.get('on'),true);if(Object.keys(on).some(k=>k in off))throw Error('Viens datums nevar būt gan darba diena, gan brīvdiena.');return{weekLength:Number(fd.get('week')),hours:Number(fd.get('hours')||8),saturdayHours:5,shorten:fd.get('shorten')==='on',overrides:{...off,...on}};}
function fields(){return `<div class="field-grid"><label>Darba nedēļa<select name="week"><option value="5">5 dienas (pirmdiena–piektdiena)</option><option value="6">6 dienas (pirmdiena–sestdiena)</option></select></label><label>Stundas darba dienā<input type="number" name="hours" value="8" min="1" max="12" step="0.5" required></label></div><label class="check-label"><input type="checkbox" name="shorten" checked>Saīsināt pirmssvētku darba dienu par vienu stundu</label><details><summary>Mana darba devēja īpašie datumi</summary><p class="print-hint">Ievadiet datumus GGGG-MM-DD formātā, atdalot tos ar komatu. Šie iestatījumi aizstāj pamatkalendāru tikai šajā aprēķinā.</p><div class="field-grid"><label>Papildu brīvdienas<textarea name="off" rows="2" placeholder="2027-06-25"></textarea></label><label>Papildu darba dienas<textarea name="on" rows="2" placeholder="2027-06-19"></textarea></label></div></details>`;}
function assumptions(){return `<p class="print-hint">Aprēķins ietver abus datumus. Svētki pēc Latvijas likuma; darbdienu pārcelšana jāievada atsevišķi. Sešu dienu modelī: līdz 7 stundām pirmdien–piektdien, 5 stundas sestdien. Tas nav individuāls darba grafiks vai juridisks aprēķins. Avots: <a href="https://likumi.lv/ta/id/26019-darba-likums">Darba likuma 131., 133. un 135. pants</a>.</p>`;}
function download(text,type,name){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function calendarFile(dates){const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalendars365//Leave planner//LV','CALSCALE:GREGORIAN',...dates.flatMap(d=>['BEGIN:VEVENT','UID:leave-'+d+'@kalendars365.lv','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+d.replaceAll('-',''),'DTEND;VALUE=DATE:'+C.dateISO(C.addDays(d,1)).replaceAll('-',''),'SUMMARY:Atvaļinājuma plāns','DESCRIPTION:Plāns jāsaskaņo ar darba devēju.','END:VEVENT']),'END:VCALENDAR',''].join('\r\n');}
function resultStatus(kind,result){return kind==='leave'?`Atrasti ${result.length} savstarpēji nepārklājoši periodi. Katrs ir atsevišķa izvēle; budžets nav sadalīts starp periodiem.`:'Aprēķins pabeigts.';}
function resultMarkup(kind,result){
 if(kind==='leave')return result.length?`<div class="leave-grid">${result.map((r,i)=>`<article class="leave-card"><div><strong>${r.days}</strong><span>dienas atpūtai</span></div><h3>${escape(C.dateLabel(r.start))}<br>– ${escape(C.dateLabel(r.end))}</h3><p>${r.leave} atvaļinājuma darba dienas · ${r.days-r.leave} brīvdienas</p>${r.dates.length?`<details><summary>Atvaļinājuma datumi</summary><p>${r.dates.map(d=>escape(C.dateLabel(d))).join('<br>')}</p></details><button type="button" data-leave="${i}">Saglabāt plānu (.ics)</button>`:'<p>Nav jāizmanto atvaļinājuma dienas.</p>'}</article>`).join('')}</div>`:'<p>Ar šiem iestatījumiem nav atrasts vismaz trīs dienu atpūtas periods.</p>';
 return `<div class="metrics-grid"><div><b>${result.work}</b><span>Darba dienas</span></div><div><b>${result.hours}</b><span>Darba stundas</span></div><div><b>${result.rest}</b><span>Brīvdienas</span></div><div><b>${result.shortened}</b><span>Saīsinātas dienas</span></div></div><button type="button" data-csv>Saglabāt dienu aprēķinu (.csv)</button>`;
}
// The static build and interactive hydration share these exact form/result nodes.
function initialMarkup(kind,year){
 if(!['work','leave'].includes(kind)||!Number.isInteger(year)||year<2027||year>2030)throw Error('Nederīgs sākotnējais plānotājs.');
 const result=kind==='leave'?suggestions(year,3):period(`${year}-01-01`,`${year}-12-31`);
 return `<section class="tool-panel"><h2>${kind==='leave'?'Vairāk atpūtas ar pārdomātu atvaļinājumu':'Darba dienas un stundas pēc jūsu grafika'}</h2><form class="planning-form">${kind==='leave'?`<div class="field-grid"><label>Gads<select name="year">${[2027,2028,2029,2030].map(y=>`<option${y===year?' selected':''}>${y}</option>`).join('')}</select></label><label>Pieejamās atvaļinājuma darba dienas<input type="number" name="budget" value="3" min="0" max="20" required></label></div>`:`<div class="field-grid"><label>No<input type="date" name="from" min="2027-01-01" max="2030-12-31" value="${year}-01-01" required></label><label>Līdz<input type="date" name="to" min="2027-01-01" max="2030-12-31" value="${year}-12-31" required></label></div>`}${fields()}<button class="primary">${kind==='leave'?'Atrast atpūtas periodus':'Aprēķināt dienas un stundas'}</button><p class="planning-status" role="status">${resultStatus(kind,result)}</p></form><div class="planning-result">${resultMarkup(kind,result)}</div>${assumptions()}</section>`;
}
function mount(){
 if(typeof document==='undefined')return;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 document.querySelectorAll('[data-riga-today]').forEach(input=>{input.value=today;});
 document.querySelectorAll('[data-planning]').forEach(el=>{
  if(el.dataset.planningMounted==='true')return;
  const kind=el.dataset.planning,year=Math.max(2027,Math.min(2030,Number(document.body.dataset.year)||2027));let result;
  if(!el.querySelector('form.planning-form'))el.innerHTML=initialMarkup(kind,year);
  el.dataset.planningMounted='true';
  const form=el.querySelector('form'),out=el.querySelector('.planning-result'),status=el.querySelector('[role=status]');
  function calculate(){try{const fd=new FormData(form),opts=settings(fd);
   result=kind==='leave'?suggestions(fd.get('year'),fd.get('budget'),opts):period(fd.get('from'),fd.get('to'),opts);
   status.textContent=resultStatus(kind,result);
   const html=resultMarkup(kind,result);if(out.innerHTML!==html)out.innerHTML=html;
  }catch(e){result=null;out.replaceChildren();status.textContent=e.message;}}
  form.addEventListener('submit',e=>{e.preventDefault();calculate();});el.addEventListener('click',e=>{const b=e.target.closest('[data-leave],[data-csv]');if(!b||!result)return;if(b.hasAttribute('data-csv'))download('\ufeffDatums,Darba diena,Stundas,Saīsināta diena\r\n'+result.rows.map(r=>[r.date,r.work?'Jā':'Nē',r.hours,r.shortened?'Jā':'Nē'].join(',')).join('\r\n'),'text/csv;charset=utf-8','darba-laiks.csv');else{const r=result[Number(b.dataset.leave)];download(calendarFile(r.dates),'text/calendar;charset=utf-8','atvalinajums-'+r.start+'.ics');}});calculate();
 });
}
return{period,suggestions,overrides,calendarFile,initialMarkup,mount};
});
