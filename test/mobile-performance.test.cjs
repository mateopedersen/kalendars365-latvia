'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/consent-state.js','utf8');
const privacy=require('../assets/privacy-choice.js');
function consent(saved,{blocked=false,appReady=false}={}){
 const attributes=new Map(),listeners={};let raw=JSON.stringify(saved),reads=0,writes=0;const banner={hidden:false};
 const context={window:{K365PrivacyChoice:privacy,...(appReady?{K365:{}}:{})},localStorage:{getItem(){reads++;if(blocked)throw Error('blocked');return raw},setItem(k,v){writes++;if(blocked)throw Error('blocked');raw=v}},document:{documentElement:{toggleAttribute(k,on){if(on)attributes.set(k,'');else attributes.delete(k)},setAttribute(k,v){attributes.set(k,v)}},addEventListener(k,fn){listeners[k]=fn},getElementById(id){return id==='consent-banner'?banner:null}},Date};
 vm.runInNewContext(source,context);
 const click=choice=>{let stopped=false;listeners.click({target:{closest(){return{dataset:{consent:choice}}}},preventDefault(){},stopImmediatePropagation(){stopped=true}});return stopped};
 return{context,attributes,banner,click,get record(){return JSON.parse(raw)},get reads(){return reads},get writes(){return writes}};
}
test('saved privacy choices are applied early without changing personal calendar records',()=>{
 const saved={events:[{date:'2027-01-02',title:'My event'}],tasks:[{title:'My task'}],notes:{'2027-01-02':'My note'},consent:privacy.acknowledge()};
 const h=consent(saved);assert.equal(h.reads,1);assert(h.attributes.has('data-consent-saved'));assert.deepEqual(h.record,saved);assert.equal(h.writes,0);
});
test('acknowledging the notice before the calendar loads preserves personal data and enables no tracking',()=>{
 const saved={events:[{title:'Keep me'}],notes:{date:'Keep this too'}};const h=consent(saved);assert(!h.attributes.has('data-consent-saved'));assert(h.click('necessary'));assert(h.banner.hidden);assert(h.attributes.has('data-consent-saved'));assert.deepEqual(h.record.events,saved.events);assert.deepEqual(h.record.notes,saved.notes);assert.equal(h.record.consent.choice,'necessary');assert.equal(h.record.consent.analytics,false);assert.equal(h.record.consent.advertising,false);assert.equal(h.record.consent.version,2);
 const legacy=consent(saved);assert(!legacy.click('all'));assert.equal(legacy.writes,0);
});
test('blocked storage and invalid choices are safe and the main app keeps control once loaded',()=>{
 const blocked=consent(null,{blocked:true});assert(blocked.click('necessary'));assert(blocked.banner.hidden);
 const invalid=consent(null);assert(!invalid.click('invalid'));assert.equal(invalid.writes,0);
 const ready=consent(null,{appReady:true});assert(!ready.click('all'));assert.equal(ready.writes,0);
});
test('expired and legacy notice records re-show the notice without erasing calendar data',()=>{
 for(const record of [{choice:'all',version:1},privacy.acknowledge(Date.now()-181*86400000)]){
  const saved={events:[{title:'Saglabāt'}],notes:{'2027-03-04':'Mana piezīme'},consent:record},h=consent(saved);
  assert(!h.attributes.has('data-consent-saved'));assert.deepEqual(h.record,saved);assert.equal(h.writes,0);assert.equal(h.context.window.K365BootstrapStore.consent,null);
  assert(h.click('necessary'));assert.deepEqual(h.record.events,saved.events);assert.deepEqual(h.record.notes,saved.notes);
 }
});
test('smaller browser datasets preserve every consumed date, name, holiday and Moon value',()=>{
 const full=JSON.parse(fs.readFileSync('assets/calendar-data.json')),runtime=JSON.parse(fs.readFileSync('assets/calendar-runtime.json')),summary=JSON.parse(fs.readFileSync('assets/calendar-summary.json'));
 const project=n=>Object.fromEntries(['name','month','day','kind'].map(k=>[k,n[k]]));
 assert.deepEqual(runtime.names,full.names.map(project));assert.equal(runtime.names.length,5652);
 assert.deepEqual(summary.names,full.names.filter(n=>n.kind==='traditional').map(project));assert.equal(summary.names.length,1032);
 for(const key of Object.keys(full).filter(k=>k!=='names')){assert.deepEqual(runtime[key],full[key],key);assert.deepEqual(summary[key],full[key],key);}
 assert(fs.statSync('assets/calendar-summary.json').size<fs.statSync('assets/calendar-data.json').size*.15);
 const app=fs.readFileSync('assets/app.js','utf8');assert(app.includes("'K365BootstrapStore' in window"));assert(app.includes('/assets/calendar-runtime.json'));assert(app.includes('/assets/calendar-summary.json'));
});
test('first-paint privacy UI and critical school artwork do not wait for deferred widgets',()=>{
 for(const url of ['','skolas-brivlaiki/','meness-kalendars/2027/janvaris/','blogs/gimenes-kalendars-nedelas-planosana/']){
  const s=fs.readFileSync('_site/'+url+'index.html','utf8');assert(s.indexOf('/assets/consent-state.js')<s.indexOf('/assets/app.js'));
  const banner=s.match(/<aside[^>]+id="consent-banner"[^>]*>/)[0];assert(!/\bhidden\b/.test(banner));
 }
 const school=fs.readFileSync('_site/skolas-brivlaiki/index.html','utf8');assert.match(school,/<img[^>]+class="[^"]*v2-scene-photo[^>]+decoding="sync"[^>]+loading="eager"[^>]+fetchpriority="high"/);
});
