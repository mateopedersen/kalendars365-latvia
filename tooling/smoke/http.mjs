import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../critical-css/package.json',import.meta.url));
const {parseDocument}=require('htmlparser2'),{findAll}=require('domutils');
const origin=process.argv[2]||'http://127.0.0.1:4025',out=process.argv[3]||'../reports/smoke-2026-11-12/after/http.json';
const manifest=JSON.parse(await fs.readFile('docs/route-manifest.json','utf8'));
const rows=[...manifest,{url:'/404.html',family:'not_found'},{url:'/500.html',family:'temporary_error'}];
const results=[],resourceMap=new Map(),errors=[];let cursor=0;
await Promise.all(Array.from({length:8},async()=>{while(cursor<rows.length){const row=rows[cursor++];try{
 const response=await fetch(origin+row.url),html=await response.text(),doc=parseDocument(html);
 const entry={url:row.url,family:row.family,status:response.status,bytes:Buffer.byteLength(html),contentType:response.headers.get('content-type'),csp:!!response.headers.get('content-security-policy'),errors:[]};
 if(response.status!==200)entry.errors.push('HTTP '+response.status);
 if(!entry.contentType?.startsWith('text/html'))entry.errors.push('HTML content type');
 if(!entry.csp)entry.errors.push('CSP missing in QA server');
 for(const n of findAll(n=>!!n.attribs,doc.children,true)){
  const a=n.attribs,urls=[];
  if(['img','script','source','video','audio'].includes(n.name)&&a.src)urls.push(a.src);
  if(n.name==='link'&&/stylesheet|icon|preload/.test(a.rel||'')&&a.href)urls.push(a.href);
  if(n.name==='a'&&(a.download!==undefined||/\.(pdf|webp|png|jpe?g|ics|csv|docx|xlsx)(?:\?|$)/i.test(a.href||'')))urls.push(a.href);
  if(a.srcset)urls.push(...a.srcset.split(',').map(v=>v.trim().split(/\s+/)[0]));
  for(const raw of urls){const u=new URL(raw,'https://kalendars365.lv'+row.url);if(u.origin!=='https://kalendars365.lv'||!u.pathname.startsWith('/'))continue;const key=decodeURIComponent(u.pathname);if(!resourceMap.has(key))resourceMap.set(key,[]);resourceMap.get(key).push(row.url);}
 }
 results.push(entry);
}catch(error){results.push({...row,error:String(error)});}}}));
const resources=[];
for(const [url,pages] of resourceMap){const file=path.join('_site',url);try{const stat=await fs.stat(file);if(!stat.isFile()||!stat.size)throw Error('empty or non-file');resources.push({url,bytes:stat.size,pages:pages.length});}catch(error){errors.push({url,pages:pages.slice(0,5),error:String(error)});}}
const missing=await fetch(origin+'/smoke-test-nonexistent-2026-11-12/');
const report={origin,pages:results.length,families:new Set(rows.map(r=>r.family)).size,routeErrors:results.filter(r=>r.error||r.errors?.length),resourceErrors:errors,resources:resources.length,downloadResources:resources.filter(r=>/\.(pdf|webp|png|jpg|jpeg|ics|csv|docx|xlsx)$/.test(r.url)).length,notFoundStatus:missing.status,results:results.sort((a,b)=>a.url.localeCompare(b.url)),resourceInventory:resources};
await fs.writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined,resourceInventory:undefined}));
if(report.routeErrors.length||errors.length||missing.status!==404)process.exitCode=1;
