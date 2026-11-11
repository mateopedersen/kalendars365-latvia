import {plannerScenes,makePlannerFile,plannerDesigns} from './planner-exports.mjs';
const root=document.querySelector('.category-v2');
if(root){
 const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const select of $$('[data-export-design],[data-period-design]')){
  const value=select.value;select.innerHTML=plannerDesigns.map((name,i)=>`<option value="${i+1}">${String(i+1).padStart(2,'0')} · ${esc(name)}</option>`).join('');select.value=value;
 }
 const studio=$('[data-v2-designs]');
 if(studio){
  const dialog=$('[data-v2-preview]'),grid=$('[data-v2-design-grid]'),status=$('[data-v2-design-status]');let current=null,lastButton=null;
  const model=()=>{const api=window.K365CategoryExports;if(!api)throw Error('Kalendārs vēl ielādējas. Mēģini pēc brīža.');return studio.dataset.v2Designs==='period'?api.period():studio.dataset.v2Designs==='shift'?api.shift():api.organizer(studio.dataset.v2Designs);};
  function render(){try{const snapshot=model();grid.innerHTML=plannerDesigns.map((name,i)=>{const thumbnail={...snapshot,rows:snapshot.rows.map(r=>({...r,text:String(r.text||'').slice(0,100)}))};const scene=plannerScenes(thumbnail,{design:i+1})[0];return `<button class="v2-design-tile" type="button" data-v2-design="${i+1}" aria-label="Priekšskatīt: ${esc(name)}"><span aria-hidden="true">${scene}</span><strong>${String(i+1).padStart(2,'0')} · ${esc(name)}</strong><small>Priekšskatīt savu plānu ↗</small></button>`;}).join('');status.textContent='';}catch(e){status.textContent=e.message;}}
  grid.addEventListener('click',e=>{const button=e.target.closest('[data-v2-design]');if(!button)return;try{current={model:model(),design:Number(button.dataset.v2Design)};lastButton=button;$('[data-v2-preview-title]').textContent=plannerDesigns[current.design-1]+' · '+current.model.title;$('[data-v2-preview-content]').innerHTML=plannerScenes(current.model,{design:current.design}).join('');$('[data-v2-preview-status]').textContent='';dialog.showModal();}catch(e){status.textContent=e.message;}});
  $('[data-v2-preview-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>lastButton?.focus());
  for(const button of $$('[data-v2-download]'))button.addEventListener('click',async()=>{if(!current)return;const buttons=$$('[data-v2-download]'),out=$('[data-v2-preview-status]');try{buttons.forEach(b=>b.disabled=true);out.textContent='Sagatavojam tavu kalendāru…';const file=await makePlannerFile(current.model,{format:button.dataset.v2Download,design:current.design}),url=URL.createObjectURL(file.blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);out.textContent=`Sagatavots: ${file.name}${file.pages>1?' · '+file.pages+' lapas':''}.`;}catch(e){out.textContent=e.message||'Failu nevar sagatavot.';}finally{buttons.forEach(b=>b.disabled=false);}});
  // Render only once visible, then refresh when revisiting after edits.
  let timer;const update=()=>{clearTimeout(timer);timer=setTimeout(render,150);};
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))render();},{rootMargin:'100px'});observer.observe(studio);
  window.addEventListener('k365:category-ready',update);root.addEventListener('change',()=>{if(studio.getBoundingClientRect().top<innerHeight+100)update();});
 }
 // Separate study and family editing areas are navigable without a wall of forms.
 for(const section of $$('.organizer-two-col>.organizer-card')){section.classList.add('v2-editor-card');}
 // Clear an unnecessary Jan 1 default when an actual month is given in the URL.
 const names=$('[data-names-form]');if(names){const params=new URLSearchParams(location.search);for(const key of ['year','month','kind']){const value=params.get(key),el=names.elements[key];if(value!==null&&[...el.options].some(o=>o.value===value))el.value=value;}names.dispatchEvent(new Event('change',{bubbles:true}));}
}
