import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {observatoryIllustration} from './artwork/observatory.mjs';
const out=path.resolve('assets/astronomy-events');fs.mkdirSync(out,{recursive:true});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const p=(d,fill='none',stroke='none',width=1,extra='')=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const c=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const l=(x,y,a,b,stroke,width=1,extra='')=>`<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const ellipse=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
let id='';const url=n=>`url(#${id}-${n})`;
const definitions=()=>`<defs>
<radialGradient id="${id}-moon" cx=".34" cy=".26" r=".83"><stop stop-color="#f9fbef"/><stop offset=".46" stop-color="#c4cdd0"/><stop offset=".8" stop-color="#87969e"/><stop offset="1" stop-color="#425464"/></radialGradient>
<radialGradient id="${id}-crater" cx=".62" cy=".7"><stop stop-color="#a6b3b9" stop-opacity=".1"/><stop offset=".72" stop-color="#687c8a" stop-opacity=".2"/><stop offset="1" stop-color="#263b4e" stop-opacity=".7"/></radialGradient>
<radialGradient id="${id}-night" cx=".38" cy=".35"><stop stop-color="#283a4c"/><stop offset=".7" stop-color="#142334"/><stop offset="1" stop-color="#08111f"/></radialGradient>
<radialGradient id="${id}-earth" cx=".3" cy=".25" r=".85"><stop stop-color="#b0f0e5"/><stop offset=".35" stop-color="#5aadc2"/><stop offset=".7" stop-color="#266580"/><stop offset="1" stop-color="#122c49"/></radialGradient>
<radialGradient id="${id}-sun" cx=".35" cy=".28" r=".75"><stop stop-color="#fffbd1"/><stop offset=".48" stop-color="#ffcd6a"/><stop offset=".85" stop-color="#e98f32"/><stop offset="1" stop-color="#ba4c21"/></radialGradient>
<radialGradient id="${id}-halo"><stop stop-color="#f6ddba" stop-opacity=".65"/><stop offset=".65" stop-color="#f6ddba" stop-opacity=".2"/><stop offset="1" stop-color="#f6ddba" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-blood" cx=".3" cy=".35"><stop stop-color="#ffd49e"/><stop offset=".4" stop-color="#d88055"/><stop offset=".7" stop-color="#8d3c38"/><stop offset="1" stop-color="#291f2c"/></radialGradient>
<radialGradient id="${id}-corona"><stop offset=".37" stop-color="#fff8dd" stop-opacity="0"/><stop offset=".48" stop-color="#fffbef" stop-opacity=".9"/><stop offset=".59" stop-color="#e1e9eb" stop-opacity=".27"/><stop offset="1" stop-color="#d4e6e8" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}-metal" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#e8eff0"/><stop offset=".35" stop-color="#99aeb6"/><stop offset=".5" stop-color="#f7f3df"/><stop offset="1" stop-color="#324f63"/></linearGradient>
<linearGradient id="${id}-tail"><stop stop-color="#fff8d4" stop-opacity="0"/><stop offset=".6" stop-color="#7bd1df" stop-opacity=".35"/><stop offset="1" stop-color="#fff6ce"/></linearGradient>
<linearGradient id="${id}-penumbra" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3b2948" stop-opacity=".73"/><stop offset=".65" stop-color="#273345" stop-opacity=".16"/><stop offset="1" stop-color="#293b50" stop-opacity="0"/></linearGradient>
<clipPath id="${id}-disc">${c(160,152,108,'#fff')}</clipPath><clipPath id="${id}-earth-clip">${c(160,158,68,'#fff')}</clipPath>
<filter id="${id}-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#243245" flood-opacity=".2"/></filter>
</defs>`;
function moonSurface(){let s=c(160,152,108,url('moon'));s+=p('M114 75C133 70 154 76 157 89C159 103 145 103 150 120C154 137 177 141 166 156C153 171 129 153 116 161C100 173 82 164 87 143C91 129 76 119 84 103C89 91 109 95 114 75Z','#536c7e','none',1,'opacity=".25"')+p('M172 90C199 65 226 93 222 109C218 125 192 119 194 137C194 155 173 145 171 131C165 115 158 103 172 90Z','#647b88','none',1,'opacity=".25"')+p('M151 178C168 161 195 169 198 189C209 209 182 230 160 215C153 207 133 196 151 178Z','#536879','none',1,'opacity=".2"');
 for(let i=0;i<54;i++){const angle=i*2.39996,r=18+Math.sqrt((i+.5)/54)*84,x=160+Math.cos(angle)*r,y=152+Math.sin(angle)*r,size=2.2+(i*17%9)*.65;s+=c(x,y,size,url('crater'),`stroke="#dbe3df" stroke-width="${size>.5?'.6':'.3'}" stroke-opacity=".5"`)+p(`M${x-size*.7} ${y+size*.35}Q${x} ${y+size*1.05} ${x+size*.75} ${y+size*.15}`,'none','#f4f4e5',.7,'opacity=".6"');}
 s+=c(134,213,7,url('crater'));for(let a=0;a<10;a++){const angle=a*Math.PI/5;s+=l(134+Math.cos(angle)*9,213+Math.sin(angle)*9,134+Math.cos(angle)*(19+a%3*8),213+Math.sin(angle)*(19+a%3*8),'#e7ece4',.7,'opacity=".35"');}return s;}
function moon(phase='full',lunar=''){let s=ellipse(160,279,74,7,'#7e8892','opacity=".13"');if(lunar)s+=c(160,152,139,url('halo'));s+=`<g filter="${url('shadow')}"><g clip-path="${url('disc')}">${moonSurface()}`;
 if(phase==='new')s+=c(160,152,108,url('night'),'opacity=".97"');
 if(phase==='first')s+=`<path data-shadow-side="left" d="M160 44A108 108 0 0 0 160 260Z" fill="${url('night')}" opacity=".98"/>`;
 if(phase==='last')s+=`<path data-shadow-side="right" d="M160 44A108 108 0 0 1 160 260Z" fill="${url('night')}" opacity=".98"/>`;
 if(lunar==='total')s+=c(160,152,108,url('blood'),'opacity=".88"');
 if(lunar==='partial')s+=c(227,111,121,'#172036','opacity=".94"')+c(227,111,124,'none','stroke="#a66754" stroke-width="5" stroke-opacity=".65"');
 if(lunar==='penumbral')s+=c(160,152,108,url('penumbra'));
 s+='</g>'+c(160,152,108,'none','stroke="#c0ccd0" stroke-width="1.1" stroke-opacity=".7"')+'</g>';
 if(lunar==='penumbral')s+=p('M47 251Q162 303 279 218','none','#9a85af',1.8,'stroke-dasharray="4 6"')+p('M277 211L283 222L270 220Z','#9a85af');return s;}
function stars(){return Array.from({length:24},(_,i)=>c(31+(i*43)%262,30+(i*71)%242,.8+(i%3)*.45,i%2?'#e0ebee':'#f6e6b6','opacity=".75"')).join('');}
function sun(x=160,y=150,r=67){return c(x,y,r*1.65,url('halo'))+c(x,y,r,url('sun'))+Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return l(x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7),x+Math.cos(a)*(r+15),y+Math.sin(a)*(r+15),'#dba448',2,'stroke-linecap="round"');}).join('');}
function solar(kind){let s=c(160,154,139,url('night'))+stars();if(kind==='total'){s+=c(160,151,134,url('corona'));for(let i=0;i<18;i++){const a=i*Math.PI/9,x=160+Math.cos(a)*63,y=151+Math.sin(a)*63;s+=p(`M${x} ${y}Q${160+Math.cos(a+.08)*111} ${151+Math.sin(a+.08)*111} ${160+Math.cos(a)*129} ${151+Math.sin(a)*129}`,'none','#e7eadb',1.6,'opacity=".3"');}s+=c(160,151,64,'#080e18','stroke="#fff3d1" stroke-width="2"')+p('M201 101Q218 88 216 110','none','#d88971',3);}else{s+=sun(156,150,78);if(kind==='annular')s+=c(156,150,70,'#0c1420','stroke="#ffdb91" stroke-width="1.8"');else s+=c(199,113,77,'#0c1420','stroke="#233243" stroke-width="1"');}return s;}
function earth(x=160,y=158,r=68){return `<g transform="translate(${x-160*r/68} ${y-158*r/68}) scale(${r/68})" filter="${url('shadow')}"><g clip-path="${url('earth-clip')}">${c(160,158,68,url('earth'))}${p('M122 101L142 94L151 111L142 118L151 134L142 149L118 145L108 127Z','#a4bd91')}${p('M166 117L181 102L211 118L219 143L201 154L191 144L177 155L160 142L148 128Z','#a9bf8d')}${p('M151 149L175 151L187 170L172 193L160 208L149 191L143 166Z','#91ae83')}${p('M190 190L212 180L221 196L208 208L193 206Z','#a9bf8d')}${p('M101 122Q155 95 205 119M106 162Q147 141 210 159M130 196Q175 178 213 187','none','#f5f7e9',4,'opacity=".45"')}${c(160,158,68,'none','stroke="#bbdde0" stroke-width="2"')}</g></g>`;}
function blossom(x,y,color){return Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return ellipse(x+Math.cos(a)*10,y+Math.sin(a)*10,8,8,color);}).join('')+c(x,y,4,'#dfb564');}
function season(type){let s=c(160,158,127,'#f4ede5')+ellipse(160,274,83,6,'#c8bbaa','opacity=".2"');s+=earth();s+=l(132,226,190,88,'#8a6370',1.8)+c(132,226,3,'#8a6370')+c(190,88,3,'#8a6370');
 if(type==='spring'){s+=sun(240,90,22)+p('M52 242Q65 178 93 147','none','#5e8270',3)+p('M65 208Q30 177 48 174Q71 172 65 208Z','#81a58a')+p('M77 180Q106 157 104 184Q94 197 77 180Z','#56836c')+blossom(88,146,'#eab3bc')+blossom(56,188,'#f5d3d5')+p('M96 250H224','none','#9db4a4',2);}
 if(type==='summer'){s+=sun(214,62,35)+p('M49 220Q72 66 227 64','none','#ccae6e',1.8,'stroke-dasharray="4 5"')+p('M50 240Q73 195 85 217Q95 230 73 244Z','#6e9570')+p('M74 248Q111 207 119 234Q120 249 74 248Z','#a5b56a');}
 if(type==='autumn'){s+=sun(242,191,24)+p('M54 242L63 211L43 203L60 189L47 172L71 175L80 152L89 175L114 171L100 191L114 203L89 210L89 236Z','#c8834d','#a75a43',1.4)+p('M73 251L83 181M81 205L59 186M82 205L103 185','none','#f7d7a7',1.5)+l(97,254,224,254,'#c8a27b',2);}
 if(type==='winter'){s+=sun(246,231,23)+p('M65 231Q153 177 250 222','none','#b8cbd0',1.8,'stroke-dasharray="4 5"');for(let i=0;i<6;i++){const a=i*Math.PI/3,x=73+Math.cos(a)*31,y=102+Math.sin(a)*31;s+=l(73,102,x,y,'#779eaf',2.8,'stroke-linecap="round"')+l(73+Math.cos(a)*20,102+Math.sin(a)*20,73+Math.cos(a)*20+Math.cos(a+1.9)*11,102+Math.sin(a)*20+Math.sin(a+1.9)*11,'#779eaf',2)+l(73+Math.cos(a)*20,102+Math.sin(a)*20,73+Math.cos(a)*20+Math.cos(a-1.9)*11,102+Math.sin(a)*20+Math.sin(a-1.9)*11,'#779eaf',2);}}
 return s;}
function orbit(near){return c(160,157,135,'#f3eee6')+ellipse(160,157,124,73,'none','stroke="#a59baa" stroke-width="1.6" stroke-dasharray="4 5"')+sun(145,157,37)+earth(near?45:282,157,30)+l(near?74:186,157,near?102:249,157,'#916d7b',1.5)+p(near?'M78 152L73 157L78 162M99 152L104 157L99 162':'M191 152L186 157L191 162M245 152L250 157L245 162','none','#916d7b',1.5)+c(near?45:282,157,36,'none','stroke="#bb9a69" stroke-width="1"');}
function meteor(){return c(160,157,139,url('night'))+stars()+p('M42 183L211 77Q196 113 136 145Z',url('tail'))+p('M75 241L260 118Q243 156 162 194Z',url('tail'))+p('M104 118L205 47Q198 73 158 91Z',url('tail'))+l(82,225,245,131,'#e9f5ea',1.7,'opacity=".75"')+c(246,130,4,'#fff5c8')+c(201,83,3,'#fff7df')+p('M31 249L73 229L114 243L171 224L219 249L275 230L298 255V295H31Z','#243f50')+p('M30 270Q143 251 291 270V300H30Z','#173143');}
function sunrise(){return c(160,155,134,'#f5eadb')+sun(160,156,60)+p('M40 173Q96 154 154 177T280 173V247H40Z','#6e9fa3')+p('M40 196Q96 177 154 200T280 196M45 214Q111 194 171 218T278 212','none','#c8e0d7',3)+p('M57 171H263','none','#4e7781',2);}
function overview(){let s=c(160,155,135,url('night'))+stars()+p('M45 194Q160 240 275 194','none','#8499a6',1);const phases=['new','first','full','last'];for(let i=0;i<4;i++){const x=65+i*64;s+=c(x,150,24,i===0?url('night'):url('moon'),'stroke="#95a9b4" stroke-width=".8"');if(i===1)s+=p(`M${x} 126A24 24 0 0 0 ${x} 174Z`,url('night'));if(i===3)s+=p(`M${x} 126A24 24 0 0 1 ${x} 174Z`,url('night'));}return s;}
function observatory(){return observatoryIllustration(id);}
const defs=[
 ['moon-new','Jaunmēness','Tumšs Mēness disks jaunmēnesī.','phase','new','none',()=>moon('new')],
 ['moon-first','Pirmais ceturksnis','Mēness labā puse apgaismota ziemeļu puslodes standarta skatā.','phase','first','right',()=>moon('first')],
 ['moon-full','Pilnmēness','Pilnībā apgaismots Mēness disks.','phase','full','both',()=>moon('full')],
 ['moon-last','Pēdējais ceturksnis','Mēness kreisā puse apgaismota ziemeļu puslodes standarta skatā.','phase','last','left',()=>moon('last')],
 ...['partial','annular','total'].map(k=>['solar-'+k,({partial:'Daļējs Saules aptumsums',annular:'Gredzenveida Saules aptumsums',total:'Pilns Saules aptumsums'})[k],'Ilustratīvs Saules aptumsuma veida attēls.','solar',k,'',()=>solar(k)]),
 ...['penumbral','partial','total'].map(k=>['lunar-'+k,({penumbral:'Pusēnas Mēness aptumsums',partial:'Daļējs Mēness aptumsums',total:'Pilns Mēness aptumsums'})[k],'Ilustratīvs Mēness aptumsuma veida attēls.','lunar',k,'',()=>moon('full',k)]),
 ...['spring','summer','autumn','winter'].map(k=>['season-'+k,({spring:'Pavasara ekvinokcija',summer:'Vasaras saulgrieži',autumn:'Rudens ekvinokcija',winter:'Ziemas saulgrieži'})[k],'Zemes un Saules sezonāla vektoru kompozīcija.','season',k,'',()=>season(k)]),
 ['perihelion','Perihēlijs','Zeme orbītas tuvākajā punktā Saulei. Shēma nav mērogā.','season','perihelion','',()=>orbit(true)],
 ['aphelion','Afēlijs','Zeme orbītas tālākajā punktā no Saules. Shēma nav mērogā.','season','aphelion','',()=>orbit(false)],
 ['perseids','Perseīdu novērošanas nakts','Meteoru pēdu ilustrācija virs nakts ainavas.','meteor','perseids','',meteor],
 ['sunrise','Saules ceļš','Saules un horizonta ilustrācija.','tool','sunrise','',sunrise],
 ['moon-overview','Mēness cikls','Četri atšķirīgi galvenie Mēness fāžu veidi.','tool','moon-overview','',overview],
 ['observatory','Astronomisko notikumu ceļvedis','Lēcu teleskops ar meklētāju, okulāru un regulējamu trijkāji zem zvaigžņotām debesīm.','tool','observatory','',observatory]
];
const artworks=defs.map(([key,title,description,kind,variant,litSide,body])=>{id='ae-'+key;const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-labelledby="${id}-title ${id}-desc" data-event-art="${key}"${litSide?` data-lit-side="${litSide}"`:''}><title id="${id}-title">${title}</title><desc id="${id}-desc">${escape(description)} Kalendārs365 oriģināla vektoru ilustrācija.</desc>${definitions()}${body()}</svg>\n`;const file=path.join(out,key+'.svg');fs.writeFileSync(file,svg);return{key,title,description,kind,variant,litSide:litSide||undefined,file:'/assets/astronomy-events/'+key+'.svg',bytes:Buffer.byteLength(svg),sha256:crypto.createHash('sha256').update(svg).digest('hex')};});
fs.writeFileSync('_data/astronomy-event-art.json',JSON.stringify({version:1,source:'scripts/build_astronomy_event_art.mjs',orientation:'Northern hemisphere standard phase diagrams; illustrations are not topocentric sky simulations.',references:['https://science.nasa.gov/moon/moon-phases/','https://starchild.gsfc.nasa.gov/docs/StarChild/solar_system_level2/moonlight.html','https://aa.usno.navy.mil/faq/moon_phases'],artworks},null,2)+'\n');console.log('Created '+artworks.length+' event-specific vector illustrations');
fs.writeFileSync('assets/astronomy-art-catalog.mjs','// Generated by scripts/build_astronomy_event_art.mjs\nexport const astronomyArtCatalog='+JSON.stringify(Object.fromEntries(artworks.map(a=>[a.key,{key:a.key,src:a.file,title:a.title,alt:a.title+' · ilustrācija'}])),null,2)+';\n');
