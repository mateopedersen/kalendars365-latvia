import fs from 'node:fs';

const profiles = JSON.parse(fs.readFileSync('_data/horoscope/profiles.json', 'utf8'));
const themes = JSON.parse(fs.readFileSync('_data/horoscope/themes.json', 'utf8'));
const closings = JSON.parse(fs.readFileSync('_data/horoscope/closings.json', 'utf8'));
const method = JSON.parse(fs.readFileSync('_data/horoscope/method.json', 'utf8'));
if (profiles.profiles?.length !== 12 || themes.themes?.length !== 36 || closings.notes?.length !== 24) throw new Error('Horoskopa satura apjoms nav derīgs.');
const module = [
  '// Generated from _data/horoscope; edit the source bank, then rebuild.',
  `export const profiles = ${JSON.stringify(profiles.profiles)};`,
  `export const themes = ${JSON.stringify(themes.themes)};`,
  `export const closings = ${JSON.stringify(closings.notes)};`,
  `export const method = ${JSON.stringify(method)};`,
].join('\n') + '\n';
fs.writeFileSync('assets/horoscope-data.mjs', module);
console.log(JSON.stringify({ profiles: profiles.profiles.length, themes: themes.themes.length, closings: closings.notes.length }));
