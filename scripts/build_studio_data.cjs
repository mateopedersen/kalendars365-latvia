const fs=require('node:fs'),C=require('../assets/calendar-core.js');
const holidays=Object.fromEntries([2027,2028,2029,2030].map(year=>[year,C.holidays(year).filter(h=>h.dayOff).map(h=>({date:h.date,title:h.title,holiday:true,source:h.source}))]));
const cities=JSON.parse(fs.readFileSync('_data/cities.json')),occasions=JSON.parse(fs.readFileSync('_data/occasions.json'));
const photoFor=src=>occasions.map(e=>e.photo).find(p=>p?.src===src);
const riga=cities.cities.find(c=>c.id==='riga').photo;
const samples=[{...riga,anchor:'riga'},...['summer','winter'].map(id=>({...photoFor('/assets/occasions/'+id+'-960.webp'),anchor:'occasion-photo-'+id}))];
const samplePhotos=Object.fromEntries(samples.map(p=>[p.src,{author:p.author,license:p.license,licenseUrl:p.licenseUrl,sourceUrl:p.sourceUrl,credit:'Foto: '+p.author+' · '+p.license+' ('+p.licenseUrl.replace('https://','')+') · Kadrēts · kalendars365.lv/pilsetas-un-fotografijas/#'+p.anchor}]));
samplePhotos['/assets/astronomy/earth-apollo17.webp']={author:'NASA · Apollo 17',credit:'Foto: NASA · Apollo 17 · 1972 · Kadrēts · Avots: images.nasa.gov/details/as17-148-22727',sourceUrl:'https://images.nasa.gov/details/as17-148-22727'};
fs.mkdirSync('assets/studio',{recursive:true});
fs.writeFileSync('assets/studio/latvia-data.mjs','// Generated from the shared Latvia calendar core.\nexport const LATVIA_HOLIDAYS='+JSON.stringify(holidays)+';\nexport const STUDIO_PHOTOS='+JSON.stringify(samplePhotos)+';\n');
console.log('Studio holidays: 2027–2030');
const crypto=require('node:crypto'),digest=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,12);
const dataPath='assets/studio/latvia-data.mjs',enginePath='assets/studio/engine.mjs',uiPath='assets/studio/studio.mjs';
let engine=fs.readFileSync(enginePath,'utf8').replace(/from '\.\/latvia-data\.mjs(?:\?v=[^']*)?'/,"from './latvia-data.mjs?v="+digest(fs.readFileSync(dataPath))+"'");
fs.writeFileSync(enginePath,engine);
// Fingerprint the lazy export graph in dependency order, keeping cached versions coherent.
for(const name of ['office-exports.mjs','export-pipeline.mjs']){
 const path='assets/studio/'+name;
 if(!fs.existsSync(path))continue;
 const source=fs.readFileSync(path,'utf8').replace(/from '\.\/(engine|binary-exports|office-exports)\.mjs(?:\?v=[^']*)?'/g,(_,dependency)=>"from './"+dependency+".mjs?v="+digest(fs.readFileSync('assets/studio/'+dependency+'.mjs'))+"'");
 fs.writeFileSync(path,source);
}
fs.writeFileSync(uiPath,fs.readFileSync(uiPath,'utf8').replace(/from '\.\/engine\.mjs(?:\?v=[^']*)?'/,"from './engine.mjs?v="+digest(engine)+"'"));
