import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const decode=s=>String(s||'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const physical=u=>'_site'+u+(u.endsWith('/')?'index.html':'');
const meta=(s,key)=>decode(s.match(new RegExp('<meta (?:name|property)="'+key+'" content="([^\"]*)"'))?.[1]);
export function verifyMetadata(){
 const registry=json('docs/route-manifest.json'),contracts=json('_data/seo-contract.json').pages,errors=[],sitemap=read('_site/sitemap.xml');
 const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decodeURI(decode(m[1])));
 const records=[...registry,{url:'/404.html',indexable:false},{url:'/500.html',indexable:false}];
 const ids=new Set(),titles=new Set(),descriptions=new Set(),styles=new Map();let graphCount=0;
 for(const r of records){
  const url=r.url,s=read(physical(url)),c=contracts[url],expected='https://kalendars365.lv'+url;
  const fail=(code,detail)=>errors.push({url,code,detail});
  if(!c){fail('contract','missing');continue;}
  const canonical=decode(s.match(/<link rel="canonical" href="([^"]+)"/)?.[1]);
  if(canonical!==expected||canonical!==c.canonical)fail('canonical',canonical);
  if(c.canonicalPath!==url||c.locale!=='lv-LV')fail('contract-route',c.canonicalPath);
  const title=decode(s.match(/<title>([^<]+)<\/title>/)?.[1]),description=meta(s,'description');
  if(title!==c.title||description!==c.description||!title||!description)fail('metadata','contract mismatch');
  if(titles.has(title)||descriptions.has(description))fail('metadata-duplicate',title);titles.add(title);descriptions.add(description);
  if(!title.endsWith(' | Kalendārs365')||/\s[-—–]\s/.test(title))fail('title-separator',title);
  if((s.match(/<h1(?:\s|>)/g)||[]).length!==1||!s.includes('<html lang="lv">'))fail('heading-language','expected one Latvian H1');
  const robots=meta(s,'robots');if(robots.includes('noindex')===r.indexable||c.robots!==robots)fail('robots',robots);
  if(locs.includes(expected)!==r.indexable)fail('sitemap-membership',expected);
  if(r.lastmod&&c.significantModifiedAt!==r.lastmod)fail('modified-date','manifest and contract differ');
  if(r.significantModifiedAt&&r.significantModifiedAt!==r.lastmod)fail('modified-date-alias','different dates');
  if(c.significantModifiedAt&&!/^\d{4}-\d{2}-\d{2}$/.test(c.significantModifiedAt))fail('modified-date-type',c.significantModifiedAt);
  const blocks=[...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  if(blocks.length!==1||!Array.isArray(blocks[0]['@graph'])){fail('jsonld-graph','expected one entity graph');continue;}
  const graph=blocks[0]['@graph'],byId=new Map(graph.map(n=>[n['@id'],n]));graphCount++;
  if(byId.size!==graph.length||graph.some(n=>!n['@id']))fail('entity-identity','missing or duplicate @id');
  const page=byId.get(expected+'#webpage'),image=byId.get(expected+'#primaryimage'),publisher=byId.get('https://kalendars365.lv/#publisher');
  if(!page||page.url!==canonical||page.inLanguage!=='lv-LV'||page.description!==description||page.name!==r.title&&r.title)fail('page-entity','not bound to visible document');
  if(page?.primaryImageOfPage?.['@id']!==image?.['@id']||image?.url!==meta(s,'og:image')||image?.caption!==meta(s,'og:image:alt'))fail('image-entity','sharing/image disagreement');
  if(meta(s,'og:url')!==canonical||meta(s,'og:title')!==title||meta(s,'twitter:title')!==title||meta(s,'twitter:image')!==image?.url)fail('social-metadata','mismatch');
  if(!publisher||publisher['@type']!=='Person'||publisher.name!=='Silvis Balodis')fail('publisher','inconsistent owner identity');
  if(graph.some(n=>['Product','Event','AggregateRating','Review','Dataset'].includes(n['@type'])))fail('unjustified-schema','unsupported content claim');
  const article=graph.find(n=>n['@type']==='BlogPosting');
  if((r.family==='blog_article')!==Boolean(article))fail('article-type','not an article document');
  if(article&&(!s.includes(`datetime="${article.datePublished}"`)||article.author['@id']!==publisher['@id']||article.mainEntityOfPage['@id']!==page['@id']))fail('article-visible-data','author/date mismatch');
  for(const n of graph){const check=v=>{if(Array.isArray(v))return v.forEach(check);if(v&&typeof v==='object'){if(Object.keys(v).length===1&&v['@id']&&!byId.has(v['@id']))fail('dangling-entity',v['@id']);Object.values(v).forEach(check);}};check(n);}
  if(/https?:\/\/(localhost|127\.0\.0\.1|[^/"\s]+\.pages\.dev)/.test(s))fail('local-output-leak','preview origin present');
  if(/data-critical-source|critical-css-loader\.js\?/.test(s))fail('css-policy','duplicate or delayed stylesheet');
  const stylesheets=[...s.split('</head>')[0].matchAll(/<link rel="stylesheet" href="([^\"]+)"/g)].map(m=>m[1]);
  if(stylesheets.length!==1)fail('css-count',stylesheets.length);
  else{const href=stylesheets[0];if(!styles.has(href))styles.set(href,crypto.createHash('sha256').update(read('_site'+href)).digest('hex'));if(meta(s,'style-bundle-sha256')!==styles.get(href))fail('css-digest',href);}
  ids.add(url);
 }
 if(locs.length!==registry.filter(r=>r.indexable).length||new Set(locs).size!==locs.length)errors.push({code:'sitemap-total'});
 return {pages:ids.size,entityGraphs:graphCount,indexable:locs.length,cssBundles:styles.size,errors};
}
async function localServer(mode){
 const child=spawn(process.execPath,[path.join(root,'tooling/seo/serve.mjs'),'--root='+path.join(root,'_site'),'--port=0','--mode='+mode],{cwd:root,stdio:['ignore','pipe','pipe']});
 return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(Error('Loopback server startup timed out'));},5000);child.once('error',reject);child.once('exit',code=>{if(code)reject(Error('Loopback server failed: '+code));});child.stdout.once('data',data=>{clearTimeout(timer);try{resolve({child,...JSON.parse(data.toString().trim())});}catch(error){child.kill();reject(error);}});});
}
export async function verifyHttp(){
 const results=[],errors=[];
 for(const mode of ['preview','production-simulation']){
  const server=await localServer(mode);
  try{
   for(const p of ['/','/kalendars/2028/februaris/','/pilsetas-un-fotografijas/','/seo-test-does-not-exist/','/avoti/','/sikdatnes/','/kalendars/2027/index.html','/kalendars/2027','/api/laikapstakli?city=riga']){
    const r=await fetch(server.url+p,{method:'HEAD',redirect:'manual'}),row={mode,path:p,status:r.status,robots:r.headers.get('x-robots-tag'),location:r.headers.get('location'),csp:r.headers.get('content-security-policy')};results.push(row);
    if(p.includes('does-not-exist')&&(r.status!==404||!row.robots?.includes('noindex')))errors.push(row);
    if(p.startsWith('/api/')&&(r.status!==503||!r.headers.get('cache-control')?.includes('no-store')))errors.push(row);
    if(p==='/'&&(r.status!==200||(mode==='preview')!==Boolean(row.robots?.includes('noindex'))))errors.push(row);
    if(p==='/'&&!row.csp?.startsWith("default-src 'self'"))errors.push({...row,reason:'root wildcard headers missing'});
    if(p==='/avoti/'&&(r.status!==301||row.location!=='/avoti-un-metodika/'))errors.push(row);
    if(p==='/sikdatnes/'&&(r.status!==301||row.location!=='/sikdatnu-politika/'))errors.push(row);
    if(p.endsWith('/index.html')&&(r.status!==308||row.location!=='/kalendars/2027/'))errors.push(row);
    if(p==='/kalendars/2027'&&(r.status!==308||row.location!=='/kalendars/2027/'))errors.push(row);
   }
  }finally{server.child.kill();}
 }
 const redirects=read('_redirects').split('\n').filter(v=>v.startsWith('/')).map(v=>v.trim().split(/\s+/));
 const map=new Map(redirects.map(([from,to])=>[from,to]));
 for(const [from]of redirects){const seen=new Set([from]);let target=map.get(from),steps=1;while(map.has(target)){if(seen.has(target)){errors.push({type:'redirect-loop',from});break;}seen.add(target);target=map.get(target);steps++;}if(steps>1)errors.push({type:'redirect-chain',from,steps});if(!fs.existsSync(path.join(root,physical(target))))errors.push({type:'redirect-missing-target',from,target});}
 return {scope:'loopback simulation; no deployment or CDN assertions',requests:results.length,results,errors};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 process.chdir(root);
 const arg=process.argv.find(v=>v.startsWith('--output=')),out=path.resolve(arg?arg.slice(9):'docs/seo/validation');fs.mkdirSync(out,{recursive:true});
 const metadata=verifyMetadata(),http=await verifyHttp();
 execFileSync(process.env.PYTHON||'python3',['tooling/seo/verify_dates.py','--output='+path.join(out,'dates.json')],{cwd:root,stdio:'inherit'});
 const result={metadata,http,externalValidator:'not run; localhost is not public',publicationPerformed:false};
 fs.writeFileSync(path.join(out,'seo-gate.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pages:metadata.pages,graphs:metadata.entityGraphs,httpRequests:http.requests,errors:metadata.errors.length+http.errors.length,publicationPerformed:false}));
 process.exitCode=metadata.errors.length+http.errors.length?1:0;
}
