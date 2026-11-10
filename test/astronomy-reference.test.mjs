import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {citySky,rigaInstant} from '../assets/sky-core.mjs';
import * as A from '../lib/vendor/astronomy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const cities=read('_data/cities.json').cities,manifest=read('_data/reference/astronomy/manifest.json');
let checks=0,maxSun=0,maxMoon=0,maxFraction=0,maxPhase=0;
const samples=[];
for(const sample of manifest){
 const raw=fs.readFileSync(sample.file);assert.equal(createHash('sha256').update(raw).digest('hex'),sample.sha256);checks++;
 const d=JSON.parse(raw).properties.data,city=cities.find(c=>c.id===sample.city),sky=citySky(sample.date,city),errors={};
 for(const [key,events,actual,tolerance] of [['sunrise',d.sundata,[sky.sun.sunrise],120],['sunset',d.sundata,[sky.sun.sunset],120],['moonrise',d.moondata,sky.moon.rises,600],['moonset',d.moondata,sky.moon.sets,600]]){
  const event=events.find(e=>e.phen===(key.endsWith('rise')?'Rise':'Set'));if(!event)continue;
  const [h,m]=event.time.split(':').map(Number),expected=rigaInstant(sample.date,h,m),error=Math.min(...actual.map(e=>Math.abs(e-expected)/1000));
  assert(error<=tolerance,`${sample.city} ${sample.date} ${key}: ${error.toFixed(1)}s > ${tolerance}s`);checks++;errors[key]=Math.round(error*10)/10;
  if(key.startsWith('sun'))maxSun=Math.max(maxSun,error);else maxMoon=Math.max(maxMoon,error);
 }
 const fractionError=Math.abs(sky.moon.fraction-parseFloat(d.fracillum)/100);assert(fractionError<=.025,`${sample.city} ${sample.date} illuminated fraction: ${fractionError}`);checks++;maxFraction=Math.max(maxFraction,fractionError);samples.push({...sample,errors,illuminationError:Math.round(fractionError*10000)/100});
}
const angle={'New Moon':0,'First Quarter':90,'Full Moon':180,'Last Quarter':270};
for(const year of [2027,2028,2029,2030])for(const p of read(`_data/usno-${year}.json`).phasedata){
 const stamp=new Date(`${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}T${p.time}:00Z`),actual=A.SearchMoonPhase(angle[p.phase],new Date(+stamp-86400000),2),error=Math.abs(actual.date-stamp)/1000;
 assert(error<120,`${year} ${p.phase} phase error ${error}s`);checks++;maxPhase=Math.max(maxPhase,error);
}
const report={checkedAt:'2026-11-10',checks,usnoCityDateSamples:manifest.length,phaseEvents:198,maxSunErrorSeconds:Math.round(maxSun),maxMoonErrorSeconds:Math.round(maxMoon),maxIlluminationErrorPercentagePoints:Math.round(maxFraction*10000)/100,maxPhaseErrorSeconds:Math.round(maxPhase),samples,scope:'External primary-source numerical comparison; not an independent astronomer certification.'};
fs.writeFileSync('docs/ASTRONOMY_REFERENCE_RESULTS.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,samples:undefined}));
