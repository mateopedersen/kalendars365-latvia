import {cities} from '../../lib/city-coordinates.mjs';
import {stations} from '../../lib/weather-stations.mjs';
import {nearestObservation} from '../../lib/observations.mjs';
const source={name:'LVĢMC',url:'https://data.gov.lv/dati/dataset/hidrometeorologiskie-noverojumi',license:'CC0-1.0',quality:'Operatīvi, pamata pārbaudi izgājuši dati; nav galīgi verificēti novērojumi.'};
let cache=null,pending=null;
async function records(now) {
 if(cache&&now-cache.at<600000)return cache.rows;
 if(!pending)pending=(async()=>{
  const url=new URL('https://data.gov.lv/dati/api/3/action/datastore_search');
  url.searchParams.set('resource_id','17460efb-ae99-4d1d-8144-1068f184b05f');
  url.searchParams.set('filters',JSON.stringify({ABBREVIATION:'HTDRY'}));
  url.searchParams.set('sort','DATETIME desc');url.searchParams.set('limit','200');
  const response=await fetch(url,{headers:{Accept:'application/json'},cf:{cacheTtl:600,cacheEverything:true},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Observation provider unavailable');
  const data=await response.json();
  if(!data.success||!Array.isArray(data.result?.records))throw Error('Invalid observation data');
  cache={at:now,rows:data.result.records};return cache.rows;
 })().finally(()=>{pending=null;});
 return pending;
}
export async function onRequestGet({request}) {
 const city=cities[new URL(request.url).searchParams.get('city')||'riga'];
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':status===200?'public, max-age=60, s-maxage=300':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});
 if(!city)return reply({error:'Pilsēta nav atrasta.'},404);
 const now=Date.now();
 try {const observation=nearestObservation(city,stations,await records(now),now);return reply({city:city.id,cityName:city.name,status:observation?'available':'unavailable',observation,source,fetchedAt:new Date().toISOString()});}
 catch{return reply({city:city.id,status:'unavailable',observation:null,source,error:'Stacijas novērojumus pašlaik nevar ielādēt.'},503);}
}
