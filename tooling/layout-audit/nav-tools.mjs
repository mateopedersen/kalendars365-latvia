// Read-only checks for the shared secondary navigation.
export function measureNavTools() {
  const nav=document.querySelector('.secondary-nav');
  const round=x=>Math.round(x*100)/100;
  const rect=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
  const controls=[...nav.querySelectorAll(':scope > .nav-shortcut,:scope > .nav-more > summary')].map(el=>{
    const icon=el.querySelector('.nav-tool-icon'),label=el.querySelector('.nav-tool-label'),chevron=el.querySelector('.nav-tool-chevron');
    const b=rect(el),i=rect(icon),t=rect(label),s=getComputedStyle(el);
    const left=Math.min(i.x,t.x),right=Math.max(i.right,t.right);
    return {text:label.textContent.trim(),href:el.getAttribute('href'),box:b,icon:i,label:t,font:s.fontSize,weight:s.fontWeight,
      iconLoaded:icon.complete&&icon.naturalWidth>0,
      groupCenterError:round((left+right-b.x-b.right)/2),
      verticalCenterError:round((i.y+i.height/2)-(t.y+t.height/2)),
      buttonCenterError:round((i.y+i.height/2)-(b.y+b.height/2)),
      overflow:el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2,
      chevron:chevron?rect(chevron):null};
  });
  const menu=nav.querySelector('.nav-more'),panel=nav.querySelector('.nav-directory');
  return {path:location.pathname,width:innerWidth,documentWidth:document.documentElement.scrollWidth,
    assetVersion:document.querySelector('meta[name="asset-version"]')?.content,fonts:document.fonts.status,nav:rect(nav),controls,
    menuOpen:menu.open,menu:menu.open?rect(panel):null,
    problems:controls.flatMap(c=>[...(!c.iconLoaded?['icon']:[]),...(Math.abs(c.groupCenterError)>1?['horizontal-center']:[]),...(Math.abs(c.verticalCenterError)>1||Math.abs(c.buttonCenterError)>1?['vertical-center']:[]),...(c.overflow?['overflow']:[])].map(type=>({type,text:c.text})))};
}
