import * as SunCalc from './vendor/suncalc-v2.1.3.mjs';

export const TIME_ZONE = 'Europe/Riga';
const DAY = 86400000;
const partsFormatter = new Intl.DateTimeFormat('en-CA', {timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const timeFormatter = new Intl.DateTimeFormat('lv-LV', {timeZone:TIME_ZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const dateFormatter = new Intl.DateTimeFormat('lv-LV', {timeZone:TIME_ZONE,year:'numeric',month:'long',day:'numeric'});
const pad = n => String(n).padStart(2,'0');
SunCalc.addTime(-4, 'goldenMorningStart', 'goldenEveningEnd');

const zoneParts=new Map([[TIME_ZONE,partsFormatter]]);
function partsFor(zone){if(!zoneParts.has(zone))zoneParts.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));return zoneParts.get(zone);}
export function dateKey(date = new Date(),zone=TIME_ZONE) {
  const p = Object.fromEntries(partsFor(zone).formatToParts(date).map(p=>[p.type,p.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Nederīgs datums.');
  const date = new Date(value+'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==value || date.getUTCFullYear()<1901 || date.getUTCFullYear()>2099) throw new RangeError('Izvēlies datumu no 1901. līdz 2099. gadam.');
  return date;
}
export function addDays(value, days) {
  const date=parseDate(value);date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}
export function rigaInstant(value,hour=0,minute=0){return zonedInstant(value,hour,minute,TIME_ZONE);}
export function zonedInstant(value, hour=0, minute=0, zone=TIME_ZONE) {
  return instantForDate(parseDate(value),hour,minute,zone);
}
function instantForDate(date,hour,minute,zone){
  const desired=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),hour,minute);
  let stamp=desired;
  for(let i=0;i<4;i++) {
    const p=Object.fromEntries(partsFor(zone).formatToParts(new Date(stamp)).map(p=>[p.type,p.value]));
    const displayed=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
    const correction=desired-displayed;stamp+=correction;if(!correction)break;
  }
  return new Date(stamp);
}
export function dayBounds(value,zone=TIME_ZONE) {
  const date=parseDate(value);
  return {start:instantForDate(date,0,0,zone),end:instantForDate(new Date(date.getTime()+DAY),0,0,zone)};
}
export function formatTime(date,zone=TIME_ZONE) {
  const formatter=zone===TIME_ZONE?timeFormatter:new Intl.DateTimeFormat('lv-LV',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  return date && Number.isFinite(new Date(date).getTime()) ? formatter.format(new Date(Math.round(new Date(date).getTime()/60000)*60000)) : '—';
}
export function formatEventTimes(events, separator=', ', zone=TIME_ZONE) {
  return events.map(event => formatTime(event, zone)).join(separator);
}
export function formatDate(value) { return dateFormatter.format(rigaInstant(value,12)); }
export function phaseName(phase) {
  const names=['Jaunmēness','Augošs sirpis','Pirmais ceturksnis','Augošs Mēness','Pilnmēness','Dilstošs Mēness','Pēdējais ceturksnis','Dilstošs sirpis'];
  return names[Math.floor(((phase+1/16)%1)*8)];
}
function unique(events) { return [...new Map(events.sort((a,b)=>a-b).map(d=>[Math.round(d.getTime()/1000),d])).values()]; }
const cache=new Map();
export function citySky(value, city) {
  parseDate(value);
  if(!Number.isFinite(city.lat)||!Number.isFinite(city.lon)||Math.abs(city.lat)>90||Math.abs(city.lon)>180) throw new RangeError('Nederīgas pilsētas koordinātas.');
  const zone=city.timeZone||TIME_ZONE;
  const key=`${value}|${city.id}|${city.lat}|${city.lon}|${zone}`;if(cache.has(key))return cache.get(key);
  const {start,end}=dayBounds(value,zone),fields=['sunrise','sunset','dawn','dusk','nauticalDawn','nauticalDusk','nightEnd','night','solarNoon','nadir','goldenMorningStart','goldenHourEnd','goldenHour','goldenEveningEnd'];
  const collected=Object.fromEntries(fields.map(k=>[k,[]])),rises=[],sets=[];
  // UTC windows are filtered to the actual IANA civil day: DST days can be 23/25h.
  for(let stamp=Math.floor(start.getTime()/DAY)*DAY;stamp<end.getTime();stamp+=DAY) {
    const anchor=new Date(stamp+DAY/2),sun=SunCalc.getTimes(anchor,city.lat,city.lon,0,0),moon=SunCalc.getMoonTimes(anchor,city.lat,city.lon,0);
    for(const field of fields) {const event=sun[field];if(event instanceof Date&&event>=start&&event<end)collected[field].push(event);}
    if(moon.rise>=start&&moon.rise<end)rises.push(moon.rise);
    if(moon.set>=start&&moon.set<end)sets.push(moon.set);
  }
  const sun=Object.fromEntries(fields.map(k=>[k,unique(collected[k])[0]||null]));
  const illumination=SunCalc.getMoonIllumination(zonedInstant(value,12,0,zone));
  const result={date:value,cityId:city.id,timeZone:zone,start,end,sun,moon:{rises:unique(rises),sets:unique(sets),fraction:illumination.fraction,phase:illumination.phase,angle:illumination.angle,name:phaseName(illumination.phase)},daylightMinutes:sun.sunrise&&sun.sunset?Math.round((sun.sunset-sun.sunrise)/60000):null};
  if(cache.size>400)cache.clear();cache.set(key,result);return result;
}
export function sunPosition(date, city) {
  const result=SunCalc.getPosition(date,city.lat,city.lon);
  // SunCalc 2.x returns both angles in degrees, with azimuth clockwise from north.
  return {altitude:result.altitude,azimuth:result.azimuth};
}
export function monthSky(year, month, city) {
  if(!Number.isInteger(year)||year<1901||year>2099||!Number.isInteger(month)||month<1||month>12)throw new RangeError('Nederīgs mēnesis.');
  return Array.from({length:new Date(Date.UTC(year,month,0)).getUTCDate()},(_,i)=>citySky(`${year}-${pad(month)}-${pad(i+1)}`,city));
}
export {SunCalc};
