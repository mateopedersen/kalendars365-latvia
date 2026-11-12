(()=>{
 'use strict';
 const source=document.getElementById('share-page-data');if(!source)return;
 document.documentElement.dataset.shareReady='';
 const version=document.querySelector('meta[name="asset-version"]')?.content||'1',icon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/></svg>';
 const cards='.a3-design-card,.moon-print-card,.print-library-card';
 let modulePromise,stylePromise;
 const style=()=>stylePromise||=(new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/share-dialog.css?v='+version;link.onload=resolve;link.onerror=reject;document.head.append(link);}));
 const button=(label,kind)=>{const b=document.createElement('button');b.type='button';b.className='share-inline-button';b.dataset.shareOpen='';b.dataset.shareKind=kind;b.innerHTML=icon+'<span></span>';b.querySelector('span').textContent=label;return b;};
 function enhance(){
  for(const card of document.querySelectorAll(cards)){
   if(card.querySelector('[data-share-template]')||!card.querySelector('a[download][href$=".pdf"]'))continue;
   const row=document.createElement('div'),b=button('Kopīgot šo dizainu','template');row.className='share-template-row';b.dataset.shareTemplate='';b.setAttribute('aria-label','Kopīgot šo dizainu: '+(card.querySelector('h3')?.textContent||'')+(card.querySelector('.print-library-card-copy>small')?', '+card.querySelector('.print-library-card-copy>small').textContent:''));row.append(b);card.append(row);
  }
  const collection=document.querySelector('[data-calendar-collection]');
  if(collection&&!document.getElementById('calendar-app')&&!collection.querySelector('[data-share-kind="calendar"]')){
   const row=document.createElement('div');row.className='share-content-row';row.append(button('Kopīgot kalendāru','calendar'));collection.querySelector('#calendar-period-content')?.prepend(row);
  }
 }
 enhance();
 const topicLabels={blog_article:'Kopīgot rakstu',occasion:'Kopīgot svētkus',latvia_cultural:'Kopīgot tradīciju',holiday_year:'Kopīgot svētku kalendāru',holiday_month:'Kopīgot svētku kalendāru',school_academic:'Kopīgot skolas kalendāru',school_year_calendar:'Kopīgot skolas kalendāru',garden:'Kopīgot dārza ceļvedi',garden_month:'Kopīgot sējas plānu'};
 const label=topicLabels[document.body.dataset.family],heading=document.querySelector('main .page-heading,main .journal-article-heading');
 if(label&&heading&&!document.querySelector('[data-page-action-dock] [data-share-open]')){const row=document.createElement('div');row.className='share-content-row';row.append(button(label,'topic'));heading.insertAdjacentElement('afterend',row);}
 let pending=false;new MutationObserver(records=>{if(pending||!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.(cards)||n.querySelector?.(cards)))))return;pending=true;queueMicrotask(()=>{pending=false;enhance();});}).observe(document.querySelector('main'),{childList:true,subtree:true});
 document.addEventListener('click',async event=>{
  const opener=event.target.closest('[data-share-open]');if(!opener)return;
  opener.setAttribute('aria-busy','true');
  try{modulePromise||=import('/assets/share-dialog.mjs?v='+version);const [api]=await Promise.all([modulePromise,style()]);await api.openShare(opener,source.dataset,version);}
  catch{modulePromise=null;stylePromise=null;let status=opener.parentElement.querySelector('.share-context-error');if(!status){status=document.createElement('p');status.className='share-context-error';status.setAttribute('role','status');opener.insertAdjacentElement('afterend',status);}status.textContent='Kopīgošanu pašlaik nevar atvērt. Mēģini vēlreiz.';}
  finally{opener.removeAttribute('aria-busy');}
 });
})();
