export const normalizeToolQuery=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('lv').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function matchesTool(item,{query='',kind='all',savedOnly=false,saved=[]}={}){
 const terms=normalizeToolQuery(query).split(' ').filter(Boolean),haystack=normalizeToolQuery(item.search);
 return (kind==='all'||item.kind===kind)&&(!savedOnly||saved.includes(item.url))&&terms.every(term=>haystack.includes(term));
}
export function readSavedTools(raw,validUrls){
 try{const value=JSON.parse(raw||'[]');return Array.isArray(value)?[...new Set(value.filter(url=>validUrls.includes(url)))]:[];}catch{return [];}
}
const root=typeof document==='undefined'?null:document.querySelector('[data-tools-explorer]');
if(root){
 const form=root.querySelector('form'),count=root.querySelector('[data-discovery-count]'),empty=root.querySelector('[data-directory-empty]'),clear=root.querySelector('[data-directory-clear]'),notice=root.querySelector('[data-directory-storage]'),key='k365-favorite-tools-v1';
 const cards=[...root.querySelectorAll('[data-directory-tool]')].map(node=>({node,search:node.dataset.toolSearch,kind:node.dataset.kind,url:node.dataset.toolUrl,button:node.querySelector('[data-tool-save]'),title:node.querySelector('h3').textContent}));
 const urls=cards.map(c=>c.url),params=new URLSearchParams(location.search);let saved=[],canStore=true;
 try{saved=readSavedTools(localStorage.getItem(key),urls);}catch{canStore=false;}
 if(params.has('q'))form.elements.q.value=params.get('q');
 if([...form.elements.kind.options].some(o=>o.value===params.get('kind')))form.elements.kind.value=params.get('kind');
 function render(){
  const state={query:form.elements.q.value,kind:form.elements.kind.value,savedOnly:form.elements.saved.checked,saved};let total=0;
  for(const c of cards){c.node.hidden=!matchesTool(c,state);if(!c.node.hidden)total++;const marked=saved.includes(c.url);c.button.setAttribute('aria-pressed',String(marked));c.button.setAttribute('aria-label',`${marked?'Noņemt no saglabātajiem':'Saglabāt'}: ${c.title}`);}
  const active=state.query.trim()||state.kind!=='all'||state.savedOnly;count.textContent=active?`Atlasē: ${total} no ${cards.length} rīkiem.`:`Pieejami ${cards.length} rīki.`;clear.hidden=!active;empty.hidden=total!==0;
  const savedEmpty=state.savedOnly&&!saved.length;root.querySelector('[data-directory-empty-title]').textContent=savedEmpty?'Vēl nav saglabātu rīku':'Neviens rīks neatbilst meklējumam.';root.querySelector('[data-directory-empty-copy]').textContent=savedEmpty?'Lai izveidotu savu rīku izlasi, atzīmē kartītes ar grāmatzīmi.':'Pārbaudi nosaukumu, izmēģini īsāku vārdu vai noņem kādu filtru.';
  for(const link of document.querySelectorAll('[data-directory-kind]'))link.classList.toggle('is-active',link.dataset.directoryKind===state.kind);
 }
 function reset(){form.reset();render();form.elements.q.focus();}
 form.hidden=false;for(const c of cards)c.button.hidden=false;
 form.addEventListener('submit',e=>{e.preventDefault();render();});form.addEventListener('input',render);form.addEventListener('change',render);clear.addEventListener('click',reset);root.querySelector('[data-directory-reset]').addEventListener('click',reset);
 root.addEventListener('click',e=>{const button=e.target.closest('[data-tool-save]');if(!button)return;const url=button.dataset.toolSave;if(!urls.includes(url))return;saved=saved.includes(url)?saved.filter(v=>v!==url):[...saved,url];try{localStorage.setItem(key,JSON.stringify(saved));canStore=true;}catch{canStore=false;}notice.hidden=canStore;notice.textContent=canStore?'':'Pārlūka krātuve nav pieejama. Atzīmes saglabāsies tikai līdz lapas aizvēršanai.';render();});
 for(const link of document.querySelectorAll('[data-directory-kind]'))link.addEventListener('click',e=>{e.preventDefault();form.elements.kind.value=link.dataset.directoryKind;form.elements.q.value='';form.elements.saved.checked=false;render();root.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});form.elements.kind.focus({preventScroll:true});});
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){e.preventDefault();form.elements.q.focus();}});
 window.addEventListener('storage',e=>{if(e.key===key){saved=readSavedTools(e.newValue,urls);render();}});render();
}
