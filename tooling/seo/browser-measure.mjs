// Read-only DOM evidence; collected separately from the raw-HTML inventory.
export function measureSeoDom(){
 const meta=name=>document.querySelector('meta[name="'+name+'"],meta[property="'+name+'"]')?.content||'';
 const calendar=document.querySelector('#calendar-view');
 const visibleImages=[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.y<innerHeight;});
 const images=visibleImages.map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt'),width:i.width,height:i.height,loaded:i.complete&&i.naturalWidth>0}));
 return {path:location.pathname,query:location.search,width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,title:document.title,description:meta('description'),canonical:document.querySelector('link[rel="canonical"]')?.href,robots:meta('robots'),lang:document.documentElement.lang,h1:[...document.querySelectorAll('h1')].map(h=>h.innerText),jsonld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),calendarTitle:document.querySelector('#calendar-title')?.textContent,calendarCells:calendar?.querySelectorAll('[data-date]').length||0,calendarTables:calendar?.querySelectorAll('table').length||0,tables:document.querySelectorAll('main table').length,visibleImages:images,fonts:document.fonts.status};
}
