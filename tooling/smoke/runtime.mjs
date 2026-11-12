// Read-only post-initialization checks, run through the supported browser surface.
export function measureRuntime(){
 const shown=el=>{if(el.closest('[hidden],[aria-hidden="true"],.sr-only,.visually-hidden'))return false;for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||(p.tagName==='DETAILS'&&!p.open&&!p.querySelector('summary')?.contains(el)))return false;}const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
 const main=document.querySelector('main'),text=main?.innerText||'',errors=[];
 const invalid=/Invalid time zone|(?:Type|Reference|Syntax|Range)Error|\b(?:undefined|NaN)\b|Cannot read properties|is not a function/i;
 for(const el of document.querySelectorAll('main [role="status"],main [role="alert"],main [data-useful-status],main output'))if(shown(el)&&invalid.test(el.textContent))errors.push(el.textContent.trim().slice(0,300));
 const topImages=[...document.images].filter(i=>shown(i)&&i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0);
 const broken=topImages.filter(i=>i.complete&&!i.naturalWidth).map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt')}));
 return {runtimeVersion:1,path:location.pathname,title:document.title,lang:document.documentElement.lang,h1:[...document.querySelectorAll('main h1')].map(n=>n.textContent.trim()),canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href'),mainCharacters:text.length,unexpectedText:invalid.test(text)?text.match(invalid)?.[0]:null,errors,brokenImages:broken,pendingImages:topImages.filter(i=>!i.complete).map(i=>i.getAttribute('src')),useful:main?.getAttribute('data-useful-ready'),lunar:!!document.querySelector('[data-lunar-calendar]'),status:[...document.querySelectorAll('main [role="status"],main [data-useful-status]')].filter(shown).map(n=>n.textContent.trim()).filter(Boolean).slice(0,8)};
}
