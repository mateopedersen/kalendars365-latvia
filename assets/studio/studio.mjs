import {FONTS,STUDIO_PHOTOS,PRESETS,applyPreset,LOCALES,uid,esc,clamp,clone,initialState,normalize,validDate,moveMonth,dimensions,eventsFor,renderCalendar,exportPages,parseEvents,eventsICS} from './engine.mjs?v=541569fccac8';

const root=document.getElementById('calendar-studio');
if(root){
const $=(s,el=root)=>el.querySelector(s),$$=(s,el=root)=>[...el.querySelectorAll(s)];
const icons={calendar:'M5 4v4m14-4v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12H3V8a2 2 0 0 1 2-2m2 8h2m4 0h2m-8 4h2m4 0h2',sparkles:'m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z',undo:'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12',redo:'m15 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12',folder:'M3 6h7l2 3h9v11H3Zm0 0V4h7l2 2h7v3',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',templates:'M3 3h8v8H3Zm11 0h7v12h-7ZM3 14h8v7H3Zm11 4h7v3h-7Z',layout:'M3 3h18v18H3Zm0 6h18M9 9v12',type:'M4 4h16M12 4v17M8 21h8M4 4v4m16-4v4',image:'M3 3h18v18H3Zm0 14 6-6 5 5 3-3 4 4M16 7h.01',event:'M5 3v4m14-4v4M3 10h18M3 6h18v15H3Zm5 9 3 3 5-5',layers:'m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 17l9 5 9-5',info:'M12 8h.01M12 11v6m0-15a10 10 0 1 0 0 20 10 10 0 0 0 0-20',plus:'M12 5v14M5 12h14',shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Zm-5 10 3 3 7-7',copy:'M9 9h12v12H9ZM4 15H3V3h12v1',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',back:'M4 10h10v11H4Zm5-5h10v11h-2M14 3v5m-3-3 3 3 3-3',front:'M10 4h10v10H10ZM4 10h3v10h10v-3M14 3v5m-3-3 3-3 3 3',move:'M12 2v20M2 12h20M8 6l4-4 4 4m-8 12 4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4',expand:'M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6',file:'M5 2h9l5 5v15H5Zm9 0v6h5M8 13h8m-8 4h8',vector:'M4 4h16v16H4Zm-2-2h4v4H2Zm16 0h4v4h-4ZM2 18h4v4H2Zm16 0h4v4h-4Z',print:'M6 8V2h12v6M6 17H3V8h18v9h-3M6 14h12v8H6Zm11-3h1',edit:'m4 17 11-11 4 4L8 21H4Zm11-11 3-3 4 4-3 3'};
function icon(name){return `<svg class="studio-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${icons[name]||icons.calendar}"/></svg>`;}
$$('[data-icon]').forEach(node=>{if(node.className){node.innerHTML=icon(node.dataset.icon);node.removeAttribute('data-icon');}else node.outerHTML=icon(node.dataset.icon);});
let state=initialState(),selected=null,history=[],future=[],activeTab='design',lastKey='',lastAt=0,saveTimer,renderFrame,zoom='fit',busy=false,drag=null,exportController=null,exportModule=null;
const fonts=Object.entries(FONTS).map(([key,font])=>`<option value="${key}">${font.label}</option>`).join('');$$('[data-font-select]').forEach(el=>el.innerHTML=fonts);
$('#studio-month-select').innerHTML=LOCALES.lv.months.map((m,i)=>`<option value="${i+1}">${m[0].toUpperCase()+m.slice(1)}</option>`).join('');
$('#studio-presets').innerHTML=PRESETS.map(p=>{
 const preview=applyPreset(initialState(),p.id);preview.title=p.id==='editorial'?'Mans stāsts':'Mans gads';preview.subtitle='';preview.footer='';
 if(p.id==='photo'){preview.photo='/assets/cities/riga-480.webp';preview.photoRatio=1.5;}
 const art=renderCalendar(preview,{idPrefix:'studio-preset-'+p.id}).replace('<svg ','<svg class="studio-preset-art" aria-hidden="true" ').replace('role="img"','');
 return `<button type="button" data-preset="${p.id}" aria-pressed="false">${art}<div><strong>${p.label}</strong><small>${p.note}</small></div></button>`;
}).join('');
const palettes=[['Latvijas karmīns','#8a2946','#352c35','#fffdf8','#a53753'],['Tinte','#352c35','#352c35','#fffdf9','#bd293e'],['Mežs','#256451','#213a32','#fafbf7','#a84a39'],['Terakota','#a84a39','#442e27','#fffaf4','#246c88'],['Baltijas nakts','#4c75bb','#f3f7ff','#15243b','#f1a5aa']];
$('#studio-palettes').innerHTML=palettes.map(([label,a,i,p,w],n)=>`<button type="button" data-palette="${n}" aria-label="Palete ${label}" title="${label}"><span style="background:${a}"></span><span style="background:${p}"></span><span style="background:${w}"></span></button>`).join('');
function tell(message,error=false){const n=$('#studio-message');n.textContent=message;n.dataset.error=String(error);}
function snapshot(key=''){const now=Date.now();if(key!==lastKey||now-lastAt>650||!key){history.push(clone(state));if(history.length>30)history.shift();}future=[];lastKey=key;lastAt=now;}
function change(fn,key=''){snapshot(key);fn();schedule();}
function schedule({save=true}={}){cancelAnimationFrame(renderFrame);renderFrame=requestAnimationFrame(render);if(save){$('#studio-save-state').textContent='Saglabājam izmaiņas…';clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,800);}}
function switchTab(tab,focus=false){activeTab=tab;$$('[data-tab]').forEach(b=>{const yes=b.dataset.tab===tab;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;if(yes&&focus)b.focus();});$$('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab);$('.studio-inspector').scrollTop=0;}
function fit(){const board=$('#studio-artboard'),paper=$('#studio-paper'),style=getComputedStyle(board),available=board.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=board.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom),d=dimensions(state),ratio=String(d.width/d.height);if(board.style.getPropertyValue('--studio-page-ratio')!==ratio)board.style.setProperty('--studio-page-ratio',ratio);board.classList.toggle('studio-fit-mode',zoom==='fit');const width=`${Math.round((zoom==='fit'?Math.max(180,Math.min(available,height*d.width/d.height)):1000*Number(zoom))*100)/100}px`;if(paper.style.width!==width)paper.style.width=width;}
function sync(){
  $$('[data-setting]').forEach(el=>{const value=state[el.dataset.setting];if(el.type==='checkbox')el.checked=!!value;else if(document.activeElement!==el)el.value=String(value);});
  $$('[data-color]').forEach(el=>el.value=state.colors[el.dataset.color]);
  $$('[data-value]').forEach(el=>{const key=el.dataset.value;el.textContent=key==='textScale'?`${Math.round(state[key]*100)} %`:key==='margin'?`${state[key]} mm`:key==='titleSize'?state[key]:`${state[key]} %`;});
  $$('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===state.template)));
  $('#studio-undo').disabled=!history.length;$('#studio-redo').disabled=!future.length;
  const monthly=state.view==='month';$('#studio-month-select').disabled=!monthly;$('#studio-prev').disabled=!monthly||(state.year===2027&&state.month===1);$('#studio-next').disabled=!monthly||(state.year===2030&&state.month===12);
  $('#studio-preview-label').textContent=monthly?`${LOCALES[state.locale].months[state.month-1]} ${state.year}`:`Gada kalendārs · ${state.year}`;
  const d=dimensions(state);$('#studio-paper-size').textContent=`${state.paper==='letter'?'Letter':state.paper.toUpperCase()} · ${Math.round(d.mmWidth*10)/10} × ${Math.round(d.mmHeight*10)/10} mm`;
  $('#studio-photo-current').hidden=!state.photo;$('#studio-drop').hidden=!!state.photo;
  if(state.photo&&$('#studio-photo-thumb').src!==state.photo)$('#studio-photo-thumb').src=state.photo;
  if(!state.photo)$('#studio-photo-thumb').removeAttribute('src');
  $('#studio-event-count').textContent=state.events.length;$('#studio-events-ics').disabled=!state.events.length;
  if(!$('#studio-event-form').elements.date.value)$('#studio-event-form').elements.date.value=`${state.year}-${String(state.month).padStart(2,'0')}-01`;
  const scope=$('#studio-export-scope');scope.options[1].disabled=!monthly;if(!monthly)scope.value='current';
  const count=exportPages(state,scope.value).length;$('#studio-export-summary').textContent=`${$('#studio-paper-size').textContent} · ${state.quality} dpi`;
  const pxWidth=Math.round(d.mmWidth/25.4*state.quality),pxHeight=Math.round(d.mmHeight/25.4*state.quality);$('#studio-export-resolution').textContent=`${pxWidth} × ${pxHeight} px`;
  $('#studio-export-image-note').textContent=count>1?`JPG un PNG: ${count} lapas vienā ZIP arhīvā. SVG ietver pašreizējo lapu.`:'JPG un PNG saglabā pašreizējo kalendāra lapu. SVG ir mērogojams vektorfails.';
}
function render(){
  sync();$('#studio-paper').innerHTML=renderCalendar(state,{editing:true,selected,idPrefix:'studio-preview'});fit();
  const sorted=[...state.events].sort((a,b)=>a.date.localeCompare(b.date));
  $('#studio-events-list').innerHTML=sorted.length?sorted.map(e=>`<div class="studio-event-row"><span class="studio-event-color" style="background:${e.color}"></span><div><strong>${esc(e.title)}</strong><small>${esc(e.date.split('-').reverse().join('.'))}${e.annual?' · katru gadu':''}</small></div><button type="button" data-edit-event="${e.id}" aria-label="Rediģēt ${esc(e.title)}">${icon('edit')}</button><button type="button" data-delete-event="${e.id}" aria-label="Dzēst ${esc(e.title)}">${icon('trash')}</button></div>`).join(''):'<p class="studio-empty">Šeit būs tavas dzimšanas dienas, jubilejas un plāni. Pievieno pirmo notikumu augstāk.</p>';
  $('#studio-layers-list').innerHTML=state.layers.length?[...state.layers].reverse().map(l=>`<button type="button" data-select-layer="${l.id}" aria-pressed="${l.id===selected}">${icon(l.type==='image'?'image':'type')}<span>${esc(l.type==='image'?'Attēls / logotips':l.text.slice(0,50)||'Tukšs teksts')}</span></button>`).join(''):'<p class="studio-empty">Pievieno tekstu vai attēlu, atlasi to uz lapas un pārvieto.</p>';
  const layer=state.layers.find(l=>l.id===selected);$('#studio-layer-properties').hidden=!layer;
  if(layer){$$('[data-layer-field]').forEach(el=>{const key=el.dataset.layerField;if(el.type==='checkbox')el.checked=!!layer[key];else if(document.activeElement!==el)el.value=String(layer[key]??'');});$$('[data-text-property]').forEach(el=>el.hidden=layer.type!=='text');$$('[data-image-property]').forEach(el=>el.hidden=layer.type!=='image');$('#studio-rotation-value').textContent=`${layer.rotation}°`;$('#studio-opacity-value').textContent=`${layer.opacity} %`;}
}
let dbPromise;
function database(){return dbPromise??=new Promise((resolve,reject)=>{const req=indexedDB.open('kalendars365-studio-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('projects');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Krātuve ir aizņemta.'));});}
async function stored(mode,fn){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('projects',mode),req=fn(tx.objectStore('projects'));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Saglabāšana neizdevās.'));});}
async function saveDraft(){try{await stored('readwrite',s=>s.put(clone(state),'draft'));$('#studio-save-state').textContent=`Saglabāts šajā ierīcē · ${new Intl.DateTimeFormat('lv-LV',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Riga'}).format(new Date())}`;}catch{$('#studio-save-state').textContent='Automātiskā saglabāšana nav pieejama';tell('Melnrakstu nevar saglabāt pārlūkā. Izvēlnē “Projekts” lejupielādē JSON kopiju.',true);}}
async function initialize(){try{const draft=await stored('readonly',s=>s.get('draft'));if(draft){state=normalize(draft);$('#studio-save-state').textContent='Tavs melnraksts ir atjaunots';tell('Sveiciens atkal! Tavs kalendārs ir atjaunots.');}}catch{$('#studio-save-state').textContent='Melnrakstu vari saglabāt failā';}
  const period=new URLSearchParams(location.search),year=Number(period.get('year')),month=Number(period.get('month'));
  if(period.has('year')&&Number.isInteger(year)&&year>=2027&&year<=2030)state.year=year;
  if(period.has('month')&&Number.isInteger(month)&&month>=1&&month<=12)state.month=month;
  if(period.has('name'))state.name=String(period.get('name')).trim().replace(/[\u0000-\u001f]/g,'').slice(0,100);
  if(['month','year'].includes(period.get('view')))state.view=period.get('view');
  else if(period.get('type')==='monthly')state.view='month';
  else if(period.get('type')==='annual')state.view='year';
  render();}

root.addEventListener('click',e=>{
  const tab=e.target.closest('[data-tab]');if(tab)switchTab(tab.dataset.tab);
  const preset=e.target.closest('[data-preset]');if(preset){const p=PRESETS.find(p=>p.id===preset.dataset.preset);change(()=>{state=applyPreset(state,p.id);if(p.id==='photo'){if(!state.photo){switchTab('photos');tell('Pievieno savu fotogrāfiju. Citus iestatījumus vari mainīt vēlāk.');}}},'preset');}
  const palette=e.target.closest('[data-palette]');if(palette){const [,accent,ink,paper,weekend]=palettes[Number(palette.dataset.palette)];change(()=>state.colors={accent,ink,paper,weekend,grid:paper==='#15243b'?'#3f526a':'#e3d4cb'},'palette');}
  if(e.target.closest('[data-action="add-text"]'))addText();
  const select=e.target.closest('[data-select-layer]');if(select){selected=select.dataset.selectLayer;switchTab('layers');schedule({save:false});}
  const edit=e.target.closest('[data-edit-event]');if(edit){const entry=state.events.find(x=>x.id===edit.dataset.editEvent),form=$('#studio-event-form');for(const key of ['id','date','title','color'])form.elements[key].value=entry[key];form.elements.annual.checked=entry.annual;$('#studio-event-submit').textContent='Saglabāt notikumu';$('#studio-event-cancel').hidden=false;form.elements.title.focus();}
  const del=e.target.closest('[data-delete-event]');if(del)change(()=>{state.events=state.events.filter(x=>x.id!==del.dataset.deleteEvent);if($('#studio-event-form').elements.id.value===del.dataset.deleteEvent)resetEventForm();});
});
$('.studio-rail').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const tabs=$$('[data-tab]'),index=tabs.findIndex(t=>t.dataset.tab===activeTab),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+tabs.length)%tabs.length;switchTab(tabs[next].dataset.tab,true);});
const numeric={year:[2027,2030],month:[1,12],weekStart:[0,1],margin:[6,25],titleSize:[20,76],textScale:[.8,1.3],photoPosition:[0,100],photoHeight:[15,40],photoOpacity:[0,65],quality:[150,600]};
function settingInput(e){const el=e.target;if(el.matches('[data-setting]')){const key=el.dataset.setting;if(el.type==='number'&&e.type==='input'&&(!el.validity.valid||!el.value))return;let value=el.type==='checkbox'?el.checked:el.value;if(numeric[key]){value=clamp(value,...numeric[key],state[key]);if(['year','month','weekStart'].includes(key))value=Math.round(value);if(e.type==='change')el.value=String(value);}if(state[key]===value)return;change(()=>state[key]=value,key);}
  if(el.matches('[data-color]')){const key=el.dataset.color;if(/^#[0-9a-f]{6}$/i.test(el.value)&&state.colors[key]!==el.value)change(()=>state.colors[key]=el.value,`color-${key}`);}
  if(el.matches('[data-layer-field]')){const layer=state.layers.find(l=>l.id===selected);if(!layer)return;const key=el.dataset.layerField;if(el.type==='number'&&e.type==='input'&&!el.validity.valid)return;let value=el.type==='checkbox'?el.checked:el.value;const bounds={x:[0,100],y:[0,100],width:[3,100],height:[3,100],size:[8,100],rotation:[-180,180],opacity:[10,100]};if(bounds[key]){value=clamp(value,...bounds[key],layer[key]);if(e.type==='change')el.value=String(value);}if(layer[key]===value)return;change(()=>layer[key]=value,`layer-${key}`);}
}
root.addEventListener('input',settingInput);root.addEventListener('change',settingInput);
$('#studio-undo').onclick=()=>{if(!history.length)return;future.push(clone(state));state=history.pop();selected=null;lastKey='';schedule();tell('Pēdējā izmaiņa atsaukta.');};
$('#studio-redo').onclick=()=>{if(!future.length)return;history.push(clone(state));state=future.pop();selected=null;lastKey='';schedule();tell('Izmaiņa atkārtota.');};
function addText(){if(state.layers.length>=16)return tell('Projektam vari pievienot līdz 16 atsevišķiem elementiem.',true);change(()=>{const layer={id:uid(),type:'text',text:'Tavs teksts',x:12,y:28,width:25,height:10,size:24,color:state.colors.ink,font:state.font,align:'start',bold:false,italic:false,rotation:0,opacity:100};state.layers.push(layer);selected=layer.id;});switchTab('layers');tell('Teksts ir pievienots lapai. Rediģē to zemāk vai ievelc vēlamajā vietā.');}
async function photoData(file,transparent=false){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Izvēlies JPG, PNG vai WebP attēlu.');
  if(file.size>20*1024*1024)throw Error('Attēls ir par lielu. Atļauti faili līdz 20 MB.');
  const url=URL.createObjectURL(file),img=new Image();try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Attēlu nevar nolasīt.'));img.src=url;});if(img.naturalWidth<32||img.naturalHeight<32||img.naturalWidth>20000||img.naturalHeight>20000)throw Error('Izvēlies attēlu ar malu izmēru no 32 līdz 20 000 pikseļiem.');const max=transparent?4096:8192,ratio=img.naturalWidth/img.naturalHeight,factor=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*factor);canvas.height=Math.round(img.naturalHeight*factor);const ctx=canvas.getContext('2d');if(!transparent){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(img,0,0,canvas.width,canvas.height);const src=canvas.toDataURL(transparent?'image/png':'image/jpeg',.97);canvas.width=canvas.height=1;if(src.length>8000000)throw Error('Attēls pārsniedz projekta 8 MB glabāšanas robežu. Izvēlies mazāku oriģinālu.');return {src,ratio,width:img.naturalWidth};}finally{URL.revokeObjectURL(url);}
}
async function addPhoto(file,layer=false,credit=''){try{tell('Sagatavojam tavu attēlu…');if(layer&&state.layers.length>=16)throw Error('Vienā projektā atļauti līdz 16 atsevišķiem elementiem.');const im=await photoData(file,layer);change(()=>{if(layer){const d=dimensions(state),item={id:uid(),type:'image',text:'',src:im.src,x:70,y:8,width:20,height:Math.min(70,20/im.ratio*d.width/d.height),size:24,color:state.colors.ink,font:state.font,align:'start',rotation:0,opacity:100};state.layers.push(item);selected=item.id;switchTab('layers');}else{state.photo=im.src;state.photoCredit=credit;state.photoRatio=im.ratio;}});tell(im.width<1200?'Attēls pievienots. Asai izdrukai ieteicams oriģināls vismaz 1200 pikseļu platumā.':'Attēls pievienots un paliek tavā ierīcē.');}catch(error){tell(error.message,true);}}
$$('[data-studio-sample]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{const response=await fetch(button.dataset.studioSample);if(!response.ok)throw Error('Fotogrāfiju nevar ielādēt.');const blob=await response.blob();await addPhoto(new File([blob],button.dataset.sampleName+'.webp',{type:blob.type||'image/webp'}),false,STUDIO_PHOTOS[button.dataset.studioSample]?.credit||'');}catch(error){tell(error.message,true);}finally{button.disabled=false;}}));
$('#studio-photo').onchange=e=>{addPhoto(e.target.files[0]);e.target.value='';};
for(const id of ['studio-layer-image','studio-layer-image-2'])$('#'+id).onchange=e=>{addPhoto(e.target.files[0],true);e.target.value='';};
$('#studio-remove-photo').onclick=()=>change(()=>{state.photo='';state.photoCredit='';});
const drop=$('#studio-drop');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');addPhoto(e.dataTransfer.files[0]);});
function resetEventForm(){const form=$('#studio-event-form');form.reset();form.elements.id.value='';form.elements.date.value=`${state.year}-${String(state.month).padStart(2,'0')}-01`;form.elements.color.value=state.colors.accent;$('#studio-event-submit').textContent='Pievienot notikumu';$('#studio-event-cancel').hidden=true;}
$('#studio-event-cancel').onclick=resetEventForm;
$('#studio-event-form').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,date=form.elements.date.value,title=form.elements.title.value.trim();if(!title||!validDate(date))return tell('Ievadi nosaukumu un derīgu datumu.',true);const id=form.elements.id.value;if(!id&&state.events.length>=500)return tell('Vienā projektā atļauti līdz 500 notikumiem.',true);const item={id:id||uid(),date,title,color:form.elements.color.value,annual:form.elements.annual.checked};change(()=>{const at=state.events.findIndex(e=>e.id===id);if(at>=0)state.events[at]=item;else state.events.push(item);});resetEventForm();tell('Notikums saglabāts. Gada kalendārā tas atzīmēts ar punktu, mēneša skatā — arī ar nosaukumu.');};
$('#studio-import-events').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>2*1024*1024)throw Error('Notikumu fails drīkst būt līdz 2 MB.');const entries=parseEvents(await file.text(),file.name.toLowerCase().endsWith('.ics')?'ics':'csv');if(!entries.length)throw Error('Derīgi notikumi nav atrasti. Pārbaudi datumus un faila formātu.');const available=500-state.events.length,accepted=entries.slice(0,available);if(!available)throw Error('Projektā jau ir 500 notikumu.');change(()=>state.events.push(...accepted));tell(`Importēti notikumi: ${accepted.length}. Importēti datumi, nosaukumi un ikgadējie atkārtojumi.${entries.length>available?' Pārsniegtie ieraksti izlaisti 500 notikumu ierobežojuma dēļ.':''}`);}catch(error){tell(error.message,true);}};
$('#studio-events-ics').onclick=()=>download(new Blob([eventsICS(state)],{type:'text/calendar;charset=utf-8'}),`mani-notikumi-${state.year}.ics`);
function selectedChange(fn){if(!selected)return;change(()=>{const at=state.layers.findIndex(l=>l.id===selected);if(at>=0)fn(state.layers[at],at);});}
$('#studio-layer-delete').onclick=()=>selectedChange((l,i)=>{state.layers.splice(i,1);selected=null;});
$('#studio-layer-copy').onclick=()=>{if(state.layers.length>=16)return tell('Projektā atļauti līdz 16 elementiem.',true);selectedChange(l=>{const copy={...l,id:uid(),x:Math.min(95,l.x+3),y:Math.min(95,l.y+3)};state.layers.push(copy);selected=copy.id;});};
$('#studio-layer-back').onclick=()=>selectedChange((l,i)=>{if(i>0)[state.layers[i-1],state.layers[i]]=[l,state.layers[i-1]];});
$('#studio-layer-front').onclick=()=>selectedChange((l,i)=>{if(i<state.layers.length-1)[state.layers[i+1],state.layers[i]]=[l,state.layers[i+1]];});
$('#studio-paper').addEventListener('pointerdown',e=>{if(e.button!==0)return;const target=e.target.closest('[data-layer]');if(!target){if(selected){selected=null;schedule({save:false});}return;}e.preventDefault();selected=target.dataset.layer;switchTab('layers');snapshot();const svg=target.ownerSVGElement,p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const start=p.matrixTransform(svg.getScreenCTM().inverse()),layer=state.layers.find(l=>l.id===selected);drag={id:selected,start,x:layer.x,y:layer.y,svg,ctm:svg.getScreenCTM().inverse()};schedule({save:false});});
window.addEventListener('pointermove',e=>{if(!drag)return;e.preventDefault();const p=drag.svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const point=p.matrixTransform(drag.ctm),d=dimensions(state),layer=state.layers.find(l=>l.id===drag.id);if(!layer)return;layer.x=Math.round(clamp(drag.x+(point.x-drag.start.x)/d.width*100,0,100)*10)/10;layer.y=Math.round(clamp(drag.y+(point.y-drag.start.y)/d.height*100,0,100)*10)/10;schedule({save:false});},{passive:false});
window.addEventListener('pointerup',()=>{if(drag){drag=null;schedule();}});window.addEventListener('pointercancel',()=>{if(drag){drag=null;schedule();}});
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,[contenteditable=true]'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'#studio-redo':'#studio-undo').click();}if(selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Delete','Backspace'].includes(e.key)&&!$('#studio-export').open){e.preventDefault();if(e.key==='Delete'||e.key==='Backspace')return $('#studio-layer-delete').click();const step=e.shiftKey?2:.2;selectedChange(l=>{if(e.key==='ArrowLeft')l.x=clamp(l.x-step,0,100);if(e.key==='ArrowRight')l.x=clamp(l.x+step,0,100);if(e.key==='ArrowUp')l.y=clamp(l.y-step,0,100);if(e.key==='ArrowDown')l.y=clamp(l.y+step,0,100);});}if(e.key==='Escape'&&selected){selected=null;schedule({save:false});}});
for(const [id,dir] of [['studio-prev',-1],['studio-next',1]])$('#'+id).onclick=()=>change(()=>{Object.assign(state,moveMonth(state,dir));});
$('#studio-zoom').onchange=e=>{zoom=e.target.value;fit();};$('#studio-fit').onclick=()=>{zoom='fit';$('#studio-zoom').value=zoom;fit();};
let fitFrame=0;
new ResizeObserver(()=>{if(zoom!=='fit'||fitFrame)return;fitFrame=requestAnimationFrame(()=>{fitFrame=0;if(zoom==='fit')fit();});}).observe($('#studio-artboard'));
$('#studio-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('.studio-canvas').requestFullscreen)await $('.studio-canvas').requestFullscreen();else throw Error();}catch{tell('Pilnekrāna režīms šajā pārlūkā nav pieejams. Izmanto priekšskatījuma mērogu.',true);}};
function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('#studio-save-project').onclick=()=>{download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),`kalendars365-projekts-${state.year}.json`);$('.studio-menu').open=false;tell('Projekts ar iestatījumiem, notikumiem un attēliem ir lejupielādēts.');};
$('#studio-open-project').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>150*1024*1024)throw Error('Projekts ir par lielu. Atļauti faili līdz 150 MB.');const next=normalize(JSON.parse(await file.text()));change(()=>{state=next;selected=null;});$('.studio-menu').open=false;resetEventForm();tell('Projekts ir atvērts. Vari turpināt rediģēt.');}catch(error){tell(error instanceof SyntaxError?'JSON fails nav derīgs.':error.message,true);}};
$('#studio-reset').onclick=()=>{if(!confirm('Sākt jaunu kalendāru? Vispirms saglabā pašreizējo projektu, ja vēlies to paturēt.'))return;change(()=>{state=initialState();selected=null;});resetEventForm();switchTab('design');$('.studio-menu').open=false;tell('Jauna lapa tavām idejām.');};
$('#studio-clear-draft').onclick=async()=>{if(!confirm('Dzēst šajā pārlūkā saglabāto melnrakstu? Pašreizējais kalendārs paliks atvērts. Nākamā izmaiņa atkal ieslēgs automātisko saglabāšanu.'))return;clearTimeout(saveTimer);try{await stored('readwrite',s=>s.delete('draft'));$('#studio-save-state').textContent='Saglabātais melnraksts ir dzēsts';tell('Melnraksts šajā ierīcē ir dzēsts. Atvērto projektu joprojām vari lejupielādēt.');}catch{tell('Melnrakstu nevarēja dzēst.',true);}$('.studio-menu').open=false;};
$('#studio-download').onclick=()=>{sync();$('#studio-export').showModal();};
$('#studio-export-close').onclick=()=>{exportController?.abort();$('#studio-export').close();};
$('#studio-export').addEventListener('cancel',()=>exportController?.abort());
$('#studio-export-cancel').onclick=()=>exportController?.abort();
$('#studio-export-scope').onchange=sync;
function loadExporter(){return exportModule??=import(new URL('./export-pipeline.mjs'+new URL(import.meta.url).search,import.meta.url)).catch(error=>{exportModule=null;throw error;});}
function preparePrint(s,pages){
  let documentRoot=document.getElementById('studio-print-document');
  if(!documentRoot){documentRoot=document.createElement('div');documentRoot.id='studio-print-document';documentRoot.setAttribute('aria-hidden','true');document.body.append(documentRoot);}
  let sheet=document.getElementById('studio-print-page-style');if(!sheet){sheet=document.createElement('style');sheet.id='studio-print-page-style';document.head.append(sheet);}
  const d=dimensions(s);sheet.textContent=`@page{size:${d.mmWidth}mm ${d.mmHeight}mm;margin:0}@media print{#studio-print-document .studio-print-page{width:${d.mmWidth}mm;height:${d.mmHeight}mm}}`;
  documentRoot.innerHTML=pages.map(svg=>`<div class="studio-print-page">${svg}</div>`).join('');
}
window.addEventListener('beforeprint',()=>preparePrint(clone(state),exportPages(state,$('#studio-export-scope').value)));
async function printPages(s,pages){preparePrint(s,pages);await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));window.print();}
async function exportFile(format){
 if(busy)return;
 const s=normalize(clone(state)),scope=$('#studio-export-scope').value,dialog=$('#studio-export');
 busy=true;exportController=new AbortController();dialog.setAttribute('aria-busy','true');
 $$('[data-export],#studio-export-scope,#studio-export [data-setting]').forEach(button=>button.disabled=true);
 const progress=$('#studio-export-progress');progress.hidden=false;const meter=$('progress',progress),label=$('p',progress),cancel=$('#studio-export-cancel');cancel.hidden=false;meter.value=2;label.textContent='Sagatavojam tavu kalendāru…';
 try{
  if(format==='print'){await printPages(s,exportPages(s,scope));meter.value=100;label.textContent='Drukas logs ir atvērts.';tell('Drukājot izvēlies 100 % mērogu un atbilstošo papīru.');}
  else{
   const exporter=await loadExporter();
   const result=await exporter.makeExport(s,format,{scope,signal:exportController.signal,onProgress:({percent,message})=>{meter.value=percent;label.textContent=message;}});
   if(exportController.signal.aborted)throw new DOMException('Darbība atcelta.','AbortError');
   download(result.blob,result.name);meter.value=100;label.textContent='Lejupielāde sagatavota: '+result.name;tell('Kalendārs ir sagatavots lejupielādei. Saglabā arī projektu, lai turpinātu vēlāk.');
  }
 }catch(error){const message=error.name==='AbortError'?'Sagatavošana atcelta. Tavs projekts nav mainīts.':error.message||'Failu nevar sagatavot. Mēģini vēlreiz.';label.textContent=message;tell(message,error.name!=='AbortError');}
 finally{busy=false;exportController=null;dialog.removeAttribute('aria-busy');$$('[data-export],#studio-export-scope,#studio-export [data-setting]').forEach(button=>button.disabled=false);cancel.hidden=true;sync();}
}
$$('[data-export]').forEach(button=>button.onclick=()=>exportFile(button.dataset.export));
initialize();
}
