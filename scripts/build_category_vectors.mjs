import fs from 'node:fs';
import crypto from 'node:crypto';
import {planningArt} from './vector-planning.mjs';
import {lifeArt,monthArt} from './vector-life.mjs';
import {natureArt,moonDisc} from './vector-nature.mjs';
const names={calendar:'Mēneša kalendārs',week:'Nedēļas kalendārs',planner:'Personīgais plānotājs',family:'Ģimenes kalendārs',vacation:'Atvaļinājuma plānotājs',shift:'Maiņu grafiks',holiday:'Svētki',school:'Skola un mācības',timetable:'Stundu saraksts',alltools:'Visi rīki',calculator:'Datumu kalkulators',names:'Vārda dienas',culture:'Latvijas gadskārtas','latvia-days':'Latvijas dienas',memorial:'Atceres diena',privacy:'Privātums',about:'Par projektu',city:'Atrašanās vieta',moon:'Mēness kalendārs',phases:'Mēness fāzes',earth:'Zeme',astronomy:'Astronomiskais kalendārs',sun:'Saule',sunrise:'Saullēkts un saulriets',seasons:'Gadalaiki',garden:'Sējas un stādīšanas kalendārs',work:'Darba dienas',clock:'Laiks',pdf:'PDF lejupielāde',webp:'Attēla lejupielāde',print:'Kalendāru druka',zodiac:'Zodiaka zīmes'};
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function defs(id,ice=false){const colors=ice?['#fbfeff','#c4dce5','#7fa4b6']:['#fffaf0','#eee5d4','#b7ae9c'];return `<defs>
<linearGradient id="${id}-paper" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${colors[0]}"/><stop offset=".57" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient>
<linearGradient id="${id}-wine" x1="0" y1="0" x2=".95" y2="1"><stop stop-color="${ice?'#fbfdff':'#bf6a83'}"/><stop offset=".4" stop-color="${ice?'#dbeaf0':'#973f5a'}"/><stop offset="1" stop-color="${ice?'#87afc0':'#5d2036'}"/></linearGradient>
<linearGradient id="${id}-teal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8ec5b8"/><stop offset=".48" stop-color="#488c80"/><stop offset="1" stop-color="#24574f"/></linearGradient>
<linearGradient id="${id}-gold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff2b7"/><stop offset=".22" stop-color="#d1aa5b"/><stop offset=".4" stop-color="#f1d68b"/><stop offset=".67" stop-color="#ad8439"/><stop offset="1" stop-color="#7b5b2c"/></linearGradient>
<linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2=".9"><stop stop-color="#fafdfb"/><stop offset=".2" stop-color="#c6d0d0"/><stop offset=".43" stop-color="#fbfcf3"/><stop offset=".6" stop-color="#9cabae"/><stop offset="1" stop-color="#4c636d"/></linearGradient>
<linearGradient id="${id}-ink" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#66747d"/><stop offset=".45" stop-color="#35424f"/><stop offset="1" stop-color="#17242f"/></linearGradient>
<radialGradient id="${id}-glass" cx="30%" cy="20%" r="85%"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="#eaf5ed" stop-opacity=".3"/><stop offset="1" stop-color="#86a3ae" stop-opacity=".55"/></radialGradient>
<filter id="${id}-shadow" x="-35%" y="-35%" width="180%" height="190%"><feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#35262d" flood-opacity=".17"/></filter>
<filter id="${id}-soft" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="3.5"/></filter>
</defs>`;}
function body(name,id){return planningArt(name,id)||lifeArt(name,id)||natureArt(name,id);}
function wrap(name,content,id,ice=false){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" role="img" aria-labelledby="${id}-title ${id}-description"><title id="${id}-title">${E(names[name]||name)}</title><desc id="${id}-description">Kalendāram365 radīta oriģināla vektoru ilustrācija ar apjoma, gaismas un materiālu zīmējumu. Fotogrāfijas un pikseļu attēli nav izmantoti.</desc>${defs(id,ice)}${content}</svg>\n`;}
const dir='assets/category-vector';fs.mkdirSync(dir,{recursive:true});const manifest=[];
for(const [name,label] of Object.entries(names)){
 const id='kv-'+name,content=body(name,id);if(!content){if(['clock','pdf','webp','print'].includes(name))continue;throw Error('Missing vector subject '+name);}
 const svg=wrap(name,content,id);if(/<(?:image|foreignObject)\b|data:image|\b(?:NaN|Infinity|undefined)\b/.test(svg))throw Error('Invalid or raster artwork '+name);
 fs.writeFileSync(`${dir}/${name}.svg`,svg);fs.writeFileSync(`assets/category-art/${name}.svg`,svg);
 manifest.push({id:name,label,file:`/${dir}/${name}.svg`,kind:'original-vector',sha256:crypto.createHash('sha256').update(svg).digest('hex'),bytes:Buffer.byteLength(svg)});
}
// Four illustrative phase variants use the same drawn surface, not a photograph.
for(const phase of ['new','first','full','last']){const id='kv-phase-'+phase;fs.writeFileSync(`${dir}/phase-${phase}.svg`,wrap('phases',moonDisc(id+'-disc',160,121,103,phase),id));}
// Compatibility aliases all resolve to true, topic-specific vector art.
for(const [alias,name] of Object.entries({tools:'alltools',gift:'holiday',location:'city'})){const id='kv-'+alias;const svg=wrap(name,body(name,id),id);fs.writeFileSync(`${dir}/${alias}.svg`,svg);fs.writeFileSync(`assets/category-art/${alias}.svg`,svg);}
// Twelve independently drawn seasonal subjects, not repeated calendar badges.
for(let month=1;month<=12;month++){
 names['month-'+month]=['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'][month-1];
 const id='kv-month-'+month,content=monthArt(month,id);
 const svg=wrap('month-'+month,content,id);
 if(!content||/<(?:image|foreignObject)\b|data:image|\b(?:NaN|Infinity|undefined)\b/.test(svg))throw Error('Invalid month vector '+month);
 fs.writeFileSync(`${dir}/month-${month}.svg`,svg);fs.writeFileSync(`assets/category-art/month-${month}.svg`,svg);
 manifest.push({id:'month-'+month,label:['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'][month-1],file:`/${dir}/month-${month}.svg`,kind:'original-vector',sha256:crypto.createHash('sha256').update(svg).digest('hex'),bytes:Buffer.byteLength(svg)});
}
for(const name of ['calendar','holiday','school']){const id='kv-nav-'+name;let content=body(name,id);content=content.replace(/#[0-9a-fA-F]{6}/g,color=>{const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);if(r>g*1.22&&r>b*.88){const l=(r+g+b)/3/255;const vals=[196+Math.round(l*50),220+Math.round(l*30),230+Math.round(l*23)].map(n=>Math.min(255,n).toString(16).padStart(2,'0'));return '#'+vals.join('');}return color;});fs.writeFileSync(`assets/nav-ice/${name}.svg`,wrap(name,content,id,true));}
for(const [name,target] of [['pdf','file-pdf.svg'],['webp','file-image.svg']]){const id='kv-download-'+name,content=body(name,id);if(content)fs.writeFileSync('assets/'+target,wrap(name,content,id));}
fs.writeFileSync('_data/category-vectors.json',JSON.stringify({version:2,design:'Original illustrated vectors; no embedded pixels',artworks:manifest},null,2)+'\n');
console.log(JSON.stringify({vectors:manifest.length,allPureSVG:true}));
