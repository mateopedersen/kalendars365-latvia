// Read-only browser measurements for the shared footer contact directory.
export function measureFooterConnect(){
 const panel=document.querySelector('.footer-about-row');
 const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const problems=[];
 if(!panel)return {path:location.pathname,problems:[{type:'missing-panel'}]};
 const b=rect(panel),nav=panel.querySelector('.footer-about-links'),intro=panel.querySelector('.footer-connect-intro');
 const inside=(child,parent)=>child.x>=parent.x-1&&child.right<=parent.right+1&&child.y>=parent.y-1&&child.bottom<=parent.bottom+1;
 const links=[...nav.querySelectorAll('a')].map(el=>{
  const label=el.querySelector('.footer-route-label'),img=el.querySelector('img');
  const box=rect(el),text=rect(label),icon=rect(img),style=getComputedStyle(el);
  const result={label:label.textContent.trim(),href:el.getAttribute('href'),box,text,icon,font:style.fontSize,weight:style.fontWeight,loaded:img.complete&&img.naturalWidth>0,current:el.getAttribute('aria-current')};
  if(!result.loaded)problems.push({type:'image',label:result.label});
  if(!inside(box,b)||!inside(text,box)||!inside(icon,box))problems.push({type:'outside',label:result.label});
  if(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)problems.push({type:'overflow',label:result.label});
  return result;
 });
 const heights=links.map(x=>Math.round(x.box.height*100)/100);
 if(Math.max(...heights)-Math.min(...heights)>1)problems.push({type:'unequal-height',heights});
 if(links.length!==6)problems.push({type:'link-count',count:links.length});
 const cover=intro.querySelector('img');
 if(!cover.complete||cover.naturalWidth===0)problems.push({type:'intro-image'});
 if(document.documentElement.scrollWidth>innerWidth+1)problems.push({type:'page-overflow'});
 return {path:location.pathname,width:innerWidth,documentWidth:document.documentElement.scrollWidth,panel:b,intro:rect(intro),nav:rect(nav),fonts:document.fonts.status,links,problems};
}
