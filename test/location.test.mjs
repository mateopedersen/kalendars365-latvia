import test from 'node:test';
import assert from 'node:assert/strict';
import core from '../assets/location-core.js';
import {cities as records} from '../lib/city-coordinates.mjs';
import {onRequestGet} from '../functions/api/atrasanas-vieta.js';
import {requestCity} from '../lib/request-city.mjs';
import {onRequestGet as forecast} from '../functions/api/laikapstakli.js';
import {citySky,dateKey,dayBounds,formatTime} from '../assets/sky-core.mjs';

const cities=Object.values(records),edge=(city='Riga',rest={})=>({country:'LV',city,latitude:'56.95',longitude:'24.10',timezone:'Europe/Riga',...rest});
const available=city=>({status:'available',city});
function setup(fetchLocation,initial){const store=new Map(initial?[[core.key,initial]]:[]),changes=[];const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};return {controller:core.createController({cities,storage,fetchLocation,onChange:event=>changes.push(event)}),store,changes};}

test('IP names map to all 82 Latvian cities, with Latvian spelling and country bounds',()=>{
 for(const city of cities){const result=core.fromEdge(edge(core.normalize(city.name)),cities);assert.equal(result.id,city.id);assert.equal(result.name,city.name);assert.equal(result.timeZone,'Europe/Riga');}
 assert.equal(core.fromEdge(edge('Unknown',{latitude:'57.3897',longitude:'21.5644'}),cities).id,'ventspils');
 for(const cf of [null,{},edge('',{latitude:null,longitude:null}),edge('Unknown',{latitude:'',longitude:' '}),edge('Unknown',{latitude:999}),edge('Unknown',{latitude:0,longitude:0})])assert.equal(core.fromEdge(cf,cities),null);
 assert.equal(core.fromEdge(edge('Riga',{country:'US',timezone:'America/New_York'}),cities).external,true);
});

test('foreign IP location uses valid local timezone and rounded city coordinates',()=>{
 const city=core.fromEdge(edge('Istanbul',{country:'TR',latitude:'41.00823',longitude:'28.97836',timezone:'Europe/Istanbul'}),cities);
 assert.equal(city.id,'geo-41.01_28.98');assert.equal(city.timeZone,'Europe/Istanbul');assert.equal(city.external,true);
 assert.equal(core.fromEdge(edge('Istanbul',{country:'TR',timezone:'Invalid/Timezone'}),cities),null);
 assert.equal(core.fromEdge(edge('<script>',{country:'TR',timezone:'Europe/Istanbul'}),cities),null);
 const equator=core.fromEdge(edge('Equator',{country:'KE',latitude:'-0.001',longitude:'37.00',timezone:'Africa/Nairobi'}),cities);
 assert.equal(requestCity(new Request('https://kalendars365.lv/api/laikapstakli/?city='+equator.id+'&lat='+equator.lat+'&lon='+equator.lon)).id,equator.id);
 const req=new Request('https://kalendars365.lv/api/laikapstakli/?city='+city.id+'&lat='+city.lat+'&lon='+city.lon);
 assert.equal(requestCity(req).id,city.id);
 for(const query of ['city=unknown','city=geo-41.01_28.98','city=geo-41.01_28.98&lat=0&lon=0','city=geo-a&lat=91&lon=20'])assert.equal(requestCity(new Request('https://kalendars365.lv/api/laikapstakli/?'+query)),null);
});

test('foreign forecast uses the selected coordinates without forwarding visitor headers',async()=>{
 const original=globalThis.fetch,now=new Date().toISOString();let called;
 try{
  globalThis.fetch=async(url,options)=>{called={url:new URL(url),headers:options.headers};return Response.json({properties:{meta:{updated_at:now},timeseries:[{time:now,data:{instant:{details:{air_temperature:7.5}},next_1_hours:{summary:{symbol_code:'cloudy'}}}}]}});};
  const response=await forecast({request:new Request('https://kalendars365.lv/api/laikapstakli/?city=geo-40.71_-74.01&lat=40.71&lon=-74.01',{headers:{'CF-Connecting-IP':'192.0.2.1'}})});
  assert.equal(response.status,200);assert.equal((await response.json()).temperature,7.5);assert.equal(called.url.searchParams.get('lat'),'40.7100');assert.equal(called.url.searchParams.get('lon'),'-74.0100');assert(!JSON.stringify(called.headers).includes('192.0.2.1'));
 }finally{globalThis.fetch=original;}
});

test('visitor response is never shared-cacheable and exposes no IP address',async()=>{
 const request=new Request('https://kalendars365.lv/api/atrasanas-vieta/',{headers:{'CF-Connecting-IP':'192.0.2.1','X-Forwarded-For':'192.0.2.2'}});
 Object.defineProperty(request,'cf',{value:edge('Jurmala')});
 const response=onRequestGet({request}),data=await response.json();
 assert.equal(data.city.id,'jurmala');assert.equal(data.approximate,true);
 for(const name of ['Cache-Control','CDN-Cache-Control','Cloudflare-CDN-Cache-Control'])assert.match(response.headers.get(name),/no-store/);
 assert(!JSON.stringify(data).includes('192.0.2.'));
 const unavailable=await onRequestGet({request:new Request(request.url)}).json();assert.equal(unavailable.status,'unavailable');assert.equal(unavailable.city,null);
});

test('fresh visitors use detected city, manual preference wins, auto can be restored',async()=>{
 let calls=0;const a=setup(async()=>{calls++;return available(records.liepaja);});await a.controller.start();assert.equal(a.controller.current.id,'liepaja');assert.equal(a.controller.source,'ip');assert.equal(a.store.size,0);
 a.controller.manual('ventspils');assert.equal(a.store.get(core.key),'ventspils');
 const b=setup(async()=>{throw Error('Must not lookup saved manual preference');},'ventspils');await b.controller.start();assert.equal(b.controller.current.id,'ventspils');assert.equal(b.controller.source,'manual');
 await a.controller.auto();assert.equal(a.controller.current.id,'liepaja');assert.equal(a.store.size,0);assert.equal(calls,2);
});

test('slow IP response cannot overwrite a manual selection; storage failure and offline are safe',async()=>{
 let complete;const a=setup(()=>new Promise(resolve=>complete=resolve));const ready=a.controller.start();a.controller.manual('kuldiga');complete(available(records.riga));await ready;assert.equal(a.controller.current.id,'kuldiga');assert.equal(a.controller.source,'manual');
 const b=setup(async()=>{throw Error('Offline');});await b.controller.start();assert.equal(b.controller.source,'fallback');assert.equal(b.controller.current.id,'riga');
 const c=core.createController({cities,storage:{getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}},fetchLocation:async()=>available(records.jelgava)});await c.start();assert.equal(c.current.id,'jelgava');assert(c.manual('ogre'));assert.equal(c.current.id,'ogre');
 const d=setup(async()=>available({id:'geo-broken',name:'City',country:'TR',timeZone:'bad',lat:'x',lon:4}));await d.controller.start();assert.equal(d.controller.source,'fallback');
});

test('foreign local date, DST and sun/moon events use the same civil day',()=>{
 const city={id:'ny',lat:40.71,lon:-74.01,timeZone:'America/New_York'};
 assert.equal(dateKey(new Date('2027-01-01T01:00:00Z'),city.timeZone),'2026-12-31');
 assert.equal((dayBounds('2027-03-14',city.timeZone).end-dayBounds('2027-03-14',city.timeZone).start)/3600000,23);
 for(const place of [city,{id:'istanbul',lat:41.01,lon:28.98,timeZone:'Europe/Istanbul'},{id:'sydney',lat:-33.87,lon:151.21,timeZone:'Australia/Sydney'}]){
  const sky=citySky('2027-06-21',place);assert.equal(sky.timeZone,place.timeZone);assert(sky.sun.sunrise<sky.sun.sunset);for(const event of [...Object.values(sky.sun),...sky.moon.rises,...sky.moon.sets].filter(Boolean))assert(event>=sky.start&&event<sky.end);
 }
 assert.notEqual(formatTime(new Date('2027-01-01T12:00Z'),'America/New_York'),formatTime(new Date('2027-01-01T12:00Z'),'Europe/Riga'));
});


test('foreign homepage visitors see Riga photographs while Latvian manual preferences remain authoritative',async()=>{
 const foreign=core.fromEdge(edge('Istanbul',{country:'TR',latitude:'41.00823',longitude:'28.97836',timezone:'Europe/Istanbul'}),cities);
 const a=setup(async()=>available(foreign));await a.controller.start();assert.equal(a.controller.current.id,'riga');assert.equal(a.controller.current.timeZone,'Europe/Riga');assert.equal(a.controller.source,'country-fallback');assert.equal(a.store.size,0);
 a.controller.manual('ventspils');assert.equal(a.controller.current.id,'ventspils');assert.equal(a.store.get(core.key),'ventspils');
 const b=setup(async()=>available(foreign),'kuldiga');await b.controller.start();assert.equal(b.controller.current.id,'kuldiga');assert.equal(b.controller.source,'manual');
});
