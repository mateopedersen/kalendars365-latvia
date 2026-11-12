import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {zodiacModels} from '../assets/zodiac-models.mjs';
import {sculpture,packedSculpture} from '../scripts/artwork/zodiac-sculptures.mjs';
const registry=JSON.parse(fs.readFileSync('_data/zodiac-models.json')).models;
test('all twelve zodiac signs have distinct original vector sculptures and finite solid meshes',()=>{
 assert.equal(Object.keys(zodiacModels).length,12);const hashes=new Set();
 for(const [slug,m]of Object.entries(zodiacModels)){
  const bytes=fs.readFileSync(`assets/zodiac/models/${slug}.bin`);assert.equal(bytes.length,m.bytes);assert.equal(bytes.length,registry[slug].vertices*36);
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(hash,registry[slug].sha256);assert(hash.startsWith(m.hash));hashes.add(hash);
  const geometry=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);assert.equal(geometry.length%27,0);
  for(let i=0;i<geometry.length;i+=9){assert(geometry.slice(i,i+9).every(Number.isFinite),slug);assert(geometry.slice(i,i+3).every(v=>Math.abs(v)<1.6),slug+' bounds');const n=geometry.slice(i+3,i+6);assert(Math.abs(Math.hypot(...n)-1)<.00001,slug+' unit normal');assert(geometry.slice(i+6,i+9).every(v=>v>=0&&v<=1),slug+' material');}
  const vector=fs.readFileSync(`assets/zodiac/${slug}.svg`,'utf8');assert(!/<image|<script|data:image/.test(vector));assert(vector.includes('skulptūra'));assert(vector.includes('<ellipse'));assert.equal(crypto.createHash('sha256').update(vector).digest('hex').slice(0,16),m.version);
 }
 assert.equal(hashes.size,12);
});
test('the model builder is reproducible and rejects unknown signs',()=>{
 assert.throws(()=>sculpture('unknown'));for(const slug of ['auns','vezis','zivis']){const expected=fs.readFileSync(`assets/zodiac/models/${slug}.bin`),model=packedSculpture(sculpture(slug));assert.equal(Buffer.compare(expected,Buffer.from(model.buffer)),0);}
});
test('wheel has twelve accessible real links and preserves the computed longitude coordinate system',()=>{
 const svg=fs.readFileSync('_includes/ascendant-wheel.svg','utf8');assert.equal((svg.match(/data-zodiac-model=/g)||[]).length,12);assert.equal((svg.match(/data-ascendant-sector=/g)||[]).length,12);assert(svg.includes('data-ascendant-pointer'));assert(svg.includes('data-wheel-rotor'));assert(!/[♈-♓]/.test(svg));
 for(const slug of Object.keys(zodiacModels))assert(svg.includes(`href="/horoskops/${slug}/"`));
 const code=fs.readFileSync('assets/ascendant-ui.mjs','utf8');assert(code.includes('rotate(${value.longitude} 220 220)'));
});
test('3D model renderer is lazy, touch and keyboard operated, and stops while hidden',()=>{
 const ui=fs.readFileSync('assets/zodiac-interactive.mjs','utf8'),viewer=fs.readFileSync('assets/zodiac-viewer.mjs','utf8');
 assert(ui.includes("await import('./zodiac-viewer.mjs'+revision)"));assert(ui.includes('if(token!==revisionId||!dialog.open)return'));assert(ui.includes('request?.abort()'));assert(ui.includes('event.metaKey||event.ctrlKey'));assert(ui.includes("'ArrowLeft','ArrowRight','Home'"));assert(viewer.includes("getContext('webgl'"));assert(viewer.includes("document.hidden"));assert(viewer.includes('pointercancel'));assert(viewer.includes('webglcontextlost'));assert(!/eval\(|new Function|setInterval/.test(viewer+ui));
});
test('rendered horoscope page puts signs first and calculators inside all twelve signs', {skip:!fs.existsSync('_site/horoskops/index.html')},()=>{
 const page=fs.readFileSync('_site/horoskops/index.html','utf8');assert(page.indexOf('data-horoscope-collection')<page.indexOf('data-ascendant-calculator'));assert(!page.includes('data-useful-outline'));assert(page.includes('zodiac-interactive.mjs'));
 const linkCards=[...page.matchAll(/<a class="link-card[^"]*" href="\/horoskops\/([a-z]+)\/">([\s\S]*?)<\/a>/g)];assert.equal(linkCards.length,12);for(const card of linkCards){assert(card[2].includes('/assets/zodiac/'+card[1]+'.svg?v='));assert(!card[2].includes('#i-star'));}
 for(const slug of Object.keys(zodiacModels)){const s=fs.readFileSync(`_site/horoskops/${slug}/index.html`,'utf8');assert(s.includes('horoscope-ascendant-sidebar'));assert(s.includes('ascendant-calculator--compact'));assert(!s.includes('data-useful-outline'));}
});
