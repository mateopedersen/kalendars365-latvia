import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {advertisingCsp} from '../lib/advertising-csp.mjs';
import {consentRecord,validConsent,validUnit,unitForWidth} from '../assets/ad-policy.mjs';
const productionConfig=JSON.parse(fs.readFileSync(new URL('../_data/advertising.json',import.meta.url),'utf8'));
// Behavior fixtures explicitly enable delivery; the disabled switch is tested independently.
const config={...productionConfig,enabled:true};
const code=fs.readFileSync(new URL('../assets/advertising.mjs',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
function browser({width=1000,choice=null,query='',host=config.hosts[0],blocked=false,hasSlot=true,settings=config}={}){
 const scripts=[],events={},docEvents={},data=new Map(),dialogs=[];let observer;
 if(choice)data.set(config.storageKey,JSON.stringify(choice));
 const node=()=>({dataset:{},style:{},children:[],hidden:false,setAttribute(){},addEventListener(){},append(...children){this.children.push(...children);},showModal(){this.open=true;},close(){this.open=false;}});
 const placeholder=node(),stage={...node(),clientWidth:width,append(n){scripts.push(n);}};
 const slot={...node(),clientWidth:width,querySelector:s=>s==='[data-advertising-stage]'?stage:placeholder,getBoundingClientRect:()=>({top:300,bottom:700})};
 const document={visibilityState:'visible',getElementById:()=>({textContent:JSON.stringify(settings)}),querySelector:()=>hasSlot?slot:null,createElement(tag){const n=node();if(tag==='dialog')dialogs.push(n);return n;},body:{append(){}},addEventListener:(k,f)=>docEvents[k]=f};
 const context={document,URL,Date,innerHeight:800,location:{hostname:host,search:query,reload(){context.reloads++;}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return data.get(k)||null;},setItem(k,v){if(blocked)throw Error('blocked');data.set(k,v);}},consentRecord,validConsent,unitForWidth,addEventListener:(k,f)=>events[k]=f,reloads:0,IntersectionObserver:function(cb){observer={cb,observe(){},disconnect(){}};return observer;}};context.window=context;
 vm.createContext(context);vm.runInContext(code,context);
 return {context,scripts,data,slot,stage,placeholder,dialogs,near:()=>observer?.cb([{isIntersecting:true}]),storage:(key,newValue)=>events.storage({key,newValue}),click(action){docEvents.click({target:{closest:()=>({dataset:{advertisingChoice:action},hasAttribute:()=>false})},preventDefault(){}});},resize(w){slot.clientWidth=w;events.resize();}};
}
test('advertising records reject expired, forged, analytics-only and necessary-only choices',()=>{
 const now=Date.now();assert(validConsent(consentRecord(false,now),now));assert(validConsent(consentRecord(true,now),now));
 for(const record of [null,{version:1,analytics:true,expiresAt:now+1000},{version:1,advertising:'true',expiresAt:now+1000},{version:1,advertising:true,expiresAt:now},{version:1,advertising:true,expiresAt:now+181*86400000}])assert.equal(validConsent(record,now),false);
});
test('only the exact official host, key and supported size can become a tag',()=>{
 for(const unit of [config.desktop,config.mobile])assert(validUnit(unit,config.scriptHosts));
 assert.equal(validUnit({...config.mobile,src:'https://example.com/22/'+config.mobile.key},config.scriptHosts),false);
 assert.equal(validUnit({...config.mobile,src:config.mobile.src+'?private=data'},config.scriptHosts),false);
 assert.equal(validUnit({...config.mobile,width:299},config.scriptHosts),false);
 assert.equal(unitForWidth(728,config),config.desktop);assert.equal(unitForWidth(727,config),config.mobile);assert.equal(unitForWidth(299,config),null);
});
test('no vendor script before BOTH explicit advertising consent and viewport proximity',()=>{
 const b=browser();assert.equal(b.scripts.length,0);b.near();assert.equal(b.scripts.length,0);b.click('deny');assert.equal(b.scripts.length,0);b.click('allow');assert.equal(b.scripts.length,1);assert.equal(b.scripts[0].src,config.desktop.src);assert.equal(b.context.atOptions.key,config.desktop.key);assert.equal(b.context.atOptions.format,'iframe');assert.equal(b.context.atOptions.width,728);assert.equal(Object.keys(b.context.atOptions.params).length,0);b.near();b.click('allow');assert.equal(b.scripts.length,1);
 const saved=browser({choice:consentRecord(true)});assert.equal(saved.scripts.length,0);saved.near();assert.equal(saved.scripts.length,1);
});
test('mobile gets only300x250; resize never scales, clips or starts another impression',()=>{
 const b=browser({width:300});b.near();b.click('allow');assert.equal(b.scripts.length,1);assert.equal(b.scripts[0].src,config.mobile.src);assert.equal(b.context.atOptions.width,300);assert.equal(b.context.atOptions.height,250);
 const d=browser();d.near();d.click('allow');d.resize(300);assert.equal(d.slot.hidden,true);assert.equal(d.scripts.length,1);d.resize(1000);assert.equal(d.slot.hidden,false);assert.equal(d.scripts.length,1);
});
test('private query strings, preview hosts and refusals cannot start ads; revocation ends loaded code',()=>{
 for(const options of [{query:'?name=private'},{host:'127.0.0.1'},{choice:consentRecord(false)}]){const b=browser(options);b.near();if(!options.choice)b.click('allow');assert.equal(b.scripts.length,0);}
 const b=browser();b.near();b.click('allow');b.click('deny');assert.equal(b.context.reloads,1);assert.equal(JSON.parse(b.data.get(config.storageKey)).advertising,false);
 const blocked=browser({blocked:true});blocked.near();blocked.click('allow');assert.equal(blocked.scripts.length,1);assert.equal(blocked.data.has(config.storageKey),false);
});
test('ad placement is responsive, transparent and excluded from print',()=>{
 const css=fs.readFileSync(new URL('../assets/advertising.css',import.meta.url),'utf8');assert.match(css,/@media print\{\.ad-placement/);assert.match(css,/min-height:250px/);assert.match(css,/@container\(min-width:728px\)/);assert(!css.includes('position:fixed'));assert(!code.includes('document.write'));assert(!code.includes('setInterval'));
});

test('the observed pixel and creative image origins are restricted to img-src',()=>{
 const source=fs.readFileSync(new URL('../_headers',import.meta.url),'utf8');
 const base=source.split('Content-Security-Policy: ')[1].split('\n')[0];
 assert.doesNotMatch(base,/bauval|nresystems|storageimagedisplay/);
 const policy=advertisingCsp(base);
 const directives=policy.split(';').map(value=>value.trim()).filter(Boolean);
 for(const host of ['https://static.nresystems.com','https://cdn.storageimagedisplay.com'])assert.equal(directives.filter(value=>value.includes(host)).length,1);
 assert.match(directives.find(value=>value.startsWith('img-src ')),/^img-src 'self' data: blob: https:\/\/bauval\.org https:\/\/static\.nresystems\.com https:\/\/cdn\.storageimagedisplay\.com$/);
 assert(!directives.some(value=>value.includes('*')));
});

test('cross-tab choices preserve unloaded private, query and preview pages without starting ads',()=>{
 for(const options of [{hasSlot:false},{query:'?name=private'},{host:'127.0.0.1'}]){
  const b=browser(options);b.near();
  b.storage(config.storageKey,JSON.stringify(consentRecord(true)));
  assert.equal(b.context.K365Advertising.choice().advertising,true);
  assert.equal(b.scripts.length,0);assert.equal(b.context.reloads,0);
  for(const value of [JSON.stringify(consentRecord(false)),null,'invalid',JSON.stringify({version:1,analytics:true})]){
   b.storage(config.storageKey,value);assert.equal(b.context.reloads,0);assert.equal(b.scripts.length,0);
  }
  b.storage(null,JSON.stringify(consentRecord(true)));
  assert.equal(b.context.K365Advertising.choice(),null);assert.equal(b.context.reloads,0);assert.equal(b.scripts.length,0);
 }
});
test('cross-tab grant keeps viewport and consent gates on unloaded public pages',()=>{
 const b=browser();b.storage(config.storageKey,JSON.stringify(consentRecord(true)));
 assert.equal(b.context.reloads,0);assert.equal(b.scripts.length,0);assert.equal(b.slot.dataset.advertisingConsent,'granted');
 b.storage(config.storageKey,JSON.stringify(consentRecord(false)));b.near();
 assert.equal(b.context.reloads,0);assert.equal(b.scripts.length,0);assert.equal(b.slot.dataset.advertisingConsent,'denied');
 b.storage(config.storageKey,JSON.stringify(consentRecord(true)));assert.equal(b.scripts.length,1);assert.equal(b.context.reloads,0);
 const cleared=browser();cleared.storage(config.storageKey,JSON.stringify(consentRecord(true)));cleared.storage(null,null);cleared.near();
 assert.equal(cleared.scripts.length,0);assert.equal(cleared.context.reloads,0);assert.equal(cleared.placeholder.hidden,false);
});
test('loaded cross-tab revocation, deletion, clearing and invalid records reload at most once',()=>{
 const expired={...consentRecord(true),expiresAt:Date.now()-1};
 for(const [key,value] of [[config.storageKey,JSON.stringify(consentRecord(false))],[config.storageKey,null],[null,null],[null,JSON.stringify(consentRecord(true))],[config.storageKey,'not JSON'],[config.storageKey,JSON.stringify(expired)],[config.storageKey,JSON.stringify({version:1,analytics:true})]]){
  const b=browser({choice:consentRecord(true)});b.near();assert.equal(b.scripts.length,1);
  b.storage(key,value);assert.equal(b.context.reloads,1);assert.equal(b.slot.dataset.advertisingConsent,'denied');
  b.storage(config.storageKey,null);b.storage(null,null);b.click('deny');
  b.storage(config.storageKey,JSON.stringify(consentRecord(true)));b.near();
  assert.equal(b.context.reloads,1);assert.equal(b.scripts.length,1);
 }
});
test('unrelated storage keys do nothing and another valid grant never refreshes a loaded ad',()=>{
 const b=browser();b.near();b.storage('analytics-consent',JSON.stringify(consentRecord(true)));
 assert.equal(b.context.K365Advertising.choice(),null);assert.equal(b.context.reloads,0);assert.equal(b.scripts.length,0);
 b.click('allow');const saved=b.context.K365Advertising.choice();
 b.storage('another-key',null);assert.equal(b.context.K365Advertising.choice(),saved);
 b.storage(config.storageKey,JSON.stringify(consentRecord(true)));b.near();b.resize(300);b.resize(1000);
 assert.equal(b.context.reloads,0);assert.equal(b.scripts.length,1);assert.equal(b.slot.dataset.advertisingConsent,'granted');
});

test('disabled delivery switch prevents any vendor request even with a grant and a forced visible slot',()=>{
 const disabled={...productionConfig,enabled:false};
 assert.equal(unitForWidth(1000,disabled),null);assert.equal(unitForWidth(300,disabled),null);
 const b=browser({settings:disabled,choice:consentRecord(true)});b.near();b.click('allow');
 b.storage(config.storageKey,JSON.stringify(consentRecord(true)));b.resize(300);b.resize(1000);
 assert.equal(b.scripts.length,0);assert.equal(b.context.reloads,0);
});

test('production template omits banner markup unless the delivery configuration is enabled',()=>{
 const template=fs.readFileSync(new URL('../_includes/advertising.html',import.meta.url),'utf8');
 assert.match(template,/{% if site\.data\.advertising\.enabled and advertising_groups contains advertising_group %}<section/);
 assert.equal(productionConfig.enabled,true);
});

test('approved active production still requires explicit advertising consent and viewport proximity',()=>{
 assert.equal(productionConfig.enabled,true);
 const b=browser({settings:productionConfig});b.click('allow');assert.equal(b.scripts.length,0);b.near();assert.equal(b.scripts.length,1);
 for(const options of [{hasSlot:false},{query:'?name=private'},{host:'127.0.0.1'}]){const excluded=browser({...options,settings:productionConfig,choice:consentRecord(true)});excluded.near();assert.equal(excluded.scripts.length,0);}
});

test('every built public information page has one slot while private pages have none and no eager vendor tag',()=>{
 const site=new URL('../_site/',import.meta.url);
 const pages=fs.readdirSync(site,{recursive:true}).filter(file=>file.endsWith('.html'));
 const publicGroups=new Set(['svetki-un-tradicijas','svetku-dienas','atceres-dienas','varda-dienas','nozimigas-dienas','pasakumi','blogs','gadalaiki','garas-brivdienas','pdf-kalendari','skolas-brivlaiki','studiju-kalendars','horoskops']);
 let eligible=0,excluded=0;assert(pages.length>=936);
 for(const file of pages){
  const html=fs.readFileSync(new URL(file,site),'utf8');
  const expected=publicGroups.has(file.split('/')[0])?1:0;
  assert.equal((html.match(/data-advertising-slot\b/g)||[]).length,expected,file);
  assert.equal((html.match(/id="advertising-config"/g)||[]).length,1,file+' configuration');
  const settings=JSON.parse(html.match(/id="advertising-config"[^>]*>([^<]*)<\/script>/)[1]);
  assert.equal(settings.enabled,true,file+' approved active configuration');
  assert(!/<script\b[^>]*src=["'][^"']*bauval\.org/i.test(html),file+' eager vendor');
  if(expected)eligible++;else excluded++;
 }
 assert(eligible>250);assert(excluded>600);
});
