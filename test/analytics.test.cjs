'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('assets/analytics.js','utf8'),key='k365.analytics-consent.v1',id='G-5E1KZEJCNR';
function browser({saved,blocked=false,host='kalendars365.lv'}={}){
 const data=new Map([['kalendars365.v1',JSON.stringify({events:[{title:'Private event'}],notes:{today:'Private note'}})]]),listeners={},scripts=[],dialogs=[],cookies=new Map([['_ga','test'],['_ga_5E1KZEJCNR','test'],['unrelated','keep']]);
 if(saved)data.set(key,JSON.stringify(saved));
 const banner={hidden:false},attributes=new Set(),body={style:{setProperty(){}},classList:{toggle(){}},append(n){dialogs.push(n)}};
 const document={referrer:'https://example.com/path?email=private#secret',title:'Calendar',body,documentElement:{toggleAttribute(k,v){if(v)attributes.add(k);else attributes.delete(k)}},getElementById(){return banner},createElement(tag){return {tag,setAttribute(){},className:'',open:false,showModal(){this.open=true},close(){this.open=false}}},head:{append(n){scripts.push(n)}},addEventListener(k,f){listeners[k]=f}};
 Object.defineProperty(document,'cookie',{get:()=>[...cookies].map(([k,v])=>k+'='+v).join('; '),set:s=>{const [name,value]=s.split(';')[0].split('=');if(/Max-Age=0/.test(s))cookies.delete(name);else cookies.set(name,value)}});
 const context={document,URL,Date,location:{hostname:host,href:'https://'+host+'/?q=private#secret',reload(){context.reloaded=true}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return data.get(k)||null},setItem(k,v){if(blocked)throw Error('blocked');data.set(k,v)}},addEventListener(k,f){listeners['window:'+k]=f}};context.window=context;
 vm.createContext(context);vm.runInContext(code,context);
 const click=dataset=>listeners.click({target:{closest:()=>({dataset,hasAttribute:k=>k==='data-analytics-close'&&dataset.close})},preventDefault(){},stopImmediatePropagation(){}});
 return {context,data,scripts,dialogs,banner,cookies,click,again:()=>vm.runInContext(code,context),storage:k=>listeners['window:storage']({key:k}),commands:()=>Array.from(context.dataLayer||[],x=>Array.from(x))};
}
test('no consent, rejection, invalid records, and local previews never load Google',()=>{
 for(const saved of [undefined,{version:1,analytics:true,expiresAt:Date.now()-1},{version:0,analytics:true,expiresAt:Date.now()+5000},{version:1,analytics:'true',expiresAt:Date.now()+5000}]){const b=browser({saved});assert.equal(b.scripts.length,0);assert.equal(b.context.dataLayer,undefined);b.click({consent:'necessary'});assert.equal(b.scripts.length,0);assert.equal(b.context.K365Analytics.choice().analytics,false);}
 const preview=browser({host:'127.0.0.1',saved:{version:1,analytics:true,expiresAt:Date.now()+5000}});assert.equal(preview.scripts.length,0);
});
test('grant configures exactly one automatic page view, no manual duplicate, and redacts private URL values',()=>{
 const b=browser();b.click({consent:'analytics'});b.click({consent:'analytics'});b.again();assert.equal(b.scripts.length,1);assert.equal(b.dialogs.length,1);
 const commands=b.commands(),config=commands.filter(x=>x[0]==='config');assert.equal(config.length,1);assert.equal(config[0][1],id);assert.equal(config[0][2].send_page_view,true);assert.equal(commands.filter(x=>x[0]==='event'&&x[1]==='page_view').length,0);
 assert.equal(config[0][2].page_location,'https://kalendars365.lv/');assert.equal(config[0][2].page_referrer,'https://example.com/path');assert(!JSON.stringify(commands).includes('private'));assert(!JSON.stringify(commands).includes('secret'));
 const defaults=commands.findIndex(x=>x[0]==='set'),start=commands.findIndex(x=>x[0]==='js');assert(defaults>=0&&defaults<start,'privacy defaults must precede tag startup');assert.deepEqual(commands[defaults][1],config[0][2]);
 assert.equal(config[0][2].allow_google_signals,false);assert.equal(config[0][2].allow_ad_personalization_signals,false);
 for(const c of commands.filter(x=>x[0]==='consent'))for(const k of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(c[2][k],'denied');
});
test('revocation disables analytics, removes only GA cookies, and re-grant updates consent without another page view',()=>{
 const b=browser();const personal=b.data.get('kalendars365.v1');b.click({consent:'analytics'});b.click({action:'consent'});assert(b.dialogs[0].open);b.click({analyticsChoice:'no'});assert(b.context['ga-disable-'+id]);assert.deepEqual([...b.cookies.keys()],['unrelated']);assert.equal(b.commands().at(-1)[2].analytics_storage,'denied');
 b.click({analyticsChoice:'yes'});assert.equal(b.commands().at(-1)[2].analytics_storage,'granted');assert.equal(b.context['ga-disable-'+id],false);assert.equal(b.scripts.length,1);assert.equal(b.commands().filter(x=>x[0]==='config').length,1);assert.equal(b.data.get('kalendars365.v1'),personal);
 b.storage(null);assert(b.context.reloaded);
});
test('saved valid choice is honored and blocked storage retains a session-only choice',()=>{
 const b=browser({saved:{version:1,analytics:true,expiresAt:Date.now()+5000}});assert.equal(b.scripts.length,1);assert(b.banner.hidden);
 const blocked=browser({blocked:true});blocked.click({consent:'analytics'});assert.equal(blocked.scripts.length,1);assert(blocked.banner.hidden);assert.equal(blocked.data.has(key),false);
});
