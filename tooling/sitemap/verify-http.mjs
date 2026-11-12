// Read-only loopback verification. Never contacts the public origin or a search engine.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const output=process.argv[2];
const sitemap=fs.readFileSync(path.join(root,'_site/sitemap.xml'),'utf8');
const images=fs.readFileSync(path.join(root,'_site/image-sitemap.xml'),'utf8');
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const pages=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>({url:decode(m[1]),kind:'page'}));
const uniqueImages=[...new Set([...images.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m=>decode(m[1])))].map(url=>({url,kind:'image'}));
const child=spawn(process.execPath,[path.join(root,'tooling/seo/serve.mjs'),'--root='+path.join(root,'_site'),'--port=0','--mode=production-simulation'],{cwd:root,stdio:['ignore','pipe','pipe']});
try{
 const local=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Local test server did not start')),10000);
  child.once('error',error=>{clearTimeout(timer);reject(error)});
  child.once('exit',()=>{clearTimeout(timer);reject(Error('Local test server exited'))});
  child.stdout.once('data',data=>{clearTimeout(timer);try{resolve(JSON.parse(data.toString().trim()).url)}catch(error){reject(error)}});
 });
 const results=[],errors=[];let cursor=0;
 const rows=[...pages,...uniqueImages];
 await Promise.all(Array.from({length:6},async()=>{
  while(cursor<rows.length){
   const row=rows[cursor++];
   try{
    const url=new URL(row.url);
    if(url.origin!=='https://kalendars365.lv')throw Error('Nonpublic sitemap origin');
    const response=await fetch(local+url.pathname,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(20000)});
    const entry={...row,status:response.status,type:response.headers.get('content-type'),bytes:Number(response.headers.get('content-length')),robots:response.headers.get('x-robots-tag')};
    results.push(entry);
    if(response.status!==200||response.headers.has('location')||entry.bytes<=0||/noindex|noimageindex|none/.test(entry.robots||'')
      ||!(row.kind==='page'?entry.type?.startsWith('text/html'):entry.type?.startsWith('image/')))errors.push(entry);
   }catch(error){errors.push({...row,error:String(error)})}
  }
 }));
 const documents=[];
 for(const name of ['sitemap.xml','image-sitemap.xml','robots.txt']){
  const response=await fetch(local+'/'+name,{redirect:'manual',signal:AbortSignal.timeout(10000)});
  const bytes=Buffer.from(await response.arrayBuffer()),expected=fs.readFileSync(path.join(root,'_site',name));
  const entry={name,status:response.status,type:response.headers.get('content-type'),cache:response.headers.get('cache-control'),bytes:bytes.length,identical:bytes.equals(expected)};
  documents.push(entry);
  if(entry.status!==200||!entry.identical||!(name.endsWith('.xml')?entry.type?.startsWith('application/xml')&&entry.cache==='public, max-age=900, must-revalidate':entry.type?.startsWith('text/plain')))errors.push(entry);
 }
 const result={scope:'loopback production HTTP simulation; not live CDN verification',publicationPerformed:false,
  pages:pages.length,images:uniqueImages.length,requests:rows.length+documents.length,documents,errors,results};
 if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({...result,results:undefined}));
 if(errors.length)process.exitCode=1;
}finally{child.kill()}
