(()=>{'use strict';
 const cities=Array.isArray(window.K365Cities)?window.K365Cities:[];
 function init(){
  const get=id=>document.getElementById(id),select=get('city-select'),location=window.K365Location;
  if(!select||!cities.length||!location)return;
  let city=null,solarKey='',photoVersion=0,solarTimes=null,zone='Europe/Riga',clockFormatter,solarFormatter,dateFormatter,fullDateFormatter;
  const card=get('city-card'),image=get('city-photo'),figure=image.closest('figure');
  const status=document.createElement('span');status.className='city-photo-status';status.setAttribute('role','status');status.hidden=true;figure.append(status);
  function formatters(nextZone){
   zone=nextZone;clockFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'short'});
   solarFormatter=new Intl.DateTimeFormat('lv-LV',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
   dateFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
   fullDateFormatter=new Intl.DateTimeFormat('lv-LV',{timeZone:zone,weekday:'long',year:'numeric',month:'long',day:'numeric'});
  }
  function updatePhoto(){
   const current=++photoVersion,photo=city.photo||{src:'/assets/category-vector/earth.svg',srcset:'',alt:'Zemes ilustrācija — aptuveni noteiktā pilsēta'};
   figure.classList.toggle('is-location-illustration',!!city.external);
   if(image.getAttribute('src')===photo.src&&(image.getAttribute('srcset')||'')===(photo.srcset||'')&&image.complete&&image.naturalWidth){image.alt=photo.alt;return;}
   figure.classList.add('is-loading');status.textContent='Ielādē attēlu…';status.hidden=false;
   const pending=new Image();pending.sizes=image.sizes;pending.srcset=photo.srcset||'';pending.src=photo.src;
   pending.onload=()=>{if(current!==photoVersion)return;image.alt=photo.alt;image.srcset=photo.srcset||'';image.src=photo.src;image.hidden=false;figure.classList.remove('is-loading');status.hidden=true;};
   pending.onerror=()=>{if(current!==photoVersion)return;image.hidden=true;figure.classList.remove('is-loading');status.textContent='Attēlu nevar ielādēt. Mēģini vēlreiz.';status.hidden=false;};
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
  function tick(){
   if(!city)return;const now=new Date(),p=Object.fromEntries(clockFormatter.formatToParts(now).map(p=>[p.type,p.value]));
   get('riga-time').textContent=p.hour+':'+p.minute;get('riga-time').dateTime=now.toISOString();get('city-clock-seconds').textContent=p.second;get('city-clock-zone').textContent=p.timeZoneName;
   get('today-date').textContent=fullDateFormatter.format(now);
   get('clock-hour').setAttribute('transform',`rotate(${Number(p.hour)%12*30+Number(p.minute)/2} 40 39)`);
   get('clock-minute').setAttribute('transform',`rotate(${Number(p.minute)*6+Number(p.second)/10} 40 39)`);get('clock-second').setAttribute('transform',`rotate(${Number(p.second)*6} 40 39)`);
   const d=Object.fromEntries(dateFormatter.formatToParts(now).map(p=>[p.type,p.value]));updateSun(`${d.year}-${d.month}-${d.day}`);updateSunVisual(now);
  }
  function apply({city:next,source}){
   card.dataset.locationState=source;get('city-location-auto').disabled=source==='detecting';
   get('city-location-status').textContent=source==='detecting'?'Nosaka pilsētu pēc IP…':source==='manual'?'Tava izvēlētā pilsēta.':source==='ip'?'Aptuvenā pilsēta pēc IP.':'Pilsētu pēc IP neizdevās noteikt. Izvēlies to sarakstā.';
   if(!next){if(!select.querySelector('[data-location-pending]')){const option=document.createElement('option');option.value='';option.textContent='Nosaka pilsētu…';option.disabled=true;option.hidden=true;option.dataset.locationPending='true';select.prepend(option);}select.value='';get('city-photo-caption').textContent='Nosaka tavu pilsētu…';image.hidden=true;return;}
   if(source==='detecting')return;
   const changed=city?.id!==next.id;city=next;formatters(city.timeZone||'Europe/Riga');
   for(const option of [...select.options])if(option.dataset.detectedCity&&option.value!==city.id)option.remove();
   if(city.external&&![...select.options].some(option=>option.value===city.id)){const option=document.createElement('option');option.value=city.id;option.textContent=city.name;option.dataset.detectedCity='true';select.prepend(option);}
   select.querySelector('[data-location-pending]')?.remove();select.value=city.id;select.setAttribute('aria-label',city.external?'Izvēlies pilsētu':'Izvēlies pilsētu Latvijā');get('city-photo-caption').textContent=city.name+', '+city.countryName;get('city-card-title').textContent=city.external?'Šodien tavā pilsētā':'Šodien Latvijā';
   get('city-credit').href=city.external?'/pilsetas-un-fotografijas/#category-vectors':'/pilsetas-un-fotografijas/#'+city.id;
   get('city-credit').setAttribute('aria-label',city.external?'Ilustrācijas avots':city.name+' — fotogrāfijas autors un licence');
   get('riga-time').setAttribute('aria-label','Vietējais laiks: '+city.name);get('city-sun-zone').textContent=zone;
   get('city-time-note').textContent=city.external?`Vietējais laiks — ${zone}. Latvijas kalendārs izmanto Europe/Riga.`:'Visā Latvijā ir vienāda laika josla — Europe/Riga.';
   const sunLink=get('city-sun-link');sunLink.href=city.external?'/saullekts-saulriets/':'/saullekts-saulriets/'+city.id+'/';
   sunLink.firstChild.textContent=city.external?'Saules laiki Latvijas pilsētās':'Saules laiki un datuma izvēle';
   if(changed)updatePhoto();solarKey='';tick();
  }
  select.addEventListener('change',()=>location.manual(select.value));get('city-location-auto').addEventListener('click',()=>location.auto());
  document.addEventListener('k365:citychange',event=>apply(event.detail));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  document.addEventListener('k365:skyready',()=>{solarKey='';tick();});
  apply({city:location.current,source:location.source});setInterval(()=>{if(!document.hidden)tick();},1000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
