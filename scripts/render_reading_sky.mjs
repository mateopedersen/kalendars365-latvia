// Fixed, dated examples for the reading notes; never presented as live weather.
import fs from 'node:fs';
import {citySky,formatTime} from '../assets/sky-core.mjs';
const cities=JSON.parse(fs.readFileSync(new URL('../_data/cities.json',import.meta.url))).cities;
const output={};
for(const city of cities){
  const sample={};
  for(const date of ['2027-06-21','2027-12-21','2027-01-15']){
    const sky=citySky(date,city);
    sample[date]={sunrise:formatTime(sky.sun.sunrise),sunset:formatTime(sky.sun.sunset),daylightMinutes:sky.daylightMinutes,moonrise:sky.moon.rises.map(v=>formatTime(v)),moonset:sky.moon.sets.map(v=>formatTime(v)),illumination:Math.round(sky.moon.fraction*1000)/10};
  }
  output[city.id]=sample;
}
process.stdout.write(JSON.stringify(output));
