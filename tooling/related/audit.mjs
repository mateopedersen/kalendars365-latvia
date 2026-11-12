import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../critical-css/package.json',import.meta.url));
const {parseDocument}=require('htmlparser2');
const {findAll,textContent}=require('domutils');
const hasClass=(node,name)=>(node.attribs?.class||'').split(/\s+/).includes(name);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function auditRelated(site=process.env.K365_SITE||'_site'){
 const routes=read('docs/route-manifest.json'),plans=read('_data/internal-navigation.json').pages;
 const cards=read('_data/related-cards.json').pages,covers=read('_data/social-images.json').pages,previews=read('_data/related-previews.json').pages;
 const indexed=new Set(routes.filter(r=>r.indexable).map(r=>r.url));
 const errors=[],pages=[];let imageFiles=0,renderedCards=0;
 const fail=(route,message)=>errors.push({route,message});
 for(const [route,cover] of Object.entries(covers)){
  const preview=previews[route],card=cards[route];
  if(!preview||!card){fail(route,'Missing card metadata');continue;}
  if(preview.source!==cover.src||preview.sourceSha256!==cover.sha256||preview.sourceSha256!==digest('.'+cover.src))fail(route,'Preview no longer matches accepted page cover');
  if(!card.description?.trim()||!card.cta?.trim()||!card.kicker?.trim())fail(route,'Incomplete card copy');
  const variants=preview.files;
  if(variants.length!==2||variants[0].width!==240||variants[1].width!==480)fail(route,'Missing responsive preview');
  for(const variant of variants){
   const p='.'+variant.src;
   if(!fs.existsSync(p)||!fs.existsSync(path.join(site,variant.src))){fail(route,'Preview missing from built site');continue;}
   const buffer=fs.readFileSync(p);imageFiles++;
   if(digest(p)!==variant.sha256||buffer.length!==variant.bytes)fail(route,'Changed thumbnail bytes');
   if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')fail(route,'Preview is not a WebP image');
   if(!variant.src.includes(variant.sha256.slice(0,24)))fail(route,'Unversioned image cache identity');
  }
 }
 for(const [route,plan] of Object.entries(plans)){
  const file=path.join(site,route,route.endsWith('/')?'index.html':'');
  const doc=parseDocument(fs.readFileSync(file,'utf8'));
  const sections=findAll(n=>'data-related-discovery' in (n.attribs||{}),doc.children,true);
  const row={route,mode:plan.show?'contextual':route==='/'?'home':'recovery',cards:0,targets:[]};
  if(route==='/'){
   if(sections.length!==1||!('data-related-home' in (sections[0]?.attribs||{})))fail(route,'Home must reuse its unique curated discovery section');
  }else if(plan.show){
   if(sections.length!==1){fail(route,'Exactly one contextual section required');continue;}
   const section=sections[0],rendered=findAll(n=>n.name==='a'&&'data-related-target' in (n.attribs||{}),[section],true);
   const expected=[...plan.related,...plan.reading].map(l=>l.url);
   row.targets=rendered.map(n=>n.attribs.href);row.cards=rendered.length;renderedCards+=rendered.length;
   if(JSON.stringify(row.targets)!==JSON.stringify(expected))fail(route,'Rendered recommendations differ from reviewed topic graph');
   if(new Set(row.targets).size!==row.targets.length)fail(route,'Repeated card destination');
   for(const node of rendered){
    const target=node.attribs.href,card=cards[target];
    if(target===route||!indexed.has(target))fail(route,'Self, missing or noindex recommendation');
    if(!fs.existsSync(path.join(site,target,'index.html')))fail(route,'Dead destination');
    const images=findAll(n=>n.name==='img',[node],true);
    if(images.length!==1){fail(route,'Card needs one preview');continue;}
    const img=images[0].attribs;
    if(img.src!==card.image.src||img.srcset!==card.image.srcset||img.alt!==''||img.loading!=='lazy'||img.decoding!=='async'||!img.width||!img.height||!img.sizes)fail(route,'Card image lacks responsive, accessible loading markup');
    const title=findAll(n=>/^h[34]$/.test(n.name),[node],true);
    if(title.length!==1||!textContent(title[0]).trim())fail(route,'Card heading missing');
    if(!textContent(node).includes(card.cta)||!textContent(node).includes(card.description))fail(route,'Card action or description missing');
   }
  }else{
   const recovery=findAll(n=>hasClass(n,'recovery-actions')||hasClass(n,'recovery-destinations'),doc.children,true);
   if(!recovery.length)fail(route,'Error page must retain recovery routes');
  }
  pages.push(row);
 }
 return {totals:{htmlPages:pages.length,contentPages:routes.length,contextualPages:pages.filter(p=>p.mode==='contextual').length,homeDiscoveryPages:pages.filter(p=>p.mode==='home').length,recoveryPages:pages.filter(p=>p.mode==='recovery').length,renderedCards,imageFiles,sourceCoverPages:Object.keys(covers).length,errors:errors.length},errors,pages};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditRelated();const output=process.argv[2];if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(output?{totals:result.totals,errors:result.errors}:result,null,2));if(result.errors.length)process.exitCode=1;
}
