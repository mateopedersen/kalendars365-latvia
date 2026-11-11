// Local function preview. Named fixtures emulate edge metadata only on this local server.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {onRequestGet as location} from '../functions/api/atrasanas-vieta.js';
import {onRequestGet as weather} from '../functions/api/laikapstakli.js';
import {onRequestGet as observation} from '../functions/api/noverojumi.js';
const arg=name=>process.argv[process.argv.indexOf(name)+1],port=Number(arg('--port'))||4002;
const fixture=process.argv.includes('--fixture')?arg('--fixture'):null;
const fixtures={jurmala:{country:'LV',city:'Jurmala',latitude:'56.97',longitude:'23.80',timezone:'Europe/Riga'},'new-york':{country:'US',city:'New York',latitude:'40.71',longitude:'-74.01',timezone:'America/New_York'}};
if(fixture&&!fixtures[fixture])throw Error('Unknown local fixture');
const root=path.resolve('_site'),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.pdf':'application/pdf'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`),route=url.pathname.replace(/\/$/,'');
  const handler={'/api/atrasanas-vieta':location,'/api/laikapstakli':weather,'/api/noverojumi':observation}[route];
  if(handler){const request=new Request(url,{headers:req.headers});if(fixture)Object.defineProperty(request,'cf',{value:fixtures[fixture]});const reply=await handler({request});res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(Buffer.from(await reply.arrayBuffer()));return;}
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');}catch{file=path.join(root,'404.html');res.statusCode=404;}
  const body=await readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(body);
 }catch(error){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local preview failed'}));console.error(error.message);}
}).listen(port,'127.0.0.1',()=>console.log(`Local preview http://127.0.0.1:${port}/ · ${fixture?'TEST FIXTURE '+fixture:'IP metadata unavailable locally; automatic location is tested at the edge'}`));
