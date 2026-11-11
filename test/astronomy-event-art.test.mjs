import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {astronomyEventArt} from '../assets/astronomy-event-art.mjs';
import {astronomyArtCatalog} from '../assets/astronomy-art-catalog.mjs';
const data=JSON.parse(fs.readFileSync('assets/category-data.json')),astro=JSON.parse(fs.readFileSync('assets/latvia-astronomy.json'));
test('USNO phases resolve to four different correctly illuminated Moon illustrations',()=>{
 const expected={'New Moon':'moon-new','First Quarter':'moon-first','Full Moon':'moon-full','Last Quarter':'moon-last'};
 for(const p of data.moon){const art=astronomyEventArt({...p,kind:'phase'});assert.equal(art.key,expected[p.phaseKey],p.utc);}
 assert.equal(new Set(data.moon.map(p=>astronomyEventArt({...p,kind:'phase'}).src)).size,4);
 for(const [key,side] of [['new','none'],['first','right'],['full','both'],['last','left']])assert(fs.readFileSync('assets/astronomy-events/moon-'+key+'.svg','utf8').includes('data-lit-side="'+side+'"'));
});
test('seasonal boundaries, perihelion and aphelion retain six different meanings every year',()=>{
 for(const year of [2027,2028,2029,2030]){const rows=data.seasons.filter(r=>r.date.startsWith(String(year)));assert.equal(rows.length,6);const expected=['perihelion','season-spring','season-summer','aphelion','season-autumn','season-winter'];assert.deepEqual(rows.map(r=>astronomyEventArt({...r,kind:'season'}).key),expected);}
});
test('eclipse artwork follows the actual local visible kind before the global eclipse kind',()=>{
 const solar=astro.solar.find(r=>r.date==='2027-08-02');assert.equal(solar.kind,'total');assert.equal(astronomyEventArt({kind:'solar',eclipseKind:solar.kind,visible:solar.cities.riga.visible,localKind:solar.cities.riga.kind}).key,'solar-partial');
 const lunar=astro.lunar.find(r=>r.date==='2029-06-26');assert.equal(lunar.kind,'total');assert.equal(astronomyEventArt({kind:'lunar',eclipseKind:lunar.kind,visible:lunar.cities.riga.visible,localKind:lunar.cities.riga.kind}).key,'lunar-partial');
 for(const kind of ['solar','lunar'])for(const event of astro[kind])for(const local of Object.values(event.cities)){const art=astronomyEventArt({kind,eclipseKind:event.kind,visible:local.visible,localKind:local.kind});assert(art.key.startsWith(kind+'-'),event.id);const expected=String(local.visible&&local.kind?local.kind:event.kind).toLowerCase();assert.equal(art.key,kind+'-'+expected);}
});
test('20 self-contained vector assets have distinct identities and verified bytes',()=>{
 const {artworks}=JSON.parse(fs.readFileSync('_data/astronomy-event-art.json'));assert.equal(artworks.length,20);assert.equal(new Set(artworks.map(a=>a.sha256)).size,20);
 for(const a of artworks){const bytes=fs.readFileSync('.'+a.file),svg=bytes.toString();assert.equal(bytes.length,a.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);assert(!/<image\b|<script\b|<foreignObject\b|data:image|NaN|Infinity/.test(svg),a.key);assert(astronomyArtCatalog[a.key]);assert(svg.includes('viewBox="0 0 320 320"'));}
 assert.equal(astronomyEventArt({kind:'meteor'}).key,'perseids');assert.equal(astronomyEventArt({kind:'unknown'}).key,'observatory');assert.equal(astronomyEventArt({kind:'phase',phaseKey:'unknown'}).key,'observatory');
});
