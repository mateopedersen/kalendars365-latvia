import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../tooling/critical-css/package.json',import.meta.url));
const {parseDocument}=require('htmlparser2');
const {findOne,findAll,textContent}=require('domutils');
const html=fs.readFileSync('_site/index.html','utf8'),doc=parseDocument(html);
const main=findOne(n=>n.attribs?.id==='main',doc.children,true);
const hasClass=(n,name)=>(n.attribs?.class||'').split(/\s+/).includes(name);
const routes=new Set(JSON.parse(fs.readFileSync('docs/route-manifest.json')).map(r=>r.url));

test('home content offers each canonical destination once without changing global navigation',()=>{
 const links=findAll(n=>n.name==='a'&&n.attribs.href?.startsWith('/')&&!n.attribs.href?.startsWith('//')&&!('data-week-link' in n.attribs),[main],true);
 const destinations=links.map(n=>n.attribs.href.split(/[?#]/)[0]);
 assert(destinations.length>=25);
 assert.equal(new Set(destinations).size,destinations.length,JSON.stringify(destinations.filter((p,i)=>destinations.indexOf(p)!==i)));
 for(const url of destinations)assert(routes.has(url),url);
 // Calendar week links preserve different date/view state, even when the current
 // year is outside the published download years. They are distinct actions.
 const weeks=findAll(n=>n.name==='a'&&'data-week-link' in (n.attribs||{}),[main],true);
 assert(weeks.length>=4);assert.equal(new Set(weeks.map(n=>n.attribs.href)).size,weeks.length);
 assert(findOne(n=>hasClass(n,'primary-nav'),doc.children,true));assert(findOne(n=>hasClass(n,'footer-directory'),doc.children,true));
 const notes=findOne(n=>hasClass(n,'page-reading'),[main],true);
 assert.equal(findAll(n=>n.name==='a',[notes],true).length,0);
 assert(!findOne(n=>'data-internal-navigation' in (n.attribs||{}),[main],true));
});

test('home discovery illustrations distinguish useful tasks instead of repeating the same large artwork',()=>{
 const cards=findAll(n=>hasClass(n,'home-feature')||hasClass(n,'home-tool')||hasClass(n,'hero-create'),[main],true);
 const illustrations=cards.map(n=>findAll(child=>child.name==='use',[n],true)[0]?.attribs.href||findOne(child=>child.name==='img',[n],true)?.attribs.src.split('?')[0]);
 assert(illustrations.every(Boolean));assert.equal(illustrations.length,new Set(illustrations).size);
 const artwork=illustrations.map(id=>{let src=id;if(id.startsWith('#')){const symbol=findOne(n=>n.attribs?.id===id.slice(1),doc.children,true);assert(symbol,id);const image=findOne(n=>n.name==='image',[symbol],true);assert(image,id);src=image.attribs.href.split('?')[0];}return crypto.createHash('sha256').update(fs.readFileSync('.'+src)).digest('hex');});
 assert.equal(artwork.length,new Set(artwork).size,'Different icon identifiers must not conceal the same artwork');
 for(const node of cards)assert(textContent(node).trim());
 assert.equal(findAll(n=>hasClass(n,'home-tool-holiday'),[main],true).length,0);
 const countdown=cards.find(n=>n.attribs?.href==='/dienu-skaititajs/');assert(countdown);
 assert(fs.readFileSync('_site/dienu-skaititajs/index.html','utf8').includes('data-widget="countdown"'));
 const garden=cards.find(n=>n.attribs?.href==='/sejas-kalendars/');assert(garden);
 assert.equal(findAll(n=>n.name==='use',[garden],true)[0].attribs.href,'#i-garden');
});

test('home footer keeps one brand and offers different destinations from the main content',()=>{
 const footer=findOne(n=>n.attribs?.id==='site-footer',doc.children,true);
 assert.equal(findAll(n=>hasClass(n,'brand'),[footer],true).length,1);
 assert.equal(findAll(n=>hasClass(n,'footer-copyright')&&textContent(n).includes('Kalendārs365'),[footer],true).length,0);
 const links=findAll(n=>n.name==='a'&&n.attribs.href?.startsWith('/')&&n.attribs.href!=='/'&&!('data-week-link' in n.attribs),[main,footer],true);
 const paths=links.map(n=>n.attribs.href.split(/[?#]/)[0]);
 assert.equal(new Set(paths).size,paths.length,'Discovery destinations should not repeat');
 for(const url of paths)assert(routes.has(url),url);
 assert.equal(findAll(n=>hasClass(n,'footer-link-group'),[footer],true).length,4);
});
