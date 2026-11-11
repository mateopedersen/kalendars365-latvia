import locationCore from '../../assets/location-core.js';
import {cities} from '../../lib/city-coordinates.mjs';

// The edge supplies IP geolocation. Never forward the visitor's IP to another service.
export function onRequestGet({request}){
 const city=locationCore.fromEdge(request.cf,Object.values(cities));
 return Response.json(city?{status:'available',city,source:'ip',approximate:true}:{status:'unavailable',city:null},
  {headers:{'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});
}
