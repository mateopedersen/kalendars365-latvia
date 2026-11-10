import {addDays, dateKey, parseDate, rigaInstant, SunCalc} from '../assets/sky-core.mjs';
import {closings, method, profiles, themes} from '../assets/horoscope-data.mjs';
import {zodiacVersions} from './zodiac-versions.mjs';

const RIGA = {lat:56.9496,lon:24.1052};
const positive = (number, modulo) => ((number % modulo) + modulo) % modulo;
const longDate = new Intl.DateTimeFormat('lv-LV',{timeZone:'Europe/Riga',dateStyle:'full'});

export function checkEditionDate(date, today = dateKey()) {
  parseDate(date);
  if (date > today) throw new RangeError('Nākotnes horoskopa izdevums nav pieejams.');
  if (addDays(date,7) < today) throw new RangeError('Pieejami tikai pēdējo septiņu dienu izdevumi.');
  return date;
}

export function createEdition(date = dateKey()) {
  checkEditionDate(date);
  const localNoon = rigaInstant(date,12);
  const sun = SunCalc.getPosition(localNoon,RIGA.lat,RIGA.lon);
  const moon = SunCalc.getMoonIllumination(localNoon);
  const dateParts = date.split('-').map(Number);
  const yearStart = Date.UTC(dateParts[0],0,1);
  const dayIndex = Math.floor((Date.UTC(dateParts[0],dateParts[1]-1,dateParts[2])-yearStart)/86400000);
  const season = Math.floor((dateParts[1]-1)/3);
  const sunSector = Math.floor(positive(sun.azimuth,360)/10);
  const moonSector = Math.floor(positive(moon.phase+1/16,1)*8);
  const base = positive(dayIndex + sunSector + moonSector*5 + season*7, themes.length);
  const entries = Object.fromEntries(profiles.map((profile,index)=>{
    const theme = themes[positive(base + index*7, themes.length)];
    const closing = closings[positive(dayIndex*3 + index*5 + moonSector*7 + sunSector, closings.length)];
    return [profile.slug,{
      slug:profile.slug,name:profile.name,genitive:profile.genitive,symbol:profile.symbol,
      element:profile.element,modality:profile.modality,profileSummary:profile.summary,
      date,themeId:theme.id,title:theme.title,overview:theme.overview,love:theme.love,
      work:theme.work,wellbeing:theme.wellbeing,thought:theme.thought,closing:closing.text,
    }];
  }));
  return {
    date,timeZone:'Europe/Riga',editionLabel:method.editionLabel,
    context:{place:'Rīga',localNoon:localNoon.toISOString(),sunAltitudeDegrees:Number(sun.altitude.toFixed(3)),sunAzimuthDegrees:Number(sun.azimuth.toFixed(3)),moonPhase:moon.phase,moonIllumination:moon.fraction,moonName:moonName(moon.phase)},
    entries,method:{shortDisclosure:method.shortDisclosure,editorialDisclosure:method.editorialDisclosure,profileNotice:method.profileNotice,selectionExplanation:method.selectionExplanation,astronomyNotice:method.astronomyNotice,entertainmentNotice:method.entertainmentNotice,wellbeingNotice:method.wellbeingNotice,profileLabel:method.profileLabel,sectionLabels:method.sectionLabels,profileSectionLabels:method.profileSectionLabels,collectionSeo:method.collectionSeo},
  };
}

function moonName(phase) {
  const names=['Jaunmēness','Augošs sirpis','Pirmais ceturksnis','Augošs Mēness','Pilnmēness','Dilstošs Mēness','Pēdējais ceturksnis','Dilstošs sirpis'];
  return names[Math.floor(positive(phase+1/16,1)*8)];
}

export function escapeHtml(value) {
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export function renderSignOrb(entry, variant = 'daily') {
  const slug = profiles.some(profile => profile.slug === entry.slug) ? entry.slug : 'auns';
  const variantClass = ['daily','card','profile'].includes(variant) ? ` sign-orb--${variant}` : '';
  const loading = variant === 'card' ? 'lazy' : 'eager';
  return `<img class="sign-orb sign-orb--${escapeHtml(entry.element?.key)}${variantClass}" src="/assets/zodiac/${escapeHtml(slug)}.svg?v=${zodiacVersions[slug]}" alt="" aria-hidden="true" width="128" height="128" decoding="async" loading="${loading}">`;
}

function dateLabel(date) { return escapeHtml(longDate.format(rigaInstant(date,12))); }
export function renderDailyMarkup(entry, editionMethod) {
  const labels=editionMethod.sectionLabels;
  return `<article class="horoscope-issue" data-issue-date="${escapeHtml(entry.date)}"><div class="horoscope-issue-top"><div><span class="eyebrow">${escapeHtml(editionMethod.editionLabel||'Dienas izdevums')}</span><time datetime="${escapeHtml(entry.date)}">${dateLabel(entry.date)}</time></div><div class="horoscope-day-controls" role="group" aria-label="Horoskopa dienas izvēle"><button type="button" data-horoscope-step="-1" aria-label="Iepriekšējais izdevums"><svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button><button type="button" data-horoscope-step="1" aria-label="Nākamais izdevums"${entry.date>=dateKey()?' disabled':''}><svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button></div></div><div class="horoscope-issue-title">${renderSignOrb(entry)}<div><h2>${escapeHtml(entry.name)} · ${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.profileSummary)}</p></div></div><div class="horoscope-day-sections"><section><h3>${escapeHtml(labels.overview)}</h3><p>${escapeHtml(entry.overview)}</p></section><section><h3>${escapeHtml(labels.love)}</h3><p>${escapeHtml(entry.love)}</p></section><section><h3>${escapeHtml(labels.work)}</h3><p>${escapeHtml(entry.work)}</p></section><section><h3>${escapeHtml(labels.wellbeing)}</h3><p>${escapeHtml(entry.wellbeing)}</p></section></div><aside class="horoscope-thought"><span>${escapeHtml(labels.thought)}</span><p>${escapeHtml(entry.thought)}</p></aside><p class="horoscope-closing">${escapeHtml(entry.closing)}</p></article>`;
}

export function renderCollectionMarkup(edition) {
  const method=edition.method;
  const cards=profiles.map(profile=>{
    const entry=edition.entries[profile.slug];
    return `<article class="horoscope-sign-card" data-sign="${escapeHtml(profile.slug)}"><div class="horoscope-sign-card-head">${renderSignOrb(entry,'card')}<div><span>${escapeHtml(profile.element.label)} · ${escapeHtml(profile.modality.label)}</span><h2>${escapeHtml(profile.name)}</h2></div></div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.overview)}</p><a href="/horoskops/${escapeHtml(profile.slug)}/">Atvērt ${escapeHtml(profile.genitive.toLocaleLowerCase('lv-LV'))} horoskopu <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></article>`;
  }).join('');
  return `<section class="horoscope-collection-grid">${cards}</section><p class="horoscope-collection-disclosure">${escapeHtml(method.shortDisclosure)}</p>`;
}
