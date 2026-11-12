import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

// Loopback only. This is a local static/headers simulation, not the Cloudflare runtime.
const args=Object.fromEntries(process.argv.slice(2).map(v=>v.replace(/^--/,'').split('=')));
const root=path.resolve(args.root||'_site'),port=Number(args.port||4013),mode=args.mode||'preview';
if(!['preview','production-simulation'].includes(mode))throw Error('Unknown local mode');
const metrics=args.metrics==='true';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.pdf':'application/pdf','.ics':'text/calendar; charset=utf-8'};
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function pattern(source){let names=[];const body=source.split(/(\*|:[A-Za-z]\w*)/).map(v=>v==='*'?(names.push('splat'),'(.*)'):v.startsWith(':')?(names.push(v.slice(1)),'([^/]+)'):escape(v)).join('');return {regex:new RegExp('^'+body+'$'),names};}
export function headerRules(text){let list=[],current;for(const line of text.split('\n')){if(line.startsWith('/')){current={...pattern(line.trim()),headers:{}};list.push(current);}else if(current&&/^\s+[^#\s]/.test(line)){const n=line.indexOf(':');if(n>0)current.headers[line.slice(0,n).trim()]=line.slice(n+1).trim();}}return list;}
export function resolveHeaders(text,url){const result={};for(const rule of headerRules(text)){const match=url.match(rule.regex);if(match)for(const [key,value]of Object.entries(rule.headers))result[key]=value.replace(/:([A-Za-z]\w*)/g,(s,n)=>match[rule.names.indexOf(n)+1]||s);}return result;}
const localMetrics=await fs.readFile(new URL('./metrics.mjs',import.meta.url),'utf8');
const headersText=await fs.readFile(path.join(root,'_headers'),'utf8');
const redirects=(await fs.readFile(path.join(root,'_redirects'),'utf8')).split('\n').filter(l=>l.startsWith('/')).map(l=>{const [from,to,status='302']=l.trim().split(/\s+/);return {from,to,status:Number(status),...pattern(from)};});
async function fileAt(p){try{const stat=await fs.stat(p);return stat.isFile()?{file:p,stat}:null;}catch{return null;}}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:'+port),pathname=decodeURIComponent(url.pathname);
  if(!['127.0.0.1','localhost','[::1]'].includes(new URL('http://'+req.headers.host).hostname)){res.writeHead(421).end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
  if(pathname.includes('\0')||pathname.split('/').includes('..')||pathname.startsWith('/.')){res.writeHead(400).end();return;}
  if(pathname==='/_local/metrics.mjs'&&metrics){res.writeHead(200,{'Content-Type':types['.mjs'],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(req.method==='HEAD'?undefined:localMetrics);return;}
  if(pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':types['.json'],'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'});res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'unavailable',error:'Lokāls tests: ārējais avots nav pieejams.'}));return;}
  for(const r of redirects){const m=pathname.match(r.regex);if(m){const target=r.to.replace(/:([A-Za-z]\w*)/g,(s,n)=>m[r.names.indexOf(n)+1]||s);res.writeHead(r.status,{'Location':encodeURI(target)+(target.includes('?')?'':url.search),'Cache-Control':'no-store'}).end();return;}}
  if(['/\u005fheaders','/\u005fredirects'].includes(pathname)){res.writeHead(404).end();return;}
  // Match Pages' documented index.html normalization. No lowercase mass rewrite.
  if(pathname.endsWith('/index.html')){res.writeHead(308,{'Location':encodeURI(pathname.slice(0,-10))+url.search}).end();return;}
  const actual=path.join(root,pathname);
  let found=await fileAt(actual),status=200;
  if(!found){const directory=await fileAt(path.join(actual,'index.html'));if(directory){if(!pathname.endsWith('/')){res.writeHead(308,{'Location':encodeURI(pathname+'/')+url.search}).end();return;}found=directory;}}
  if(!found){found=await fileAt(actual+'.html');if(found&&!pathname.endsWith('.html')){res.writeHead(308,{'Location':encodeURI(pathname+'.html')+url.search}).end();return;}}
  if(!found){status=404;found=await fileAt(path.join(root,'404.html'));}
  const h={...resolveHeaders(headersText,pathname),'Content-Type':types[path.extname(found.file)]||'application/octet-stream','X-Local-Simulation':mode};
  if(status>=400||pathname==='/404.html'||pathname==='/500.html')h['X-Robots-Tag']='noindex, follow';
  if(mode==='preview'){h['X-Robots-Tag']='noindex, nofollow';h['Cache-Control']='no-store';}
  let bytes=await fs.readFile(found.file);
  if(metrics&&status===200&&h['Content-Type'].startsWith('text/html'))bytes=Buffer.from(bytes.toString().replace('</head>','<script type="module" src="/_local/metrics.mjs"></script></head>'));
  h.ETag='"'+crypto.createHash('sha256').update(bytes).digest('hex').slice(0,24)+'"';h['Last-Modified']=found.stat.mtime.toUTCString();
  if(req.headers['if-none-match']===h.ETag&&mode!=='preview'){res.writeHead(304,h).end();return;}
  if(/(?:text\/|javascript|json|xml|svg)/.test(h['Content-Type'])&&req.headers['accept-encoding']?.includes('gzip')){bytes=zlib.gzipSync(bytes);h['Content-Encoding']='gzip';h.Vary='Accept-Encoding';}
  h['Content-Length']=bytes.length;res.writeHead(status,h);res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(500,{'Content-Type':'text/plain','X-Robots-Tag':'noindex','Cache-Control':'no-store'}).end('Local test server error');}
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:'+server.address().port,root,mode,metrics,outboundRequests:false})));
