(()=>{
  'use strict';
  const root=document.querySelector('[data-work-calendar]'),W=window.WorkCalendarCore,C=window.CalendarCore;
  if(!root||!W||!C)return;
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number=value=>new Intl.NumberFormat('lv-LV',{maximumFractionDigits:1}).format(value);
  const capitalize=value=>value.charAt(0).toLocaleUpperCase('lv-LV')+value.slice(1);
  const one=value=>value%10===1&&value%100!==11;
  const slugs=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
  const labels={work:'Darba diena',short:'Saīsināta darba diena',holiday:'Svētku brīvdiena',rest:'Brīvdiena pēc grafika'};
  const form=$('[data-work-settings]'),rangeForm=$('[data-work-range-form]'),error=$('[data-work-error]');
  const year=Number(root.dataset.workYear),monthSelect=$('[data-work-month-select]');
  let toolMode='workdays',toolResult=null,resultText='';
  let month=Number(root.dataset.workMonth),selected=`${year}-${String(month).padStart(2,'0')}-01`,annual=null,range=null,opts=null;
  function restoreQuery(){
    const query=new URLSearchParams(location.search);
    if(query.has('days')&&/^(?:[1-7](?:,[1-7])*)?$/.test(query.get('days'))){const days=query.get('days').split(',');for(const input of form.querySelectorAll('[name=weekday]'))input.checked=days.includes(input.value);}
    if(query.has('hours'))form.elements.hours.value=query.get('hours');
    for(const key of ['holidays','shorten'])if(query.has(key))form.elements[key].checked=query.get(key)!=='0';
    for(const key of ['off','on'])if(query.has(key))form.elements[key].value=query.get(key);
    if(['workdays','difference','add'].includes(query.get('tool')))toolMode=query.get('tool');
    for(const key of ['from','to','base','amount','unit'])if(query.has(key))rangeForm.elements[key].value=query.get(key);
    for(const [key,param] of [['includeBoth','both'],['includeStart','start'],['includeEnd','end']])if(query.has(param))rangeForm.elements[key].checked=query.get(param)==='1';
  }
  function settings(){
    return W.options({weekdays:[...form.querySelectorAll('[name=weekday]:checked')].map(input=>Number(input.value)),hours:form.elements.hours.value,holidays:form.elements.holidays.checked,shorten:form.elements.shorten.checked,overrides:W.parseOverrides(form.elements.off.value,form.elements.on.value)});
  }
  function query(){
    const params=new URLSearchParams({days:opts.weekdays.join(','),hours:String(opts.hours),holidays:opts.holidays?'1':'0',shorten:opts.shorten?'1':'0'});
    for(const key of ['off','on'])if(form.elements[key].value.trim())params.set(key,form.elements[key].value.trim());
    return params.toString();
  }
  function settingsNote(){
    if(!opts.weekdays.length)return 'Nav izvēlēta neviena nedēļas darba diena. Tiek ņemtas vērā tikai ievadītās papildu darba dienas.';
    const base=`${number(opts.hours)} h dienā · ${opts.weekdays.length} ${one(opts.weekdays.length)?'darba diena':'darba dienas'} nedēļā`;
    return `${base}${opts.shorten?` · pirms svētkiem ${number(Math.max(0,opts.hours-1))} h`:''}.${opts.hours*opts.weekdays.length>40?' Pielāgotais grafiks pārsniedz 40 h nedēļā; tas nav normālā darba laika aprēķins.':opts.hours!==8?' Pielāgots stundu skaits; nepilnam darba laikam pirmssvētku saīsinājumu pārbaudi līgumā.':''}`;
  }
  function renderDetail(){
    const row=annual.rows.find(row=>row.date===selected);
    $('[data-work-day-detail]').innerHTML=`<span class="work-kicker">${esc(capitalize(C.weekdays[row.weekday-1]))} · IZVĒLĒTAIS DATUMS</span><h3>${esc(C.dateLabel(selected))}</h3><strong>${labels[row.kind]}</strong><div class="work-day-hours"><b>${number(row.hours)}</b><span>h šajā dienā</span></div>${row.holiday.map(h=>`<p>${esc(h.title)}${!opts.holidays?' · svētku atņemšana ir izslēgta':''}</p>`).join('')}${row.shortened?'<p>Darba diena tieši pirms svētku dienas. Piemērots izvēlētais 1 h saīsinājums.</p>':''}${row.override!==null?`<p>Tavs īpašais datums: ${row.override?'papildu darba diena':'papildu brīvdiena'}.</p>`:''}${!row.holiday.length&&!row.shortened&&row.override===null?`<p>${row.work?'Darba diena atbilstoši izvēlētajam nedēļas grafikam.':'Šī nedēļas diena nav izvēlēta kā darba diena.'}</p>`:''}<a href="/svetku-dienas/${year}/${slugs[month-1]}/">Mēneša svētku pārskats ↗</a>`;
  }
  function calendarHTML(print=false){
    const rows=annual.months[month-1].rows,offset=C.weekday(rows[0].date)-1;
    return Array.from({length:offset},()=>'<span aria-hidden="true"></span>').join('')+rows.map(row=>{
      const tag=print?'div':'button';
      return `<${tag}${print?'':' type="button"'} class="work-day is-${row.kind}"${print?'':` data-work-day="${row.date}" aria-pressed="${row.date===selected}" aria-label="${esc(Number(row.date.slice(-2))+' '+(row.work?number(row.hours)+' h':'—')+'. '+C.dateLabel(row.date)+' · '+labels[row.kind])}"`}><span>${Number(row.date.slice(-2))}</span> <small>${row.work?number(row.hours)+' h':'—'}</small></${tag}>`;
    }).join('');
  }
  function renderMonth(){
    monthSelect.value=String(month);
    $('[data-work-calendar-grid]').innerHTML=calendarHTML();
    $('#work-month-title').textContent=`${capitalize(C.months[month-1])} ${year}`;
    $$('[data-work-step]').forEach(button=>button.disabled=Number(button.dataset.workStep)<0?month===1:month===12);
    $$('[data-work-pick-month]').forEach(card=>{const active=Number(card.dataset.workPickMonth)===month;card.classList.toggle('is-selected',active);if(active)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');});
    $('[data-work-month-page]').href=`/darba-dienu-kalendars/${year}/${slugs[month-1]}/?${query()}`;
    const dates=annual.months[month-1].rows.filter(row=>row.holiday.length||row.shortened);
    $('[data-work-month-dates]').innerHTML=dates.length?dates.map(row=>`<li><time datetime="${row.date}">${esc(C.dateLabel(row.date))}</time><span>${row.holiday.map(h=>esc(h.title)).join('; ')}${row.shortened?`Saīsināta darba diena · ${number(row.hours)} h`:''}</span></li>`).join(''):'<li>Šajā mēnesī nav likumā noteiktu svētku vai saīsinātu darba dienu.</li>';
    renderDetail();
  }
  function applyToolMode(mode=toolMode){
    toolMode=mode;
    $$('[data-work-tool-tab]').forEach(tab=>{const active=tab.dataset.workToolTab===mode;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    $('#work-tool-pane').setAttribute('aria-labelledby',`work-tool-tab-${mode}`);
    $$('[data-work-mode-part]').forEach(part=>{part.hidden=part.dataset.workModePart!==mode;part.querySelectorAll('input,select').forEach(input=>input.disabled=part.hidden);});
    $('[data-work-date-pair]').hidden=mode==='add';
    for(const key of ['from','to']){const input=rangeForm.elements[key];input.disabled=mode==='add';input.min=mode==='workdays'?W.MIN:'1900-01-01';input.max=mode==='workdays'?W.MAX:'2100-12-31';}
    $('[data-work-schedule]').hidden=mode!=='workdays';
    $('[data-work-range-presets]').hidden=mode==='add';
    $('[data-work-tool-scope]').textContent=mode==='workdays'?'Latvijas svētki: 2027–2030. Nedēļas grafiks attiecas arī uz gada un mēneša pārskatu zemāk.':'Kalendāra datumi: 1900–2100. Aprēķins izmanto datumus, nevis pulksteņa stundas; vasaras laika maiņa dienu skaitu nemaina.';
    calculateRange();
  }
  function calculateRange(){
    const output=$('[data-work-range-result]');range=null;toolResult=null;resultText='';
    const stat=(label,value)=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
    let title,dates,value,unit,stats,note,extra='';
    try{
      if(toolMode==='workdays'){
        if(!opts)throw Error('Vispirms pārbaudi darba grafika iestatījumus.');
        range=W.workPeriod(rangeForm.elements.from.value,rangeForm.elements.to.value,opts,{includeStart:rangeForm.elements.includeStart.checked,includeEnd:rangeForm.elements.includeEnd.checked});
        toolResult=range;title='Darba dienas izvēlētajā periodā';dates=`${C.dateLabel(range.from)} → ${C.dateLabel(range.to)}`;value=number(range.work);unit=one(range.work)?'darba diena':'darba dienas';
        stats=stat('Plānotās stundas',number(range.hours)+' h')+stat('Kalendārās dienas',number(range.days))+stat('Brīvdienas',number(range.rest))+stat('Saīsinātas dienas',number(range.shortened));
        note=`Sākuma diena ${range.includeStart?'ieskaitīta':'nav ieskaitīta'} · beigu diena ${range.includeEnd?'ieskaitīta':'nav ieskaitīta'}. ${settingsNote()}`;
        const holidayRows=range.rows.filter(row=>row.excludedHoliday);
        extra=`<div class="work-result-bars" aria-hidden="true"><i style="width:${100*range.work/Math.max(1,range.days)}%"></i><i style="width:${100*(range.rest-range.excludedHolidays)/Math.max(1,range.days)}%"></i><i style="width:${100*range.excludedHolidays/Math.max(1,range.days)}%"></i></div><p class="work-result-key"><span>Darbs ${range.work}</span><span>Pārējās brīvdienas ${range.rest-range.excludedHolidays}</span><span>Atņemtie svētki ${range.excludedHolidays}</span></p>${holidayRows.length?`<details class="work-result-holidays"><summary>Skatīt atņemtās svētku dienas · ${holidayRows.length}</summary><ul>${holidayRows.map(row=>`<li><time datetime="${row.date}">${esc(C.dateLabel(row.date))}</time><span>${esc(row.holiday.map(h=>h.title).join('; '))}</span></li>`).join('')}</ul></details>`:''}`;
      }else if(toolMode==='difference'){
        const r=W.difference(rangeForm.elements.from.value,rangeForm.elements.to.value,rangeForm.elements.includeBoth.checked);toolResult=r;
        title='Starpība starp datumiem';dates=`${C.dateLabel(r.from)} → ${C.dateLabel(r.to)}`;value=number(r.days);unit=one(r.days)?'diena':'dienas';
        stats=stat('Nedēļas + dienas',`${r.weeks} ned. un ${r.weekDays} d.`)+stat('Pilni mēneši + dienas',`${r.months} mēn. un ${r.monthDays} d.`)+stat('Sākuma diena',capitalize(C.weekdays[r.startWeekday-1]))+stat('Beigu diena',capitalize(C.weekdays[r.endWeekday-1]));
        note=`${r.inclusive?'Dienu un nedēļu kopsummā ieskaitīti abi datumi.':'Pilnas dienas starp datumiem; sākuma diena netiek pieskaitīta.'} Pilnie mēneši un atlikušās dienas raksturo kalendāra starpību.${r.reverse?' Datumi ir apgrieztā secībā; parādīts starpības lielums.':''}`;
      }else{
        if(rangeForm.elements.amount.value.trim()==='')throw Error('Ievadi pieskaitāmo vai atņemamo skaitu.');
        const r=W.shiftDate(rangeForm.elements.base.value,rangeForm.elements.amount.value,rangeForm.elements.unit.value);toolResult=r;
        title='Tavs aprēķinātais datums';dates=C.dateLabel(r.from);value=C.dateLabel(r.date);unit=capitalize(C.weekdays[r.weekday-1]);
        stats=stat('Izmaiņa dienās',(r.days>0?'+':'')+number(r.days))+stat('Nedēļas numurs',C.isoWeek(r.date).week)+stat('Ievadītais skaits',number(r.amount))+stat('Laika vienība',{days:'Dienas',weeks:'Nedēļas',months:'Mēneši'}[r.unit]);
        note=r.clamped?'Izvēlētās dienas šajā mēnesī nav — izmantota mēneša pēdējā diena.':'Pieskaitītas vai atņemtas kalendāra dienas. Svētki un nedēļas nogales datumu nepārbīda.';
      }
      output.classList.toggle('is-date-result',toolMode==='add');
      output.innerHTML=`<h3 id="work-result-title">${title}</h3><p class="work-result-dates">${esc(dates)}</p><div class="work-result-value"><strong>${esc(value)}</strong><span>${esc(unit)}</span></div><div class="work-result-grid">${stats}</div>${extra}<p class="work-result-note">${esc(note)}</p>`;
      $('[data-work-result-badge]').textContent=toolMode==='workdays'?'LATVIJA':'KALENDĀRA DATUMI';
      resultText=output.innerText;
    }catch(e){
      output.classList.remove('is-date-result');output.innerHTML=`<h3 id="work-result-title">Pārbaudi ievadītos datus</h3><p class="work-result-error">${esc(e.message)}</p>`;
      $('[data-work-result-badge]').textContent='NEPIECIEŠAMS LABOJUMS';
    }
    $$('[data-work-copy]').forEach(button=>button.disabled=!toolResult);
    $('[data-work-csv="range"]').disabled=!range;
    $('[data-work-csv="range"]').hidden=toolMode!=='workdays';
    $('[data-work-copy-feedback]').textContent='';$('[data-work-copy-manual]').hidden=true;
  }
  function shareLink(){
    const url=new URL(location.href);url.search=opts?query():'';url.hash='darba-periods';
    url.searchParams.set('tool',toolMode);
    const fields=toolMode==='add'?['base','amount','unit']:['from','to'];
    fields.forEach(key=>url.searchParams.set(key,rangeForm.elements[key].value));
    if(toolMode==='difference')url.searchParams.set('both',rangeForm.elements.includeBoth.checked?'1':'0');
    if(toolMode==='workdays'){url.searchParams.set('start',rangeForm.elements.includeStart.checked?'1':'0');url.searchParams.set('end',rangeForm.elements.includeEnd.checked?'1':'0');}
    return url.href;
  }
  async function copyTool(kind){
    if(!toolResult)return;
    const value=kind==='link'?shareLink():resultText+'\nKalendārs365 · kalendars365.lv';
    try{await navigator.clipboard.writeText(value);$('[data-work-copy-feedback]').textContent=kind==='link'?'Saite nokopēta. Atverot to, saglabājas šis aprēķins.':'Rezultāts nokopēts.';}
    catch(e){const label=$('[data-work-copy-manual]');label.hidden=false;$('[data-work-copy-label]').textContent='Kopē šo tekstu';label.querySelector('textarea').value=value;label.querySelector('textarea').select();$('[data-work-copy-feedback]').textContent='Automātiska kopēšana nav pieejama. Nokopē zemāk atlasīto tekstu.';}
    if(kind==='link'){const label=$('[data-work-copy-manual]');label.hidden=false;$('[data-work-copy-label]').textContent='Aprēķina saite';label.querySelector('textarea').value=value;}
  }
  function render(){
    annual=null;opts=null;error.hidden=true;
    try{
      opts=settings();annual=W.annual(year,opts);
      $$('[data-work-total]').forEach(el=>el.textContent=number(annual[el.dataset.workTotal]));
      $$('[data-work-table-total]').forEach(el=>el.textContent=number(annual[el.dataset.workTableTotal]));
      $$('[data-work-pick-month]').forEach(card=>{
        const n=Number(card.dataset.workPickMonth),data=annual.months[n-1];
        [...card.querySelectorAll('[data-month-value]')].forEach(el=>el.textContent=number(data[el.dataset.monthValue]));
        card.querySelector('.work-month-value>span').textContent=one(data.work)?'darba diena':'darba dienas';
        card.querySelector('.work-month-bar>span').style.width=(100*data.work/data.days)+'%';
        card.href=`/darba-dienu-kalendars/${year}/${slugs[n-1]}/?${query()}`;
      });
      $$('[data-work-table-month]').forEach(row=>{const data=annual.months[Number(row.dataset.workTableMonth)-1];[...row.querySelectorAll('[data-table-value]')].forEach(el=>el.textContent=number(data[el.dataset.tableValue]));row.querySelector('a').href=`/darba-dienu-kalendars/${year}/${slugs[data.month-1]}/?${query()}`;});
      $$('a[data-work-year]').forEach(a=>a.href=`/darba-dienu-kalendars/${a.dataset.workYear}/?${query()}`);
      $('[data-work-caption]').textContent=`Kalendārās dienas: ${annual.days} · Svētku brīvdienas atlasītajā grafikā: ${annual.excludedHolidays}`;
      $('[data-work-setting-note]').textContent=settingsNote();
      $$('[data-work-csv],[data-work-print]').forEach(button=>button.disabled=false);
      renderMonth();calculateRange();
    }catch(e){
      error.hidden=false;error.textContent=e.message;
      $$('[data-work-total],[data-month-value],[data-table-value],[data-work-table-total]').forEach(el=>el.textContent='—');
      $('[data-work-caption]').textContent='Rezultāti tiks parādīti pēc iestatījumu labošanas.';
      $('[data-work-calendar-grid]').innerHTML='<p style="grid-column:1/-1">Pārbaudi darba grafika iestatījumus augstāk.</p>';
      $('[data-work-day-detail]').textContent='Darba grafika iestatījumos ir kļūda.';
      $$('[data-work-csv],[data-work-print]').forEach(button=>button.disabled=true);
      opts=null;annual=null;range=null;calculateRange();
    }
  }
  function selectMonth(value){if(!annual)return;month=value;selected=annual.months[month-1].from;renderMonth();}
  function download(result,name){
    const url=URL.createObjectURL(new Blob([W.csv(result)],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    $('[data-work-feedback]').textContent='CSV fails sagatavots ar pašlaik izvēlētajiem darba grafika iestatījumiem.';
  }
  function preparePrint(){
    if(!annual)return;
    document.getElementById('work-print-sheet')?.remove();
    const data=annual.months[month-1],sheet=document.createElement('section');sheet.id='work-print-sheet';sheet.className='work-print-sheet';
    sheet.innerHTML=`<h1>${esc(capitalize(C.months[month-1]))} ${year}</h1><p>${esc(settingsNote())}</p><p><strong>Darba dienu skaits: ${data.work} · ${number(data.hours)} h · Brīvdienu skaits: ${data.rest}</strong></p><div class="work-calendar-weekdays">${['P','O','T','C','Pk','S','Sv'].map(label=>`<b>${label}</b>`).join('')}</div><div class="work-calendar-grid">${calendarHTML(true)}</div>${$('.work-legend').outerHTML}<footer>Kalendārs365 · kalendars365.lv</footer>`;
    document.body.append(sheet);document.body.classList.add('work-printing');
  }
  function clearPrint(){document.body.classList.remove('work-printing');document.getElementById('work-print-sheet')?.remove();}
  function printMonth(){preparePrint();window.print();}
  window.addEventListener('beforeprint',preparePrint);
  window.addEventListener('afterprint',clearPrint);
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{if(event.target.name==='hours'&&event.target.value!=='8')form.elements.shorten.checked=false;render();});
  form.addEventListener('reset',()=>setTimeout(()=>{render();$('[data-work-feedback]').textContent='Atjaunots noklusējums: pirmdiena–piektdiena, 8 h un pirmssvētku saīsinājums.';},0));
  rangeForm.addEventListener('submit',event=>{event.preventDefault();calculateRange()});
  rangeForm.addEventListener('input',calculateRange);
  root.addEventListener('keydown',event=>{const tab=event.target.closest('[data-work-tool-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=$$('[data-work-tool-tab]'),index=tabs.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;applyToolMode(tabs[next].dataset.workToolTab);tabs[next].focus();});
  monthSelect.addEventListener('change',()=>selectMonth(Number(monthSelect.value)));
  root.addEventListener('click',event=>{
    const toolTab=event.target.closest('[data-work-tool-tab]');if(toolTab){applyToolMode(toolTab.dataset.workToolTab);return;}
    const copier=event.target.closest('[data-work-copy]');if(copier){copyTool(copier.dataset.workCopy);return;}
    if(event.target.closest('[data-work-swap]')){const from=rangeForm.elements.from,to=rangeForm.elements.to;[from.value,to.value]=[to.value,from.value];calculateRange();return;}
    const quick=event.target.closest('[data-work-quick-days]');if(quick){try{const end=W.shiftDate(rangeForm.elements.from.value,Number(quick.dataset.workQuickDays)-(toolMode==='workdays'?1:0),'days').date;rangeForm.elements.to.value=toolMode==='workdays'&&end>W.MAX?W.MAX:end;calculateRange();}catch(e){$('[data-work-copy-feedback]').textContent=e.message;}return;}
    const picker=event.target.closest('[data-work-pick-month]');if(picker&&annual){event.preventDefault();selectMonth(Number(picker.dataset.workPickMonth));$('#darba-menesis').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});return;}
    const step=event.target.closest('[data-work-step]');if(step){selectMonth(month+Number(step.dataset.workStep));return;}
    const day=event.target.closest('[data-work-day]');if(day&&annual){selected=day.dataset.workDay;renderMonth();return;}
    const preset=event.target.closest('[data-work-range]');if(preset&&annual){const data=preset.dataset.workRange==='year'?annual:annual.months[month-1];rangeForm.elements.from.value=data.from;rangeForm.elements.to.value=data.to;calculateRange();return;}
    const exporter=event.target.closest('[data-work-csv]');if(exporter){const data=exporter.dataset.workCsv==='year'?annual:range;if(data)download(data,`kalendars365-darba-dienas-${data.from}-${data.to}.csv`);return;}
    if(event.target.closest('[data-work-print]')&&annual)printMonth();
  });
  restoreQuery();render();applyToolMode();
})();
