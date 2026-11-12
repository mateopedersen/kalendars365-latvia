import {defaultPrintFilters,normalizePrintFilters,filterPrintLibrary,printPeriodLink,printPeriodLabel,printDesignCount,printMonthGenitives} from './print-library-core.mjs';
const root=document.querySelector('[data-print-library]');
if(root) {
  const controls=Array.from(root.querySelectorAll('[data-print-filter]')),results=root.querySelector('[data-print-library-results]'),status=root.querySelector('[data-print-library-status]');
  const empty=root.querySelector('[data-print-library-empty]'),more=root.querySelector('[data-print-library-more]'),reset=root.querySelector('[data-print-library-reset]'),periodLink=root.querySelector('[data-print-period-link]');
  const keys={year:'gads',period:'periods',month:'menesis',orientation:'virziens',holidays:'svetki',query:'dizains'};
  let state={...defaultPrintFilters},limit=6,catalogPromise,requestId=0,timer;
  const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
  const arrow=direction=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    path.setAttribute('d',direction==='download'?'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4':'M5 12h14m-6-6 6 6-6 6');svg.append(path);return svg;
  };
  function applyControls() {
    for(const control of controls)control.value=String(state[control.dataset.printFilter]);
    root.querySelector('[data-print-month-label]').hidden=state.period!=='month';
    root.querySelector('[data-print-filter="month"]').disabled=state.period!=='month';
    periodLink.href=printPeriodLink(state);
    reset.hidden=Object.keys(defaultPrintFilters).every(key=>state[key]===defaultPrintFilters[key]);
  }
  function readControls() { return normalizePrintFilters(Object.fromEntries(controls.map(control=>[control.dataset.printFilter,control.value]))); }
  function readUrl() { const params=new URL(location.href).searchParams;return normalizePrintFilters(Object.fromEntries(Object.entries(keys).map(([key,name])=>[key,params.get(name)??defaultPrintFilters[key]]))); }
  function updateUrl() {
    const url=new URL(location.href);
    for(const [key,name] of Object.entries(keys)) {
      url.searchParams.delete(name);
      if(state[key]!==defaultPrintFilters[key]&&(key!=='month'||state.period==='month'))url.searchParams.set(name,String(state[key]));
    }
    history.replaceState(null,'',url);
  }
  async function catalog() {
    if(!catalogPromise)catalogPromise=fetch('/assets/print-library-data.json').then(async response=>{
      if(!response.ok)throw Error('catalog');const data=await response.json();
      if(data.version!==1||!Array.isArray(data.items)||data.items.length!==780)throw Error('catalog');
      return data.items;
    }).catch(error=>{catalogPromise=undefined;throw error;});
    return catalogPromise;
  }
  function card(item) {
    const article=element('article','print-library-card'),preview=element('a','print-library-preview'),image=element('img');
    const period=item.month?`${item.year}. gada ${printMonthGenitives[item.month-1]} kalendārs`:`${item.year}. gada kalendārs`;
    preview.href=item.image;preview.target='_blank';preview.rel='noopener';preview.setAttribute('aria-label',`Apskatīt: ${item.title}, ${period}`);
    image.src=item.preview;image.width=item.width;image.height=item.height;image.alt=`${item.title}: ${period}`;image.loading='lazy';image.decoding='async';
    const caption=element('span',null,'Apskatīt ');caption.append(arrow('next'));preview.append(image,caption);
    const copy=element('div','print-library-card-copy'),description=element('p',null,`A3 · ${item.orientation==='portrait'?'Vertikāli':'Horizontāli'} · ${item.holidays?'Ar svētku dienām':'Bez svētku atzīmēm'}`);
    const downloads=element('div','print-library-downloads');
    for(const [key,label,icon] of [['pdf','PDF','file-pdf'],['image','Attēls','file-image']]) {
      const link=element('a'),mark=element('img');link.href=item[key];link.download='';link.setAttribute('aria-label',`Lejupielādēt ${item.title}: ${label}`);
      mark.src=`/assets/${icon}.svg`;mark.width=24;mark.height=24;mark.alt='';link.append(mark,element('span',null,label),arrow('download'));downloads.append(link);
    }
    copy.append(element('small',null,period),element('h3',null,item.title),description,downloads);article.append(preview,copy);return article;
  }
  async function render(syncUrl=true) {
    const token=++requestId;applyControls();root.setAttribute('aria-busy','true');status.textContent='Meklējam tavus kalendārus…';more.disabled=true;
    try {
      const items=await catalog();if(token!==requestId)return;
      const matching=filterPrintLibrary(items,state),fragment=document.createDocumentFragment();
      for(const item of matching.slice(0,limit))fragment.append(card(item));
      results.replaceChildren(fragment);empty.hidden=matching.length>0;
      status.textContent=`${printPeriodLabel(state)} · ${printDesignCount(matching.length)}`;
      more.hidden=matching.length<=limit;more.disabled=false;
      more.replaceChildren(document.createTextNode(`Parādīt vēl ${Math.min(6,Math.max(0,matching.length-limit))} dizainus `),arrow('next'));
      if(syncUrl)updateUrl();
    } catch {
      if(token!==requestId)return;
      status.textContent='Atlasi neizdevās ielādēt. Mēģini vēlreiz vai atver perioda kolekciju.';
      more.disabled=false;more.hidden=false;more.replaceChildren(document.createTextNode('Mēģināt vēlreiz '),arrow('next'));
    } finally {if(token===requestId)root.removeAttribute('aria-busy');}
  }
  for(const control of controls)control.addEventListener(control.type==='search'?'input':'change',()=>{
    clearTimeout(timer);state=readControls();limit=6;
    if(control.type==='search')timer=setTimeout(()=>render(),130);else render();
  });
  more.addEventListener('click',()=>{limit+=6;render();});
  reset.addEventListener('click',()=>{clearTimeout(timer);state={...defaultPrintFilters};limit=6;render();});
  root.querySelector('[data-print-library-clear]').addEventListener('click',()=>{clearTimeout(timer);state={...state,orientation:'all',holidays:'all',query:''};limit=6;render();});
  addEventListener('popstate',()=>{clearTimeout(timer);state=readUrl();limit=6;render(false);});
  state=readUrl();applyControls();
  if(Object.values(keys).some(key=>new URL(location.href).searchParams.has(key)))render(false);
}
