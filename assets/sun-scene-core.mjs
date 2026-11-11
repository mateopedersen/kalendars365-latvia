// Pure scene math. East/up/north, azimuth clockwise from geographic north.
export const RAD = Math.PI / 180;
export const SUN_RADIUS = 0.2666;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const wrap = angle => ((angle % 360) + 360) % 360;
export function direction(altitude, azimuth) {
  const h = altitude * RAD, a = azimuth * RAD;
  return [Math.cos(h) * Math.sin(a), Math.sin(h), Math.cos(h) * Math.cos(a)];
}
export function compass(angle) {
  return ['Z', 'ZA', 'A', 'DA', 'D', 'DR', 'R', 'ZR'][Math.round(wrap(angle) / 45) % 8];
}
const refraction = h => 0.0002967 / Math.tan(Math.max(0, h) + 0.00312536 / (Math.max(0, h) + 0.08901179)) / RAD;
export function discAltitude(apparentAltitude) {
  // Recover geometric centre from SunCalc's apparent centre, then use the
  // standard 34 arcmin horizon refraction underlying the -0.833° event model.
  let low = apparentAltitude - 1, high = apparentAltitude;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (mid + refraction(mid * RAD) < apparentAltitude) low = mid; else high = mid;
  }
  const geometric = (low + high) / 2;
  return geometric + (34 / 60) / (1 + Math.max(0, geometric) * 0.52);
}
export function projectSun(altitude, azimuth, bearing, pitch, width, height, fov = 36.86989765) {
  const s = direction(altitude, azimuth), b = bearing * RAD, p = pitch * RAD;
  const forward = [Math.sin(b) * Math.sin(p), -Math.cos(p), Math.cos(b) * Math.sin(p)];
  const right = [Math.cos(b), 0, -Math.sin(b)];
  const up = [Math.sin(b) * Math.cos(p), Math.sin(p), Math.cos(b) * Math.cos(p)];
  const dot = v => v.reduce((sum, n, i) => sum + n * s[i], 0), depth = dot(forward);
  const focal = height / (2 * Math.tan(fov * RAD / 2));
  const x = width / 2 + focal * dot(right) / depth;
  const y = height / 2 - focal * dot(up) / depth;
  return {x, y, visible: depth > 0 && x >= 0 && x <= width && y >= 0 && y <= height && altitude + SUN_RADIUS >= 0};
}
const stops = [
  [-18, '#071122', '#172335', '#192c3c', '#34445b', '#244154', '#182b2e', '#a7b4ca'],
  [-6, '#283951', '#c47c79', '#796a70', '#767175', '#465d6c', '#455147', '#f6b392'],
  [0, '#64849d', '#f9bc88', '#b7ab98', '#d4b69b', '#678f9d', '#809378', '#ffe1ab'],
  [12, '#6fa6c4', '#dce5dd', '#c4c5b3', '#dfd2bd', '#7aa6af', '#a3b591', '#fff6e5'],
  [60, '#4689b5', '#d9e9e8', '#c2c6b4', '#e6d9c6', '#74a5b1', '#a3b68e', '#fff9ed']
];
const rgb = hex => hex.match(/\w\w/g).map(x => parseInt(x, 16));
const mix = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
export function atmosphere(altitude) {
  let lower = stops[0], upper = stops.at(-1);
  for (let i = 1; i < stops.length; i++) if (altitude < stops[i][0]) {lower = stops[i - 1]; upper = stops[i]; break;}
  const t = clamp((altitude - lower[0]) / (upper[0] - lower[0]));
  const colors = lower.slice(1).map((a, i) => mix(a, upper[i + 1], t));
  return Object.fromEntries(['sky', 'horizon', 'land', 'building', 'water', 'green', 'sun'].map((k, i) => [k, colors[i]]).concat([
    ['daylight', clamp((altitude + 12) / 22)],
    ['label', altitude < -12 ? 'Nakts' : altitude < -6 ? 'Dziļā krēsla' : altitude < 0 ? 'Civilā krēsla' : altitude < 6 ? 'Zelta gaisma' : 'Dienasgaisma']
  ]));
}
