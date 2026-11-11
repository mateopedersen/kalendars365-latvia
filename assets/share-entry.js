(()=>{
 'use strict';
 const source=document.getElementById('share-page-data');if(!source)return;
 const version=document.querySelector('meta[name="asset-version"]')?.content||'1',icon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 14v7h16v-7"/></svg>';
 let modulePromise,stylePromise;
 const style=()=>stylePromise||=(new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/share-dialog.css?v='+version;link.onload=resolve;link.onerror=reject;document.head.append(link);}));
 function enhance(){
  for(const card of document.querySelectorAll('.a3-design-card,.moon-print-card')){if(card.querySelector('[data-share-template]'))continue;const button=document.createElement('button');button.type='button';button.className='share-template';button.dataset.shareOpen='';button.dataset.shareTemplate='';button.setAttribute('aria-label','Kopīgot kalendāru: '+(card.querySelector('h3')?.textContent||''));button.innerHTML=icon;card.append(button);}
  for(const bar of document.querySelectorAll('.useful-actions,.v2-preview-downloads')){if(bar.querySelector('[data-share-open]'))continue;const button=document.createElement('button');button.type='button';button.dataset.shareOpen='';button.className='share-inline-button';button.innerHTML=icon+'<span>Kopīgot</span>';bar.append(button);}
 }
 enhance();
 let pending=false;new MutationObserver(records=>{if(pending||!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('[data-share-open]')&&(n.matches?.('.a3-design-card,.moon-print-card,.useful-actions,.v2-preview-downloads')||n.querySelector?.('.a3-design-card,.moon-print-card,.v2-preview-downloads')))))return;pending=true;queueMicrotask(()=>{pending=false;enhance();});}).observe(document.querySelector('main'),{childList:true,subtree:true});
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-share-open]');if(!button)return;
  button.setAttribute('aria-busy','true');
  try{modulePromise||=import('/assets/share-dialog.mjs?v='+version);const [api]=await Promise.all([modulePromise,style()]);await api.openShare(button,source.dataset,version);}
  catch{modulePromise=null;stylePromise=null;const status=document.querySelector('.share-bootstrap-status');status.hidden=false;status.textContent='Kopīgošanu pašlaik nevar atvērt. Pārlādē lapu un mēģini vēlreiz.';}
  finally{button.removeAttribute('aria-busy');}
 });
})();
