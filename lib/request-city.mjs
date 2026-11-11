import {cities} from './city-coordinates.mjs';
import locationCore from '../assets/location-core.js';

export function requestCity(request){
 const params=new URL(request.url).searchParams,id=params.get('city')||'riga';
 if(cities[id])return cities[id];
 if(!id.startsWith('geo-'))return null;
 const lat=locationCore.coordinate(params.get('lat'),90),lon=locationCore.coordinate(params.get('lon'),180);
 if(lat===null||lon===null)return null;
 const place={lat:Number(lat.toFixed(2)),lon:Number(lon.toFixed(2))};
 if(id!==`geo-${place.lat.toFixed(2)}_${place.lon.toFixed(2)}`)return null;
 return {id,name:'Izvēlētā pilsēta',...place};
}
