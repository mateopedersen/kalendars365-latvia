import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as core from '../assets/sky-core.mjs';
import {cityCardReading} from '../assets/city-photo-cards.mjs';
import {daylightGeometry,daylightSummary} from '../assets/sun-year-chart.mjs';
import {panoramaView,projectPanorama} from '../assets/solar-panorama-core.mjs';

const cities=JSON.parse(fs.readFileSync('_data/cities.json')).cities;
test('82 individual thumbnail sources retain their reviewed photo and license provenance',()=>{
  const photos=JSON.parse(fs.readFileSync('_data/city-thumbnails.json')).photos;
  assert.equal(photos.length,82);
  assert.equal(new Set(photos.map(p=>p.sourceSha256)).size,82);
  for(const photo of photos){
    const original=cities.find(c=>c.id===photo.id).photo;
    assert.equal(photo.sourceSha256,original.reviewedDerivativeSha256);
    assert.equal(photo.alt,original.alt);assert.equal(photo.sourceUrl,original.sourceUrl);assert.equal(photo.licenseUrl,original.licenseUrl);
    assert.deepEqual(photo.files.map(f=>f.width),[96,192]);
    for(const f of photo.files){
      const bytes=fs.readFileSync('.'+f.src);
      assert.equal(bytes.length,f.bytes);assert.equal(bytes.toString('ascii',8,12),'WEBP');
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);
    }
  }
});
test('city cards preserve the selected date and use city-specific rise/set calculations',()=>{
  for(const date of ['2027-06-21','2027-12-21'])for(const city of cities){
    const reading=cityCardReading(date,city,'sun',core),sky=core.citySky(date,city);
    assert.equal(reading.rise,core.formatTime(sky.sun.sunrise));assert.equal(reading.set,core.formatTime(sky.sun.sunset));
    assert.equal(reading.href,'/saullekts-saulriets/'+city.id+'/?date='+date);
    const moon=cityCardReading(date,city,'moon',core);assert(moon.href.startsWith('/meness-lekts-un-riets/'+city.id+'/'));
    assert.notEqual(reading.rise,'—');assert.notEqual(reading.set,'—');
  }
  assert.notEqual(cityCardReading('2027-12-21',cities[0],'sun',core).rise,cityCardReading('2027-06-21',cities[0],'sun',core).rise);
});
test('dimensional chart fronts retain the exact linear 0–24 h values for every city and year',()=>{
  for(const city of cities)for(const year of [2027,2028,2029,2030]){
    const rows=Array.from({length:12},(_,m)=>core.citySky(year+'-'+String(m+1).padStart(2,'0')+'-21',city));
    const geometry=daylightGeometry(rows),summary=daylightSummary(rows);
    assert.equal(geometry.length,12);
    assert.equal(summary.longest,5);assert.equal(summary.shortest,11);
    geometry.forEach((p,i)=>{assert(p.y>=52&&p.y<=268);assert(Math.abs(p.height/216*1440-rows[i].daylightMinutes)<1e-8);assert(Math.abs(p.y+p.height-268)<1e-8);});
  }
});
test('the following panorama camera keeps the midday Sun visible in all Latvian cities',()=>{
  for(const city of cities)for(const date of ['2027-03-28','2027-06-21','2027-10-31','2027-12-21']){
    const instant=core.citySky(date,city).sun.solarNoon,position=core.sunPosition(instant,city);
    const view=panoramaView({instant,position,city});
    assert(projectPanorama(view.altitude,position.azimuth,view,900,520).visible,city.id+' '+date);
    assert(Math.abs(Math.hypot(...view.sun)-1)<1e-10);
  }
});
