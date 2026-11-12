import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {applyCriticalCss,createCriticalProcessor,applyBlockingStylesheet} from '../tooling/critical-css/inline.mjs';
import crypto from 'node:crypto';
const href='/static/css/'+'a'.repeat(24)+'.css';
test('the production policy preserves blocking CSS, validates its hash and avoids redundant inline bytes',()=>{
 const css='.runtime{display:grid}@media print{.calendar{display:block}}',digest=crypto.createHash('sha256').update(css).digest('hex'),source=`/static/css/${digest.slice(0,24)}.css`;
 const html=`<head><link rel="stylesheet" href="${source}"><script defer src="/app.js"></script></head><body>Calendar</body>`;
 const out=applyBlockingStylesheet(html,css,source);
 assert.equal(out.criticalBytes,0);assert(out.html.includes('name="style-bundle-sha256" content="'+digest+'"'));assert(out.html.includes(`<link rel="stylesheet" href="${source}">`));assert(!out.html.includes('<style'));assert(!out.html.includes('media="print"'));assert.throws(()=>applyBlockingStylesheet(html,css,href));assert.throws(()=>applyBlockingStylesheet(out.html,css,source));
});
test('critical extraction preserves source order, privacy choices and all print rules',()=>{
 const css=':root{--ink:#123}p{color:var(--ink)}.unused{color:blue}html[data-consent-saved] .consent-banner{display:none}.calendar-hidden{color:green}@media print{.not-in-dom{display:block!important}}@media(max-width:600px){p{color:purple}}';
 const html=`<html><head><meta name="asset-version" content="test"><link rel="stylesheet" href="${href}"></head><body><p>Hello</p></body></html>`;
 const result=applyCriticalCss(html,css,href),critical=result.html.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
 assert(critical.includes('--ink'));assert(!critical.includes('.unused'));assert(critical.includes('data-consent-saved'));assert(critical.includes('.calendar-hidden'));assert(critical.includes('.not-in-dom'));assert(critical.indexOf('color:var(--ink)')<critical.indexOf('color:purple'));
 assert(result.html.includes(`<link rel="stylesheet" href="${href}">`));assert(!result.html.includes('data-critical-deferred'));assert(!result.html.includes('critical-css-loader'));assert(!result.html.includes('<noscript>'));assert(!/\sonload=/.test(result.html));
 assert.equal(css.includes('.unused'),true,'Original source is preserved');
});
test('runtime-only controls receive the complete stylesheet before first paint, without a script or body gate',()=>{
 const css='.existing{color:red}.runtime-controls{display:grid;grid-template-columns:1fr 1fr;gap:12px}.runtime-controls button{min-height:44px}';
 const html=`<html><head><link rel="stylesheet" href="${href}"><script defer src="/assets/widget.js"></script><script type="module" src="/assets/widget.mjs"></script></head><body><main class="existing">Ready</main></body></html>`;
 const result=applyCriticalCss(html,css,href).html,head=result.split('</head>')[0],critical=result.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
 assert(!critical.includes('.runtime-controls'),'SSR extraction cannot anticipate runtime markup');
 assert(head.includes(`<link rel="stylesheet" href="${href}">`),'A matching head stylesheet blocks painting until the full cascade is ready');
 assert(head.indexOf(`<link rel="stylesheet" href="${href}">`)<head.indexOf('<script defer'));
 assert(!/media="print"|data-critical-deferred|critical-css-loader|visibility\s*:\s*hidden|opacity\s*:\s*0/.test(result));
 assert.equal((head.match(/rel="stylesheet"/g)||[]).length,1);
});
test('one compiled stylesheet can safely extract different pages',()=>{
 const css='.a{color:red}.b{color:blue}',processor=createCriticalProcessor(css,href);
 const html=body=>`<head><meta name="asset-version" content="test"><link rel="stylesheet" href="${href}"></head><body>${body}</body>`;
 const a=applyCriticalCss(html('<div class="a"></div>'),css,href,processor).html;
 const b=applyCriticalCss(html('<div class="b"></div>'),css,href,processor).html;
 assert(a.includes('.a{'));assert(!a.includes('.b{'));assert(b.includes('.b{'));assert(!b.includes('.a{'));
});
test('the CSP-safe loader activates cached and newly loaded CSS without a timer',async()=>{
 const code=fs.readFileSync('assets/critical-css-loader.js','utf8');
 for(const cached of [true,false]){
  const listeners={},link={sheet:cached?{}:null,media:'print',dataset:{},getAttribute:()=> 'all',removeAttribute(){this.removed=true},addEventListener(k,f){listeners[k]=f}};
  const context={window:{},document:{querySelectorAll:()=>[link]},Promise};vm.runInNewContext(code,context);
  if(!cached){assert.equal(link.media,'print');listeners.load();}
  await context.window.K365StylesReady;assert.equal(link.media,'all');assert(link.removed);
 }
 assert(!/setTimeout|requestIdleCallback/.test(code));
});
