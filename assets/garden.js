(()=>{
 'use strict';
 const root=document.querySelector('[data-garden-app]'),profile=document.querySelector('[data-garden-profile]'),G=window.GardenCalendarCore,C=window.CalendarCore;
 if((!root&&!profile)||!G||!C)return;
 const KEY='kalendars365.garden.v1',esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const data=root?JSON.parse(root.querySelector('[data-garden-data]').textContent):{crops:[]},crops=new Map(data.crops.map(c=>[c.id,c]));
 const names={sow:'Sēja',plant:'Stādīšana / dēsti',harvest:'Ražas novākšana',other:'Dārza darbs'},expanded=new Set();
 let state;try{state=G.state(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{state=G.state();}
 let printMode='overview';
 const $=selector=>root?.querySelector(selector),planForm=$('.g-plan-form');
 function announce(text){const node=document.querySelector('[data-garden-feedback]')||document.querySelector('[data-garden-count]');if(node)node.textContent=text;}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{announce('Izmaiņas ir redzamas, bet pārlūka krātuve nav pieejama. Saglabā JSON dublējumu.');return false;}}
 function updateSaved(){document.querySelectorAll('[data-garden-save-crop]').forEach(button=>{const saved=state.saved.includes(button.dataset.gardenSaveCrop);button.setAttribute('aria-pressed',String(saved));button.textContent=saved?'Saglabāts manā sarakstā ✓':'Saglabāt kultūru manā sarakstā';});}
 function renderPlan(){
  const holder=$('[data-garden-reminders]');if(!holder)return;
  const list=[...state.reminders].sort((a,b)=>a.date.localeCompare(b.date)||a.cropName.localeCompare(b.cropName,'lv'));
  holder.innerHTML=list.length?`<ul>${list.map(r=>`<li><div><time datetime="${r.date}">${esc(C.dateLabel(r.date))}</time><h4>${esc(r.cropName)} · ${esc(names[r.task]||names.other)}</h4><p>${esc(r.note)}</p><p>${esc(r.place)} · ${esc(r.region)}</p></div><div class="g-reminder-actions"><button type="button" data-garden-edit="${esc(r.id)}" aria-label="Labot: ${esc(r.cropName)} ${r.date}">Labot</button><button type="button" data-garden-remove-reminder="${esc(r.id)}" aria-label="Noņemt: ${esc(r.cropName)} ${r.date}">Noņemt</button></div></li>`).join('')}</ul>`:'<p class="g-plan-empty">Tavas nākamās sezonas plāns sāksies ar pirmo kultūru un datumu.</p>';
  if(state.saved.length)holder.insertAdjacentHTML('beforeend',`<section class="g-saved-list"><h3>Manas kultūras</h3><div>${state.saved.map(id=>`<span>${esc(crops.get(id)?.name||id)}<button type="button" data-garden-remove-crop="${esc(id)}" aria-label="Noņemt kultūru: ${esc(crops.get(id)?.name||id)}">×</button></span>`).join('')}</div></section>`);
  $('[data-garden-plan-count]').textContent=`Darbi plānā: ${list.length}`;
  $('[data-garden-export]').disabled=!list.length;
  $('[data-garden-print="plan"]').disabled=!list.length;
  $('[data-garden-backup]').disabled=!list.length&&!state.saved.length;
 }
 function filters(){return {month:Number($('[data-garden-month-filter]').value),task:$('[data-garden-task]').value,place:$('[data-garden-cultivation]').value,query:$('[data-garden-search]').value};}
 function filter(){
  if(!root)return;const f=filters();let count=0;
  for(const crop of data.crops){
   const visible=G.matches(crop,f),row=$(`[data-g-season-row="${crop.id}"]`),detail=$(`[data-g-detail="${crop.id}"]`);row.hidden=!visible;detail.hidden=!visible||!expanded.has(crop.id);if(visible)count++;
   row.querySelectorAll('[data-g-cell-month]').forEach(cell=>{const month=Number(cell.dataset.gCellMonth);cell.classList.toggle('is-current-month',month===f.month);cell.querySelectorAll('[data-g-stage-task]').forEach(token=>{token.hidden=!G.matchingActions(crop,{...f,month,task:token.dataset.gStageTask}).some(a=>(f.task==='all'||a.task===f.task));});});
   detail.querySelectorAll('[data-g-action-months]').forEach(action=>{action.hidden=!!f.month&&!action.dataset.gActionMonths.split(',').map(Number).includes(f.month)||(f.task!=='all'&&action.dataset.gActionTask!==f.task)||(f.place!=='all'&&!action.dataset.gActionPlaces.split(',').includes(f.place));});
  }
  root.querySelectorAll('[data-g-month-header]').forEach(th=>th.classList.toggle('is-current-month',Number(th.dataset.gMonthHeader)===f.month));
  $('[data-garden-count]').textContent=`Kultūras pārskatā: ${count} no ${data.crops.length}`;$('[data-garden-empty]').hidden=count>0;
  const season=$('[data-garden-season-note]');
  season.textContent=f.month?`${C.months[f.month-1].charAt(0).toUpperCase()+C.months[f.month-1].slice(1)}. ${[11,12,1,2].includes(f.month)?'Ziemas ieraksti attiecas tikai uz norādīto kultūru un audzēšanas veidu. ':''}Mēneša atzīme nav precīzas dienas vai ražas garantija.`:'Laika logi ir orientieri. Pārbaudi šķirni, augsnes siltumu un vietējo salnu risku.';
 }
 function regionNote(){const note=$('[data-garden-region-note]');if(note)note.textContent=`${state.region}. Piekrastē un iekšzemē sezonas atšķiras; datumus nepārbīdām ar vienādu dienu skaitu. Pirms darba pārbaudi vietējos apstākļus.`;}
 function resetPlanForm(){if(!planForm)return;planForm.reset();planForm.elements.editId.value='';planForm.elements.place.value=state.place;planForm.elements.region.value=state.region;$('[data-garden-cancel-edit]').hidden=true;$('[data-garden-save-plan]').textContent='Pievienot manam plānam +';}
 function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 function planCrop(id){if(!planForm)return;planForm.elements.cropId.value=id;const f=filters();if(f.task!=='all')planForm.elements.task.value=f.task;$('#garden-my-plan').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});planForm.elements.date.focus({preventScroll:true});announce('Izvēlies savu datumu un šķirnes vai dobes piezīmi.');}
 function clearPrint(){document.body.classList.remove('garden-printing');document.getElementById('garden-print-sheet')?.remove();}
 function preparePrint(){
  if(!root)return;document.getElementById('garden-print-sheet')?.remove();const sheet=document.createElement('section');sheet.id='garden-print-sheet';sheet.className='g-print-sheet '+(printMode==='plan'?'is-plan':'is-overview');
  if(printMode==='plan'){
   sheet.innerHTML=`<h1>Mans dārza plāns</h1><p>Personiski izvēlēti datumi · Darbu skaits: ${state.reminders.length}</p><table><thead><tr><th>Datums</th><th>Kultūra un darbs</th><th>Piezīme un vieta</th></tr></thead><tbody>${[...state.reminders].sort((a,b)=>a.date.localeCompare(b.date)).map(r=>`<tr><th>${esc(C.dateLabel(r.date))}</th><td>${esc(r.cropName)}<br>${esc(names[r.task])}</td><td>${esc(r.note)}<br>${esc(r.place)} · ${esc(r.region)}</td></tr>`).join('')}</tbody></table>`;
  }else{
   const f=filters(),selected=data.crops.filter(c=>G.matches(c,f));
   sheet.innerHTML=`<h1>Sējas un stādīšanas kalendārs Latvijā</h1><p>Sezonas orientieri · ${f.month?esc(C.months[f.month-1]):'viss gads'} · ${selected.length} kultūras</p><table><thead><tr><th>Kultūra</th>${['Jan','Feb','Mar','Apr','Mai','Jūn','Jūl','Aug','Sep','Okt','Nov','Dec'].map(m=>`<th>${m}</th>`).join('')}</tr></thead><tbody>${selected.map(c=>`<tr><th>${esc(c.name)}</th>${Array.from({length:12},(_,i)=>`<td${f.month===i+1?' class="is-current-month"':''}>${[...new Set(G.matchingActions(c,{...f,month:i+1}).map(a=>a.task))].map(task=>`<b class="g-stage g-stage--${task}">${{sow:'S',plant:'D',harvest:'R'}[task]}</b>`).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table><p>S — sēja · D — stādīšana / dēsti · R — ražas novākšana. Pārbaudi šķirni, augsni un vietējo salnu risku.</p><p>Avoti un periodu nosacījumi: kalendars365.lv/sejas-kalendars/</p>`;
  }
  sheet.innerHTML+='<footer>Kalendārs365 · kalendars365.lv</footer>';document.body.append(sheet);document.body.classList.add('garden-printing');
 }
 if(root){window.addEventListener('beforeprint',preparePrint);window.addEventListener('afterprint',clearPrint);}
 document.addEventListener('submit',event=>{
  const form=event.target;
  if(form.matches('[data-garden-reminder-form]')){
   event.preventDefault();const fd=new FormData(form),id=String(fd.get('cropId')||form.dataset.cropId||''),crop=crops.get(id),task=String(fd.get('task')||'other'),cropName=crop?.name||profile?.querySelector('.garden-profile-lead h2')?.textContent.split(':')[0]||id;
   try{
    const editId=String(fd.get('editId')||''),item=G.reminder({id:editId||crypto.randomUUID(),cropId:id,cropName,note:String(fd.get('note')||'').trim()||names[task],date:String(fd.get('date')||''),task,place:String(fd.get('place')||state.place),region:String(fd.get('region')||state.region)});
    if(!editId&&state.reminders.length>=500)throw Error('Plānā var saglabāt līdz 500 ierakstiem.');
    state.reminders=editId?state.reminders.map(r=>r.id===editId?item:r):[...state.reminders,item];state.place=item.place;state.region=item.region;if(!state.saved.includes(id))state.saved.push(id);
    const saved=persist();renderPlan();updateSaved();regionNote();if(planForm)resetPlanForm();else form.reset();if(saved)announce(editId?'Ieraksts atjaunināts šajā pārlūkā.':'Darbs saglabāts šajā pārlūkā.');
   }catch(error){announce(error.message);}
  }
  if(form.matches('[data-variety-timing]')){
   event.preventDefault();const fd=new FormData(form),min=Number(fd.get('minDays')),max=Number(fd.get('maxDays')),output=form.querySelector('output');
   try{const date=G.date(String(fd.get('date')||''));if(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max<min||max>365)throw Error('Pārbaudi dienu intervālu (1–365).');const sourced=fd.get('basis')==='sowing'&&min===Number(form.dataset.sourceMin)&&max===Number(form.dataset.sourceMax);output.textContent=`Gatavības pārbaude: ${C.dateLabel(C.dateISO(C.addDays(date,min)))} – ${C.dateLabel(C.dateISO(C.addDays(date,max)))}. ${sourced?'Avota intervāls attiecas tikai uz norādīto kultūru un sējas sākumu.':'Pēc tava ievadītā dienu skaita; tas nav valsts kalendāra termiņš.'}`;}catch(error){output.textContent=error.message;}
  }
 });
 document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-g-expand')){const id=button.dataset.gExpand;expanded.has(id)?expanded.delete(id):expanded.add(id);button.setAttribute('aria-expanded',String(expanded.has(id)));button.querySelector('b').textContent=expanded.has(id)?'−':'+';filter();}
  if(button.hasAttribute('data-g-plan-crop'))planCrop(button.dataset.gPlanCrop);
  if(button.hasAttribute('data-garden-save-crop')){const id=button.dataset.gardenSaveCrop;state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];persist();updateSaved();renderPlan();}
  if(button.hasAttribute('data-garden-remove-crop')){state.saved=state.saved.filter(id=>id!==button.dataset.gardenRemoveCrop);persist();updateSaved();renderPlan();}
  if(button.hasAttribute('data-garden-remove-reminder')){state.reminders=state.reminders.filter(r=>r.id!==button.dataset.gardenRemoveReminder);persist();renderPlan();if(planForm?.elements.editId.value===button.dataset.gardenRemoveReminder)resetPlanForm();}
  if(button.hasAttribute('data-garden-edit')){const r=state.reminders.find(r=>r.id===button.dataset.gardenEdit);if(r&&planForm){for(const key of ['cropId','date','task','note','place','region'])planForm.elements[key].value=r[key];planForm.elements.editId.value=r.id;$('[data-garden-cancel-edit]').hidden=false;$('[data-garden-save-plan]').textContent='Saglabāt izmaiņas';planForm.elements.date.focus();}}
  if(button.hasAttribute('data-garden-cancel-edit'))setTimeout(resetPlanForm,0);
  if(button.hasAttribute('data-garden-this-month')){$('[data-garden-month-filter]').value=String(Number(C.todayRiga().slice(5,7)));filter();}
  if(button.hasAttribute('data-garden-export')){try{download(G.ics(state),'text/calendar;charset=utf-8','mans-darza-plans.ics');announce('ICS kalendārs sagatavots ar taviem datumiem.');}catch(error){announce(error.message);}}
  if(button.hasAttribute('data-garden-backup')){download(G.backup(state),'application/json;charset=utf-8','mans-darza-plans.json');announce('JSON dublējums sagatavots.');}
  if(button.hasAttribute('data-garden-print')){printMode=button.dataset.gardenPrint;preparePrint();window.print();}
 });
 if(root){
  const form=$('[data-garden-filters]'),month=$('[data-garden-month-filter]');month.value=root.dataset.gardenInitialMonth||'0';
  form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',filter);form.addEventListener('change',filter);form.addEventListener('reset',()=>setTimeout(()=>{month.value=root.dataset.gardenInitialMonth||'0';filter();},0));
  const region=$('[data-garden-region]');region.value=state.region;region.addEventListener('change',()=>{state.region=region.value;if(planForm)planForm.elements.region.value=state.region;persist();regionNote();});
  planForm.elements.place.value=state.place;planForm.elements.region.value=state.region;
  $('[data-garden-import]').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Izvēlies JSON failu līdz 1 MB.');const incoming=G.parseBackup(await file.text()),merged=G.merge(state,incoming);state=merged;const saved=persist();renderPlan();updateSaved();if(saved)announce('Dublējums pievienots. Iepriekšējie darbi saglabāti, vienādi ieraksti nav dublēti.');}catch(error){announce('Dublējums nav atvērts. '+error.message);}event.target.value='';});
  let checks={};try{checks=JSON.parse(localStorage.getItem('kalendars365.garden.checks.v1')||'{}');}catch{}
  root.querySelectorAll('[data-garden-check]').forEach(input=>{input.checked=!!checks[input.dataset.gardenCheck];input.addEventListener('change',()=>{checks[input.dataset.gardenCheck]=input.checked;try{localStorage.setItem('kalendars365.garden.checks.v1',JSON.stringify(checks));}catch{}});});
  filter();regionNote();renderPlan();
 }
 updateSaved();
})();
