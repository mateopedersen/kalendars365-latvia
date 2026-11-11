const riseIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 14h16M5 14a5 5 0 0 1 10 0M10 2v5M7 5l3-3 3 3"/></svg>';
const setIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 14h16M5 14a5 5 0 0 1 10 0M10 2v5M7 4l3 3 3-3"/></svg>';
const moonRiseIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 3a6 6 0 1 0 5 9 6 6 0 0 1-5-9ZM3 18h14M15 2v5m-2-3 2-2 2 2"/></svg>';
const moonSetIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 3a6 6 0 1 0 5 9 6 6 0 0 1-5-9ZM3 18h14M15 2v5m-2-2 2 2 2-2"/></svg>';
export function cityCardReading(day,city,kind,core){
  const sky=core.citySky(day,city),moon=kind==='moon';
  return {
    rise:moon?(sky.moon.rises.length?sky.moon.rises.map(d=>core.formatTime(d)).join(' · '):'Neuzlec'):core.formatTime(sky.sun.sunrise),
    set:moon?(sky.moon.sets.length?sky.moon.sets.map(d=>core.formatTime(d)).join(' · '):'Nenoriet'):core.formatTime(sky.sun.sunset),
    riseLabel:moon?'Mēness lēkts':'Saullēkts',setLabel:moon?'Mēness riets':'Saulriets',
    href:(moon?'/meness-lekts-un-riets/':'/saullekts-saulriets/')+city.id+'/?date='+encodeURIComponent(day)
  };
}
export function initCityPhotoCards(doc,core,cities){
  for(const root of doc.querySelectorAll('[data-city-photo-cards]')){
    if(root.dataset.cityPhotosReady)continue;root.dataset.cityPhotosReady='true';
    const cards=[...root.querySelectorAll('[data-city-photo-card]')],kind=root.dataset.cityPhotoCards;
    const byId=new Map(cities.map(c=>[c.id,c]));
    let shown=false,lastDay='',frame=0;
    function render(){
      frame=0;if(!shown)return;
      const day=doc.querySelector('[data-sky-date]')?.value||core.dateKey();
      try{core.parseDate(day);}catch{return;}
      const selected=doc.querySelector('[data-sky-city-select]')?.value;
      for(const card of cards){
        const city=byId.get(card.dataset.cityPhotoCard);if(!city)continue;
        if(city.id===selected)card.setAttribute('aria-current','location');else card.removeAttribute('aria-current');
        if(day===lastDay)continue;
        const reading=cityCardReading(day,city,kind,core);
        card.href=reading.href;
        for(const [field,icon] of [['rise',kind==='moon'?moonRiseIcon:riseIcon],['set',kind==='moon'?moonSetIcon:setIcon]]){
          const el=card.querySelector('[data-city-photo-'+field+']');
          el.innerHTML=icon;const label=doc.createElement('span');label.className='sr-only';label.textContent=reading[field+'Label']+' ';const time=doc.createElement('span');time.textContent=reading[field];el.append(label,time);
          el.setAttribute('aria-label',reading[field+'Label']+' '+reading[field]);
        }
        card.querySelector('[data-city-photo-times]').hidden=false;
        card.querySelector('.city-photo-prompt').hidden=true;
      }
      root.querySelector('[data-city-photo-date]').textContent=core.formatDate(day)+' · Latvijas laiks';
      lastDay=day;
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(render);};
    const observer=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting){shown=true;schedule();observer.disconnect();}
    },{rootMargin:'300px'});observer.observe(root);
    doc.addEventListener('k365:sky-datechange',schedule);
  }
}
