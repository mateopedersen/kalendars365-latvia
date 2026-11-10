import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const photos=JSON.parse(fs.readFileSync('_data/astronomy-photos.json')).photos;
const hashes=new Set();
for(const p of photos){const file=fs.readFileSync('.'+p.src);assert.equal(createHash('sha256').update(file).digest('hex'),p.sha256);assert(p.source.startsWith('https://')&&new URL(p.source).hostname.endsWith('nasa.gov'));assert(p.rightsUrl.includes('nasa-brand-center'));assert(p.alt.length>25);hashes.add(p.sha256);}
assert.equal(hashes.size,6);
const covers=[];
for(let year=2026;year<=2030;year++){const html=fs.readFileSync(`_site/meness-kalendars/${year}/index.html`,'utf8');const cover=html.match(/class="lunar-year-hero" data-cover="([^"]+)"/);assert(cover,`${year} photo cover`);covers.push(cover[1]);assert(!html.includes('class="lunar-year-hero"><img src="/assets/moon-lro-mosaic.jpg"'));}
assert.equal(new Set(covers).size,5);
for(const id of ['moon','phases','astronomy']){const svg=fs.readFileSync(`assets/category-art/${id}.svg`,'utf8');assert(svg.includes('data:image/webp;base64,'));assert(svg.includes('NASA Apollo 17'));}
console.log('Celestial media: six traced NASA photos, five unique year covers and three photo-based SVGs verified.');
