import {plannerScenes,makePlannerFile,plannerDesigns,weeklyDesigns,familyDesigns,shiftDesigns,schoolDesigns} from './planner-exports.mjs';
const root=document.querySelector('.category-v2');
if(root){
 const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const select of $$('[data-export-design],[data-period-design]')){
  const value=select.value;select.innerHTML=plannerDesigns.map((name,i)=>`<option value="${i+1}">${String(i+1).padStart(2,'0')} · ${esc(name)}</option>`).join('');select.value=value;
 }
 const studio=$('[data-v2-designs]');
 const isWeekly=m=>m.type==='week'&&!['family','school'].includes(m.kind);
 const catalog=m=>m.kind==='school'?schoolDesigns:m.kind==='shift'?shiftDesigns:m.kind==='family'?familyDesigns:isWeekly(m)?weeklyDesigns:plannerDesigns.map((name,i)=>({id:i+1,name,description:'Priekšskatīt savu plānu ↗'}));
 const syncDesignSelects=m=>{for(const select of $$('[data-period-design],[data-export-design]')){const list=catalog(m),kind=m.kind==='school'?'school':m.kind==='shift'?'shift':m.kind==='family'?'family':isWeekly(m)?'weekly':'standard';if(select.dataset.catalog===kind)continue;const chosen=m.kind==='school'?String(m.template):select.value;select.innerHTML=list.map(d=>`<option value="${d.id}">${String(d.id).padStart(2,'0')} · ${esc(d.name)}</option>`).join('');select.value=chosen;select.dataset.catalog=kind;}};
 if(studio){
  const dialog=$('[data-v2-preview]'),grid=$('[data-v2-design-grid]'),status=$('[data-v2-design-status]');let current=null,lastButton=null;
  const model=()=>{const api=window.K365CategoryExports;if(!api)throw Error('Kalendārs vēl ielādējas. Mēģini pēc brīža.');return studio.dataset.v2Designs==='period'?api.period():studio.dataset.v2Designs==='shift'?api.shift():api.organizer(studio.dataset.v2Designs);};
  function render(){try{const snapshot=model();syncDesignSelects(snapshot);if(studio.classList.contains('weekly-design-studio')){studio.querySelector('h2').textContent=snapshot.kind==='school'?'15 stundu saraksti drukai':snapshot.kind==='shift'?'15 maiņu grafika dizaini drukai':snapshot.kind==='family'?'15 ģimenes plānotāji drukai':isWeekly(snapshot)?'15 nedēļas plānotāji drukai':'15 kalendāra dizaini drukai';}grid.innerHTML=catalog(snapshot).map(d=>{const thumbnail={...snapshot,rows:snapshot.rows.map(r=>({...r,text:String(r.text||'').slice(0,100)}))};const scene=plannerScenes(thumbnail,{design:d.id})[0];return `<button class="v2-design-tile" type="button" data-v2-design="${d.id}" aria-label="Priekšskatīt: ${esc(d.name)}"><span aria-hidden="true">${scene}</span><strong>${String(d.id).padStart(2,'0')} · ${esc(d.name)}</strong><small>${esc(d.description)}</small>${(isWeekly(snapshot)||['family','shift','school'].includes(snapshot.kind))?'<span class="v2-tile-action">Atvērt priekšskatījumu <b aria-hidden="true">↗</b></span>':''}</button>`;}).join('');status.textContent='';}catch(e){status.textContent=e.message;}}
  grid.addEventListener('click',e=>{const button=e.target.closest('[data-v2-design]');if(!button)return;try{current={model:model(),design:Number(button.dataset.v2Design)};lastButton=button;if(['shift','school'].includes(current.model.kind)&&$('[data-export-design]')){$('[data-export-design]').value=current.design;if(current.model.kind==='school')$('[data-export-design]').dispatchEvent(new Event('change',{bubbles:true}));}$('[data-v2-preview-title]').textContent=catalog(current.model)[current.design-1].name+' · '+current.model.title;$('[data-v2-preview-content]').innerHTML=plannerScenes(current.model,{design:current.design}).join('');$('[data-v2-preview-status]').textContent='';dialog.showModal();}catch(e){status.textContent=e.message;}});
  $('[data-v2-preview-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{const target=current?grid.querySelector('[data-v2-design="'+current.design+'"]'):lastButton;(target||lastButton)?.focus();});
  for(const button of $$('[data-v2-download]'))button.addEventListener('click',async()=>{if(!current)return;const buttons=$$('[data-v2-download]'),out=$('[data-v2-preview-status]');try{buttons.forEach(b=>b.disabled=true);out.textContent='Sagatavojam tavu kalendāru…';const file=await makePlannerFile(current.model,{format:button.dataset.v2Download,design:current.design}),url=URL.createObjectURL(file.blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);out.textContent=`Sagatavots: ${file.name}${file.pages>1?' · '+file.pages+' lapas':''}.`;}catch(e){out.textContent=e.message||'Failu nevar sagatavot.';}finally{buttons.forEach(b=>b.disabled=false);}});
  // Render only once visible, then refresh when revisiting after edits.
  let timer;const update=()=>{clearTimeout(timer);timer=setTimeout(render,150);};
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))render();},{rootMargin:'100px'});observer.observe(studio);
  window.addEventListener('k365:category-ready',()=>{try{syncDesignSelects(model());}catch{}if(studio.getBoundingClientRect().top<innerHeight+100)update();});
  window.addEventListener('k365:shift-updated',()=>{if(studio.getBoundingClientRect().top<innerHeight+100)update();});
  window.addEventListener('k365:school-updated',()=>{try{const snapshot=model();syncDesignSelects(snapshot);if(snapshot.kind==='school'&&$('[data-export-design]'))$('[data-export-design]').value=String(snapshot.template);}catch{}if(studio.getBoundingClientRect().top<innerHeight+100)update();});
  const calendarTitle=root.querySelector('#calendar-title,[data-family-week-title],[data-class-week-title]');
  if(calendarTitle)new MutationObserver(()=>{try{syncDesignSelects(model());}catch{}if(studio.getBoundingClientRect().top<innerHeight+100)update();}).observe(calendarTitle,{childList:true,subtree:true,characterData:true});
  if(window.K365CategoryExports)try{syncDesignSelects(model());}catch{}
 root.addEventListener('change',()=>{if(studio.getBoundingClientRect().top<innerHeight+100)update();});
 }
 // Separate study and family editing areas are navigable without a wall of forms.
 for(const section of $$('.organizer-two-col>.organizer-card')){section.classList.add('v2-editor-card');}
 // Clear an unnecessary Jan 1 default when an actual month is given in the URL.
 const names=$('[data-names-form]');if(names){const params=new URLSearchParams(location.search);for(const key of ['year','month','kind']){const value=params.get(key),el=names.elements[key];if(value!==null&&[...el.options].some(o=>o.value===value))el.value=value;}names.dispatchEvent(new Event('change',{bubbles:true}));}
}
