// Photo periods use absolute solar instants for the selected city's local day.
function selectCityPhoto(city,solarTimes,now=new Date()){
 const stamp=Number(now),rise=Number(solarTimes?.rise),set=Number(solarTimes?.set);
 const valid=solarTimes?.rise!=null&&solarTimes?.set!=null&&Number.isFinite(stamp)&&Number.isFinite(rise)&&Number.isFinite(set)&&rise!==set;
 const daytime=valid&&(rise<set?stamp>=rise&&stamp<set:stamp>=rise||stamp<set);
 const photo=valid&&!daytime&&city.nightPhoto?city.nightPhoto:city.photo;
 return{photo,photoPeriod:!valid?'archive':daytime?'day':city.nightPhoto?'night':'archive'};
}
// Keep the last decoded photograph visible until the next accepted image is ready.
// Cached DOM image nodes make repeat selections a synchronous, single-node swap.
function createCityPhotoLoader({image,figure,status,makeImage=()=>new Image(),onDisplay=()=>{},limit=16}){
 const cache=new Map();let version=0,displayed=image;
 const photoFor=city=>city.photo||{src:'/assets/category-vector/earth.svg',alt:'Zemes ilustrācija — aptuveni noteiktā pilsēta'};
 function load(city,priority='high'){
  const photo=photoFor(city),key=photo.src;let entry=cache.get(key);
  if(entry){cache.delete(key);cache.set(key,entry);if(priority==='high')entry.image.fetchPriority='high';return entry;}
  const pending=makeImage();entry={ready:false,image:pending};cache.set(key,entry);
  entry.promise=new Promise(resolve=>{
   pending.onload=async()=>{
    try{if(pending.decode)await pending.decode();entry.ready=true;resolve(true);}
    catch{if(cache.get(key)===entry)cache.delete(key);resolve(false);}
   };
   pending.onerror=()=>{if(cache.get(key)===entry)cache.delete(key);resolve(false);};
   pending.decoding='async';pending.fetchPriority=priority;pending.src=photo.src;
  });
  while(cache.size>limit)cache.delete(cache.keys().next().value);
  return entry;
 }
 function display(city,entry){
  const photo=photoFor(city),next=entry.image;
  if(next!==displayed){
   for(const attr of [...displayed.attributes])if(!['src','srcset','alt','hidden','loading','decoding','fetchpriority'].includes(attr.name))next.setAttribute(attr.name,attr.value);
   next.alt=photo.alt;next.hidden=false;displayed.replaceWith(next);displayed=next;
  }
  displayed.alt=photo.alt;displayed.hidden=false;
  figure.dataset.photoCity=city.id;figure.dataset.photoPeriod=city.photoPeriod||'day';figure.dataset.photoStage='ready';
  figure.classList.toggle('is-location-illustration',!!city.external);
  figure.classList.remove('is-loading');figure.setAttribute('aria-busy','false');status.hidden=true;onDisplay(city);
 }
 function update(city){
  const current=++version,entry=load(city);
  if(entry.ready){display(city,entry);return Promise.resolve(true);}
  figure.dataset.photoStage='loading';figure.setAttribute('aria-busy','true');status.hidden=true;
  return entry.promise.then(ok=>{
   if(current!==version)return false;
   if(ok){display(city,entry);return true;}
   figure.setAttribute('aria-busy','false');figure.dataset.photoStage='error';
   status.textContent='Neizdevās ielādēt '+city.name+' attēlu. Izvēlies pilsētu vēlreiz.';status.hidden=false;return false;
  });
 }
 return{update,preload:city=>load(city,'low').promise,hide:()=>{version++;displayed.hidden=true;}};
}
if(typeof module==='object'&&module.exports)module.exports={createCityPhotoLoader,selectCityPhoto};
(()=>{'use strict';
 if(typeof window!=='object'||typeof document!=='object')return;
 const cities=Array.isArray(window.K365Cities)?window.K365Cities:[];
 function init(){
  const get=id=>document.getElementById(id),select=get('city-select'),location=window.K365Location;
  if(!select||!cities.length||!location)return;
  let city=null,solarKey='',solarRun=0,solarTimes=null,photoKey='',photoTimer,photoRetryAt=0,zone='Europe/Riga',clockFormatter,solarFormatter,dateFormatter,fullDateFormatter;
  const card=get('city-card'),image=get('city-photo'),figure=image.closest('figure');
  const status=document.createElement('span');status.className='city-photo-status';status.setAttribute('role','status');status.hidden=true;figure.append(status);
  const photos=createCityPhotoLoader({image,figure,status,onDisplay:shown=>{get('city-photo-caption').textContent=shown.name+', '+shown.countryName;}});
  function warmNearby(){const at=cities.findIndex(record=>record.id===select.value);const nearby=at<0?cities.slice(0,3):cities.slice(Math.max(0,at-2),at+3);for(const record of nearby){photos.preload(record);if(record.nightPhoto)photos.preload({...record,photo:record.nightPhoto});}}
  select.addEventListener('focus',warmNearby);select.addEventListener('pointerdown',warmNearby,{passive:true});
  select.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key))warmNearby();});
  function formatters(nextZone){
   zone=nextZone;clockFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'short'});
   solarFormatter=new Intl.DateTimeFormat('lv-LV',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
   dateFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
   fullDateFormatter=new Intl.DateTimeFormat('lv-LV',{timeZone:zone,weekday:'long',year:'numeric',month:'long',day:'numeric'});
  }
  function updatePhoto(now=new Date()){
   if(!city||!solarTimes||Date.now()<photoRetryAt)return;
   const {rise,set}=solarTimes;
   const {photo,photoPeriod:period}=selectCityPhoto(city,solarTimes,now);
   const key=[city.id,period,photo?.src].join('|');
   if(key===photoKey)return;
   photoKey=key;clearTimeout(photoTimer);
   const next=[rise,set].filter(time=>time&&time>now).sort((a,b)=>a-b)[0];
   if(next)photoTimer=setTimeout(()=>updatePhoto(),Math.max(25,+next-Date.now()+25));
   photos.update({...city,photo,photoPeriod:period}).then(ok=>{if(!ok&&photoKey===key){photoKey='';photoRetryAt=Date.now()+60000;}});
  }
  function updateSun(today){
   const id=city.id+today+zone;if(solarKey===id)return;solarKey=id;
   const date=new Date(today+'T00:00:00Z'),enhanced=window.K365Sky?.citySky(today,city);
   const rise=enhanced?enhanced.sun.sunrise:window.K365.solarTime(date,city.lat,city.lon,true),set=enhanced?enhanced.sun.sunset:window.K365.solarTime(date,city.lat,city.lon,false);solarTimes={rise,set};
   const fmt=time=>time?solarFormatter.format(new Date(Math.round(time.getTime()/60000)*60000)):'—:—';
   get('city-sunrise').textContent=fmt(rise);get('city-sunset').textContent=fmt(set);
   const mins=rise&&set?Math.round((set-rise)/60000):null;
   get('city-daylight').textContent=mins===null?'Šajā datumā nav atsevišķa saullēkta vai saulrieta.':`Dienas garums ${Math.floor(mins/60)} h ${mins%60} min · aptuvens aprēķins`;
  }
  function updateSunVisual(now){
   const visual=get('city-sun-visual'),orb=get('city-sun-orb'),glow=get('city-sun-orb-glow');if(!visual||!orb||!glow)return;
   if(!solarTimes?.rise||!solarTimes?.set){visual.dataset.phase='unavailable';return;}
   const start=solarTimes.rise.getTime(),end=solarTimes.set.getTime(),current=now.getTime(),day=current>=start&&current<=end,t=Math.max(0,Math.min(1,(current-start)/(end-start)));
   const x=18*(1-t)*(1-t)+300*(1-t)*t+302*t*t,y=68-168*t*(1-t);visual.dataset.phase=day?'day':'night';
   for(const node of [orb,glow]){node.setAttribute('cx',x.toFixed(1));node.setAttribute('cy',y.toFixed(1));}
  }
  function tick(skipSun=false){
   if(!city)return;const now=new Date(),p=Object.fromEntries(clockFormatter.formatToParts(now).map(p=>[p.type,p.value]));
   get('riga-time').textContent=p.hour+':'+p.minute;get('riga-time').dateTime=now.toISOString();get('city-clock-seconds').textContent=p.second;get('city-clock-zone').textContent=p.timeZoneName;
   get('today-date').textContent=fullDateFormatter.format(now);
   get('clock-hour').setAttribute('transform',`rotate(${Number(p.hour)%12*30+Number(p.minute)/2} 40 39)`);
   get('clock-minute').setAttribute('transform',`rotate(${Number(p.minute)*6+Number(p.second)/10} 40 39)`);get('clock-second').setAttribute('transform',`rotate(${Number(p.second)*6} 40 39)`);
   if(!skipSun){const d=Object.fromEntries(dateFormatter.formatToParts(now).map(p=>[p.type,p.value]));updateSun(`${d.year}-${d.month}-${d.day}`);updateSunVisual(now);updatePhoto(now);}
  }
  function apply({city:next,source}){
   card.dataset.locationState=source;get('city-location-auto').disabled=source==='detecting';
   get('city-location-status').textContent=source==='detecting'?'Nosaka pilsētu pēc IP…':source==='manual'?'Tava izvēlētā pilsēta.':source==='ip'?'Aptuvenā pilsēta pēc IP.':source==='country-fallback'?'Ārpus Latvijas parādām Rīgu. Izvēlies pilsētu sarakstā.':'Pilsētu pēc IP neizdevās noteikt. Izvēlies to sarakstā.';
   if(!next){if(!select.querySelector('[data-location-pending]')){const option=document.createElement('option');option.value='';option.textContent='Nosaka pilsētu…';option.disabled=true;option.hidden=true;option.dataset.locationPending='true';select.prepend(option);}select.value='';get('city-photo-caption').textContent='Nosaka tavu pilsētu…';photos.hide();return;}
   if(source==='detecting')return;
   const changed=city?.id!==next.id;city=next;formatters(city.timeZone||'Europe/Riga');
   for(const option of [...select.options])if(option.dataset.detectedCity&&option.value!==city.id)option.remove();
   if(city.external&&![...select.options].some(option=>option.value===city.id)){const option=document.createElement('option');option.value=city.id;option.textContent=city.name;option.dataset.detectedCity='true';select.prepend(option);}
   select.querySelector('[data-location-pending]')?.remove();select.value=city.id;select.setAttribute('aria-label',city.external?'Izvēlies pilsētu':'Izvēlies pilsētu Latvijā');get('city-card-title').textContent=city.external?'Šodien tavā pilsētā':'Šodien Latvijā';
   get('riga-time').setAttribute('aria-label','Vietējais laiks: '+city.name);get('city-sun-zone').textContent=zone;
   get('city-time-note').textContent=city.external?`Vietējais laiks — ${zone}. Latvijas kalendārs izmanto Europe/Riga.`:'Visā Latvijā ir vienāda laika josla — Europe/Riga.';
   const sunLink=get('city-sun-link');sunLink.href=city.external?'/saullekts-saulriets/':'/saullekts-saulriets/'+city.id+'/';
   sunLink.firstChild.textContent=city.external?'Saules laiki Latvijas pilsētās':'Saules laiki un datuma izvēle';
   if(changed){photoKey='';photoRetryAt=0;clearTimeout(photoTimer);}solarKey='';solarTimes=null;tick(true);const run=++solarRun;
   // Keep photo loading and selection responsive before the more expensive sky calculations.
   requestAnimationFrame(()=>requestAnimationFrame(()=>{if(run===solarRun)tick();}));
  }
  select.addEventListener('change',()=>location.manual(select.value));get('city-location-auto').addEventListener('click',()=>location.auto());
  document.addEventListener('k365:citychange',event=>apply(event.detail));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  document.addEventListener('k365:skyready',()=>{solarKey='';photoKey='';clearTimeout(photoTimer);tick();});
  apply({city:location.current,source:location.source});setInterval(()=>{if(!document.hidden)tick();},1000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
