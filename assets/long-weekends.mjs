import {createLongWeekendCore} from './long-weekends-core.mjs';
import {renderFeatured,renderSummary,renderResults} from './long-weekends-markup.mjs';
const root=document.querySelector('[data-long-weekends]');
if(root){
 const revision=new URL(import.meta.url).search;if(!globalThis.CalendarCore)await import('./calendar-core.js'+revision);
 const L=createLongWeekendCore(globalThis.CalendarCore),$=selector=>root.querySelector(selector),yearPage=root.dataset.yearPage==='true',defaultYear=Number(root.dataset.defaultYear);let state,items;
 const count=n=>`${n} ${n%10===1&&n%100!==11?'atpūtas periods':n===0?'atpūtas periodu':'atpūtas periodi'}`;
 function fromURL(){const q=new URLSearchParams(location.search);return L.settings({year:!yearPage&&L.years.includes(Number(q.get('gads')))?Number(q.get('gads')):defaultYear,mode:q.get('veids')==='leave'?'leave':'free',budget:[1,2,3,4,5].includes(Number(q.get('dienas')))?Number(q.get('dienas')):3,sort:q.get('kartot')==='longest'?'longest':'earliest'});}
 function query(s,includeYear=!yearPage){const q=new URLSearchParams();if(includeYear&&s.year!==defaultYear)q.set('gads',s.year);if(s.mode!=='free')q.set('veids',s.mode);if(s.budget!==3)q.set('dienas',s.budget);if(s.sort!=='earliest')q.set('kartot',s.sort);return q;}
 function refresh({url=true}={}){try{
  state=L.settings(state);items=L.periods(state);root.dataset.year=state.year;root.dataset.mode=state.mode;
  root.querySelectorAll('[data-weekend-year]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.weekendYear)===state.year)));
  root.querySelectorAll('[data-weekend-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.weekendMode===state.mode)));
  $('[data-weekend-budget-wrap]').hidden=state.mode==='free';$('[data-weekend-leave-key]').hidden=state.mode==='free';$('[data-weekend-budget]').value=state.budget;$('[data-weekend-sort]').value=state.sort;
  $('[data-weekend-description]').textContent=state.mode==='free'?'Piecu dienu darba nedēļai. Trīs vai vairāk brīvas dienas pēc kārtas bez atvaļinājuma.':'Piecu dienu darba nedēļai. Katrs variants ir atsevišķa izvēle ar savu atvaļinājuma budžetu.';
  $('[data-weekend-summary]').innerHTML=renderSummary(items,state,L);$('[data-weekend-feature]').innerHTML=renderFeatured(L.summary(items).best,state,L);$('[data-weekend-results]').innerHTML=renderResults(items,state,L);$('[data-weekend-status]').textContent=state.year+'. gads · '+count(items.length);$('[data-weekend-export-status]').textContent='';
  const link=$('[data-weekend-year-link]');link.href=`/garas-brivdienas/${state.year}/`;link.hidden=yearPage;
  if(url){const next=new URL(location.href);next.search=query(state).toString();history.replaceState(null,'',next);}
 }catch(error){$('[data-weekend-status]').textContent=error.message;}}
 root.addEventListener('click',event=>{const year=event.target.closest('[data-weekend-year]'),mode=event.target.closest('[data-weekend-mode]'),download=event.target.closest('[data-weekend-export]');
  if(year){const selected=Number(year.dataset.weekendYear);if(yearPage&&selected!==state.year){const q=query(state,false);location.assign(`/garas-brivdienas/${selected}/`+(q.size?'?'+q:''));return;}state={...state,year:selected};refresh();}
  if(mode){state={...state,mode:mode.dataset.weekendMode};refresh();}
  if(download){try{const row=items.find(r=>r.id===download.dataset.weekendExport);if(!row)throw Error('Izvēlies periodu vēlreiz.');const blob=new Blob([L.ics(row)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`garas-brivdienas-${row.start}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);$('[data-weekend-export-status]').textContent='Sagatavots periods: '+L.range(row,{year:true})+'.';}catch(error){$('[data-weekend-export-status]').textContent=error.message;}}
 });
 $('[data-weekend-budget]').addEventListener('change',event=>{state={...state,budget:Number(event.target.value)};refresh();});$('[data-weekend-sort]').addEventListener('change',event=>{state={...state,sort:event.target.value};refresh();});
 addEventListener('popstate',()=>{state=fromURL();refresh({url:false});});state=fromURL();refresh({url:false});
}
