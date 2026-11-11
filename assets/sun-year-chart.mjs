const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=value=>String(value).padStart(2,'0');
export const daylightDuration=minutes=>Math.floor(minutes/60)+' h '+minutes%60+' min';
export function daylightSummary(rows){
  const lengths=rows.map(r=>r.daylightMinutes??0);
  const longest=lengths.indexOf(Math.max(...lengths)),shortest=lengths.indexOf(Math.min(...lengths));
  return {longest,shortest,difference:lengths[longest]-lengths[shortest]};
}
export function daylightGeometry(rows){
  return rows.map((row,index)=>({index,x:98+index*85,y:268-(row.daylightMinutes??0)/1440*216,height:(row.daylightMinutes??0)/1440*216}));
}
function daylightSvg(rows,months,id,formatTime){
  const geometry=daylightGeometry(rows),line=geometry.map(p=>p.x+','+p.y).join(' ');
  return '<svg class="daylight-prism-chart" viewBox="0 0 1120 330" aria-labelledby="'+id+'-title '+id+'-desc" role="group"><title id="'+id+'-title">Dienas garums gada laikā</title><desc id="'+id+'-desc">Divpadsmit mēneši, katra mēneša 21. datums. Vertikālā ass no 0 līdz 24 stundām. Izvēlies mēnesi, lai skatītu precīzos laikus.</desc><defs>'+
  '<linearGradient id="'+id+'-bar" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d89791"/><stop offset=".5" stop-color="#b76676"/><stop offset="1" stop-color="#71314b"/></linearGradient>'+
  '<linearGradient id="'+id+'-gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff0c5"/><stop offset=".45" stop-color="#ecc581"/><stop offset="1" stop-color="#b77640"/></linearGradient>'+
  '<linearGradient id="'+id+'-line"><stop stop-color="#dca9a7"/><stop offset=".45" stop-color="#ffe3a3"/><stop offset="1" stop-color="#dca9a7"/></linearGradient>'+
  '<radialGradient id="'+id+'-orb" cx=".3" cy=".2"><stop stop-color="#fffbe9"/><stop offset=".4" stop-color="#f8d89b"/><stop offset="1" stop-color="#b57640"/></radialGradient>'+
  '</defs><path d="M73 268H1072l15 15H88Z" fill="#e7b59b" fill-opacity=".075"/>'+
  [0,6,12,18,24].map(hour=>{const y=268-hour/24*216;return '<line x1="60" x2="1072" y1="'+y+'" y2="'+y+'" stroke="#ffffff" stroke-opacity="'+(hour===0?'.24':'.10')+'"/><text x="41" y="'+(y+5)+'" text-anchor="end" fill="#d5bfcd" font-size="14">'+hour+' h</text>';}).join('')+
  geometry.map((p,index)=>{
    const row=rows[index],x=p.x-23,y=p.y,h=p.height;
    const label=months[index]+': '+daylightDuration(row.daylightMinutes)+'. Saullēkts '+formatTime(row.sun.sunrise)+', saulriets '+formatTime(row.sun.sunset)+'.';
    return '<g class="daylight-column" data-daylight-pick="'+index+'" tabindex="0" role="button" aria-pressed="false" aria-label="'+escape(label)+'"><title>'+escape(label)+'</title>'+
      '<rect x="'+(p.x-35)+'" y="32" width="70" height="285" fill="transparent"/>'+
      '<ellipse cx="'+(p.x+6)+'" cy="273" rx="30" ry="5" fill="#100c1a" fill-opacity=".28"/>'+
      '<path class="daylight-bar-side" d="M'+(x+46)+' '+y+'l8-5v'+h+'l-8 5Z" fill="#7e3a51"/>'+
      '<rect class="daylight-bar-front" x="'+x+'" y="'+y+'" width="46" height="'+h+'" rx="1" fill="url(#'+id+'-bar)"/>'+
      '<path class="daylight-bar-top" d="M'+x+' '+y+'l8-5h46l-8 5Z" fill="#e5b2a3"/>'+
      '<path d="M'+(x+2)+' '+(y+3)+'v'+Math.max(0,h-4)+'" stroke="#fff5eb" stroke-opacity=".18"/>'+
      '<text x="'+p.x+'" y="307" text-anchor="middle" fill="#e7d5df" font-size="15" translate="no">'+escape(months[index].slice(0,3))+'</text></g>';
  }).join('')+'<polyline points="'+line+'" fill="none" stroke="url(#'+id+'-line)" stroke-width="2.4" stroke-linejoin="round" opacity=".8" pointer-events="none"/>'+
  geometry.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="url(#'+id+'-orb)" stroke="#fff1ca" stroke-width=".65" pointer-events="none"/>').join('')+'</svg>';
}
export function initSunYear(root,{core,cities,download}){
  const yearSelect=root.querySelector('select'),citySelect=document.querySelector('[data-sky-city-select]');
  const plot=root.querySelector('[data-sun-year-chart]'),table=root.querySelector('[data-sun-year-table]');
  const months=core.months.map(m=>m[0].toUpperCase()+m.slice(1));
  let rows=[],city,year,selected=Number(document.querySelector('[data-sky-date]')?.value.slice(5,7))-1,frame=0;
  if(!(selected>=0&&selected<12))selected=5;
  let observedDay=document.querySelector('[data-sky-date]')?.value||new URLSearchParams(location.search).get('date')||'';
  const initialYear=observedDay.slice(0,4);
  if([...yearSelect.options].some(o=>o.value===initialYear))yearSelect.value=initialYear;
  const prefix='daylight-year';
  function selectMonth(index,focus=false){
    selected=(index+12)%12;
    for(const bar of plot.querySelectorAll('[data-daylight-pick]')){
      const active=Number(bar.dataset.daylightPick)===selected;
      bar.setAttribute('aria-pressed',String(active));
      bar.querySelector('.daylight-bar-front').setAttribute('fill','url(#'+prefix+'-'+(active?'gold':'bar')+')');
    }
    table.querySelectorAll('[data-daylight-pick]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.daylightPick)===selected)));
    plot.querySelector('[data-daylight-month]').value=String(selected);
    const row=rows[selected],date=year+'-'+pad(selected+1)+'-21';
    plot.querySelector('[data-daylight-selected]').innerHTML='<div class="daylight-selected-month"><span>IZVĒLĒTAIS MĒNESIS</span><strong translate="no">'+escape(months[selected])+'</strong><small>21. datums · '+year+'</small></div>'+
      '<div class="daylight-selected-metric"><span><i class="daylight-rise-mark" aria-hidden="true">↗</i> Saullēkts</span><strong>'+core.formatTime(row.sun.sunrise)+'</strong></div>'+
      '<div class="daylight-selected-metric"><span><i class="daylight-set-mark" aria-hidden="true">↘</i> Saulriets</span><strong>'+core.formatTime(row.sun.sunset)+'</strong></div>'+
      '<div class="daylight-selected-metric"><span>Dienas garums</span><strong>'+daylightDuration(row.daylightMinutes)+'</strong></div>'+
      '<a class="daylight-open-day" href="?city='+encodeURIComponent(city.id)+'&amp;date='+date+'#category-workspace">Atvērt dienu <span aria-hidden="true">↗</span></a>';
    const viewport=plot.querySelector('.daylight-plot-viewport'),svg=plot.querySelector('svg');
    if(viewport&&svg&&viewport.scrollWidth>viewport.clientWidth){
      const center=(98+selected*85)*svg.getBoundingClientRect().width/1120;
      viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,center-viewport.clientWidth/2));
    }
    if(focus)plot.querySelector('[data-daylight-pick="'+selected+'"]').focus();
  }
  function render(){
    frame=0;city=cities.find(c=>c.id===citySelect?.value)||cities[0];if(!city)return;
    year=Number(yearSelect.value);
    rows=Array.from({length:12},(_,i)=>core.citySky(year+'-'+pad(i+1)+'-21',city));
    const summary=daylightSummary(rows),max=rows[summary.longest],min=rows[summary.shortest];
    plot.innerHTML='<div class="daylight-visual"><div class="daylight-chart-heading"><div><span class="eyebrow"><b translate="no">'+escape(city.name)+'</b> · '+year+'</span><h3>Gada gaismas ritms</h3><p>Katra mēneša 21. datums</p></div><label>Mēnesis<select data-daylight-month>'+months.map((m,i)=>'<option value="'+i+'">'+escape(m)+'</option>').join('')+'</select></label></div>'+
      '<div class="daylight-year-highlights"><span>Garākā diena pārskatā <strong translate="no">'+escape(months[summary.longest])+' <b>'+daylightDuration(max.daylightMinutes)+'</b></strong></span><span>Īsākā diena pārskatā <strong translate="no">'+escape(months[summary.shortest])+' <b>'+daylightDuration(min.daylightMinutes)+'</b></strong></span></div>'+
      '<div class="daylight-plot-viewport">'+daylightSvg(rows,months,prefix,core.formatTime)+'</div><p class="daylight-chart-hint">Izvēlies mēnesi grafikā vai sarakstā, lai salīdzinātu laikus.</p></div>'+
      '<div class="daylight-selected" data-daylight-selected aria-live="polite" aria-atomic="true"></div>';
    table.innerHTML='<table class="daylight-year-table"><thead><tr><th scope="col">Mēnesis</th><th scope="col">Saullēkts</th><th scope="col">Saulriets</th><th scope="col">Dienas garums</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><th scope="row"><button type="button" data-daylight-pick="'+i+'" aria-pressed="false"><span class="daylight-month-number">'+pad(i+1)+'</span><span translate="no">'+escape(months[i])+'</span></button></th><td>'+core.formatTime(r.sun.sunrise)+'</td><td>'+core.formatTime(r.sun.sunset)+'</td><td><span class="daylight-table-meter" aria-hidden="true"><i style="width:'+(r.daylightMinutes/1440*100).toFixed(2)+'%"></i></span><strong>'+daylightDuration(r.daylightMinutes)+'</strong></td></tr>').join('')+'</tbody></table>';
    selectMonth(selected);
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(render);};
  yearSelect.addEventListener('change',schedule);
  citySelect?.addEventListener('change',schedule);
  document.addEventListener('k365:sky-datechange',event=>{
    const nextDay=String(event.detail.date),candidate=nextDay.slice(0,4);
    if(nextDay!==observedDay&&[...yearSelect.options].some(o=>o.value===candidate))yearSelect.value=candidate;
    observedDay=nextDay;
    schedule();
  });
  root.addEventListener('click',event=>{const target=event.target.closest('[data-daylight-pick]');if(target)selectMonth(Number(target.dataset.daylightPick));});
  root.addEventListener('keydown',event=>{
    const target=event.target.closest('[data-daylight-pick]');if(!target)return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();selectMonth(Number(target.dataset.daylightPick));}
    if(event.target.closest('svg')&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();selectMonth(selected+(event.key==='ArrowLeft'?-1:1),true);}
  });
  root.addEventListener('change',event=>{if(event.target.matches('[data-daylight-month]'))selectMonth(Number(event.target.value));});
  root.querySelector('[data-sun-year-csv]').addEventListener('click',()=>{
    const csv='\ufeffDatums,Saullēkts,Saulriets,Dienas garums min\r\n'+rows.map(r=>[r.date,core.formatTime(r.sun.sunrise),core.formatTime(r.sun.sunset),r.daylightMinutes].join(',')).join('\r\n');
    download(csv,'saules-gads-'+year+'.csv','text/csv;charset=utf-8');
  });
  render();
}
