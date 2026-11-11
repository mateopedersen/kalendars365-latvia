import {MakeTime, SiderealTime, e_tilt} from './vendor/astronomy-engine.mjs';
import {zone as findZone, timeZoneVersion} from './vendor/ascendant-timezones.mjs';

export const SIGNS = Object.freeze([
  ['auns', 'Auns', 'Uguns'], ['versis', 'Vērsis', 'Zeme'],
  ['dvini', 'Dvīņi', 'Gaiss'], ['vezis', 'Vēzis', 'Ūdens'],
  ['lauva', 'Lauva', 'Uguns'], ['jaunava', 'Jaunava', 'Zeme'],
  ['svari', 'Svari', 'Gaiss'], ['skorpions', 'Skorpions', 'Ūdens'],
  ['strelnieks', 'Strēlnieks', 'Uguns'], ['mezazis', 'Mežāzis', 'Zeme'],
  ['udensvirs', 'Ūdensvīrs', 'Gaiss'], ['zivis', 'Zivis', 'Ūdens']
].map(([slug, name, element]) => Object.freeze({slug, name, element})));
export {timeZoneVersion};
const RAD = Math.PI / 180;
export const normalize = value => ((value % 360) + 360) % 360;
export class AscendantError extends Error {
  constructor(code) { super(code); this.name = 'AscendantError'; this.code = code; }
}

/** Strict civil input. Date.UTC normalization must never repair an invalid birthday. */
export function parseCivil(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) throw new AscendantError('input');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second = 0] = time.split(':').map(Number);
  if (year < 1900 || year > 2100 || hour > 23 || minute > 59 || second > 59) throw new AscendantError('input');
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(wall);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new AscendantError('input');
  return {year, month, day, hour, minute, second, wall};
}

export function validateCoordinates(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) >= 89.999 || Math.abs(longitude) > 180) throw new AscendantError('coordinates');
}

/** Return EVERY valid UTC instant, including historical offsets measured in seconds.
 * A gap has no candidates; an autumn fold has two. No implicit earlier/later choice.
 * Moment offsets use minutes west of UTC; geographic longitudes use degrees east.
 */
export function resolveCivil(date, time, zoneName) {
  const {wall} = parseCivil(date, time);
  const zone = findZone(zoneName);
  if (!zone) throw new AscendantError('zone');
  const candidates = [];
  for (const westMinutes of new Set(zone.offsets)) {
    const utc = Math.round((wall + westMinutes * 60000) / 1000) * 1000;
    const actual = zone.utcOffset(utc);
    if (Math.abs(actual - westMinutes) > 1e-8 || Math.abs(utc - actual * 60000 - wall) > 0.1) continue;
    if (!candidates.some(item => item.utc === utc)) candidates.push({utc, offsetSeconds: Math.round(-actual * 60)});
  }
  return candidates.sort((a, b) => a.utc - b.utc);
}

export function formatOffset(seconds) {
  if (!Number.isFinite(seconds)) throw new AscendantError('zone');
  const value = Math.round(Math.abs(seconds));
  const hh = String(Math.floor(value / 3600)).padStart(2, '0');
  const mm = String(Math.floor(value % 3600 / 60)).padStart(2, '0');
  const ss = value % 60;
  return `UTC${seconds < 0 ? '−' : '+'}${hh}:${mm}${ss ? ':' + String(ss).padStart(2, '0') : ''}`;
}

/** Tropical ascendant = eastern intersection of the true ecliptic of date and
 * the geometric horizon. GAST and true obliquity use the same true equinox.
 * Derived from dot(eclipticPoint, zenith) = 0, independently of house algorithms.
 */
export function ascendantAt(utc, latitude, longitude) {
  validateCoordinates(latitude, longitude);
  if (typeof utc !== 'number' || !Number.isFinite(utc) || utc < Date.UTC(1899, 11, 30) || utc > Date.UTC(2101, 0, 3)) throw new AscendantError('input');
  const time = MakeTime(new Date(utc));
  const theta = normalize(SiderealTime(time) * 15 + longitude) * RAD;
  const obliquity = e_tilt(time).tobl * RAD;
  const phi = latitude * RAD;
  const a = Math.cos(phi) * Math.cos(theta);
  const b = Math.cos(phi) * Math.sin(theta) * Math.cos(obliquity) + Math.sin(phi) * Math.sin(obliquity);
  if (Math.hypot(a, b) < 1e-10) throw new AscendantError('singular');
  let angle = Math.atan2(-a, b);
  const east = -Math.sin(theta) * Math.cos(angle) + Math.cos(theta) * Math.cos(obliquity) * Math.sin(angle);
  if (Math.abs(east) < 1e-10) throw new AscendantError('singular');
  if (east < 0) angle += Math.PI;
  const longitudeDegrees = normalize(angle / RAD);
  return describeLongitude(longitudeDegrees);
}

export function describeLongitude(longitudeDegrees) {
  if (!Number.isFinite(longitudeDegrees)) throw new AscendantError('input');
  const longitude = normalize(longitudeDegrees);
  const signIndex = Math.min(11, Math.floor(longitude / 30));
  const within = longitude - signIndex * 30;
  // Truncate arcminutes so rounding can never show 30° inside the previous sign.
  const minutes = Math.min(1799, Math.floor((within + 1e-10) * 60));
  return {longitude, signIndex, sign: SIGNS[signIndex], degrees: Math.floor(minutes / 60), minutes: minutes % 60,
    cuspDistance: Math.min(within, 30 - within)};
}

/** Evaluate the entered uncertainty as elapsed time around the chosen UTC
 * instant. One-second samples include both ends. A near-singular horizon or
 * a rapid polar jump is flagged instead of claiming a stable rising sign.
 */
export function assessUncertainty(utc, latitude, longitude, minutes = 0) {
  if (![0, 1, 5, 15, 30, 60].includes(minutes)) throw new AscendantError('uncertainty');
  const center = ascendantAt(utc, latitude, longitude);
  const possible = new Set([center.signIndex]);
  let sensitive = false, previous;
  for (let offset = -minutes * 60; offset <= minutes * 60; offset++) {
    try {
      const value = ascendantAt(utc + offset * 1000, latitude, longitude);
      possible.add(value.signIndex);
      if (previous !== undefined && Math.abs(normalize(value.longitude - previous + 180) - 180) > 2) sensitive = true;
      previous = value.longitude;
    } catch (error) {
      if (error.code !== 'singular') throw error;
      sensitive = true;
    }
  }
  return {center, minutes, signs: [...possible].sort((a, b) => a - b).map(index => SIGNS[index]), sensitive};
}
