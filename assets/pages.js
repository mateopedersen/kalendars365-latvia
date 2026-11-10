(()=>{'use strict';
const rigaDate=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return `${parts.find(x=>x.type==='year').value}-${parts.find(x=>x.type==='month').value}-${parts.find(x=>x.type==='day').value}`;};
const addDays=(date,amount)=>{const [y,m,d]=date.split('-').map(Number),value=new Date(Date.UTC(y,m-1,d+amount));return `${value.getUTCFullYear()}-${String(value.getUTCMonth()+1).padStart(2,'0')}-${String(value.getUTCDate()).padStart(2,'0')}`;};
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
      if(token!==request)return;
      if(views.length&&data.markup){views.forEach(view=>{view.innerHTML=data.markup;view.dataset.editionDate=data.date;view.removeAttribute('aria-busy');});}
      if(collection&&data.collectionMarkup){collection.innerHTML=data.collectionMarkup;collection.removeAttribute('aria-busy');}
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
  const scheduleMidnight=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),hour=Number(parts.find(x=>x.type==='hour').value),minute=Number(parts.find(x=>x.type==='minute').value),second=Number(parts.find(x=>x.type==='second').value),delay=((23-hour)*60*60+(59-minute)*60+(60-second))*1000;setTimeout(()=>{load(rigaDate());scheduleMidnight();},Math.max(1000,delay));};
  scheduleMidnight();
});
})();
