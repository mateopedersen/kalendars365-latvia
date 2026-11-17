import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import productionAdPaths from '../functions/advertising-routes.js';
import {advertisingCandidate,advertisingCsp,advertisingResponse} from '../lib/advertising-csp.mjs';
const original="default-src 'self'; script-src 'self' 'sha256-abc' 'nonce-xyz'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://docs.google.com; object-src 'none'; form-action 'self'; frame-ancestors 'none'";
test('a static sponsored link preserves every strict nonce/hash and grants no vendor permission',()=>{assert.equal(advertisingCsp(original),original);assert.equal(advertisingCsp(null),null);assert.doesNotMatch(advertisingCsp(original),/bauval|asiafilm|storageimagedisplay|script-src[^;]*unsafe-inline/);});
test('response middleware never reads public, private, query or download bodies and preserves headers/status',async()=>{for(const route of ['/','/kontakti/','/piskotki/','/upravljanje/','/?q=private','/free/file.pdf'])for(const status of [200,404]){const response=new Response('unchanged',{status,headers:{'Content-Security-Policy':original,'ETag':'stable'}});response.clone=()=>{throw Error('No buffering is necessary');};const result=await advertisingResponse({request:new Request('https://kalendars365.lv'+route),next:async()=>response});assert.equal(result,response);assert.equal(result.headers.get('Content-Security-Policy'),original);assert.equal(result.headers.get('ETag'),'stable');}});
test('canonical placement inventory remains exact and excludes private/query methods',()=>{const paths=new Set(productionAdPaths);assert.equal(paths.size,productionAdPaths.length);for(const p of ["/", "/kontakti/", "/privatuma-politika/", "/sikdatnu-politika/", "/gimenes-kalendars/", "/izveidot-kalendaru/"])assert(paths.has(p),p);assert(advertisingCandidate(new Request('https://kalendars365.lv/kontakti/'),paths,['kalendars365.lv']));assert(!advertisingCandidate(new Request('https://kalendars365.lv/kontakti/?q=private'),paths,['kalendars365.lv']));assert(!advertisingCandidate(new Request('https://preview.pages.dev/kontakti/'),paths,['kalendars365.lv']));assert(!advertisingCandidate(new Request('https://kalendars365.lv/kontakti/',{method:'POST'}),paths,['kalendars365.lv']));});
test('every generated canonical slot contains the static link and no automatic vendor inclusion',()=>{for(const p of productionAdPaths){const html=fs.readFileSync(new URL('../_site'+p+'index.html',import.meta.url),'utf8');assert.equal((html.match(/data-advertising-slot/g)||[]).length,1,p);assert.match(html,/data-sponsored-link/,p);assert.doesNotMatch(html,/<(?:script|iframe)[^>]*src=["'][^"']*(?:bauval|asiafilm|bellnewyork)/i,p);}});

test('generated Functions routing preserves existing API and horoscope handlers without routing assets',()=>{
 const routing=JSON.parse(fs.readFileSync(new URL('../_site/_routes.json',import.meta.url),'utf8'));
 assert.equal(routing.version,1);assert(routing.include.includes('/api/*'));assert(routing.include.includes('/horoskops/*'));
 assert(!routing.include.includes('/*'));assert(routing.include.length<=100);
 assert(!routing.include.some(path=>path.startsWith('/assets')));assert(!routing.include.some(path=>path.startsWith('/downloads')));
 const exact=new Set(productionAdPaths);
 const pages=fs.readdirSync(new URL('../_site/',import.meta.url),{recursive:true}).filter(file=>file.endsWith('/index.html')||file==='index.html');
 for(const file of pages){const html=fs.readFileSync(new URL('../_site/'+file,import.meta.url),'utf8');const path='/'+file.replace(/index\.html$/,'');assert.equal(exact.has(encodeURI(path)),html.includes('data-advertising-slot'),path);}
});
