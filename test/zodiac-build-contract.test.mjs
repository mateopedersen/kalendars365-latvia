import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyZodiacArtifacts} from '../scripts/verify_zodiac_art.mjs';
const catalog=()=>JSON.parse(fs.readFileSync('_data/zodiac-models.json','utf8'));
test('publication validates accepted artwork instead of redrawing it on a different architecture',()=>{
 assert.deepEqual(verifyZodiacArtifacts(),{sculptures:12,sources:3,artifacts:28,policy:'verified-prebuilt-artwork'});
 const generator=fs.readFileSync('scripts/generate.rb','utf8');assert(generator.includes("'scripts/verify_zodiac_art.mjs'"));assert(!generator.includes("'scripts/build_zodiac_art.mjs'"));
});
test('stale geometry source, replaced artwork and omitted output evidence block publication',()=>{
 const stale=catalog();stale.sources['scripts/artwork/zodiac-sculptures.mjs']='0'.repeat(64);assert.throws(()=>verifyZodiacArtifacts(process.cwd(),stale),/sources changed/);
 const replaced=catalog();replaced.artifacts['assets/zodiac/atlas.svg']='0'.repeat(64);assert.throws(()=>verifyZodiacArtifacts(process.cwd(),replaced),/artifacts changed/);
 const missing=catalog();delete missing.artifacts['assets/zodiac/models/auns.bin'];assert.throws(()=>verifyZodiacArtifacts(process.cwd(),missing),/artifacts changed/);
});
