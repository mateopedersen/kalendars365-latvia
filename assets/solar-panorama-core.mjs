import {clamp, compass, direction, discAltitude, RAD, wrap} from './sun-scene-core.mjs';

// Rendering parameters only. Event times and solar coordinates stay in sky-core.
export function panoramaView(snapshot, {bearing, follow = true, landscape = 'water'} = {}) {
  const altitude = discAltitude(snapshot.position.altitude);
  const heading = follow || !Number.isFinite(bearing) ? snapshot.position.azimuth : bearing;
  return {
    bearing: wrap(heading),
    elevation: follow ? clamp(altitude * .40 + 3, 5, 29) : 8,
    fov: follow ? clamp(58 + Math.max(0, altitude - 15) * .65, 58, 88) : 64,
    sun: direction(altitude, snapshot.position.azimuth),
    altitude,
    landscape: landscape === 'meadow' ? 1 : landscape === 'forest' ? 2 : 0,
    seed: (snapshot.city.lat * 17.13 + snapshot.city.lon * 11.71) % 100,
    season: (snapshot.instant.getUTCMonth() + 1),
    label: compass(heading)
  };
}

export function projectPanorama(altitude, azimuth, view, width, height) {
  const sun = direction(altitude, azimuth), b = view.bearing * RAD, e = view.elevation * RAD;
  const forward = [Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e)];
  const right = [Math.cos(b), 0, -Math.sin(b)];
  const up = [-Math.sin(b) * Math.sin(e), Math.cos(e), -Math.cos(b) * Math.sin(e)];
  const dot = v => v.reduce((sum, n, i) => sum + n * sun[i], 0), depth = dot(forward);
  const focal = height / (2 * Math.tan(view.fov * RAD / 2));
  const x = width / 2 + focal * dot(right) / depth, y = height / 2 - focal * dot(up) / depth;
  return {x, y, visible: depth > 0 && x >= 0 && x <= width && y >= 0 && y <= height && altitude >= -.2666};
}

export function compassTicks(bearing) {
  return [-60, -30, 0, 30, 60].map(offset => {
    const angle = wrap(bearing + offset);
    return {angle, label: Math.round(angle) + '°', center: offset === 0};
  });
}
