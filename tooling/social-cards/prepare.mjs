import {Resvg} from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as Astronomy from '../../assets/vendor/astronomy-engine.mjs';
import {rigaInstant} from '../../assets/sky-core.mjs';
const root=process.cwd(),cache=path.join(root,'tooling/social-cards/cache');fs.mkdirSync(cache,{recursive:true});
const dirs=['assets/category-vector','assets/tools-art','assets/zodiac','assets/astronomy-events','assets/season-scenes','assets/trust'];let count=0;
for(const dir of dirs)for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.svg'))){
 const source=path.join(dir,name),bytes=fs.readFileSync(source),hash=crypto.createHash('sha256').update(bytes).digest('hex'),output=path.join(cache,source.replaceAll('/','__').replace('.svg','.png')),stamp=output+'.sha256';
 if(!fs.existsSync(output)||!fs.existsSync(stamp)||fs.readFileSync(stamp,'utf8')!==hash){const render=new Resvg(bytes,{fitTo:{mode:'width',value:900}});fs.writeFileSync(output,render.render().asPng());fs.writeFileSync(stamp,hash);count++;}
}
const moons={};
for(let y=2027;y<=2031;y++)for(let m=1;m<=12;m++)for(let d=1;d<=new Date(Date.UTC(y,m,0)).getUTCDate();d++){
 const day=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,instant=rigaInstant(day,12),phase=Astronomy.MoonPhase(instant)/360,light=Astronomy.Illumination(Astronomy.Body.Moon,instant).phase_fraction;
 moons[day]={phase,illumination:light};
}
fs.writeFileSync(path.join(cache,'moon-noon.json'),JSON.stringify({instant:'12:00 Europe/Riga',engine:'Astronomy Engine (vendored site implementation)',days:moons}));
console.log(JSON.stringify({vectorsRendered:count,moonDays:Object.keys(moons).length}));
