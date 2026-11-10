(()=>{'use strict';
 const select=document.getElementById('city-select'),panel=document.getElementById('station-observation');if(!select||!panel)return;
 const title=document.getElementById('station-observation-title'),value=document.getElementById('station-observation-value'),detail=document.getElementById('station-observation-detail');
 const number=new Intl.NumberFormat('lv-LV',{maximumFractionDigits:1}),time=new Intl.DateTimeFormat('lv-LV',{timeZone:'Europe/Riga',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 let generation=0,timer;
 async function update(){const token=++generation,city=select.value;clearTimeout(timer);panel.dataset.state='loading';title.textContent='Tuvākās stacijas mērījums';value.textContent='—';detail.textContent='Ielādē LVĢMC novērojumus…';
  try{const r=await fetch(`/api/noverojumi/?city=${encodeURIComponent(city)}`,{cache:'no-store',signal:AbortSignal.timeout(13000)}),data=await r.json();if(token!==generation)return;
   const o=data.observation;if(!r.ok||!o||!Number.isFinite(o.temperature)||Date.now()-Date.parse(o.observedAt)>10800000)throw Error('Unavailable');
   panel.dataset.state='available';title.textContent=`Stacija: ${o.stationName}`;value.textContent=`${number.format(o.temperature)} °C`;detail.textContent=`Stundas vidējā temperatūra · ${number.format(o.distanceKm)} km no pilsētas centra. Stundas sākums: ${time.format(new Date(o.observedAt))} (Latvijas laiks).`;
  }catch{if(token!==generation)return;panel.dataset.state='unavailable';title.textContent='Stacijas mērījums nav pieejams';value.textContent='—';detail.textContent='Nav saņemts derīgs mērījums pēdējās 3 stundās līdz 50 km attālumā. Prognoze ir parādīta atsevišķi.';}
  timer=setTimeout(update,10*60*1000);
 }
 select.addEventListener('change',update);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});update();
})();
