import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../critical-css/package.json',import.meta.url));
const{parseDocument}=require('htmlparser2');const{findAll,textContent}=require('domutils');
const rows=[...JSON.parse(fs.readFileSync('docs/route-manifest.json')),{url:'/404.html',family:'not_found'},{url:'/500.html',family:'temporary_error'}];
const pages=rows.map(row=>{
 const html=fs.readFileSync('_site'+row.url+(row.url.endsWith('/')?'index.html':''),'utf8'),doc=parseDocument(html);
 const widgets=findAll(n=>n.attribs?.['data-widget'],doc.children,true).map(n=>n.attribs['data-widget']);
 const controls=findAll(n=>['button','select','input','textarea','summary'].includes(n.name),doc.children,true);
 const longest=Math.max(0,...controls.map(n=>textContent(n).length));
 return{url:row.url,family:row.family,css:html.match(/static\/css\/([a-f0-9]+)\.css/)?.[1],widgets:[...new Set(widgets)],controls:controls.length,longest};
});
const selected=new Map(pages.filter(r=>r.family==='hub').map(r=>[r.url,r]));
for(const key of ['family','css'])for(const value of new Set(pages.map(r=>r[key]))){const list=pages.filter(r=>r[key]===value).sort((a,b)=>b.controls-a.controls||b.longest-a.longest);selected.set(list[0].url,list[0]);}
for(const widget of new Set(pages.flatMap(r=>r.widgets))){const row=pages.find(r=>r.widgets.includes(widget));selected.set(row.url,row);}
for(const url of ['/kalendars/2028/februaris/','/kalendars/2030/decembris/','/svetku-dienas/2029/','/meness-kalendars/2029/aprilis/','/horoskops/vezis/','/izveidot-kalendaru/','/blogs/latvijas-svetku-dienas-2027-planosana/'])selected.set(url,pages.find(r=>r.url===url));
fs.writeFileSync('../reports/responsive-2026-11-12/inventory.json',JSON.stringify({pages,sample:[...selected.values()]},null,2)+'\n');
console.log(JSON.stringify({pages:pages.length,families:new Set(pages.map(r=>r.family)).size,styleBundles:new Set(pages.map(r=>r.css)).size,sample:selected.size,widgets:[...new Set(pages.flatMap(r=>r.widgets))]}));
