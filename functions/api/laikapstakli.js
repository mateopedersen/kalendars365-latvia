import {cities} from '../../lib/city-coordinates.mjs';
const memory=new Map();
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':status===200?'public, max-age=300':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});
export async function onRequestGet({request}) {
 const id=new URL(request.url).searchParams.get('city')||'riga',city=cities[id];
 if(!city)return json({error:'Pilsēta nav atrasta.'},404);
 const now=Date.now(),cached=memory.get(id);if(cached&&now-cached.stored<1800000)return json(cached.value);
 try {
  const url=new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact');url.searchParams.set('lat',city.lat.toFixed(4));url.searchParams.set('lon',city.lon.toFixed(4));
  const response=await fetch(url,{headers:{'User-Agent':'Kalendars365/1.0 https://kalendars365.lv/ kalendars365@gmail.com','Accept':'application/json'},cf:{cacheTtl:1800,cacheEverything:true},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Weather provider unavailable');
  const data=await response.json(),series=data.properties?.timeseries;
  if(!Array.isArray(series)||!series.length)throw Error('Weather data unavailable');
  const row=series.find(x=>Date.parse(x.time)>=now-3600000)||series[0],details=row.data?.instant?.details||{},hour=row.data?.next_1_hours||row.data?.next_6_hours;
  if(!Number.isFinite(details.air_temperature)||!hour?.summary?.symbol_code)throw Error('Incomplete weather data');
  const value={city:id,name:city.name,modelUpdatedAt:data.properties.meta.updated_at,forecastTime:row.time,fetchedAt:new Date().toISOString(),temperature:details.air_temperature,feelsLike:details.apparent_air_temperature??null,windSpeed:details.wind_speed??null,windDirection:details.wind_from_direction??null,humidity:details.relative_humidity??null,cloudCover:details.cloud_area_fraction??null,symbol:hour.summary.symbol_code,precipitation:hour.details?.precipitation_amount??null,source:{name:'MET Norway',url:'https://api.met.no/',description:'Laika prognoze pilsētas centra koordinātām'}};
  memory.set(id,{stored:now,value});return json(value);
 }catch{return json({error:'Laika prognozi pašlaik nevar ielādēt. Mēģini vēlreiz vēlāk.'},503);}
}
