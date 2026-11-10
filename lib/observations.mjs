// LVĢMC open-data timestamps are UTC. HTDRY values are already expressed in °C;
// the parameter dictionary's SCALE is resolution, not a value multiplier.
export function distanceKm(a,b) {
 const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlon=(b.lon-a.lon)*r;
 const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
export function nearestObservation(city,stations,records,now=Date.now()) {
 const latest=new Map();
 for(const row of records) {
  if(row.ABBREVIATION!=='HTDRY'||row.VALUE===null||String(row.VALUE).trim()==='')continue;
  const temperature=Number(row.VALUE),stamp=Date.parse(String(row.DATETIME).replace(/Z$/,'')+'Z');
  if(!Number.isFinite(stamp)||!Number.isFinite(temperature)||temperature< -50||temperature>50||stamp>now+300000||now-stamp>3*3600000)continue;
  if(!latest.has(row.STATION_ID)||latest.get(row.STATION_ID).stamp<stamp)latest.set(row.STATION_ID,{temperature,stamp});
 }
 const candidates=stations.filter(s=>latest.has(s.id)).map(s=>({...s,distanceKm:distanceKm(city,s)})).filter(s=>s.distanceKm<=50).sort((a,b)=>a.distanceKm-b.distanceKm||a.id.localeCompare(b.id));
 if(!candidates.length)return null;
 const station=candidates[0],row=latest.get(station.id);
 return {stationId:station.id,stationName:station.name,stationLat:station.lat,stationLon:station.lon,distanceKm:Math.round(station.distanceKm*10)/10,temperature:row.temperature,observedAt:new Date(row.stamp).toISOString(),aggregation:'hourly_mean',ageMinutes:Math.round((now-row.stamp)/60000)};
}
