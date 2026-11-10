import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {lunarPrintDay} from '../scripts/lunar_print_data.mjs';
import * as A from '../lib/vendor/astronomy.mjs';
import {rigaInstant} from '../assets/sky-core.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const manifest=read('downloads/meness/manifest.json');
const slugs=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
assert(manifest.complete);assert.equal(manifest.items.length,260);
assert.equal(new Set(manifest.items.map(i=>i.fingerprint)).size,1,'every print uses the same reviewed renderer');
const allHashes=new Set();
let files=0;
assert(!fs.existsSync('_site/meness-kalendars/2026/index.html'));
for(let year=2027;year<=2030;year++)for(const month of [null,...Array.from({length:12},(_,i)=>i+1)]){
  const items=manifest.items.filter(i=>i.year===year&&i.month===month);
  assert.equal(items.length,4,`${year}/${month}: four designs`);
  assert.equal(new Set(items.map(i=>i.design)).size,4);
  const html=fs.readFileSync(`_site/meness-kalendars/${year}/${month?slugs[month-1]+'/':''}index.html`,'utf8');
  const gallery=html.split('id="meness-drukai"')[1].split('</section>')[0];
  assert.equal((gallery.match(/class="moon-print-card"/g)||[]).length,4);
  assert.equal((gallery.match(/<span>Attēls<\/span>/g)||[]).length,4);
  assert(!gallery.includes('WebP'));assert(!gallery.includes('data-print-design'));
  for(const i of items){
    assert.equal(i.dpi,600);assert.equal(i.pageCount,1);
    assert.equal(i.dates,month?new Date(Date.UTC(year,month,0)).getUTCDate():new Date(Date.UTC(year,1,29)).getUTCMonth()===1?366:365);
    for(const [kind,size,sha] of [['pdf','pdfBytes','pdfSha256'],['image','imageBytes','imageSha256']]){
      const bytes=fs.readFileSync('.'+i[kind]);assert.equal(bytes.length,i[size]);assert(bytes.length<25*1024*1024);
      const hash=createHash('sha256').update(bytes).digest('hex');assert.equal(hash,i[sha]);assert(!allHashes.has(hash));allHashes.add(hash);files++;
      assert(html.includes(`href="${i[kind]}"`));
      assert(kind==='pdf'?bytes.subarray(0,5).toString()==='%PDF-':bytes.subarray(0,4).toString()==='RIFF');
    }
    assert(fs.statSync('.'+i.preview).size>1000);
  }
}
let dates=0,maxFraction=0,maxLibration=0;
for(let year=2026;year<=2030;year++)for(let month=1;month<=12;month++)for(let day=1;day<=new Date(Date.UTC(year,month,0)).getUTCDate();day++){
 const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,instant=rigaInstant(date,12),d=lunarPrintDay(date),reference=A.Illumination(A.Body.Moon,instant).phase_fraction,lib=A.Libration(instant);
 const fractionError=Math.abs(d.fraction-reference);maxFraction=Math.max(maxFraction,fractionError);assert(fractionError<.0001);
 const librationError=Math.max(Math.abs(d.subEarthLon-lib.elon),Math.abs(d.subEarthLat-lib.elat));maxLibration=Math.max(maxLibration,librationError);assert(librationError<.04);
 for(const row of d.basis)assert(Math.abs(Math.hypot(...row)-1)<1e-10);
 assert(Math.abs(Math.hypot(...d.light)-1)<1e-10);dates++;
}
assert.equal(lunarPrintDay('2028-02-29').utc,'2028-02-29T10:00:00.000Z');
assert.equal(lunarPrintDay('2027-03-28').utc,'2027-03-28T09:00:00.000Z');
assert.equal(lunarPrintDay('2027-10-31').utc,'2027-10-31T10:00:00.000Z');
// Independent, archived USNO source values (rounded to 1 percentage point).
let maxUsno=0;
for(const s of read('_data/reference/astronomy/manifest.json')){
 const official=read(s.file).properties.data;
 const error=Math.abs(lunarPrintDay(s.date).fraction-parseFloat(official.fracillum)/100);
 assert(error<.01,`${s.date}: USNO illumination error ${error}`);maxUsno=Math.max(maxUsno,error);
}
console.log(JSON.stringify({files,dates,monthlyPages:48,annualPages:4,designsPerPage:4,maxFractionDifference:maxFraction,maxLibrationDifferenceDegrees:maxLibration,maxUsnoDifferencePercentagePoints:maxUsno*100}));
