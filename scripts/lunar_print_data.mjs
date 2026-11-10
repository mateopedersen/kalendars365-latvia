// Geocentric calendar views, at noon in Latvia. No city-dependent horizon tilt.
import fs from 'node:fs';
import * as A from '../lib/vendor/astronomy.mjs';
import {rigaInstant} from '../assets/sky-core.mjs';

const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const unit=v=>v.map(x=>x/Math.hypot(...v));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const vec=v=>[v.x,v.y,v.z];
export function lunarPrintDay(date) {
  const instant=rigaInstant(date,12), moon=vec(A.GeoVector(A.Body.Moon,instant,true));
  const sun=vec(A.GeoVector(A.Body.Sun,instant,true));
  const view=unit(moon.map(x=>-x));
  // A north-up sky chart: west is right, east is left, without mirror reversal.
  const right=unit(cross([0,0,1],view)), up=cross(view,right);
  const light=unit(sun.map((x,i)=>x-moon[i]));
  const axis=A.RotationAxis(A.Body.Moon,instant), ra=axis.ra*Math.PI/12, dec=axis.dec*Math.PI/180, w=axis.spin*Math.PI/180;
  const node=[-Math.sin(ra),Math.cos(ra),0];
  const equator=[-Math.sin(dec)*Math.cos(ra),-Math.sin(dec)*Math.sin(ra),Math.cos(dec)];
  const bx=node.map((v,i)=>Math.cos(w)*v+Math.sin(w)*equator[i]);
  const by=node.map((v,i)=>-Math.sin(w)*v+Math.cos(w)*equator[i]);
  const bz=vec(axis.north);
  const basis=[bx,by,bz].map(b=>[dot(b,right),dot(b,up),dot(b,view)]);
  return {date,utc:instant.toISOString(),fraction:(1+dot(light,view))/2,phase:A.MoonPhase(instant)/360,
    light:[dot(light,right),dot(light,up),dot(light,view)],basis,
    subEarthLon:Math.atan2(dot(by,view),dot(bx,view))*180/Math.PI,
    subEarthLat:Math.asin(dot(bz,view))*180/Math.PI};
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const days=[];
  for(let year=2026;year<=2030;year++) for(let month=1;month<=12;month++)
    for(let day=1;day<=new Date(Date.UTC(year,month,0)).getUTCDate();day++)
      days.push(lunarPrintDay(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`));
  fs.writeFileSync(process.argv[2],JSON.stringify({timeZone:'Europe/Riga',hour:12,orientation:'Celestial north up, geocentric',days}));
  console.log(`Calculated ${days.length} dates, including local summer/winter time and IAU lunar rotation.`);
}
