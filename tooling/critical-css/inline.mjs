import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compileSheet} from 'beasties/compiler';
import {createProcessor} from 'beasties/runtime';

const safeRules=[/data-consent-saved/,/consent-/,/dialog|#toast/,/:focus|:hover|:active|:checked|aria-pressed|aria-expanded/,/#calendar-|\.calendar-|\.day-|\.mini-|\.week-|\.plan-event|\.task-/,/\.is-today|\.selected-day|\.holiday|\.other-month|\.more-events/,/#city-|\.clock-|\.weather-/];
export function createCriticalProcessor(css,href){
 const plan=compileSheet(css,{href,exact:true,allowRules:safeRules});
 if(plan.warnings.length)throw new Error('Critical CSS compiler: '+plan.warnings.join('; '));
 for(const rule of plan.rules)if(rule.wrap?.some(w=>/^@media\b[^\{]*\bprint\b/i.test(w))){rule.always=true;if(rule.match)rule.match=rule.match.map(()=>true);}
 return createProcessor([plan],{preload:false,fonts:false,inlineFonts:false,preloadFonts:false,keyframes:'all'});
}
export function applyCriticalCss(html,css,href,processor=createCriticalProcessor(css,href)){
 const original=`<link rel="stylesheet" href="${href}">`;
 if(!html.includes(original))throw Error('Stylesheet must appear at its original cascade position.');
 const critical=processor.extract(html).css;
 if(!critical||critical.includes('</style'))throw Error('Invalid extracted stylesheet.');
 const digest=crypto.createHash('sha256').update(critical).digest('hex');
 // Runtime widgets can introduce elements not present in the SSR snapshot.
 // The complete sheet must participate in the first render; a print-media
 // swap activated by a deferred script paints incomplete widget layouts first.
 // Retain the source-bound inline subset and the cacheable family bundle,
 // but let the browser apply the complete cascade before painting or running
 // deferred/module widgets. No JavaScript or hidden-body gate is required.
 const replacement=`<style data-critical-source="${href}" data-critical-sha="${digest}">${critical}</style>`+
  original;
 return {html:html.replace(original,replacement),criticalBytes:Buffer.byteLength(critical)};
}
async function htmlFiles(dir){const result=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(entry.name==='downloads')continue;const file=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await htmlFiles(file));else if(entry.name.endsWith('.html'))result.push(file);}return result;}
export async function buildCriticalCss(destination){
 const processors=new Map();let pages=0,total=0;
 for(const file of await htmlFiles(destination)){
  const html=await fs.readFile(file,'utf8');
  const styles=[...html.split('</head>')[0].matchAll(/<link rel="stylesheet" href="(\/static\/css\/[a-f0-9]{24}\.css)">/g)];
  if(styles.length!==1)throw Error('Expected one bundled stylesheet: '+file);
  const href=styles[0][1];
  if(!processors.has(href)){const css=await fs.readFile(path.join(destination,href),'utf8');processors.set(href,{css,processor:createCriticalProcessor(css,href)});}
  const {css,processor}=processors.get(href),result=applyCriticalCss(html,css,href,processor);
  await fs.writeFile(file,result.html);pages++;total+=result.criticalBytes;
 }
 console.log(JSON.stringify({criticalCssPages:pages,sharedStylesheets:processors.size,averageInlineBytes:Math.round(total/pages)}));
 return {pages,bundles:processors.size};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildCriticalCss(path.resolve(process.argv[2]||'_site'));
