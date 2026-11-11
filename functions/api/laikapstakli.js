import {requestCity} from '../../lib/request-city.mjs';
import {currentForecast} from '../../lib/weather-forecast.mjs';
const memory=new Map();
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':status===200?'public, max-age=300':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});
export async function onRequestGet({request}) {
 const city=requestCity(request),id=city?.id;
 if(!city)return json({error:'Pilsēta nav atrasta.'},404);
 const now=Date.now(),cached=memory.get(id);if(cached&&now-cached.stored<1800000)return json(cached.value);
 try {
  const url=new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact');url.searchParams.set('lat',city.lat.toFixed(4));url.searchParams.set('lon',city.lon.toFixed(4));
  const response=await fetch(url,{headers:{'User-Agent':'Kalendars365/1.0 https://kalendars365.lv/ kalendars365@gmail.com','Accept':'application/json'},cf:{cacheTtl:1800,cacheEverything:true},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Weather provider unavailable');
  const value={city:id,name:city.name,...currentForecast(await response.json(),now),fetchedAt:new Date().toISOString(),source:{name:'MET Norway',url:'https://api.met.no/',description:'Laika prognoze pilsētas centra koordinātām'}};
  if(memory.size>=384)memory.delete(memory.keys().next().value);memory.set(id,{stored:now,value});return json(value);
 }catch{return json({error:'Laika prognozi pašlaik nevar ielādēt. Mēģini vēlreiz vēlāk.'},503);}
}
