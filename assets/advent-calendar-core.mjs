export const YEARS = [2026, 2027, 2028, 2029, 2030];
const clock = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'});
export function rigaDate(now = new Date()) {
  const parts=Object.fromEntries(clock.formatToParts(now).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function availableDays(year, now = new Date()) {
  if(!YEARS.includes(Number(year))) return 0;
  const date=rigaDate(now), start=`${year}-12-01`, end=`${year}-12-24`;
  if(date<start) return 0;
  if(date>=end) return 24;
  return Number(date.slice(-2));
}
export function readProgress(storage, year) {
  try { const a=JSON.parse(storage.getItem(`k365:advent:v1:${year}`)); return new Set(Array.isArray(a)?a.filter(d=>Number.isInteger(d)&&d>=1&&d<=24):[]); } catch { return new Set(); }
}
export function saveProgress(storage, year, days) {
  try { storage.setItem(`k365:advent:v1:${year}`,JSON.stringify([...days].sort((a,b)=>a-b))); return true; } catch { return false; }
}
