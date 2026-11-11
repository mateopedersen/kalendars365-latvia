import {shareServices,shareGroups,findShareServices} from './share-services.mjs';
import {escapeShare as esc,safePublicUrl,safeShareImage,safeTemplateUrl,shareComposer,shareText,copyPayload} from './share-core.mjs';

let dialog,context,returnFocus,assetVersion,catalogPromise,openRevision=0;
const localUrl=url=>{const u=new URL(url,location.origin);return u.pathname+u.search;};
const icon=(id,size=23)=>`<svg width="${size}" height="${size}" aria-hidden="true"><use href="/assets/share-icons.svg?v=${assetVersion}#s-${id}"/></svg>`;
const actionLabel=s=>s.method==='manual'?'Kopēt un atvērt':s.method==='direct'?'Atvērt kopīgošanu':s.method==='instance'?'Izvēlēties serveri':'Kopīgošanas rīks';
const serviceById=id=>shareServices.find(s=>s.id===id);
const notice=message=>{dialog.querySelector('[data-share-status]').textContent=message;};
function createDialog(){
 dialog=document.createElement('dialog');dialog.id='share-dialog';dialog.className='share-dialog';dialog.setAttribute('aria-labelledby','share-heading');
 dialog.innerHTML=`<header class="share-header"><div><span class="share-eyebrow">KALENDĀRS365 · LABĀK KOPĀ</span><h2 id="share-heading">Dalies ar noderīgo.</h2></div><button type="button" class="share-close" data-share-close aria-label="Aizvērt kopīgošanu">×</button></header>
 <div class="share-layout"><aside class="share-preview"><div class="share-cover"><img alt="" width="1200" height="630" data-share-cover></div><div class="share-preview-copy"><span class="share-pill" data-share-kind>Lapas saite</span><h3 data-share-title></h3><p data-share-context-note></p><div class="share-url-row"><input readonly aria-label="Publiskā kopīgošanas saite" data-share-url><button type="button" data-share-action="copy-link" aria-label="Kopēt saiti">${icon('copy-link',19)}</button></div><div class="share-quick"><button type="button" data-share-action="native">${icon('native',19)} Kopīgot ierīcē</button><button type="button" data-share-action="download">${icon('download',19)} Attēls</button></div><p class="share-private">${icon('copy-text',15)} Personīgie notikumi un piezīmes paliek tavā ierīcē.</p></div></aside>
 <section class="share-options" aria-label="Kopīgošanas iespējas"><div class="share-options-top"><label class="share-search"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" placeholder="Meklē, piemēram, WhatsApp" aria-label="Meklēt kopīgošanas iespēju" autocomplete="off" data-share-search></label><div class="share-groups" role="group" aria-label="Filtrēt iespējas">${Object.entries(shareGroups).map(([id,name])=>`<button type="button" data-share-group="${id}" aria-pressed="${id==='all'}">${name}</button>`).join('')}</div><div class="share-count"><strong data-share-count>55 iespējas</strong><span>Izvēlies, kur vēlies dalīties</span></div></div><div class="share-grid" data-share-grid></div><section class="share-action-panel" data-share-panel hidden aria-label="Izvēlētās iespējas norādes"></section></section></div>
 <footer class="share-footer"><p role="status" aria-live="polite" data-share-status>Izvēlies saiti, attēlu vai sev ērtāko lietotni.</p><span>55 iespējas · bez izsekošanas logrīkiem</span></footer>`;
 document.body.append(dialog);
 dialog.addEventListener('close',()=>{openRevision++;returnFocus?.focus({preventScroll:true});});
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}
  if(event.target.closest('[data-share-close]'))dialog.close();
  const group=event.target.closest('[data-share-group]');if(group){dialog.querySelectorAll('[data-share-group]').forEach(b=>b.setAttribute('aria-pressed',String(b===group)));renderServices();}
  const service=event.target.closest('[data-share-service]');if(service)showService(serviceById(service.dataset.shareService));
  const action=event.target.closest('[data-share-action]');if(action)runAction(action.dataset.shareAction,action);
 });
 dialog.querySelector('[data-share-search]').addEventListener('input',renderServices);
 dialog.addEventListener('submit',event=>{
  if(!event.target.matches('[data-share-instance]'))return;event.preventDefault();
  const field=event.target.elements.instance,link=event.target.querySelector('[data-instance-link]');
  try{link.href=shareComposer(serviceById('mastodon'),context,field.value);link.hidden=false;field.setCustomValidity('');link.focus();notice('Servera saite ir sagatavota. Atver to, lai pārskatītu ierakstu.');}
  catch(error){field.setCustomValidity(error.message);field.reportValidity();}
 });
 dialog.addEventListener('input',event=>{if(event.target.name==='instance'){event.target.setCustomValidity('');const link=dialog.querySelector('[data-instance-link]');if(link)link.hidden=true;}});
}
function renderServices(){
 const query=dialog.querySelector('[data-share-search]').value,group=dialog.querySelector('[data-share-group][aria-pressed="true"]').dataset.shareGroup;
 const services=findShareServices(query,group),grid=dialog.querySelector('[data-share-grid]');
 dialog.querySelector('[data-share-count]').textContent=`${services.length} ${services.length===1?'iespēja':'iespējas'}`;
 grid.innerHTML=services.map(s=>{
  const contents=`<span class="share-service-icon" style="--service-color:${s.color}">${icon(s.id)}</span><span><strong>${esc(s.name)}</strong><small>${actionLabel(s)}</small></span>`;
  const composer=s.method==='direct'?shareComposer(s,context):null;
  return composer?`<a class="share-service" href="${esc(composer)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)}: atvērt kopīgošanu jaunā cilnē">${contents}</a>`:`<button type="button" class="share-service" data-share-service="${s.id}">${contents}</button>`;
 }).join('')||'<p class="share-empty">Nekas nav atrasts. Pamēģini citu nosaukumu vai izvēlies visas iespējas.</p>';
}
function showPanel(html){const panel=dialog.querySelector('[data-share-panel]');panel.hidden=false;panel.innerHTML=html;panel.scrollIntoView({block:'nearest',behavior:'instant'});panel.querySelector('h3')?.focus({preventScroll:true});}
function showService(service){
 if(!service)return;
 if(service.method==='manual'){
  const imageFirst=['instagram','tiktok','snapchat'].includes(service.id);
  showPanel(`<div class="share-panel-heading"><span class="share-service-icon" style="--service-color:${service.color}">${icon(service.id)}</span><h3 tabindex="-1">${esc(service.name)}</h3></div><p>${imageFirst?'Saglabā attēlu, nokopē tekstu un pievieno tos savā ierakstā vai stāstā. Video lietotnē attēlu vari izmantot kā ieraksta pamatu.':'Nokopē saiti vai tekstu un ielīmē to izvēlētajā sarunā, ierakstā vai piezīmē.'} Šī vietne neatbalsta automātiski aizpildītu kopīgošanas saiti.</p><div class="share-panel-buttons"><button type="button" data-share-action="copy-text">${icon('copy-text',18)} Kopēt tekstu</button><button type="button" data-share-action="download">${icon('download',18)} Saglabāt attēlu</button><a href="${esc(service.website)}" target="_blank" rel="noopener noreferrer">Atvērt ${esc(service.name)} ↗</a></div>`);
 }else if(service.method==='instance'){
  showPanel(`<h3 tabindex="-1">Tavs Mastodon serveris</h3><p>Ievadi servera domēnu. Ierakstu varēsi pārskatīt un publicēt savā kontā.</p><form data-share-instance><label>Servera domēns<input name="instance" type="text" placeholder="mastodon.social" autocomplete="off" required maxlength="253"></label><button type="submit">Sagatavot saiti</button><a data-instance-link hidden target="_blank" rel="noopener noreferrer">Atvērt Mastodon ↗</a></form>`);
 }else runAction(service.method);
}
async function copyText(text){
 try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);notice('Nokopēts. Vari ielīmēt izvēlētajā lietotnē.');}
 catch{showPanel(`<h3 tabindex="-1">Nokopē tekstu</h3><p>Pārlūks neļāva kopēt automātiski. Iezīmētais teksts ir gatavs kopēšanai.</p><textarea readonly rows="4" aria-label="Teksts kopēšanai">${esc(text)}</textarea>`);const field=dialog.querySelector('[data-share-panel] textarea');field.focus();field.select();notice('Automātiska kopēšana nav pieejama. Nokopē iezīmēto tekstu.');}
}
async function runAction(action,button){
 const revision=openRevision,activeContext={...context};
 try{
  if(['copy-link','copy-text','markdown','embed'].includes(action)){await copyText(copyPayload(action,activeContext));return;}
  if(action==='native'){
   if(navigator.share){await navigator.share({title:activeContext.title,text:activeContext.title,url:activeContext.url});if(revision===openRevision)notice('Ierīces kopīgošanas izvēlne ir aizvērta.');}
   else{showPanel(`<h3 tabindex="-1">Dalies ar saiti</h3><p>Šajā pārlūkā ierīces kopīgošanas izvēlne nav pieejama. Izvēlies lietotni vai nokopē saiti.</p><button type="button" data-share-action="copy-link">${icon('copy-link',18)} Kopēt saiti</button>`);}return;
  }
  if(action==='download'){
   showPanel(`<h3 tabindex="-1">Attēls tavam ierakstam</h3><p>Izvēlies izmēru. Kalendāra veidnes attēlā vienmēr saglabājas viss kalendārs.</p><div class="share-image-formats"><a href="${esc(localUrl(activeContext.image))}" download="${esc(activeContext.filename)}">${icon('download',20)} Oriģināls</a><button type="button" data-share-action="poster-square">${icon('download',20)} Kvadrāts <small>1080 × 1080</small></button><button type="button" data-share-action="poster-story">${icon('download',20)} Stāsts <small>1080 × 1920</small></button></div><p class="share-credit">${esc(activeContext.credits||'Kalendārs365 oriģinālais dizains.')} <a href="/pilsetas-un-fotografijas/#kopigosanas-vaki" target="_blank" rel="noopener">Attēlu avoti ↗</a></p>`);return;
  }
  if(action.startsWith('poster-')){
   button?.setAttribute('aria-busy','true');notice('Attēls tiek sagatavots…');const {createSharePoster}=await import('./share-poster.mjs?v='+assetVersion);
   const blob=await createSharePoster(activeContext,action==='poster-story'?'story':'square');if(revision!==openRevision)return;
   downloadBlob(blob,`kalendars365-${action==='poster-story'?'stasts':'ieraksts'}.png`);notice('Attēls ir sagatavots lejupielādei.');return;
  }
  if(action==='qr'){
   const {qrcode}=await import('./vendor/share-qrcode.mjs?v='+assetVersion);if(revision!==openRevision)return;
   const qr=qrcode(0,'M');qr.addData(activeContext.url);qr.make();
   // Four modules of white quiet zone keep both the preview and download scannable.
   const svg=qr.createSvgTag({cellSize:6,margin:24,scalable:true});
   showPanel(`<h3 tabindex="-1">Noskenē un atver</h3><div class="share-qr">${svg}</div><p>QR kodā ir tikai publiskā saite.</p><button type="button" data-share-action="save-qr">${icon('download',18)} Saglabāt QR kodu</button>`);
   dialog.querySelector('[data-share-panel]').dataset.qr=svg;return;
  }
  if(action==='save-qr'){const svg=dialog.querySelector('[data-share-panel]').dataset.qr;if(svg)downloadBlob(new Blob([svg],{type:'image/svg+xml'}),'kalendars365-qr.svg');}
 }catch(error){if(error.name!=='AbortError'&&revision===openRevision)notice('Šo darbību neizdevās pabeigt. Izmēģini saites kopēšanu vai citu iespēju.');}
 finally{button?.removeAttribute('aria-busy');}
}
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function resolveContext(opener,page){
 const calendar=document.getElementById('calendar-app'),url=new URL(page.url,location.origin);url.search=location.search;
 const shared={date:calendar?.dataset.shareDate,view:calendar?.dataset.shareView,year:document.getElementById('calendar-year')?.value,month:document.getElementById('calendar-month')?.value};
 const result={url:safePublicUrl(url.href,shared),title:page.title||'Kalendārs365',image:safeShareImage(page.image),credits:page.credits||'',template:false};
 const card=opener.closest('.a3-design-card,.moon-print-card');
 if(card){
  const pdf=[...card.querySelectorAll('a[download]')].find(a=>new URL(a.href).pathname.endsWith('.pdf'));
  const full=card.querySelector('.a3-design-preview,.moon-print-preview');
  if(pdf&&full){result.url=safeTemplateUrl(pdf.getAttribute('href'));result.image=safeShareImage(safeTemplateUrl(full.getAttribute('href')));result.title=(card.querySelector('h3')?.textContent.trim()||'Kalendārs')+' | '+(document.querySelector('h1')?.textContent.trim()||page.title);result.template=true;result.credits='Kalendārs365 oriģinālais kalendāra dizains.';const img=card.querySelector('img'),candidates=(img?.getAttribute('srcset')||'').split(',').map(x=>x.trim().split(/\s+/)).filter(x=>/^\d+w$/.test(x[1])).sort((a,b)=>parseInt(b[1])-parseInt(a[1]));result.posterSource=candidates[0]?.[0]||img?.getAttribute('src');}
 }else if(new URL(result.url).pathname!==page.url){
  try{catalogPromise||=fetch('/assets/share-pages.json?v='+assetVersion,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(error=>{catalogPromise=null;throw error;});const catalog=await catalogPromise,row=catalog[new URL(result.url).pathname];if(row){result.title=row.title;result.image=safeShareImage(row.image);result.credits=row.credits;}}
  catch{/* The original reviewed page cover remains available if the optional catalog fails. */}
 }
 result.filename='kalendars365-'+new URL(result.image).pathname.split('/').pop();return result;
}
export async function openShare(opener,page,version){
 assetVersion=version;if(!dialog)createDialog();if(dialog.open)return;
 const revision=++openRevision;returnFocus=opener;
 const next=await resolveContext(opener,page);if(revision!==openRevision)return;context=next;
 dialog.querySelector('[data-share-title]').textContent=context.title;
 dialog.querySelector('[data-share-cover]').src=localUrl(context.posterSource||context.image);
 dialog.querySelector('[data-share-cover]').alt=context.template?'Izvēlētā kalendāra priekšskatījums':'Kopīgojamās lapas vāks';
 dialog.querySelector('[data-share-cover]').classList.toggle('is-template',context.template);
 dialog.querySelector('[data-share-kind]').textContent=context.template?'Izvēlētā veidne · PDF':'Publiskā lapas saite';
 dialog.querySelector('[data-share-context-note]').textContent=context.template?'Dalies tieši ar šo kalendāra failu.':'Kalendāri, horoskopi un idejas, ko vērts paturēt un nosūtīt tālāk.';
 dialog.querySelector('[data-share-url]').value=context.url;
 dialog.querySelector('[data-share-search]').value='';dialog.querySelectorAll('[data-share-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shareGroup==='all')));
 const panel=dialog.querySelector('[data-share-panel]');panel.hidden=true;panel.innerHTML='';delete panel.dataset.qr;
 notice('Izvēlies saiti, attēlu vai sev ērtāko lietotni.');renderServices();dialog.showModal();dialog.querySelector(matchMedia('(max-width:600px)').matches?'[data-share-close]':'[data-share-search]').focus({preventScroll:true});
}
