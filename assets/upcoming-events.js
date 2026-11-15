(function(root){
'use strict';
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function rigaParts(now=new Date()){const p=Object.fromEntries(formatter.formatToParts(now).map(x=>[x.type,x.value]));return {day:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
function selectUpcoming(events,now=new Date(),limit=4){const {day,time}=rigaParts(now);return (Array.isArray(events)?events:[]).filter(e=>e&&/^\d{4}-\d{2}-\d{2}$/.test(e.start)&&/^\d{4}-\d{2}-\d{2}$/.test(e.end)&&e.end>=e.start&&e.end>=day&&!(e.end===day&&e.endTime&&time>e.endTime)).sort((a,b)=>(a.start<=day?0:1)-(b.start<=day?0:1)||a.start.localeCompare(b.start)||a.end.localeCompare(b.end)||a.id.localeCompare(b.id)).slice(0,limit).map(e=>({...e,status:e.start<=day?'Turpinās':'Drīzumā'}));}
const api={rigaParts,selectUpcoming};if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const section=document.querySelector('[data-upcoming-events]');if(!section)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
const date=s=>s.slice(8)+'.'+s.slice(5,7)+'.'+s.slice(0,4)+'.';
let catalog=[],last='';
function render(){const list=selectUpcoming(catalog),key=JSON.stringify(list.map(e=>[e.id,e.status]));if(key===last)return;last=key;section.querySelector('[data-upcoming-list]').innerHTML=list.map(e=>`<article class="home-event"><a class="home-event-main" href="${esc(e.url)}"><div class="home-event-photo"><img src="${esc(e.image)}" alt="${esc(e.imageAlt)}" width="${e.imageWidth}" height="${e.imageHeight}" loading="lazy" decoding="async"><span>${e.status}</span></div><div class="home-event-copy"><small>${esc(e.city)}</small><h3>${esc(e.title)}</h3><p class="home-event-date">${date(e.start)}${e.end!==e.start?'–'+date(e.end):''}</p><p>${esc(e.schedule)}</p><span class="home-event-cta">Atvērt ceļvedi ${icon}</span></div></a></article>`).join('');section.querySelector('[data-upcoming-note]').textContent=list.length?'Rādīti tuvākie izziņotie pasākumi. Datumu un programmu pirms došanās pārbaudi ceļvedī.':'Šai dienai katalogā nav turpmāku apstiprinātu datumu. Jaunās norises pievienojam pēc rīkotāju paziņojumiem; atver visus ceļvežus.';}
const v=document.querySelector('meta[name="asset-version"]')?.content||'';
fetch('/assets/upcoming-events.json'+(v?'?v='+encodeURIComponent(v):'')).then(r=>{if(!r.ok)throw Error('Event catalog unavailable');return r.json();}).then(data=>{catalog=data.events;render();setInterval(()=>{if(!document.hidden)render()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});}).catch(()=>{});
})(typeof window!=='undefined'?window:globalThis);
