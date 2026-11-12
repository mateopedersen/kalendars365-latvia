// Local function preview. Named fixtures emulate edge metadata only on this local server.
import http from 'node:http';
import {readFile,stat,appendFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {onRequestGet as location} from '../functions/api/atrasanas-vieta.js';
import {onRequestGet as weather} from '../functions/api/laikapstakli.js';
import {onRequestGet as observation} from '../functions/api/noverojumi.js';
import {onRequestGet as horoscope} from '../functions/api/horoskops/dienas.js';
const arg=name=>process.argv[process.argv.indexOf(name)+1],port=Number(arg('--port'))||4002;
const fixture=process.argv.includes('--fixture')?arg('--fixture'):null;
const fixtures={jurmala:{country:'LV',city:'Jurmala',latitude:'56.97',longitude:'23.80',timezone:'Europe/Riga'},'new-york':{country:'US',city:'New York',latitude:'40.71',longitude:'-74.01',timezone:'America/New_York'}};
if(fixture&&!fixtures[fixture])throw Error('Unknown local fixture');
const root=path.resolve('_site'),types={'.html':'text/html; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.avif':'image/avif','.gif':'image/gif','.bmp':'image/bmp','.ico':'image/x-icon','.woff2':'font/woff2','.pdf':'application/pdf'};
const quality=process.argv.includes('--quality');
const csp=process.argv.includes('--csp')?(await readFile('_headers','utf8')).split('\n').find(line=>line.trim().startsWith('Content-Security-Policy:'))?.trim().slice('Content-Security-Policy:'.length).trim():null;
http.createServer(async(req,res)=>{
 try{
  if(csp)res.setHeader('Content-Security-Policy',quality?csp.replace("frame-ancestors 'none'","frame-ancestors 'self'"):csp);
  const url=new URL(req.url,`http://127.0.0.1:${port}`),route=url.pathname.replace(/\/$/,'');
  if(quality&&route==='/_quality'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(await readFile('tooling/quality/runner.html'));return;}
  if(quality&&route==='/_local/runner.mjs'){res.writeHead(200,{'Content-Type':types['.mjs'],'Cache-Control':'no-store'});res.end(await readFile('tooling/quality/runner.mjs'));return;}
  if(quality&&route==='/_local/quality-routes.json'){
   const rows=JSON.parse(await readFile('docs/route-manifest.json','utf8'));
   let selected=rows;
   if(url.searchParams.get('scope')!=='all'){
    const chosen=new Map(rows.filter(row=>row.family==='hub').map(row=>[row.url,row]));
    const families=new Set(),styles=new Set();
    for(const row of rows){const html=await readFile(path.join(root,row.url,'index.html'),'utf8'),style=html.match(/static\/css\/[a-f0-9]{24}\.css/)?.[0];if(!families.has(row.family)||!styles.has(style))chosen.set(row.url,row);families.add(row.family);styles.add(style);}
    selected=[...chosen.values()];
   }
   selected=[...selected,{url:'/404.html',family:'not_found'},{url:'/500.html',family:'temporary_error'}];
   res.writeHead(200,{'Content-Type':types['.json'],'Cache-Control':'no-store'});res.end(JSON.stringify(selected.map(r=>({url:r.url,family:r.family}))));return;
  }
  if(quality&&route==='/_local/quality-results'&&req.method==='POST'){
   const phase=url.searchParams.get('phase');if(!['before','after'].includes(phase)){res.writeHead(400).end();return;}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>3000000){res.writeHead(413).end();return;}}
   const row=JSON.parse(body);await mkdir('../reports/quality-audit-2026-11-12',{recursive:true});
   await appendFile('../reports/quality-audit-2026-11-12/'+phase+'.jsonl',JSON.stringify(row)+'\n');res.writeHead(200,{'Content-Type':types['.json']});res.end('{"saved":true}');return;
  }
  if(quality&&route==='/_local/axe.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end(await readFile('node_modules/.cache/review/package/axe.min.js'));return;}
  if(quality&&route==='/_local/quality-audit.mjs'){res.writeHead(200,{'Content-Type':types['.mjs'],'Cache-Control':'no-store'});res.end(await readFile('tooling/quality/audit.mjs'));return;}
  const handler={'/api/atrasanas-vieta':location,'/api/laikapstakli':weather,'/api/noverojumi':observation,'/api/horoskops/dienas':horoscope}[route];
  if(handler){const request=new Request(url,{headers:req.headers});if(fixture)Object.defineProperty(request,'cf',{value:fixtures[fixture]});const reply=await handler({request});res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(Buffer.from(await reply.arrayBuffer()));return;}
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');}catch{file=path.join(root,'404.html');res.statusCode=404;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
  if(req.method==='HEAD'){res.setHeader('Content-Length',(await stat(file)).size);res.end();return;}
  let body=await readFile(file);
  if(quality&&path.extname(file)==='.html')body=Buffer.from(body.toString().replace('</head>','<script defer src="/_local/axe.js"></script><script type="module" src="/_local/quality-audit.mjs"></script></head>'));
  res.end(body);
 }catch(error){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local preview failed'}));console.error(error.message);}
}).listen(port,'127.0.0.1',()=>console.log(`Local preview http://127.0.0.1:${port}/ · ${fixture?'TEST FIXTURE '+fixture:'IP metadata unavailable locally; automatic location is tested at the edge'}`));
