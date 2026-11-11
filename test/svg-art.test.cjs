const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const dirs=['assets/category-art','assets/zodiac','assets/garden'];let count=0,total=0;
for(const dir of dirs)for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))){const p=path.join(dir,file),s=fs.readFileSync(p,'utf8'),bytes=Buffer.byteLength(s);assert(bytes<2*1024*1024,p+' must remain below 2 MB');assert(!/\b(?:NaN|Infinity|undefined)\b/.test(s.replace(/data:image\/[^"]+/g,'')),p+' invalid numeric or missing data');assert(s.includes('viewBox='),p+' viewBox');total+=bytes;count++;
 if(dir.endsWith('category-art')&&s.includes('trīsdimensiju modelis'))for(const points of s.matchAll(/<polygon points="([^"]+)"/g))for(const pair of points[1].split(' ')){const [x,y]=pair.split(',').map(Number);assert(x>=0&&x<=320&&y>=0&&y<=260,p+' clipped projected geometry');}
}
assert(total<14*1024*1024,'SVG category library size budget');
for(const id of ['moon','phases','astronomy'])assert(!fs.readFileSync(`assets/category-art/${id}.svg`,'utf8').includes('<image'),id+' original vector illustration');
console.log(`${count} category, zodiac and garden SVG files: size, finite geometry, frame bounds and portable photos passed.`);

for(const [url,model] of Object.entries({'svetku-dienas':'holiday','atceres-dienas':'memorial','astronomiskais-kalendars':'astronomy','meness-lekts-un-riets':'moon','meness-fazes':'phases','gadalaiki':'seasons','stundu-saraksts':'timetable','mainu-grafiks':'shift','atvalinajuma-planotajs':'vacation','visi-riki':'alltools','nedelas-kalendars':'week'})){const html=fs.readFileSync('_site/'+url+'/index.html','utf8');assert(html.includes('page-heading--'+model)||html.includes('category-hero--'+model)||html.includes('v2-hero--'+({astronomy:'cosmos',vacation:'escape',alltools:'directory'}[model]||model)),url+' topic-specific hero');}
console.log('Eleven main category pages use their own subject-specific artwork.');
