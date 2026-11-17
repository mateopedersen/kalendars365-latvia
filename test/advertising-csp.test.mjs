import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import productionAdPaths from '../functions/advertising-routes.js';
import {advertisingCandidate,advertisingCsp,advertisingResponse} from '../lib/advertising-csp.mjs';
const original="default-src 'self'; script-src 'self' 'sha256-abc' 'nonce-xyz'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://docs.google.com; object-src 'none'; form-action 'self'; frame-ancestors 'none'";
const host='kalendars365.lv',hosts=[host],paths=new Set(['/']);
test('the exact display provider is added without removing nonce/hash protection or enabling eval/inline code',()=>{
 const p=advertisingCsp(original);assert.match(p,/https:\/\/bauval.org/);assert.match(p,/'nonce-xyz'/);assert.match(p,/'sha256-abc'/);assert.doesNotMatch(p,/unsafe-eval|script-src[^;]*unsafe-inline|asiafilm/);assert.match(p,/object-src 'none'/);assert.equal(advertisingCsp(null),null);
});
test('private/query/preview/method/error/download responses never gain a provider exception or require body buffering',async()=>{
 for(const [url,method,status,type]of [[`https://${host}/?q=private`,'GET',200,'text/html'],[`https://${host}/private/`,'GET',200,'text/html'],['https://preview.pages.dev/','GET',200,'text/html'],[`https://${host}/`,'POST',200,'text/html'],[`https://${host}/`,'GET',404,'text/html'],[`https://${host}/`,'GET',200,'application/pdf']]){
  const response=new Response('body',{status,headers:{'Content-Type':type,'Content-Security-Policy':original}});response.clone=()=>{throw Error('Private body must not be buffered');};
  const result=await advertisingResponse({request:new Request(url,{method}),next:async()=>response},paths,hosts);assert.equal(result,response);assert.equal(result.headers.get('Content-Security-Policy'),original);
 }
});
test('only successful public HTML actually containing the display slot gains the provider exception',async()=>{
 for(const [body,expected]of [['plain content',false],['<section data-advertising-mode="display-banner" data-advertising-slot></section>',true]]){
  const response=new Response(body,{headers:{'Content-Type':'text/html','Content-Security-Policy':original,'Cache-Control':'public,max-age=0'}});
  const result=await advertisingResponse({request:new Request(`https://${host}/`),next:async()=>response},paths,hosts);assert.equal(result.headers.get('Content-Security-Policy').includes('https://bauval.org'),expected);assert.equal(await result.text(),body);assert.equal(result.headers.get('Cache-Control'),'public,max-age=0');
 }
});
test('the generated public placement inventory is unique and excludes queries/preview hosts/writes',()=>{
 const exact=new Set(productionAdPaths);assert.equal(exact.size,productionAdPaths.length);assert(exact.has('/'));
 assert(advertisingCandidate(new Request(`https://${host}/`),exact,hosts));
 assert(!advertisingCandidate(new Request(`https://${host}/?private=note`),exact,hosts));assert(!advertisingCandidate(new Request('https://preview.pages.dev/'),exact,hosts));assert(!advertisingCandidate(new Request(`https://${host}/`,{method:'POST'}),exact,hosts));
});
test('every generated eligible page has one actual display stage and no handmade offer panel',()=>{
 for(const p of productionAdPaths){const html=fs.readFileSync(new URL('../_site'+p+'index.html',import.meta.url),'utf8');assert.equal((html.match(/data-advertising-slot/g)||[]).length,1,p);assert.match(html,/data-advertising-mode="display-banner"/,p);assert.match(html,/data-advertising-stage/,p);assert.doesNotMatch(html,/data-sponsored-link|sponsored-banner__cta/,p);}
});

test('generated Functions routing preserves existing API and horoscope handlers without routing assets',()=>{
 const routing=JSON.parse(fs.readFileSync(new URL('../_site/_routes.json',import.meta.url),'utf8'));
 assert.equal(routing.version,1);assert(routing.include.includes('/api/*'));assert(routing.include.includes('/horoskops/*'));
 assert(!routing.include.includes('/*'));assert(routing.include.length<=100);
 assert(!routing.include.some(path=>path.startsWith('/assets')));assert(!routing.include.some(path=>path.startsWith('/downloads')));
 const exact=new Set(productionAdPaths);
 const pages=fs.readdirSync(new URL('../_site/',import.meta.url),{recursive:true}).filter(file=>file.endsWith('/index.html')||file==='index.html');
 for(const file of pages){const html=fs.readFileSync(new URL('../_site/'+file,import.meta.url),'utf8');const path='/'+file.replace(/index\.html$/,'');assert.equal(exact.has(encodeURI(path)),html.includes('data-advertising-slot'),path);}
});
