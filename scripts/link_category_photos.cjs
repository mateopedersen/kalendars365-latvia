/* Bind the shared category symbols to reviewed photographic SVG artwork. */
const fs=require('node:fs');
const manifest=JSON.parse(fs.readFileSync('_data/category-photos.json','utf8')),ids=new Set(manifest.artworks.map(a=>a.id));
const map={calendar:'calendar',week:'week',family:'family',vacation:'vacation',shift:'shift',plan:'planner',gift:'holiday',school:'school',names:'names',sun:'sun',sunset:'sunrise','moon':'moon','moon-phases':'phases',seasons:'seasons',timetable:'timetable',alltools:'alltools',astronomy:'astronomy','latvia-days':'latvia-days'};
if(ids.has('calculator'))map.calculator='calculator';
let html=fs.readFileSync('_includes/icons.html','utf8');
for(const [symbol,art] of Object.entries(map)){
 if(!ids.has(art))throw Error('Missing reviewed category photo '+art);
 const markup=`<symbol id="i-${symbol}" viewBox="0 0 320 260"><image href="/assets/category-photos/${art}.svg?v={{ site.data.build.asset_version }}" width="320" height="260"/></symbol>`;
 const re=new RegExp(`<symbol id="i-${symbol}"[^>]*>[\\s\\S]*?<\\/symbol>`);
 html=re.test(html)?html.replace(re,markup):html.replace('</svg>',markup+'</svg>');
}
fs.writeFileSync('_includes/icons.html',html);
console.log('Bound '+Object.keys(map).length+' shared photographic category symbols.');
