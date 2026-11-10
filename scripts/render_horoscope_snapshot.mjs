import {createEdition} from '../lib/horoscope-edition.mjs';
import {dateKey} from '../assets/sky-core.mjs';
import {profiles} from '../assets/horoscope-data.mjs';
import {renderCollectionMarkup,renderDailyMarkup,renderSignOrb,escapeHtml} from '../lib/horoscope-edition.mjs';

const today=dateKey();
const edition=createEdition(today);
const profileMarkup=Object.fromEntries(profiles.map(profile=>{
  const labels=edition.method.profileSectionLabels;
  const sections=[
    ['profile',profile.profile],['strengths',profile.strengths],['balance',profile.balance],
    ['dating',profile.dating],['love',profile.love],['work',profile.work],['everydayRhythm',profile.everydayRhythm],
  ].map(([key,text])=>`<section><h2>${escapeHtml(labels[key])}</h2><p>${escapeHtml(text)}</p></section>`).join('');
  const sample=edition.entries[profile.slug];
  return [profile.slug,`<section class="sign-profile-lead">${renderSignOrb(sample,'profile')}<div><span class="eyebrow">${escapeHtml(profile.element.label)} · ${escapeHtml(profile.modality.label)}</span><p>${escapeHtml(profile.summary)}</p></div></section><div class="sign-profile-grid">${sections}</div><aside class="horoscope-disclosure"><h2>${escapeHtml(edition.method.profileLabel)}</h2><p>${escapeHtml(edition.method.profileNotice)}</p><p>${escapeHtml(edition.method.entertainmentNotice)}</p></aside>`];
}));
const dailyMarkup=Object.fromEntries(Object.entries(edition.entries).map(([slug,entry])=>[slug,renderDailyMarkup(entry,edition.method)]));
process.stdout.write(JSON.stringify({edition,dailyMarkup,collectionMarkup:renderCollectionMarkup(edition),profileMarkup}));
