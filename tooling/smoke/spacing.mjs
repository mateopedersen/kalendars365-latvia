// Candidates for visual review, not automatic design failures.
export function measureSpacing(){
 const visible=e=>{if(e.closest('[hidden],[aria-hidden="true"],svg,dialog:not([open])'))return false;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||(p.tagName==='DETAILS'&&!p.open&&!p.querySelector('summary')?.contains(e)))return false;}const r=e.getBoundingClientRect();return r.width>1&&r.height>1;};
 const label=e=>({tag:e.tagName,id:e.getAttribute('id'),class:e.getAttribute('class'),text:e.textContent.trim().replace(/\s+/g,' ').slice(0,85)});
 const gaps=[],actionRows=[];
 for(const parent of document.querySelectorAll('main,main section,main .actions,main form')){
  if(!visible(parent))continue;
  const kids=[...parent.children].filter(visible).filter(e=>!['absolute','fixed','sticky'].includes(getComputedStyle(e).position));
  for(let i=1;i<kids.length;i++){const a=kids[i-1],b=kids[i],ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();const occupied=[...parent.children].some(e=>{if(e===a||e===b)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.height>0&&r.top<rb.top-2&&r.bottom>ra.bottom+2&&Math.min(r.right,rb.right,ra.right)-Math.max(r.left,rb.left,ra.left)>8;});if(!occupied&&rb.top-ra.bottom>80&&Math.min(rb.right,ra.right)>Math.max(rb.left,ra.left))gaps.push({parent:label(parent),before:label(a),after:label(b),gap:Math.round(rb.top-ra.bottom)});}
  const actions=kids.filter(e=>e.matches('button,a.button,a.primary-button,select'));
  for(let i=0;i<actions.length;i++)for(let j=i+1;j<actions.length;j++){const a=actions[i],b=actions[j],ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();if(Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top)>20&&Math.abs(ra.height-rb.height)>5)actionRows.push({parent:label(parent),a:label(a),b:label(b),heights:[Math.round(ra.height),Math.round(rb.height)]});}
 }
 return{path:location.pathname,width:innerWidth,gaps,actionRows};
}
