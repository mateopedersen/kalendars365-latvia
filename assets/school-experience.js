(()=>{'use strict';
const D=window.CalendarCore,C=window.SchoolCalendarCore;if(!D||!C)return;
const $=(root,selector)=>root.querySelector(selector),$$=(root,selector)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function download(events,title,file){const text=C.makeICS(events,title);const url=URL.createObjectURL(new Blob([text],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}

const root=document.querySelector('[data-school-experience]');
if(root){
  const data=JSON.parse($(root,'[data-school-data]').textContent),school=data.school;
  const year=$(root,'[data-school-year]'),grade=$(root,'[data-school-class]'),month=$(root,'[data-school-month]'),grid=$(root,'[data-school-month-grid]'),detail=$(root,'[data-school-day-detail]'),feedback=$(root,'[data-school-feedback]'),onlySaved=$(root,'[data-school-saved-only]');
  const incoming=new URL(location.href),setOption=(select,value)=>{if([...select.options].some(option=>option.value===value))select.value=value;};
  setOption(year,incoming.searchParams.get('macibu-gads'));setOption(grade,incoming.searchParams.get('klase'));
  const storageKey='k365-school-breaks-saved-v1',allowed=new Set(school.breaks.map(item=>item.id));let saved=new Set();
  try{const value=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(value))saved=new Set(value.filter(id=>allowed.has(id)));}catch{}
  let selected=D.todayRiga();if(selected<school.start||selected>school.end)selected=school.start;
  const active=()=>year.value==='2026-27',currentGrade=()=>Number(grade.value);
  const selectedPeriods=()=>C.periods(school,currentGrade());
  const csvButton=$(root,'[data-v2-school-csv]'),csvStatus=$(root,'[data-v2-school-status]');
  csvButton?.addEventListener('click',()=>{
    try{
      if(!active())throw Error('Šim mācību gadam datumi vēl nav publicēti.');
      const ids=new Set($$(root,'[data-school-break]').filter(card=>!card.hidden).map(card=>card.dataset.schoolBreak));
      const periods=selectedPeriods().filter(item=>ids.has(item.id));if(!periods.length)throw Error('Atlasē nav brīvlaiku.');
      const rows=[['Brīvlaiks','Sākums','Beigas','Kalendārās dienas','Klase','Avots'],...periods.map(item=>[item.label,item.start,item.end,D.diffDays(item.start,item.end)+1,currentGrade(),data.source.url])];
      const cell=value=>'"'+String(value??'').replace(/^[\s]*[=+@-]/,match=>"'"+match).replaceAll('"','""')+'"';
      const text='\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n'),url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');
      link.href=url;link.download=`skolas-brivlaiki-${currentGrade()}-klase-2026-2027.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      csvStatus.textContent=`Sagatavoto brīvlaiku periodu skaits: ${periods.length}.`;
    }catch(error){csvStatus.textContent=error.message;}
  });
  function calendarHTML(){
    const [y,m]=month.value.split('-').map(Number),first=`${y}-${String(m).padStart(2,'0')}-01`,offset=D.weekday(first)-1,last=new Date(Date.UTC(y,m,0)).getUTCDate();
    const cells=Array.from({length:offset},()=>'<span aria-hidden="true"></span>');
    for(let day=1;day<=last;day++){
      const date=`${month.value}-${String(day).padStart(2,'0')}`,item=C.classify(school,currentGrade(),date,data.holidays);
      const classes=['school-day',`is-${item.kind}`,item.weekend?'is-weekend':'',item.holiday?'is-holiday':'',date===D.todayRiga()?'is-today':''].filter(Boolean).join(' ');
      cells.push(`<button type="button" class="${classes}" data-school-day="${date}" aria-pressed="${date===selected}" aria-label="${esc(D.dateLabel(date)+' · '+item.label)}">${day}${item.holiday?'<span class="school-day-dot" aria-hidden="true"></span>':''}</button>`);
    }
    return cells.join('');
  }
  function renderDetail(){const item=C.classify(school,currentGrade(),selected,data.holidays);detail.innerHTML=`<span class="hub-kicker">${currentGrade()}. KLASE · IZVĒLĒTAIS DATUMS</span><h3>${esc(D.dateLabel(selected))}</h3><strong>${esc(item.label)}</strong>${item.period?`<p>${esc(D.dateLabel(item.period.start))} – ${esc(D.dateLabel(item.period.end))}</p>`:''}${item.period&&item.holiday?`<p>Arī svētku brīvdiena: ${esc(item.holiday.title)}</p>`:''}<p>${item.kind==='study'?'Mācību pamatgrafiks; pārbaudi savas skolas paziņojumus.':item.kind==='unknown'?'Nenoteikts periods netiek uzskatīts par brīvlaiku.':'Datums attiecas uz pašlaik izvēlēto klasi.'}</p><a href="${esc(data.source.url)}" target="_blank" rel="noopener">Oficiālais skolas datumu avots ↗</a>`;}
  function renderMonth(){grid.innerHTML=calendarHTML();$$ (root,'[data-school-month-step]').forEach(button=>button.disabled=Number(button.dataset.schoolMonthStep)<0?month.selectedIndex===0:month.selectedIndex===month.options.length-1);renderDetail();}
  function counter(){const form=$(root,'[data-school-counter]'),output=$(root,'[data-school-counter-result]');if(!active()){output.textContent='Šim gadam oficiālie datumi nav publicēti.';return}try{const result=C.countRange(school,currentGrade(),form.elements.from.value,form.elements.to.value,data.holidays);output.textContent=`${result.free} no ${result.total} dienām bez regulārām mācībām. Mācību pamatgrafika dienas: ${result.study}.${result.unknown?` Nenoteiktas dienas pēc klases mācību gada beigām: ${result.unknown}.`:''}`;}catch(error){output.textContent=error.message;}}
  function render(){
    const valid=active(),ids=new Set(selectedPeriods().map(item=>item.id));
    $(root,'[data-school-pending]').hidden=valid;
    ['.school-month-section','.school-planner','.school-universities'].forEach(selector=>$(root,selector).hidden=!valid);
    $(root,'[data-school-end]').textContent=valid?D.dateLabel(C.gradeEnd(school,currentGrade())):'Datumi vēl nav publicēti';
    const note=$(root,'[data-school-grade-note]');
    note.textContent=currentGrade()===1?'1. klasei skola nosaka vēl vienu papildu brīvdienu nedēļu otrajā semestrī. Tā nav iekļauta šajā valsts pamatgrafikā.':[9,12].includes(currentGrade())?'Izlaiduma klase: 1. jūnijs nav šīs klases oficiālais vasaras brīvlaika sākums. Eksāmenus pārbaudi atsevišķi.':'Vienots Latvijas pamatgrafiks. Reģionu izvēle nav vajadzīga; skolas īpašos paziņojumus pārbaudi atsevišķi.';
    let visible=0;
    $$ (root,'[data-school-break]').forEach(card=>{const id=card.dataset.schoolBreak;card.hidden=!valid||!ids.has(id)||(onlySaved.checked&&!saved.has(id));if(!card.hidden)visible++;const button=$(card,'[data-school-save]');button.setAttribute('aria-pressed',String(saved.has(id)));button.setAttribute('aria-label',`${saved.has(id)?'Noņemt no saglabātajiem':'Saglabāt'}: ${school.breaks.find(item=>item.id===id).label}`);});
    $(root,'[data-school-empty]').hidden=!valid||visible>0;
    $(root,'[data-school-saved-count]').textContent=[...saved].filter(id=>ids.has(id)).length;
    const next=valid?C.nextBreak(school,currentGrade(),D.todayRiga()):null,nextRoot=$(root,'[data-school-next]');
    nextRoot.innerHTML=next?`<span>${next.ongoing?'BRĪVLAIKS ŠOBRĪD':'NĀKAMAIS BRĪVLAIKS'}</span><strong>${esc(next.label)}</strong><time datetime="${next.start}">${esc(D.dateLabel(next.start))} – ${esc(D.dateLabel(next.end))}</time><b>${next.ongoing?'Oficiālais periods ir sācies':`Pēc ${next.daysUntil} dienām`}</b>`:'<span>NĀKAMAIS MĀCĪBU GADS</span><strong>Datumi vēl nav publicēti</strong><p>Pārbaudīsim pēc oficiālā grafika publicēšanas.</p>';
    $$ (root,'[data-school-export]').forEach(button=>button.disabled=!valid);
    if(valid){renderMonth();counter();}
  }
  year.addEventListener('change',render);grade.addEventListener('change',render);onlySaved.addEventListener('change',render);
  month.addEventListener('change',()=>{if(!selected.startsWith(month.value))selected=month.value+'-01';renderMonth()});
  root.addEventListener('click',event=>{
    const save=event.target.closest('[data-school-save]');if(save){const id=save.dataset.schoolSave;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem(storageKey,JSON.stringify([...saved]));feedback.textContent='Izvēle saglabāta šajā pārlūkā.';}catch{feedback.textContent='Izvēle mainīta, bet pārlūka krātuve nav pieejama.'}render();return}
    const exporter=event.target.closest('[data-school-export]');if(exporter&&active()){
      const id=exporter.dataset.schoolExport,events=selectedPeriods().filter(item=>id==='all'?(!onlySaved.checked||saved.has(item.id)):item.id===id).map(item=>({...item,id:`school-2026-27-${currentGrade()}-${item.id}`,scope:`${currentGrade()}. klase; ${item.scope||'Latvijas vispārējās izglītības pamatgrafiks'}`,source:data.source.url}));
      if(!events.length){feedback.textContent='Vispirms atlasi vismaz vienu brīvlaiku.';return}download(events,`Skolas brīvlaiki · ${currentGrade()}. klase · 2026/27`,`kalendars365-skola-${currentGrade()}-klase-${id}-2026-2027.ics`);feedback.textContent='Kalendāra fails sagatavots.';return;
    }
    const step=event.target.closest('[data-school-month-step]');if(step){month.selectedIndex+=Number(step.dataset.schoolMonthStep);selected=month.value+'-01';renderMonth();return}
    const day=event.target.closest('[data-school-day]');if(day){selected=day.dataset.schoolDay;renderMonth();return}
    if(event.target.closest('[data-school-today]')){selected=D.todayRiga();if(selected<school.start||selected>school.end)selected=school.start;month.value=selected.slice(0,7);renderMonth();return}
    if(event.target.closest('[data-school-print]')){
      document.getElementById('school-print-sheet')?.remove();const sheet=document.createElement('section');sheet.id='school-print-sheet';sheet.className='school-print-sheet';sheet.innerHTML=`<h1>${esc(month.selectedOptions[0].textContent)}</h1><p>${currentGrade()}. klase · Latvijas mācību kalendārs 2026./2027.</p><div class="school-weekdays">${['P','O','T','C','Pk','S','Sv'].map(label=>`<b>${label}</b>`).join('')}</div><div class="school-month-grid">${calendarHTML()}</div><div class="school-calendar-legend"><span class="legend-break">Brīvlaiks</span><span class="legend-holiday">Svētku brīvdiena</span><span class="legend-weekend">Nedēļas nogale</span></div><footer>Kalendārs365 · kalendars365.lv</footer>`;document.body.append(sheet);document.body.classList.add('school-printing');window.addEventListener('afterprint',()=>{document.body.classList.remove('school-printing');sheet.remove()},{once:true});window.print();
    }
  });
  $(root,'[data-school-counter]').addEventListener('submit',event=>{event.preventDefault();counter()});render();
  const breakMatch=/^#brivlaiks-(autumn|winter|spring|summer)$/.exec(incoming.hash);
  if(breakMatch){const target=$$(root,'[data-school-break]').find(card=>card.dataset.schoolBreak===breakMatch[1]);if(target&&!target.hidden){onlySaved.checked=false;render();requestAnimationFrame(()=>target.scrollIntoView({block:'center'}));}}

}

document.querySelectorAll('[data-university-explorer]').forEach(explorer=>{
  const data=JSON.parse($(explorer,'[data-university-data]').textContent),choice=$(explorer,'[data-uni-choice]'),search=$(explorer,'[data-uni-search-input]'),kind=$(explorer,'[data-uni-kind]'),verified=$(explorer,'[data-uni-verified-only]'),cards=$$(explorer,'[data-university]');
  const incoming=new URL(location.href),institution=incoming.searchParams.get('augstskola'),calendar=incoming.searchParams.get('grafiks');
  const incomingCard=cards.find(card=>card.dataset.university===institution),knownCalendar=data.calendars.find(item=>item.id===calendar);
  if(incomingCard&&[...choice.options].some(option=>option.value===institution)){
    choice.value=institution;
    const picker=$(incomingCard,'[data-uni-variant-picker]');
    if(picker&&knownCalendar&&[...picker.options].some(option=>option.value===calendar))picker.value=calendar;
  }
  const render=()=>{
    const query=C.normalize(search.value.trim());let count=0;
    cards.forEach(card=>{
      card.hidden=(choice.value!=='all'&&choice.value!==card.dataset.university)||(query&&!C.normalize(card.dataset.uniSearch).includes(query))||(verified.checked&&card.dataset.uniVerified!=='true');
      if(!card.hidden)count++;
      const picker=$(card,'[data-uni-variant-picker]');
      $$ (card,'[data-uni-variant]').forEach((panel,index)=>{
        panel.hidden=picker?panel.dataset.uniVariant!==picker.value:index!==0;let visible=0;
        $$ (panel,'[data-uni-event-kind]').forEach(row=>{row.hidden=kind.value!=='all'&&kind.value!==row.dataset.uniEventKind;if(!row.hidden)visible++});
        $(panel,'.school-uni-filter-empty').hidden=visible>0;
      });
    });
    $(explorer,'[data-uni-result]').textContent=`Parādītas ${count} no ${cards.length} augstskolām`;
    $(explorer,'[data-uni-empty]').hidden=count>0;
  };
  choice.addEventListener('change',render);search.addEventListener('input',render);kind.addEventListener('change',render);verified.addEventListener('change',render);
  $$ (explorer,'[data-uni-variant-picker]').forEach(picker=>picker.addEventListener('change',render));
  explorer.addEventListener('click',event=>{
    const button=event.target.closest('[data-uni-export]');if(!button)return;
    const calendar=data.calendars.find(item=>item.id===button.dataset.uniExport);if(!calendar)return;
    const events=calendar.events.map((item,index)=>({...item,id:`university-${calendar.id}-${index}-${item.start}`,scope:[calendar.institution,calendar.scope,item.scope].filter(Boolean).join('\n'),source:calendar.source.url})).filter(item=>kind.value==='all'||item.kind===kind.value);
    if(!events.length){$(explorer,'[data-uni-result]').textContent='Atlasītajam perioda veidam nav publicētu datumu.';return}
    download(events,`${calendar.institution} · 2026/27`,`kalendars365-${calendar.id}-2026-2027.ics`);
    $(explorer,'[data-uni-result]').textContent=`Sagatavots ${calendar.institution} kalendārs: ${events.length} periodi.`;
  });render();
  if(incomingCard&&incoming.hash==='#study-'+institution&&!incomingCard.hidden)requestAnimationFrame(()=>incomingCard.scrollIntoView({block:'start'}));
});
})();
