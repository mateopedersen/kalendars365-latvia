const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, '_data/cities.json')));
assert.equal(catalog.count, 82);
assert.equal(catalog.cities.length, 82);
assert.equal(new Set(catalog.cities.map(c => c.id)).size, 82);
assert(catalog.cities.some(c => c.id === 'carnikava'));
const routes = JSON.parse(fs.readFileSync(path.join(root, '_data/routes.json')));
let images = 0;
for (const city of catalog.cities) {
  assert.equal(city.timeZone, 'Europe/Riga');
  assert(city.lat > 55 && city.lat < 59 && city.lon > 20 && city.lon < 29, city.id);
  assert(city.name && city.photo.alt && city.photo.author && city.photo.license);
  assert(/^https:\/\//.test(city.photo.sourceUrl));
  assert(/^https:\/\//.test(city.photo.licenseUrl));
  assert(routes.some(r => r['URL path'] === `/saullekts-saulriets/${city.id}/`));
  for (const [size, info] of Object.entries(city.photo.files)) {
    const bytes = fs.readFileSync(path.join(root, `assets/cities/${city.id}-${size}.webp`));
    assert.equal(bytes.toString('ascii',0,4), 'RIFF');
    assert.equal(bytes.toString('ascii',8,12), 'WEBP');
    assert.equal(bytes.length, info.bytes);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), info.sha256);
    assert(city.photo.srcset.includes(`${info.width}w`));
    images++;
  }
}
const context = vm.createContext({window: {}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/cities.js'),'utf8'), context);
assert.equal(context.window.K365Cities.length, 82);
assert.equal(context.window.K365Cities.find(c=>c.id==='riga').photo.src, '/assets/cities/riga-960.webp');
if (fs.existsSync(path.join(root, '_site'))) {
  for (const name of ['cities.js','app.js','city-card.js']) new vm.Script(fs.readFileSync(path.join(root,'_site/assets',name),'utf8'));
  for (const city of catalog.cities) assert(fs.existsSync(path.join(root,'_site/saullekts-saulriets',city.id,'index.html')));
}
console.log(`City catalog passed: 82 cities, ${images} checksum-verified photos, 82 solar routes, compiled JavaScript.`);
