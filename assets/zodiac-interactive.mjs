const revision=new URL(import.meta.url).search;
const {zodiacModels}=await import('./zodiac-models.mjs'+revision);
const signs=Object.entries(zodiacModels),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const models=new Map();let dialog,viewer,renderer,request,revisionId=0,returnFocus;
function makeDialog(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='zodiac-model-dialog';dialog.setAttribute('aria-labelledby','zodiac-model-title');
 dialog.innerHTML=`<header class="zodiac-model-header"><div><span class="eyebrow">ZODIAKA SKULPTŪRAS · 360°</span><h2 id="zodiac-model-title"></h2></div><button type="button" data-model-close aria-label="Aizvērt 3D skatījumu">✕</button></header><div class="zodiac-model-stage" aria-busy="true"><div class="zodiac-model-plinth" aria-hidden="true"></div><img class="zodiac-model-fallback" width="256" height="256" alt=""><canvas tabindex="0" aria-label="3D zodiaka skulptūra. Velc vai lieto bulttaustiņus, lai pagrieztu." hidden></canvas><span class="zodiac-model-material">BRONZA · ZILOŅKAULA TONIS · EMALJA</span></div><p data-model-status role="status">Ielādējam 3D modeli…</p><div class="zodiac-model-toolbar"><button type="button" data-model-rotate="-1" aria-label="Pagriezt skulptūru pa kreisi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg></button><button type="button" data-model-play aria-pressed="false">Griezt 360°</button><button type="button" data-model-rotate="1" aria-label="Pagriezt skulptūru pa labi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg></button><button type="button" data-model-reset>Atiestatīt</button><label>Tuvums<input type="range" min="0.65" max="1.35" step="0.05" value="1" data-model-zoom></label></div><div class="zodiac-model-bottom"><label>Zodiaka zīme<select data-model-sign>${signs.map(([slug,p])=>`<option value="${slug}">${esc(p.name)}</option>`).join('')}</select></label><a data-model-horoscope href="/horoskops/">Atvērt horoskopu <span aria-hidden="true">↗</span></a></div>`;
 document.body.append(dialog);const canvas=dialog.querySelector('canvas');
 dialog.querySelector('[data-model-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{request?.abort();revisionId++;viewer?.play(false);viewer?.setVisible(false);document.documentElement.classList.remove('zodiac-modal-open');returnFocus?.focus({preventScroll:true});});
 dialog.querySelector('[data-model-sign]').addEventListener('change',event=>loadModel(event.target.value));
 dialog.querySelectorAll('[data-model-rotate]').forEach(button=>button.addEventListener('click',()=>viewer?.rotate(Number(button.dataset.modelRotate)*Math.PI/6)));
 dialog.querySelector('[data-model-reset]').addEventListener('click',()=>{viewer?.reset();dialog.querySelector('[data-model-zoom]').value='1';});
 dialog.querySelector('[data-model-zoom]').addEventListener('input',event=>viewer?.zoom(event.target.value));
 dialog.querySelector('[data-model-play]').addEventListener('click',event=>{const value=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(value));event.currentTarget.textContent=value?'Apturēt':'Griezt 360°';viewer?.play(value);});
 const fail=()=>{canvas.hidden=true;dialog.querySelector('.zodiac-model-fallback').hidden=false;dialog.querySelector('[data-model-status]').textContent='3D skatījums šajā pārlūkā nav pieejams. Vari apskatīt skulptūras ilustrāciju un atvērt horoskopu.';dialog.querySelector('.zodiac-model-toolbar').hidden=true;};
 renderer=async()=>{if(viewer)return viewer;const {createSculptureViewer}=await import('./zodiac-viewer.mjs'+revision);viewer=createSculptureViewer(canvas,fail);return viewer;};
}
async function loadModel(slug){
 const model=zodiacModels[slug];if(!model)return;const token=++revisionId;request?.abort();request=new AbortController();
 dialog.querySelector('#zodiac-model-title').textContent=model.name;dialog.querySelector('[data-model-sign]').value=slug;
 const fallback=dialog.querySelector('.zodiac-model-fallback'),canvas=dialog.querySelector('canvas'),stage=dialog.querySelector('.zodiac-model-stage'),status=dialog.querySelector('[data-model-status]');
 delete stage.dataset.modelReady;fallback.src=`/assets/zodiac/${slug}.svg?v=${model.version}`;fallback.hidden=false;canvas.hidden=true;stage.setAttribute('aria-busy','true');
 dialog.querySelector('[data-model-horoscope]').href=`/horoskops/${slug}/`;dialog.querySelector('[data-model-horoscope]').firstChild.textContent=`Atvērt ${model.genitive.toLocaleLowerCase('lv-LV')} horoskopu `;
 dialog.querySelector('[data-model-play]').setAttribute('aria-pressed','false');dialog.querySelector('[data-model-play]').textContent='Griezt 360°';dialog.querySelector('[data-model-zoom]').value='1';viewer?.play(false);
 dialog.querySelector('.zodiac-model-toolbar').hidden=true;status.textContent='Ielādējam 3D modeli…';
 try{
  let bytes=models.get(slug);if(!bytes){const response=await fetch(`/assets/zodiac/models/${slug}.bin?v=${model.hash}`,{signal:request.signal});if(!response.ok)throw Error('Model unavailable');bytes=await response.arrayBuffer();if(bytes.byteLength!==model.bytes)throw Error('Model size mismatch');if(token!==revisionId)return;models.set(slug,bytes);}
  const v=await renderer();if(token!==revisionId||!dialog.open)return;
  canvas.hidden=false;fallback.hidden=true;v.setVisible(true);v.setModel(bytes);dialog.querySelector('.zodiac-model-toolbar').hidden=false;
  status.textContent='Velc skulptūru, lai apskatītu no visām pusēm. Darbojas arī bulttaustiņi.';stage.dataset.modelReady=slug;
 }catch(error){if(token!==revisionId||error.name==='AbortError')return;canvas.hidden=true;fallback.hidden=false;status.textContent='3D skatījumu neizdevās ielādēt. Skulptūras ilustrācija un horoskopa saite joprojām ir pieejama.';}
 finally{if(token===revisionId)stage.setAttribute('aria-busy','false');}
}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-zodiac-model]');if(!target||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 if(!zodiacModels[target.dataset.zodiacModel])return;event.preventDefault();makeDialog();returnFocus=target;if(!dialog.open)dialog.showModal();document.documentElement.classList.add('zodiac-modal-open');loadModel(target.dataset.zodiacModel);
});
for(const root of document.querySelectorAll('[data-ascendant-wheel]')){
 const stage=root.querySelector('[data-wheel-stage]'),rotor=root.querySelector('[data-wheel-rotor]');if(!stage||!rotor)continue;
 let angle=0,down=null,blockClick=false;
 const paint=()=>{rotor.setAttribute('transform',`rotate(${angle} 220 220)`);root.querySelectorAll('[data-wheel-upright]').forEach(node=>node.setAttribute('transform',`rotate(${-angle} ${node.dataset.x} ${node.dataset.y})`));root.dataset.wheelRotation=String(Math.round(angle*100)/100);};
 root.querySelectorAll('[data-wheel-turn]').forEach(button=>button.addEventListener('click',()=>{angle+=Number(button.dataset.wheelTurn);paint();}));
 root.querySelector('[data-wheel-reset]')?.addEventListener('click',()=>{angle=0;paint();});
 stage.addEventListener('keydown',event=>{if(event.target!==stage)return;if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();angle=event.key==='Home'?0:angle+(event.key==='ArrowLeft'?-15:15);paint();}});
 stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;down={id:event.pointerId,x:event.clientX,y:event.clientY,start:angle,moved:false};blockClick=false;});
 stage.addEventListener('pointermove',event=>{if(!down||down.id!==event.pointerId)return;const dx=event.clientX-down.x;if(!down.moved&&Math.abs(dx)<6)return;down.moved=true;blockClick=true;stage.setPointerCapture(event.pointerId);angle=down.start+dx*.45;paint();});
 const end=()=>{down=null;};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
 stage.addEventListener('click',event=>{if(blockClick){event.preventDefault();event.stopPropagation();blockClick=false;}},true);
 paint();
}
