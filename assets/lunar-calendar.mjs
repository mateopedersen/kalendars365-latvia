import { citySky, phaseName, rigaInstant, formatTime, formatEventTimes } from './sky-core.mjs';
import * as Astronomy from './vendor/astronomy-engine.mjs';

const root = document.querySelector('[data-lunar-calendar]');
if (root) {
  const year = Number(root.dataset.lunarYear);
  const month = Number(root.dataset.lunarMonth);
  const source = new Image();
  source.decoding = 'async';
  source.src = root.dataset.lunarSource;
  const exactNode = root.querySelector('[data-lunar-exact-phases]');
  const exactPhases = exactNode ? JSON.parse(exactNode.textContent).sort((a, b) => Date.parse(a.utc) - Date.parse(b.utc)) : [];
  const citySelect = root.querySelector('[data-lunar-city]');
  const allCities = Array.isArray(window.K365Cities) ? window.K365Cities : [];
  const monthNames = ['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
  const monthNumber = String(month).padStart(2, '0');
  const dateLabel = new Intl.DateTimeFormat('lv-LV', { timeZone: 'Europe/Riga', day: 'numeric', month: 'long', year: 'numeric' });
  const number = new Intl.NumberFormat('lv-LV', { maximumFractionDigits: 1 });
  const phaseCache = new Map();
  const query = new URLSearchParams(location.search);
  const queryDate = query.get('date');
  const queryCity = query.get('city');
  const queryDay = queryDate && Number(queryDate.slice(-2));
  const validQueryDate = queryDate && new RegExp('^' + year + '-' + monthNumber + '-\\d{2}$').test(queryDate)
    && Number.isInteger(queryDay) && queryDay >= 1 && queryDay <= new Date(Date.UTC(year, month, 0)).getUTCDate();
  let selected = validQueryDate ? queryDate : year + '-' + monthNumber + '-01';
  let city = allCities.find(item => item.id === queryCity) || allCities.find(item => item.id === citySelect?.value) || allCities.find(item => item.id === 'riga');
  if (citySelect && city) citySelect.value = city.id;

  function updateNavigationCities() {
    if (!city?.id) return;
    root.querySelectorAll('.lunar-month-nav a').forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('city', city.id);
      link.href = url;
    });
  }

  function smoothstep(a, b, value) {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function dateFor(value) { return new Date(value + 'T10:00:00Z'); }
  function displayDate(value) { return dateLabel.format(dateFor(value)); }

  function positionAngle(from, to) {
    const deltaRa = (to.ra - from.ra) * Math.PI / 12;
    const fromDec = from.dec * Math.PI / 180;
    const toDec = to.dec * Math.PI / 180;
    const east = Math.sin(deltaRa) * Math.cos(toDec);
    const north = Math.cos(fromDec) * Math.sin(toDec) - Math.sin(fromDec) * Math.cos(toDec) * Math.cos(deltaRa);
    return Math.atan2(east, north);
  }

  function phaseStats(value, place = city) {
    const placeKey = place ? `${place.id || ''}|${place.lat}|${place.lon}` : 'riga-default';
    const cacheKey = value + '|' + placeKey;
    if (phaseCache.has(cacheKey)) return phaseCache.get(cacheKey);
    const instant = rigaInstant(value, 12);
    const observer = new Astronomy.Observer(place?.lat ?? 56.9475, place?.lon ?? 24.106944, place?.elevation ?? 0);
    const moon = Astronomy.Equator(Astronomy.Body.Moon, instant, observer, true, true);
    const sun = Astronomy.Equator(Astronomy.Body.Sun, instant, observer, true, true);
    const toVector = body => {
      const ra = body.ra * Math.PI / 12, dec = body.dec * Math.PI / 180, radius = body.dist;
      return [radius * Math.cos(dec) * Math.cos(ra), radius * Math.cos(dec) * Math.sin(ra), radius * Math.sin(dec)];
    };
    const moonVector = toVector(moon), sunVector = toVector(sun);
    const moonToObserver = moonVector.map(value => -value);
    const moonToSun = sunVector.map((value, index) => value - moonVector[index]);
    const dot = moonToObserver.reduce((sum, value, index) => sum + value * moonToSun[index], 0);
    const norm = vector => Math.hypot(...vector);
    const phaseAngle = Math.acos(Math.max(-1, Math.min(1, dot / (norm(moonToObserver) * norm(moonToSun)))));
    const phase = Astronomy.MoonPhase(instant) / 360;
    const lightPositionAngle = positionAngle(moon, sun);
    const northPoleJ2000 = Astronomy.RotationAxis(Astronomy.Body.Moon, instant).north;
    const northPoleOfDate = Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(instant), northPoleJ2000);
    const lunarNorth = Astronomy.EquatorFromVector(northPoleOfDate);
    const stats = {
      phase: Math.max(0, Math.min(.999999, phase)),
      fraction: (1 + Math.cos(phaseAngle)) / 2,
      sunX: -Math.sin(lightPositionAngle) * Math.sin(phaseAngle),
      sunY: -Math.cos(lightPositionAngle) * Math.sin(phaseAngle),
      sunZ: Math.cos(phaseAngle),
      northAngle: -positionAngle(moon, lunarNorth)
    };
    phaseCache.set(cacheKey, stats);
    return stats;
  }

  function paintMoon(canvas, value, stats = phaseStats(value)) {
    if (!canvas || !source.complete || !source.naturalWidth) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width, height = canvas.height;
    const cx = width / 2, cy = height / 2, radius = Math.min(width, height) * .478;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(stats.northAngle); ctx.drawImage(source, -width / 2, -height / 2, width, height);
    ctx.restore();
    const pixels = ctx.getImageData(0, 0, width, height), rgba = pixels.data;
    for (let y = 0; y < height; y++) {
      const ny = (y + .5 - cy) / radius;
      for (let x = 0; x < width; x++) {
        const nx = (x + .5 - cx) / radius, squared = nx * nx + ny * ny, offset = (y * width + x) * 4;
        if (squared > 1) { rgba[offset + 3] = 0; continue; }
        const nz = Math.sqrt(1 - squared);
        const dot = nx * stats.sunX + ny * stats.sunY + nz * stats.sunZ;
        const lit = smoothstep(-.018, .032, dot);
        const light = .085 + .915 * lit * (.47 + .53 * nz);
        rgba[offset] = Math.min(255, rgba[offset] * light * 1.015);
        rgba[offset + 1] = Math.min(255, rgba[offset + 1] * light);
        rgba[offset + 2] = Math.min(255, rgba[offset + 2] * light * .975);
      }
    }
    ctx.putImageData(pixels, 0, 0); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, radius - .4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,247,227,.38)'; ctx.lineWidth = Math.max(1, width / 260); ctx.stroke();
  }

  function updateCells() {
    root.querySelectorAll('[data-moon-canvas]').forEach(canvas => {
      const value = canvas.dataset.moonDate;
      const data = phaseStats(value);
      const percent = number.format(data.fraction * 100) + '%';
      const button = canvas.closest('[data-lunar-day]');
      const percentNode = button && button.querySelector('[data-lunar-percent]');
      if (percentNode) percentNode.textContent = percent;
      if (button) {
        const label = phaseName(data.phase);
        button.setAttribute('aria-label', [...button.querySelectorAll('.lunar-day-number,.lunar-day-percent,.lunar-phase-mark,.lunar-holiday-mark')].map(node => node.textContent.trim()).join(' ') + '. ' + displayDate(value) + ' · ' + label);
        button.dataset.phase = String(data.phase);
      }
      paintMoon(canvas, value, data);
    });
  }

  function nextExactPhase(value) {
    const instant = rigaInstant(value, 12).getTime();
    const next = exactPhases.find(item => Date.parse(item.utc) >= instant);
    if (!next) return 'Šajā avota izlaidumā nav nākamā fāzes brīža';
    return next.phase + ' · ' + displayDate(next.date) + ' · ' + next.time + ' (' + (city?.name || 'Rīga') + ' · Europe/Riga)';
  }

  function updateDetail(value, changeUrl) {
    const data = phaseStats(value);
    const label = phaseName(data.phase);
    const percent = number.format(data.fraction * 100) + '%';
    const selectedButton = root.querySelector('[data-lunar-day="' + value + '"]');
    root.querySelectorAll('[data-lunar-day]').forEach(button => {
      const isSelected = button === selectedButton;
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('is-selected', isSelected);
    });
    const dateNode = root.querySelector('[data-lunar-date-label]');
    const phaseNode = root.querySelector('[data-lunar-phase-label]');
    const percentNode = root.querySelector('[data-lunar-illumination]');
    const descriptionNode = root.querySelector('[data-lunar-description]');
    const localLabel = root.querySelector('[data-lunar-local-label]');
    const moonCanvas = root.querySelector('[data-lunar-large-moon]');
    if (dateNode) dateNode.textContent = displayDate(value);
    if (phaseNode) phaseNode.textContent = label;
    if (percentNode) percentNode.textContent = percent;
    if (localLabel) localLabel.textContent = 'Plkst. 12.00 · ' + (city?.locative || city?.name || 'Rīga');
    if (descriptionNode) descriptionNode.textContent = displayDate(value) + ' plkst. 12.00 ' + (city?.locative || city?.name || 'Rīgā') + '. Fāze: ' + label + '. Apgaismotā daļa: ' + percent + '.';
    if (moonCanvas) {
      moonCanvas.setAttribute('aria-label', 'Mēness virsmas fotomozaīka ar ' + label.toLocaleLowerCase('lv-LV') + ' fāzes apgaismojumu, ' + displayDate(value) + ', ' + percent + ' apgaismots');
      paintMoon(moonCanvas, value);
    }
    const exact = root.querySelector('[data-lunar-next-phase]');
    if (exact) exact.textContent = nextExactPhase(value);
    if (city) {
      try {
        const observer = new Astronomy.Observer(city.lat, city.lon, city.elevation ?? 0);
        const start = rigaInstant(value, 0);
        const nextDate = new Date(value + 'T00:00:00Z');
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        const end = rigaInstant(nextDate.toISOString().slice(0, 10), 0);
        const searchDays = (end.getTime() - start.getTime()) / 86400000;
        const riseEvent = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, start, searchDays);
        const setEvent = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, start, searchDays);
        const inLocalDay = event => event && event.date.getTime() < end.getTime();
        const rise = root.querySelector('[data-lunar-rise]');
        const set = root.querySelector('[data-lunar-set]');
        if (rise) rise.textContent = inLocalDay(riseEvent) ? formatTime(riseEvent.date) : 'Šajā datumā neuzlec';
        if (set) set.textContent = inLocalDay(setEvent) ? formatTime(setEvent.date) : 'Šajā datumā nenoriet';
      } catch {
        try {
          const sky = citySky(value, city);
          const rise = root.querySelector('[data-lunar-rise]');
          const set = root.querySelector('[data-lunar-set]');
          if (rise) rise.textContent = sky.moon.rises.length ? formatEventTimes(sky.moon.rises, ' · ') : 'Šajā datumā neuzlec';
          if (set) set.textContent = sky.moon.sets.length ? formatEventTimes(sky.moon.sets, ' · ') : 'Šajā datumā nenoriet';
        } catch {
          const rise = root.querySelector('[data-lunar-rise]');
          const set = root.querySelector('[data-lunar-set]');
          if (rise) rise.textContent = 'Aprēķins nav pieejams';
          if (set) set.textContent = 'Aprēķins nav pieejams';
        }
      }
    }
    if (changeUrl) {
      const url = new URL(location.href);
      url.searchParams.set('date', value);
      if (city?.id) url.searchParams.set('city', city.id);
      history.replaceState(null, '', url);
    }
  }

  function openDay(value) {
    const parsed = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(parsed.getTime())) return;
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month) {
      const cityQuery = city?.id ? '&city=' + encodeURIComponent(city.id) : '';
      location.assign('/meness-kalendars/' + parsed.getUTCFullYear() + '/' + monthNames[parsed.getUTCMonth()] + '/?date=' + encodeURIComponent(value) + cityQuery);
      return;
    }
    selected = value;
    updateDetail(value, true);
  }

  let initialRender;
  function onReady() {
    if (!initialRender) initialRender = source.decode().catch(() => {}).then(() => {
      updateCells();
      updateDetail(selected, false);
    });
    return initialRender;
  }

  root.addEventListener('click', event => {
    const dayButton = event.target.closest('[data-lunar-day]');
    if (dayButton) openDay(dayButton.dataset.lunarDay);
    if (event.target.closest('[data-lunar-print]')) onReady().then(() => window.print());
  });
  root.addEventListener('keydown', event => {
    const button = event.target.closest('[data-lunar-day]');
    if (!button) return;
    const amount = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!amount) return;
    event.preventDefault();
    const next = new Date(button.dataset.lunarDay + 'T12:00:00Z');
    next.setUTCDate(next.getUTCDate() + amount);
    const key = next.toISOString().slice(0, 10);
    if (next.getUTCMonth() + 1 === month && next.getUTCFullYear() === year) root.querySelector('[data-lunar-day="' + key + '"]')?.focus();
    openDay(key);
  });
  citySelect?.addEventListener('change', () => {
    city = allCities.find(item => item.id === citySelect.value) || city;
    updateCells();
    updateDetail(selected, true);
    updateNavigationCities();
  });
  updateNavigationCities();
  source.addEventListener('error', () => {
    root.querySelectorAll('[data-moon-canvas]').forEach(canvas => canvas.setAttribute('aria-label', 'Mēness attēlu nevarēja ielādēt'));
  }, { once: true });
  // Enhance the offscreen calendar as it approaches the reader; print still prepares every cell.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); onReady(); }
    }, { rootMargin: '200px 0px' });
    observer.observe(root);
  } else onReady();
  window.addEventListener('beforeprint', () => {
    if (source.complete && source.naturalWidth) { updateCells(); updateDetail(selected, false); }
  });
}
