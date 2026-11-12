// Read-only geometry checks. Invoke with the supported browser tool.
export function measureResponsive() {
  const width=innerWidth,height=innerHeight;
  const style=el=>getComputedStyle(el),box=el=>el.getBoundingClientRect();
  const visible=el=>{
    if(el.closest('[hidden],.sr-only,.visually-hidden,svg,svg *,[aria-hidden="true"]'))return false;
    for(let p=el;p;p=p.parentElement){
      if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector('summary')?.contains(el))return false;
      const s=style(p);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||s.opacity==='0')return false;
    }
    const r=box(el);return r.width>1&&r.height>1;
  };
  const selector=el=>{
    const parts=[];
    for(let p=el;p&&p!==document.body&&parts.length<4;p=p.parentElement){
      const id=p.getAttribute('id');if(id){parts.unshift('[id="'+id.replace(/"/g,'\\"')+'"]');break;}
      const names=[...p.classList].slice(0,2);let part=p.tagName.toLowerCase()+names.map(s=>'.'+s).join('');
      const siblings=[...p.parentElement.children].filter(n=>n.tagName===p.tagName);
      if(siblings.length>1)part+=':nth-of-type('+(siblings.indexOf(p)+1)+')';parts.unshift(part);
    }return parts.join(' > ');
  };
  const label=el=>(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||el.getAttribute('name')||'').trim().replace(/\s+/g,' ').slice(0,100);
  const short=el=>{const r=box(el);return{selector:selector(el),label:label(el),x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}};
  const scrollerFor=el=>{
    for(let p=el.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){
      const s=style(p);if(['auto','scroll'].includes(s.overflowX)&&p.scrollWidth>p.clientWidth+2&&box(p).right<=width+2&&box(p).left>=-2)return p;
    }return null;
  };
  const clippedArtwork=el=>{
    if(!el.matches('img,canvas,figure'))return false;
    for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
      const s=style(p),r=box(p);if(['hidden','clip'].includes(s.overflowX)&&r.left>=-2&&r.right<=width+2)return true;
    }return false;
  };
  const candidates=[...document.querySelectorAll('main,header,footer,section,article,aside,nav,form,fieldset,details,summary,figure,table,th,td,button,a.button,a.primary-button,[role="button"],input,select,textarea,h1,h2,h3,h4,p,img,canvas')].filter(visible);
  const horizontal=[],textClipping=[],smallActions=[],smallFields=[],overlaps=[],scrollContainers=[],clamped=[],selectPadding=[];
  for(const el of candidates){
    const r=box(el),s=style(el),action=el.matches('button,[role="button"],a.button,a.primary-button,summary');
    if((r.right>width+2||r.left< -2)&&!clippedArtwork(el)){
      const scroller=scrollerFor(el);if(scroller){const key=selector(scroller);if(!scrollContainers.includes(key))scrollContainers.push(key);}
      else horizontal.push(short(el));
    }
    if(el.matches('h1,h2,h3,h4,p,button,summary,a.button,a.primary-button,[role="button"]')){
      if(+s.webkitLineClamp>0||s.textOverflow==='ellipsis')clamped.push(short(el));
      // Font ink can extend a few pixels outside a tight line box. With visible
      // overflow and normal surrounding flow, that is not clipped content.
      else if(el.scrollWidth>el.clientWidth+2||(el.scrollHeight>el.clientHeight+2&&(action||['hidden','clip'].includes(s.overflowY))))textClipping.push({...short(el),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight});
    }
    if(action&&(r.width<24||r.height<24))smallActions.push(short(el));
    if(el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="submit"]):not([type="button"]),select,textarea')&&+s.fontSize.replace('px','')<16)smallFields.push({...short(el),font:s.fontSize});
    if(el.matches('select:not([multiple])')&&s.appearance==='none'&&+s.paddingRight.replace('px','')<28)selectPadding.push({...short(el),paddingRight:s.paddingRight});
  }
  const parents=[];
  for(const el of candidates.filter(n=>n.matches('button,a.button,a.primary-button,[role="button"],input,select,textarea,summary'))){if(!parents.includes(el.parentElement))parents.push(el.parentElement);}
  for(const parent of parents){
    const children=[...parent.children].filter(el=>el.matches('button,a.button,a.primary-button,[role="button"],input,select,textarea,summary')&&visible(el)&&!['absolute','fixed'].includes(style(el).position));
    for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
      const a=children[i],b=children[j],ra=box(a),rb=box(b);
      if(Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left)>2&&Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top)>2)overlaps.push({parent:selector(parent),first:short(a),second:short(b)});
    }
  }
  const viewport=document.querySelector('meta[name="viewport"]')?.getAttribute('content')||'';
  const fixed=[...document.querySelectorAll('body *')].filter(el=>el.matches('aside,nav,header,dialog,[role="dialog"]')&&visible(el)&&style(el).position==='fixed').map(short);
  return{measurementVersion:3,stylesReady:style(document.documentElement).getPropertyValue('--brand').trim().length>0&&style(document.body).margin==='0px',stylesheetHrefs:[...document.querySelectorAll('link[rel="stylesheet"]')].map(el=>el.getAttribute('href')),path:location.pathname,width,height,assetVersion:document.querySelector('meta[name="asset-version"]')?.getAttribute('content')||'',documentWidth:document.documentElement.scrollWidth,documentOverflow:document.documentElement.scrollWidth>width+2,viewport,zoomRestricted:/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/i.test(viewport),fonts:document.fonts.status,
    horizontal,textClipping,overlaps,smallActions,smallFields,selectPadding,scrollContainers,clamped,fixed,inspected:candidates.length};
}
