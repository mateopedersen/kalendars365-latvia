import {YEARS, rigaDate, availableDays, readProgress, saveProgress} from './advent-calendar-core.mjs';
const root=document.querySelector('[data-advent-calendar]');
if(root) {
 const yearInput=root.querySelector('[data-advent-year]'), doors=[...root.querySelectorAll('[data-advent-day]')], status=root.querySelector('[data-advent-status]'), progress=root.querySelector('[data-advent-progress]'), dialog=root.querySelector('[data-advent-dialog]'), reveal=root.querySelector('[data-advent-reveal]');
 let storage;try{storage=window.localStorage;}catch{storage=null;}
 let year=Number(root.dataset.adventYearDefault)|| (YEARS.includes(Number(rigaDate().slice(0,4)))?Number(rigaDate().slice(0,4)):YEARS[0]), opened=readProgress(storage,year), timer, origin, previewDoor, sample=false, busy=false;
 yearInput.value=String(year);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 function refresh() {
  const count=availableDays(year), today=rigaDate();
  doors.forEach((door,i)=>{const d=i+1, ready=d<=count, done=ready&&opened.has(d);door.dataset.locked=String(!ready);door.setAttribute('aria-label',`${d}. decembris ${year}. ${done?'Atvērts. Atvērt vēlreiz.':ready?'Atvērt dienas pārsteigumu.':'Vēl slēgts. Uzzināt atvēršanas datumu.'}`);door.classList.toggle('is-open',done);door.classList.toggle('is-today',today===`${year}-12-${String(d).padStart(2,'0')}`);door.querySelector('.advent-door-state').textContent=done?'Atvērts':ready?'Atvērt':'Vēl jāgaida';});
  const done=[...opened].filter(d=>d<=count).length;
  progress.textContent=`Atvērti ${done} no 24`;
  root.querySelector('[data-advent-board-year]').textContent=year;
  status.textContent=count===0?`Pirmais lodziņš atvērsies 1. decembrī ${year}. gadā.`:count===24?'Visi 24 lodziņi ir pieejami. Atgriezies pie savām svētku idejām.':`Šodien pieejami ${count} lodziņi. Nākamais ${count+1}. decembrī.`;
 }
 function finishClose(){clearTimeout(timer);busy=false;dialog.classList.remove('is-locked');if(previewDoor){previewDoor.classList.remove('is-opening');previewDoor=null;}refresh();if(origin?.isConnected)origin.focus();}
 dialog.addEventListener('close',finishClose);
 root.querySelectorAll('[data-advent-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
 function openDay(day, isSample, trigger) {
  if(busy||dialog.open)return;
  if(!isSample&&day>availableDays(year)){
   origin=trigger;
   const date=`${day}. decembrī ${year}. gadā`, message=`Šis lodziņš atvērsies ${date} plkst. 00.00 pēc Latvijas laika.`;
   status.textContent=message;
   const badge=document.createElement('div');badge.className='advent-locked-date';badge.setAttribute('aria-hidden','true');
   const number=document.createElement('strong');number.textContent=String(day).padStart(2,'0');
   const month=document.createElement('span');month.textContent='DECEMBRIS';
   const dateYear=document.createElement('span');dateYear.textContent=String(year);badge.append(number,month,dateYear);
   const copy=document.createElement('div');copy.className='advent-reveal-copy';
   const kicker=document.createElement('p');kicker.className='advent-kicker';kicker.textContent='MAZAIS PĀRSTEIGUMS VĒL GAIDA';
   const title=document.createElement('h2');title.id='advent-dialog-title';title.textContent='Vēl mazliet pacietības';
   const detail=document.createElement('p');detail.textContent=message;
   const hint=document.createElement('p');hint.textContent='Katru dienu atveras jauns lodziņš ar svētku ideju. Iepriekšējo dienu lodziņus vari atvērt arī vēlāk.';
   copy.append(kicker,title,detail,hint);reveal.replaceChildren(badge,copy);
   root.querySelector('[data-advent-dialog-note]').textContent='Tavs progress netiek mainīts. Atgriezies, kad pienāks šī diena.';
   dialog.classList.add('is-locked');dialog.showModal();root.querySelector('.advent-dialog-close').focus();return;
  }
  busy=true;sample=isSample;origin=trigger;const door=doors[day-1];previewDoor=door;door.classList.add('is-opening');
  // Animate only the chosen door; no render loop or off-screen particle engine.
  const spark=document.createElement('span');spark.className='advent-sparks';spark.setAttribute('aria-hidden','true');for(let i=0;i<10;i++){const p=document.createElement('i');p.style.setProperty('--i',i);spark.append(p);}door.append(spark);
  timer=setTimeout(()=>{
   spark.remove();
   if(!sample){opened.add(day);const saved=saveProgress(storage,year,opened);root.querySelector('[data-advent-dialog-note]').textContent=saved?'Atzīme saglabāta šajā pārlūkā.':'Pārlūks neļauj saglabāt atzīmi. Kartīti vari turpināt lasīt.';}
   else root.querySelector('[data-advent-dialog-note]').textContent='Animācijas paraugs. Kalendāra progress netiek mainīts.';
   reveal.replaceChildren(root.querySelector(`#advent-content-${day}`).content.cloneNode(true));reveal.querySelector('[data-reveal-date]').textContent=`${sample?'PARAUGS · ':''}${day}. DECEMBRIS ${year}`;
   dialog.showModal();root.querySelector('.advent-dialog-close').focus();busy=false;
  },reduced.matches?0:780);
 }
 doors.forEach((door,i)=>door.addEventListener('click',()=>openDay(i+1,false,door)));
 root.querySelector('[data-advent-preview]').addEventListener('click',e=>openDay(1,true,e.currentTarget));
 yearInput.addEventListener('change',()=>{window.location.assign(`/adventes-kalendars/${yearInput.value}/#adventes-lodzini`);});
 let lastDate=rigaDate();let clockTimer=setInterval(()=>{if(document.hidden)return;const now=rigaDate();if(now!==lastDate){lastDate=now;refresh();}},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 window.addEventListener('storage',e=>{if(e.key===`k365:advent:v1:${year}`){opened=readProgress(storage,year);refresh();}});
 window.addEventListener('pagehide',()=>{clearInterval(clockTimer);clearTimeout(timer);},{once:true});
 window.addEventListener('pageshow',e=>{if(e.persisted){busy=false;refresh();clearInterval(clockTimer);clockTimer=setInterval(()=>{if(!document.hidden)refresh();},30000);}});
 refresh();
}
