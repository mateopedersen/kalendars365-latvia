import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as A from '../lib/vendor/astronomy.mjs';

const zone = 'Europe/Riga';
const years = [2026, 2027, 2028, 2029, 2030];
const dayMs = 86_400_000;
const cities = JSON.parse(fs.readFileSync('_data/cities.json', 'utf8')).cities;
const observer = city => new A.Observer(city.lat, city.lon, 0);
const iso = value => (value?.date || value)?.toISOString() ?? null;
const localDate = value => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value?.date || value);
const round = value => Math.round(value * 10) / 10;

function daylightWindows(body, place, start, end) {
  const from = new Date(start), to = new Date(end), cursor = new Date(from.getTime() - dayMs * 1.5);
  let rise = A.SearchRiseSet(body, place, 1, cursor, 3);
  const windows = [];
  let riseInEvent = null, setInEvent = null;
  for (let n = 0; rise && n < 5; n++) {
    const set = A.SearchRiseSet(body, place, -1, rise, 2);
    if (!set) break;
    const a = Math.max(from.getTime(), rise.date.getTime()), b = Math.min(to.getTime(), set.date.getTime());
    if (a < b) windows.push({ start: iso(new Date(a)), end: iso(new Date(b)) });
    if (rise.date >= from && rise.date <= to) riseInEvent = iso(rise);
    if (set.date >= from && set.date <= to) setInEvent = iso(set);
    if (set.date > to) break;
    rise = A.SearchRiseSet(body, place, 1, set, 2);
  }
  return { windows, rise: riseInEvent, set: setInEvent };
}

const intersects = (start, end, windows) => windows.some(w => start < w.end && end > w.start);
const within = (instant, windows) => windows.some(w => instant >= w.start && instant <= w.end);

function contact(place, body, event) {
  if (!event) return null;
  const time = event.time || event;
  const equator = A.Equator(body, time, place, true, true);
  const horizon = A.Horizon(time, place, equator.ra, equator.dec, 'normal');
  return { utc: iso(time), localDate: localDate(time), altitude: round(horizon.altitude), azimuth: round(horizon.azimuth) };
}

function globalSolarEclipses() {
  const rows = [];
  let event = A.SearchGlobalSolarEclipse(new Date('2026-01-01T00:00:00Z'));
  while (event && event.peak.date.getUTCFullYear() <= 2030) {
    const peak = iso(event.peak);
    rows.push({ id: `solar-${localDate(event.peak)}`, date: localDate(event.peak), kind: String(event.kind), peak, cities: {} });
    event = A.NextGlobalSolarEclipse(event.peak);
  }
  return rows;
}

function fillSolarCityRows(rows, city) {
  const place = observer(city);
  let event = A.SearchLocalSolarEclipse(new Date('2026-01-01T00:00:00Z'), place);
  while (event && event.peak.time.date.getUTCFullYear() <= 2030) {
    const globalRow = rows.reduce((nearest, row) => Math.abs(Date.parse(row.peak) - event.peak.time.date.getTime()) < Math.abs(Date.parse(nearest.peak) - event.peak.time.date.getTime()) ? row : nearest, rows[0]);
    if (!globalRow || Math.abs(Date.parse(globalRow.peak) - event.peak.time.date.getTime()) > dayMs) throw new Error(`Local solar event does not match a global event for ${city.id}`);
    const stages = {
      partialBegin: contact(place, A.Body.Sun, event.partial_begin),
      totalBegin: contact(place, A.Body.Sun, event.total_begin),
      maximum: contact(place, A.Body.Sun, event.peak),
      totalEnd: contact(place, A.Body.Sun, event.total_end),
      partialEnd: contact(place, A.Body.Sun, event.partial_end)
    };
    const interval = daylightWindows(A.Body.Sun, place, stages.partialBegin.utc, stages.partialEnd.utc);
    const totalVisible = stages.totalBegin && stages.totalEnd && intersects(stages.totalBegin.utc, stages.totalEnd.utc, interval.windows);
    const visible = interval.windows.length > 0;
    const locallyVisibleKind = totalVisible ? String(event.kind) : visible ? 'Partial' : null;
    for (const stage of Object.values(stages)) if (stage) stage.aboveHorizon = within(stage.utc, interval.windows);
    globalRow.cities[city.id] = {
      visible,
      kind: locallyVisibleKind,
      geometricKind: String(event.kind),
      peakVisible: within(stages.maximum.utc, interval.windows),
      peakObscuration: round(event.obscuration * 100),
      contacts: stages,
      ...interval
    };
    event = A.NextLocalSolarEclipse(event.peak.time, place);
  }
}

function lunarContacts(event) {
  const shift = minutes => event.peak.AddDays(minutes / 1440);
  return {
    penumbralBegin: shift(-event.sd_penum),
    partialBegin: event.sd_partial ? shift(-event.sd_partial) : null,
    totalBegin: event.sd_total ? shift(-event.sd_total) : null,
    maximum: event.peak,
    totalEnd: event.sd_total ? shift(event.sd_total) : null,
    partialEnd: event.sd_partial ? shift(event.sd_partial) : null,
    penumbralEnd: shift(event.sd_penum)
  };
}

function lunarEclipses() {
  const rows = [];
  let event = A.SearchLunarEclipse(new Date('2026-01-01T00:00:00Z'));
  while (event && event.peak.date.getUTCFullYear() <= 2030) {
    const contacts = lunarContacts(event), peak = iso(event.peak);
    const row = { id: `lunar-${localDate(event.peak)}`, date: localDate(event.peak), kind: String(event.kind), peak, contacts: Object.fromEntries(Object.entries(contacts).filter(([, item]) => item).map(([key, item]) => [key, iso(item)])), cities: {} };
    for (const city of cities) {
      const place = observer(city);
      const windows = daylightWindows(A.Body.Moon, place, iso(contacts.penumbralBegin), iso(contacts.penumbralEnd));
      const geometric = {
        penumbralBegin: contact(place, A.Body.Moon, contacts.penumbralBegin),
        partialBegin: contact(place, A.Body.Moon, contacts.partialBegin),
        totalBegin: contact(place, A.Body.Moon, contacts.totalBegin),
        maximum: contact(place, A.Body.Moon, contacts.maximum),
        totalEnd: contact(place, A.Body.Moon, contacts.totalEnd),
        partialEnd: contact(place, A.Body.Moon, contacts.partialEnd),
        penumbralEnd: contact(place, A.Body.Moon, contacts.penumbralEnd)
      };
      let visibleKind = windows.windows.length ? 'Penumbral' : null;
      if (contacts.partialBegin && intersects(iso(contacts.partialBegin), iso(contacts.partialEnd), windows.windows)) visibleKind = 'Partial';
      if (contacts.totalBegin && intersects(iso(contacts.totalBegin), iso(contacts.totalEnd), windows.windows)) visibleKind = 'Total';
      for (const stage of Object.values(geometric)) if (stage) stage.aboveHorizon = within(stage.utc, windows.windows);
      row.cities[city.id] = { visible: Boolean(visibleKind), kind: visibleKind, peakVisible: within(peak, windows.windows), contacts: geometric, ...windows };
    }
    rows.push(row);
    event = A.NextLunarEclipse(event.peak);
  }
  return rows;
}

function darkWindows(place, start, end) {
  const afternoon = new Date(`${start}T12:00:00Z`);
  const dusk = A.SearchAltitude(A.Body.Sun, place, -1, afternoon, 1, -18);
  const dawn = dusk && A.SearchAltitude(A.Body.Sun, place, 1, dusk, 1, -18);
  return dusk && dawn ? { start: iso(dusk), end: iso(dawn) } : null;
}

function perseidPlanningNights() {
  return years.map(year => ({ year, peakPrediction: null, nights: [11, 12, 13].map(day => {
    const date = `${year}-08-${String(day).padStart(2, '0')}`;
    const midnight = new Date(`${year}-08-${String(day + 1).padStart(2, '0')}T00:00:00+03:00`);
    const result = { id: `perseids-${date}`, date, moonIllumination: Math.round(A.Illumination(A.Body.Moon, midnight).phase_fraction * 100), cities: {} };
    for (const city of cities) {
      const place = observer(city), dark = darkWindows(place, date);
      if (!dark) {
        result.cities[city.id] = { dark: false, moonrise: null, moonset: null, moonFree: [] };
        continue;
      }
      const moon = daylightWindows(A.Body.Moon, place, dark.start, dark.end);
      const gaps = [];
      let cursor = dark.start;
      for (const window of moon.windows) {
        if (cursor < window.start) gaps.push({ start: cursor, end: window.start });
        cursor = window.end;
      }
      if (cursor < dark.end) gaps.push({ start: cursor, end: dark.end });
      result.cities[city.id] = { dark: true, darkStart: dark.start, darkEnd: dark.end, moonrise: moon.rise, moonset: moon.set, moonFree: gaps };
    }
    return result;
  }) }));
}

const data = {
  version: 1,
  timezone: zone,
  years,
  engine: 'Astronomy Engine 2.1.19',
  engineLicense: 'MIT',
  engineUrl: 'https://github.com/cosinekitty/astronomy',
  engineSha256: createHash('sha256').update(fs.readFileSync('lib/vendor/astronomy.mjs')).digest('hex'),
  coordinates: 'Pilsētu centra koordinātas no šīs vietnes 82 pilsētu kataloga; 0 m augstums.',
  horizonModel: 'Standarta atmosfēras refrakcija un plakans, neaizsegts horizonts; ēkas, reljefs, augstums un mākoņi nav modelēti.',
  timeModel: 'Aprēķinātās Astronomy Engine laika vērtības pārvērstas uz Europe/Riga. Rezultāts ir ephemerīdu aplēse, nevis novērojuma garantija.',
  solar: globalSolarEclipses(),
  lunar: lunarEclipses(),
  perseids: perseidPlanningNights()
};
for (const city of cities) fillSolarCityRows(data.solar, city);
for (const row of data.solar) for (const city of cities) row.cities[city.id] ||= { visible: false, kind: null, geometricKind: null, peakVisible: false, peakObscuration: null, contacts: {}, windows: [], rise: null, set: null };
if (cities.length !== 82 || !data.solar.length || !data.lunar.length) throw new Error('Latvia astronomy catalog unexpectedly incomplete');
const riga2026 = data.solar.find(row => row.date === '2026-08-12')?.cities?.riga;
if (!riga2026?.visible || !riga2026.contacts.partialBegin || !riga2026.contacts.partialEnd) throw new Error('Expected partial solar eclipse at Riga in 2026; review ephemeris output.');
fs.writeFileSync('assets/latvia-astronomy.json', JSON.stringify(data));
console.log(JSON.stringify({ cities: cities.length, solar: data.solar.length, lunar: data.lunar.length, perseidNights: data.perseids.reduce((n, row) => n + row.nights.length, 0), riga2026: riga2026 }));
