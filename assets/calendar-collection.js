(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.K365Collection=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const months=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
 function path(prefix,year,month){if(!['kalendars','pdf-kalendari','meness-kalendars'].includes(prefix)||!Number.isInteger(year)||year<2027||year>2030||(month!=null&&(!Number.isInteger(month)||month<1||month>12)))return null;return '/'+prefix+'/'+year+'/'+(month==null?'':months[month-1]+'/');}
 function step(value,view,direction){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||![1,-1].includes(direction))return null;
  const date=new Date(value+'T12:00:00Z');if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)return null;
  if(view==='year')return path('kalendars',date.getUTCFullYear()+direction)?`${date.getUTCFullYear()+direction}-01-01`:null;
  if(['month','list'].includes(view)){date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+direction);}else date.setUTCDate(date.getUTCDate()+(view==='week'?7:1)*direction);
  return date.getUTCFullYear()>=2027&&date.getUTCFullYear()<=2030?date.toISOString().slice(0,10):null;
 }
 function destination(prefix,state){if(!state||!/^\d{4}-\d{2}-\d{2}$/.test(state.shown))return null;const year=Number(state.shown.slice(0,4)),month=Number(state.shown.slice(5,7));return path(prefix,year,state.view==='year'?null:month);}
 return {path,step,destination};
});

if(typeof window==='object'&&typeof document==='object')(()=>{'use strict';
 const root=document.querySelector('[data-calendar-collection]');if(!root)return;
 const explorer=root.querySelector('[data-calendar-explorer]'),wide=window.matchMedia('(min-width:1101px)'),api=window.K365Collection;
 const prefix=root.dataset.collectionPrefix,year=Number(root.dataset.collectionYear),month=Number(root.dataset.collectionMonth)||null;
 function explorerLayout(){explorer.open=wide.matches;if(wide.matches){const list=root.querySelector('.collection-month-list'),current=list.querySelector('.is-current');if(current)list.scrollTop=Math.max(0,current.offsetTop-list.offsetTop-10);}}
 explorerLayout();wide.addEventListener('change',explorerLayout);
 function carryLunarCity(){
  if(prefix!=='meness-kalendars')return;
  const selected=root.querySelector('[data-lunar-city]')?.value||new URLSearchParams(location.search).get('city');
  if(!window.K365Cities?.some(city=>city.id===selected))return;
  root.querySelectorAll('.calendar-collection-sidebar a,.collection-period-nav a').forEach(link=>{const url=new URL(link.href);if(url.pathname.startsWith('/meness-kalendars/')){url.searchParams.set('city',selected);link.href=url.href;}});
 }
 carryLunarCity();root.querySelector('[data-lunar-city]')?.addEventListener('change',carryLunarCity);
 const calendar=root.querySelector('.collection-calendar-app'),calendarTitle=calendar?.querySelector('#calendar-title');if(!calendarTitle)return;
 let navigating=false;
 function updatePeriod(){
  const state=window.K365?.getState();if(!state||navigating)return;
  calendar.querySelectorAll('#calendar-year option').forEach(option=>{if(Number(option.value)<2027||Number(option.value)>2030)option.remove();});
  for(const [action,direction] of [['prev',-1],['next',1]])calendar.querySelector(`[data-action="${action}"]`).disabled=!api.step(state.shown,state.view,direction);
  const next=api.destination('kalendars',state)||'/';
  // Keep initialization idempotent when the selected month or year already
  // matches this collection's period.
  if(next===api.path('kalendars',year,month))return;
  const target=new URL(next,location.origin);target.searchParams.set('date',state.selected||state.shown);if(state.view!=='year'||next==='/')target.searchParams.set('view',state.view);target.hash=state.view==='year'?'':'calendar-app';navigating=true;location.assign(target.href);
 }
 calendar.querySelectorAll('[data-action="prev"],[data-action="next"]').forEach(button=>button.addEventListener('click',event=>{const state=window.K365?.getState();if(state&&!api.step(state.shown,state.view,button.dataset.action==='prev'?-1:1)){event.preventDefault();event.stopPropagation();}}));
 calendar.querySelector('[data-action="today"]').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();const today=window.K365?.rigaNow?.()||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const target=api.path('kalendars',Number(today.slice(0,4)),Number(today.slice(5,7)))||'/';location.assign(target+'?date='+encodeURIComponent(today)+'&view=month#calendar-app');});
 new MutationObserver(updatePeriod).observe(calendarTitle,{childList:true,subtree:true});updatePeriod();
})();
