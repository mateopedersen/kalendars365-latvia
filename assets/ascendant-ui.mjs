const roots = document.querySelectorAll('[data-ascendant-calculator]');
let calculation;
const calculationRevision = new URL(import.meta.url).search;
const loadCore = () => calculation ||= import(`./ascendant-core.mjs${calculationRevision}`);
const norm = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('lv').trim();
const placeCache = new Map();
const errors = {
  input: 'Ievadi derīgu dzimšanas datumu no 1900. līdz 2100. gadam un precīzu pulksteņa laiku.',
  coordinates: 'Pārbaudi koordinātas: platums ir starp −89,999° un 89,999°, garums no −180° līdz 180°.',
  zone: 'Izvēlies derīgu IANA laika joslu, piemēram, Europe/Riga.',
  singular: 'Šajā brīdī ekliptika gandrīz sakrīt ar horizontu. Droši noteikt ascendentu nevar; pārbaudi laiku un koordinātas.',
  uncertainty: 'Izvēlies vienu no piedāvātajiem laika precizitātes variantiem.'
};

function show(node, visible = true) { node.hidden = !visible; }
function setText(node, value) { node.textContent = value; }
const utcText = utc => new Date(utc).toISOString().replace('T', ' ').replace('.000Z', ' UTC');

for (const root of roots) {
  const $ = selector => root.querySelector(selector);
  const form = $('form'), field = name => form.elements.namedItem(name);
  const catalog = JSON.parse($('[data-ascendant-places]').textContent);
  const cityInput = field('city'), countries = field('country');
  const list = $('.ascendant-city-options'), placeStatus = $('[id=ascendant-place-status]');
  const result = $('[data-ascendant-result]'), feedback = $('[data-ascendant-feedback]');
  const errorNode = $('[data-ascendant-error]'), fold = $('[data-ascendant-fold]');
  const submit = $('.ascendant-submit'), submitText = submit.querySelector('span');
  let places = catalog.latvia, countryCode = 'LV', selectedPlace = null;
  let matches = [], active = -1, cityLoad = 0, generation = 0, foldKey = '', busy = false;
  placeCache.set('LV', catalog.latvia);

  function closeList() { show(list, false); cityInput.setAttribute('aria-expanded', 'false'); cityInput.removeAttribute('aria-activedescendant'); active = -1; }
  function invalidate({clearFold = true} = {}) {
    generation++;
    show(errorNode, false);
    const hadResult = !result.hidden;
    delete root.dataset.hasResult;
    show(result, false); show($('[data-ascendant-intro]'));
    $('[data-ascendant-wheel]').querySelector('[data-ascendant-pointer]').setAttribute('visibility', 'hidden');
    root.querySelectorAll('[data-ascendant-sector]').forEach(node => node.setAttribute('fill', 'transparent'));
    if (clearFold) { show(fold, false); foldKey = ''; $('[data-ascendant-fold-options]').replaceChildren(); }
    if (hadResult) setText(feedback, 'Dati mainīti. Aprēķini ascendentu vēlreiz.');
    root.querySelectorAll('[aria-invalid=true]').forEach(node => node.removeAttribute('aria-invalid'));
  }
  function fail(message, control) {
    setText(errorNode, message); show(errorNode);
    if (control) { control.setAttribute('aria-invalid', 'true'); control.focus(); }
    setText(feedback, '');
  }
  function selectPlace(place) {
    invalidate(); selectedPlace = place; cityInput.value = place.name;
    setText(placeStatus, `${place.name}${place.region ? ', ' + place.region : ''} · ${place.zone} · ${place.lat.toFixed(4)}°, ${place.lon.toFixed(4)}°`);
    closeList();
    field('latitude').value = String(place.lat).replace('.', ',');
    field('longitude').value = String(place.lon).replace('.', ',');
    field('timeZone').value = place.zone;
  }
  function paintMatches() {
    const query = norm(cityInput.value);
    const found = places.filter(place => !query || norm(place.name).includes(query) || place.aliases.some(name => name.includes(query)));
    found.sort((a, b) => Number(norm(b.name) === query) - Number(norm(a.name) === query) || Number(norm(b.name).startsWith(query)) - Number(norm(a.name).startsWith(query)));
    matches = found.slice(0, 12); active = -1; list.replaceChildren();
    for (const [index, place] of matches.entries()) {
      const option = document.createElement('li');
      option.id = `ascendant-city-option-${index}`; option.setAttribute('role', 'option'); option.setAttribute('aria-selected', 'false');
      const title = document.createElement('span'), note = document.createElement('small');
      title.textContent = place.name; note.textContent = [place.region, place.zone].filter(Boolean).join(' · ');
      option.append(title, note);
      option.addEventListener('pointerdown', event => event.preventDefault());
      option.addEventListener('click', () => { selectPlace(place); cityInput.focus(); });
      list.append(option);
    }
    show(list, matches.length > 0); cityInput.setAttribute('aria-expanded', String(matches.length > 0));
    cityInput.removeAttribute('aria-activedescendant');
    if (!matches.length && query) setText(placeStatus, 'Pilsēta nav atrasta. Mēģini tās vietējo nosaukumu vai ievadi koordinātas un laika joslu pats.');
    else if (!selectedPlace) setText(placeStatus, query ? `Atrasti ${found.length} varianti. Izvēlies pilsētu sarakstā.` : 'Sāc rakstīt dzimšanas pilsētas nosaukumu.');
  }
  async function loadCountry(code) {
    const request = ++cityLoad;
    countries.setAttribute('aria-busy', 'true'); cityInput.disabled = true;
    places = []; selectedPlace = null; closeList(); show($('[data-ascendant-retry]'), false);
    setText(placeStatus, 'Ielādējam pilsētas…');
    try {
      let data = placeCache.get(code);
      if (!data) {
        const response = await fetch(`/assets/ascendant-places/${encodeURIComponent(code)}.json?v=${encodeURIComponent(catalog.version)}`, {credentials: 'omit', referrerPolicy: 'no-referrer'});
        if (!response.ok) throw new Error('places');
        data = await response.json();
        if (!Array.isArray(data)) throw new Error('places');
        placeCache.set(code, data);
      }
      if (request !== cityLoad) return;
      places = data; countryCode = code;
      setText(placeStatus, code === 'LV' ? 'Izvēlies dzimšanas pilsētu. Latvijā pieejamas visas 82 pilsētas.' : 'Izvēlies pilsētu. Ja tās nav sarakstā, vari ievadīt koordinātas pats.');
      if (document.activeElement === cityInput) paintMatches();
    } catch {
      if (request !== cityLoad) return;
      setText(placeStatus, 'Pilsētu katalogu neizdevās ielādēt. Mēģini vēlreiz vai ievadi koordinātas pats.'); show($('[data-ascendant-retry]'));
    } finally {
      if (request === cityLoad) { cityInput.disabled = field('manual').checked; countries.removeAttribute('aria-busy'); }
    }
  }
  countries.addEventListener('change', () => { invalidate(); cityInput.value = ''; loadCountry(countries.value); });
  $('[data-ascendant-retry]').addEventListener('click', () => loadCountry(countries.value));
  cityInput.addEventListener('input', () => { selectedPlace = null; invalidate(); paintMatches(); });
  cityInput.addEventListener('focus', paintMatches);
  cityInput.addEventListener('blur', closeList);
  cityInput.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeList(); event.preventDefault(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); if (list.hidden) paintMatches(); if (!matches.length) return;
      active = active < 0 ? (event.key === 'ArrowDown' ? 0 : matches.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      [...list.children].forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
      cityInput.setAttribute('aria-activedescendant', list.children[active].id);
      list.children[active].scrollIntoView({block: 'nearest'});
    } else if (event.key === 'Enter' && !list.hidden) {
      event.preventDefault(); if (active >= 0) selectPlace(matches[active]);
      else if (matches.length === 1 || (matches[0] && norm(matches[0].name) === norm(cityInput.value))) selectPlace(matches[0]);
    }
  });
  field('manual').addEventListener('change', async () => {
    const manual = field('manual').checked; invalidate(); closeList();
    show($('[data-ascendant-manual]'), manual); cityInput.disabled = manual; countries.disabled = manual;
    if (manual) {
      try { const {timeZoneNames} = await import('./vendor/ascendant-timezones.mjs');
        const datalist = $('#ascendant-zones');
        if (!datalist.children.length) datalist.replaceChildren(...timeZoneNames().map(name => { const option = document.createElement('option'); option.value = name; return option; }));
      } catch { /* Calculation reports a retryable load failure; manual fields remain usable. */ }
    }
  });
  form.addEventListener('input', event => {
    if (event.target === cityInput || event.target.name === 'fold') return;
    invalidate();
  });
  form.addEventListener('change', event => {
    if (event.target.name === 'fold') invalidate({clearFold: false});
  });
  form.addEventListener('reset', () => {
    invalidate(); selectedPlace = null; places = catalog.latvia; countryCode = 'LV'; cityLoad++;
    cityInput.disabled = false; countries.disabled = false; countries.removeAttribute('aria-busy'); closeList();
    show($('[data-ascendant-manual]'), false); show($('[data-ascendant-retry]'), false);
    setText(feedback, 'Dzimšanas dati notīrīti.');
    setText(placeStatus, 'Izvēlies dzimšanas pilsētu. Latvijā pieejamas visas 82 pilsētas.');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    closeList(); show(errorNode, false);
    if (!field('birthDate').value || !field('birthDate').validity.valid) return fail(errors.input, field('birthDate'));
    if (!field('birthTime').value || !field('birthTime').validity.valid) return fail('Ievadi dzimšanas pulksteņa laiku. Ja tas nav zināms, drošu rezultātu iegūt nevar.', field('birthTime'));
    let place;
    if (field('manual').checked) {
      const latitude = field('latitude').value.trim().replace(',', '.'), longitude = field('longitude').value.trim().replace(',', '.');
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(latitude)) return fail(errors.coordinates, field('latitude'));
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(longitude)) return fail(errors.coordinates, field('longitude'));
      place = {name: 'Ievadītās koordinātas', lat: Number(latitude), lon: Number(longitude), zone: field('timeZone').value.trim()};
    } else {
      if (!selectedPlace) {
        const exact = places.filter(item => norm(item.name) === norm(cityInput.value));
        if (exact.length === 1 && countryCode === countries.value) selectPlace(exact[0]);
      }
      if (!selectedPlace || countryCode !== countries.value) return fail('Izvēlies dzimšanas pilsētu no saraksta vai ievadi tās koordinātas pats.', cityInput);
      place = selectedPlace;
    }
    const date = field('birthDate').value, time = field('birthTime').value, uncertainty = Number(field('uncertainty').value);
    const token = generation;
    busy = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
    setText(submitText, 'Aprēķinām…'); setText(feedback, 'Pārbaudām vietējo laiku un aprēķinām austrumu horizontu…');
    try {
      const core = await loadCore();
      if (token !== generation) return;
      core.validateCoordinates(place.lat, place.lon);
      const candidates = core.resolveCivil(date, time, place.zone);
      if (!candidates.length) return fail('Šis vietējais laiks šajā vietā nepastāvēja pulksteņa vai laika joslas maiņas dēļ. Pārbaudi dzimšanas ierakstu un izvēlies derīgu laiku.', field('birthTime'));
      const key = `${date}|${time}|${place.zone}`;
      if (candidates.length > 1 && foldKey !== key) {
        foldKey = key; const options = $('[data-ascendant-fold-options]'); options.replaceChildren();
        candidates.forEach((candidate, index) => {
          const label = document.createElement('label'), radio = document.createElement('input'), text = document.createElement('span');
          radio.type = 'radio'; radio.name = 'fold'; radio.value = String(candidate.utc);
          text.textContent = `${index === 0 ? 'Agrākais' : 'Vēlākais'} brīdis · ${core.formatOffset(candidate.offsetSeconds)} · ${utcText(candidate.utc)}`;
          label.append(radio, text); options.append(label);
        }); show(fold);
      }
      let candidate = candidates[0];
      if (candidates.length > 1) {
        const chosen = form.querySelector('input[name=fold]:checked');
        candidate = candidates.find(item => chosen && String(item.utc) === chosen.value);
        if (!candidate) { setText(feedback, 'Laiks atkārtojas. Izvēlies vienu no abiem brīžiem un aprēķini vēlreiz.'); fold.querySelector('input').focus(); return; }
      } else { show(fold, false); foldKey = ''; $('[data-ascendant-fold-options]').replaceChildren(); }
      const analysis = core.assessUncertainty(candidate.utc, place.lat, place.lon, uncertainty);
      if (token !== generation) return;
      const value = analysis.center;
      setText($('[data-ascendant-sign]'), value.sign.name);
      setText($('[data-ascendant-degree]'), `${value.degrees}° ${String(value.minutes).padStart(2, '0')}′ · ${value.sign.element}`);
      const image = $('[data-ascendant-sign-image]'); image.src = `/assets/zodiac/${value.sign.slug}.svg${calculationRevision}`; show(image);
      const stability = $('[data-ascendant-stability]');
      let note = `Aprēķins ievadītajam dzimšanas brīdim. Ekliptiskais garums ${value.longitude.toLocaleString('lv-LV', {minimumFractionDigits: 2, maximumFractionDigits: 2})}°.`;
      const closeToCusp = value.cuspDistance < 1 / 60;
      if (uncertainty) note = analysis.signs.length === 1 ? `± ${uncertainty} minūšu intervālā zīme nemainās: ${value.sign.name}.` : `± ${uncertainty} minūšu intervālā iespējamas zīmes: ${analysis.signs.map(sign => sign.name).join(', ')}. Precizē dzimšanas laiku.`;
      if (closeToCusp) note += ' Ascendents atrodas mazāk nekā vienas loka minūtes attālumā no zīmes robežas. Zīmi nevar uzskatīt par droši noteiktu.';
      if (analysis.sensitive) note += ' Šajā vietā un laikā rezultāts ir īpaši jutīgs pret laika izmaiņām.';
      stability.textContent = note; stability.dataset.caution = String(closeToCusp || analysis.signs.length > 1 || analysis.sensitive);
      const facts = $('[data-ascendant-facts]'); facts.replaceChildren();
      const wall = core.parseCivil(date, time).wall;
      const localDate = new Intl.DateTimeFormat('lv-LV', {dateStyle: 'long', timeZone: 'UTC'}).format(new Date(wall));
      const placeName = field('manual').checked ? place.name : [place.name, place.region, countries.selectedOptions[0].textContent].filter(Boolean).join(', ');
      const pairs = [['Dzimšanas vieta', placeName], ['Vietējais datums', localDate], ['Vietējais laiks', time],
        ['Laika josla', `${place.zone} · ${core.formatOffset(candidate.offsetSeconds)}`], ['UTC brīdis', utcText(candidate.utc).replace(' UTC', '')],
        ['Koordinātas', `${place.lat.toLocaleString('lv-LV', {maximumFractionDigits: 4})}°, ${place.lon.toLocaleString('lv-LV', {maximumFractionDigits: 4})}°`]];
      for (const [label, text] of pairs) { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = text; facts.append(dt, dd); }
      $('[data-ascendant-sign-link]').href = `/horoskops/${value.sign.slug}/`;
      const pointer = $('[data-ascendant-pointer]'); pointer.setAttribute('transform', `rotate(${value.longitude} 220 220)`); pointer.setAttribute('visibility', 'visible');
      root.querySelectorAll('[data-ascendant-sector]').forEach(node => node.setAttribute('fill', Number(node.dataset.ascendantSector) === value.signIndex ? '#b8657f' : 'transparent'));
      setText($('[data-ascendant-tz-version]'), core.timeZoneVersion);
      root.dataset.hasResult = 'true';
      show($('[data-ascendant-intro]'), false); show(result);
      setText(feedback, `Ascendents: ${value.sign.name}, ${value.degrees} grādi un ${value.minutes} loka minūtes.${analysis.signs.length > 1 ? ' Laika kļūdas intervālā zīme var mainīties.' : ''}`);
      result.focus({preventScroll: true});
      if (matchMedia('(max-width:680px)').matches) result.scrollIntoView({block: 'center', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth'});
    } catch (error) {
      if (token !== generation) return;
      if (!error.code) calculation = undefined;
      fail(errors[error.code] || 'Aprēķina moduli neizdevās ielādēt. Pārbaudi savienojumu un pārlādē lapu.', error.code === 'zone' ? field('timeZone') : undefined);
    } finally {
      busy = false; submit.disabled = false; form.removeAttribute('aria-busy'); setText(submitText, 'Aprēķināt ascendentu');
      if (token !== generation) setText(feedback, 'Dati mainīti. Aprēķini ascendentu vēlreiz.');
    }
  });
}
