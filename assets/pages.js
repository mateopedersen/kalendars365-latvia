(()=>{'use strict';
const rigaDate=(now=new Date())=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return `${parts.find(x=>x.type==='year').value}-${parts.find(x=>x.type==='month').value}-${parts.find(x=>x.type==='day').value}`;};
const addDays=(date,amount)=>{const [y,m,d]=date.split('-').map(Number),value=new Date(Date.UTC(y,m-1,d+amount));return `${value.getUTCFullYear()}-${String(value.getUTCMonth()+1).padStart(2,'0')}-${String(value.getUTCDate()).padStart(2,'0')}`;};
function midnightDelay(now=new Date()){
 const [y,m,d]=addDays(rigaDate(now),1).split('-').map(Number),desired=Date.UTC(y,m-1,d),formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});let stamp=desired;
 for(let i=0;i<3;i++){const p=Object.fromEntries(formatter.formatToParts(new Date(stamp)).map(p=>[p.type,p.value]));stamp+=desired-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);}
 return Math.max(1000,stamp-now.getTime());
}
if(typeof module==='object'&&module.exports)module.exports={rigaDate,midnightDelay};
if(typeof document==='undefined')return;
const dateFromUrl=()=>{const value=new URL(location.href).searchParams.get('date');return /^\d{4}-\d{2}-\d{2}$/.test(value||'')?value:rigaDate();};
const statusText=(target,text)=>{let status=target.parentElement?.querySelector('[data-horoscope-status]');if(!status){status=document.createElement('p');status.className='horoscope-status';status.dataset.horoscopeStatus='';status.setAttribute('role','status');target.insertAdjacentElement('afterend',status);}status.textContent=text;};
document.addEventListener('DOMContentLoaded',()=>{
  const views=[...document.querySelectorAll('[data-horoscope-view]')],collection=document.querySelector('[data-horoscope-collection]');
  if(!views.length&&!collection)return;
  let request=0;
  const load=async(date,replaceUrl=false)=>{
    const token=++request,sign=views[0]?.dataset.horoscopeView||'';
    if(date>rigaDate()){date=rigaDate();}
    if(addDays(rigaDate(),-7)>date){views.forEach(view=>{view.replaceChildren();statusText(view,'Iepriekšējā dienas izdevuma arhīvs pieejams septiņas dienas.');});return;}
    views.forEach(view=>view.setAttribute('aria-busy','true'));if(collection)collection.setAttribute('aria-busy','true');
    try{
      const query=new URLSearchParams({date});if(sign)query.set('sign',sign);
      const response=await fetch(`/api/horoskops/dienas?${query}`,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Dienas izdevumu nevar ielādēt.');
      if(data.date!==date||data.timeZone!=='Europe/Riga'||(sign&&data.entries?.[sign]?.date!==date)||(!sign&&Object.keys(data.entries||{}).length!==12))throw new Error('Saņemts neatbilstošs dienas izdevums.');
      if(token!==request)return;
      if(views.length&&data.markup){views.forEach(view=>{view.innerHTML=data.markup;view.dataset.editionDate=data.date;view.removeAttribute('aria-busy');});}
      if(collection&&data.collectionMarkup){collection.innerHTML=data.collectionMarkup;collection.dataset.editionDate=data.date;collection.removeAttribute('aria-busy');}
      document.querySelectorAll('[data-horoscope-status]').forEach(node=>node.remove());
      if(replaceUrl){const url=new URL(location.href);if(date===rigaDate())url.searchParams.delete('date');else url.searchParams.set('date',date);history.replaceState({},'',url);}
    }catch(error){
      if(token!==request)return;
      views.forEach(view=>{view.removeAttribute('aria-busy');if(view.dataset.editionDate!==rigaDate()||view.dataset.editionDate!==date){view.replaceChildren();statusText(view,date===rigaDate()?'Šodienas horoskops pašlaik nav pieejams. Mēģini vēlāk.':'Šī dienas izdevuma tekstu pašlaik nevar ielādēt.');}});
      if(collection){collection.removeAttribute('aria-busy');if(collection.dataset.editionDate!==rigaDate()){collection.replaceChildren();statusText(collection,'Dienas horoskopus pašlaik nevar ielādēt. Mēģini vēlāk.');}}
    }
  };
  if(views.length||collection)load(dateFromUrl());
  document.addEventListener('click',event=>{const button=event.target.closest('[data-horoscope-step]');if(!button)return;const current=document.querySelector('[data-horoscope-view]')?.dataset.editionDate||dateFromUrl();load(addDays(current,Number(button.dataset.horoscopeStep)),true);});
  let midnightTimer;const scheduleMidnight=()=>{clearTimeout(midnightTimer);midnightTimer=setTimeout(()=>{load(rigaDate());scheduleMidnight();},midnightDelay());};
  scheduleMidnight();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)return;const edition=views[0]?.dataset.editionDate||collection?.dataset.editionDate;if(edition!==rigaDate()&&!new URL(location.href).searchParams.has('date'))load(rigaDate());scheduleMidnight();});
});
})();
