'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),C=require('../assets/calendar-core.js');
const rows=JSON.parse(fs.readFileSync('_data/routes.json','utf8'));
const {holidayTitleMarkup}=require('../assets/app.js'),holidayTopics=JSON.parse(fs.readFileSync('assets/calendar-summary.json','utf8')).holidayTopics;
const slugs=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const short=['P.','O.','T.','C.','Pk.','S.','Sv.'],months=C.months.map(v=>v[0].toLocaleUpperCase('lv-LV')+v.slice(1));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=C.todayRiga(),cache=new Map(),iso=d=>C.dateISO(d),plus=(d,n)=>C.addDays(d,n);
const events=d=>{const y=Number(d.slice(0,4));if(!cache.has(y))cache.set(y,C.holidays(y));return cache.get(y).filter(e=>e.date===d);};
const label=d=>new Intl.DateTimeFormat('lv-LV',{timeZone:'UTC',weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(C.parseISO(d));
function dayEvents(day){return events(day).map(e=>`<div class="plan-event"><time>Visu dienu</time><i class="dot" style="background:#981c39"></i><div><strong>${holidayTitleMarkup(e,holidayTopics)}</strong><small>${e.dayOff?'Svētku diena':'Atceres vai atzīmējamā diena'}</small></div></div>`).join('');}
function monthMarkup(y,m,selected){
 const first=C.parseISO(`${y}-${String(m).padStart(2,'0')}-01`),start=plus(first,1-C.weekday(first));
 const weeks=Array.from({length:6},(_,n)=>Array.from({length:7},(_,i)=>iso(plus(start,n*7+i))));
 const head=`<thead><tr><th scope="col">Ned.</th>${short.map((s,i)=>`<th scope="col" class="${i>4?'weekend':''}"><abbr title="${esc(C.weekdays[i])}">${s}</abbr></th>`).join('')}</tr></thead>`;
 return `<table class="calendar-table" aria-label="${months[m-1]} ${y}">${head}<tbody>${weeks.map(days=>{const w=C.isoWeek(days[0]),href=w.year>=2027&&w.year<=2030?`/nedelas-kalendars/${w.year}/${String(w.week).padStart(2,'0')}/`:`/?date=${days[0]}&amp;view=week`;return `<tr><td class="week-number"><a href="${href}" data-week-link="${w.year}-${w.week}" aria-label="${w.year}. gada ${w.week}. nedēļa">${w.week}</a></td>${days.map((d,i)=>{const e=events(d),same=Number(d.slice(5,7))===m;return `<td class="${same?'':'other-month'} ${i>4?'weekend':''} ${d===today?'is-today':''} ${d===selected?'selected-day':''} ${e.some(x=>x.dayOff)?'holiday':''}"><button class="day-button" data-date="${d}" aria-label="${esc([Number(d.slice(8)),...e.slice(0,2).map(x=>x.title),...(e.length>2?['+'+(e.length-2)]:[])].join(' ')+'. '+label(d))}"${d===today?' aria-current="date"':''}><span class="date-number">${Number(d.slice(8))}</span> ${e.slice(0,2).map(x=>`<span class="day-event"><i class="dot" style="background:#981c39"></i><span class="event-label">${esc(x.title)}</span></span>`).join(' ')}${e.length>2?`<span class="more-events">+${e.length-2}</span>`:''}</button></td>`;}).join('')}</tr>`;}).join('')}</tbody></table>`;
}
function weekMarkup(selected){const start=plus(selected,1-C.weekday(selected));return `<div class="week-view">${C.weekdays.map((name,i)=>{const d=iso(plus(start,i));return `<section class="week-day ${d===today?'is-today':''}"><button data-date="${d}"><span>${name[0].toLocaleUpperCase('lv-LV')+name.slice(1)}</span><strong>${Number(d.slice(8))}</strong></button><div>${dayEvents(d)||'<p class="empty-state">Brīva diena plāniem</p>'}<button class="text-button" data-add-date="${d}">＋ Notikums</button></div></section>`;}).join('')}</div>`;}
const pages={};
for(const r of [...rows,{'URL path':'/nedelas-kalendars/2031/01/','Page family':'iso_week','Year':'2031'}]){
 const url=r['URL path'],family=r['Page family'],parts=url.split('/').filter(Boolean);
 if(!['calendar_month','iso_week'].includes(family)&&!['/','/menesa-kalendars/','/nedelas-kalendars/','/dienas-kalendars/','/dienas-planotajs/'].includes(url))continue;
 let selected=today,view='month';
 const y=Number(r.Year)||2027,m=slugs.indexOf(parts.at(-1))+1;
 if(family==='calendar_month')selected=`${y}-${String(m).padStart(2,'0')}-01`;
 if(family==='iso_week'){
  const w=Number(parts.at(-1)),jan4=C.parseISO(`${y}-01-04`);selected=iso(plus(jan4,1-C.weekday(jan4)+(w-1)*7));view='week';
  if(C.isoWeek(selected).year!==y||C.isoWeek(selected).week!==w)throw Error('Invalid ISO route '+url);
 }
 if(url==='/menesa-kalendars/')selected='2027-01-01';
 if(url==='/nedelas-kalendars/'){selected='2027-01-04';view='week';}
 if(url==='/dienas-kalendars/'||url==='/dienas-planotajs/')view='day';
 const sy=Number(selected.slice(0,4)),sm=Number(selected.slice(5,7)),week=C.isoWeek(selected);
 const title=view==='week'?`${week.week}. nedēļa · ${week.year}`:view==='day'?label(selected):`${months[sm-1]} ${sy}`;
 let markup=view==='week'?weekMarkup(selected):monthMarkup(sy,sm,selected);
 if(view==='day')markup=`<div class="day-timeline">${dayEvents(selected)}<p class="empty-state">Izvēlētā diena: ${esc(label(selected))}. Personīgos notikumus pievieno interaktīvajā skatā.</p></div>`;
 const monthCount=new Date(Date.UTC(sy,sm,0)).getUTCDate();
 const canonicalDays=Array.from({length:view==='week'?7:monthCount},(_,i)=>iso(plus(view==='week'?selected:`${sy}-${String(sm).padStart(2,'0')}-01`,i)));
 const contentFingerprint=crypto.createHash('sha256').update(JSON.stringify({view,days:canonicalDays.map(d=>({date:d,iso:C.isoWeek(d),holidays:events(d)}))})).digest('hex');
 pages[url]={view,selected,title,markup,week:week.week,day:C.diffDays(`${sy}-01-01`,selected)+1,monthDays:monthCount,dayLabel:label(selected),dayMarkup:dayEvents(selected)||'<p class="empty-state">Šī diena vēl ir brīva. Pievieno notikumu un atvēli laiku svarīgākajam.</p>',monthOptions:months.map((s,i)=>`<option value="${i+1}"${i===sm-1?' selected':''}>${s}</option>`).join(''),yearOptions:[...new Set([2026,2027,2028,2029,2030,sy])].sort().map(v=>`<option value="${v}"${v===sy?' selected':''}>${v}</option>`).join(''),contentFingerprint};
}
const K=require('../assets/category-core.js'),nameRecords=JSON.parse(fs.readFileSync('_data/name-days-current.json','utf8')).records;
const traditional=K.names(nameRecords,{kind:'traditional'});
const nameCards=traditional.slice(0,60).map(n=>`<article class="name-result-card"><h3>${esc(n.name)}</h3><p>${n.day}. ${esc(C.months[n.month-1])}</p><small>Tradicionālais saraksts${n.language==='ltg'?' · latgaliski':''}</small><a href="/izveidot-kalendaru/?year=2027&amp;month=${n.month}&amp;view=month&amp;name=${encodeURIComponent(n.name)}">Izveidot apsveikuma kalendāru ↗</a></article>`).join('');
const nameMonth=`<h3>Janvāris 2027</h3><div class="names-calendar-grid">${Array.from({length:31},(_,i)=>`<article class="names-calendar-day"><b>${i+1}</b><p>${nameRecords.filter(n=>n.month===1&&n.day===i+1&&n.kind==='traditional').map(n=>esc(n.name)).join(', ')||'—'}</p><button type="button" data-name-day="${i+1}" data-name-month="1">Skatīt dienu</button></article>`).join('')}</div>`;
const names={count:`Atrasto vārdu skaits: ${traditional.length}. Redzamo skaits: ${Math.min(60,traditional.length)}.`,cards:nameCards,month:nameMonth};
const snapshot={schemaVersion:1,timeZone:'Europe/Riga',today,sourceVersion:crypto.createHash('sha256').update(fs.readFileSync('assets/calendar-core.js')).digest('hex'),pages,names};
fs.writeFileSync('_data/calendar-ssr.json',JSON.stringify(snapshot)+'\n');
console.log(JSON.stringify({calendarSnapshots:Object.keys(pages).length,today,timeZone:snapshot.timeZone}));
