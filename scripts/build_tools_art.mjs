import fs from 'node:fs';
import crypto from 'node:crypto';
import {earthDisc} from './vector-nature.mjs';
const dir='assets/tools-art';fs.mkdirSync(dir,{recursive:true});
const catalog=JSON.parse(fs.readFileSync('_data/tools-directory.json','utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const g=n=>`url(#${n})`;
const rect=(x,y,w,h,r=3,fill='#fff',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(x,y,x2,y2,color='#c8c4bc',w=1,extra='')=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const text=(x,y,label,size=12,fill='#3a3540',extra='')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="Arial,sans-serif" font-size="${size}" font-weight="700" ${extra}>${esc(label)}</text>`;
const defs=`<defs>
<linearGradient id="paper" x2=".7" y2="1"><stop stop-color="#fffefa"/><stop offset=".6" stop-color="#f4f0e5"/><stop offset="1" stop-color="#d5ccbc"/></linearGradient>
<linearGradient id="edge" x2="0" y2="1"><stop stop-color="#eee8db"/><stop offset=".5" stop-color="#a69b8b"/><stop offset="1" stop-color="#f3eee1"/></linearGradient>
<linearGradient id="wine" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#c5758e"/><stop offset=".3" stop-color="#a03c5a"/><stop offset=".7" stop-color="#7e203d"/><stop offset="1" stop-color="#4b1027"/></linearGradient>
<linearGradient id="teal" x2=".7" y2="1"><stop stop-color="#a5d5cb"/><stop offset=".3" stop-color="#559d90"/><stop offset="1" stop-color="#174c47"/></linearGradient>
<linearGradient id="navy" x2=".7" y2="1"><stop stop-color="#718692"/><stop offset=".4" stop-color="#334f5d"/><stop offset="1" stop-color="#142833"/></linearGradient>
<linearGradient id="metal" x2="1" y2=".7"><stop stop-color="#fbffff"/><stop offset=".2" stop-color="#c1d0d5"/><stop offset=".37" stop-color="#ffffff"/><stop offset=".58" stop-color="#8c9ea7"/><stop offset=".79" stop-color="#e5ebec"/><stop offset="1" stop-color="#627782"/></linearGradient>
<linearGradient id="gold" x1=".1" x2=".9" y2=".8"><stop stop-color="#fff4ca"/><stop offset=".25" stop-color="#ddb865"/><stop offset=".42" stop-color="#ffedb5"/><stop offset=".7" stop-color="#b38439"/><stop offset="1" stop-color="#74512e"/></linearGradient>
<linearGradient id="wood" x2=".8" y2="1"><stop stop-color="#dcb891"/><stop offset=".5" stop-color="#94664b"/><stop offset="1" stop-color="#593c30"/></linearGradient>
<linearGradient id="glass" x2=".6" y2="1"><stop stop-color="#fff" stop-opacity=".96"/><stop offset=".35" stop-color="#dcf0f0" stop-opacity=".55"/><stop offset="1" stop-color="#8baab2" stop-opacity=".8"/></linearGradient>
<radialGradient id="moon" cx="32%" cy="24%" r="80%"><stop stop-color="#f0eee2"/><stop offset=".38" stop-color="#c1c4b9"/><stop offset=".76" stop-color="#828e8d"/><stop offset="1" stop-color="#303f48"/></radialGradient>
<radialGradient id="ocean" cx="32%" cy="23%" r="80%"><stop stop-color="#85c3df"/><stop offset=".36" stop-color="#337ba7"/><stop offset=".72" stop-color="#175184"/><stop offset="1" stop-color="#102b4a"/></radialGradient>
<radialGradient id="sun" cx="30%" cy="22%" r="85%"><stop stop-color="#fff5c5"/><stop offset=".48" stop-color="#f2c866"/><stop offset=".82" stop-color="#d58c38"/><stop offset="1" stop-color="#945b28"/></radialGradient>
<radialGradient id="orb-shade" cx="32%" cy="23%" r="80%"><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".7" stop-color="#081625" stop-opacity=".08"/><stop offset="1" stop-color="#081625" stop-opacity=".85"/></radialGradient>
<filter id="shadow" x="-40%" y="-30%" width="190%" height="190%"><feDropShadow dx="3" dy="9" stdDeviation="6" flood-color="#38252a" flood-opacity=".21"/></filter>
<filter id="contact" x="-50%" y="-150%" width="200%" height="400%"><feGaussianBlur stdDeviation="5"/></filter>
<clipPath id="globe-clip"><circle cx="153" cy="130" r="83"/></clipPath>
</defs>`;
const shadow=(cx=158,cy=239,rx=94)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="9" fill="#514337" opacity=".16" filter="url(#contact)"/>`;
function paper(x=65,y=47,w=190,h=180){return rect(x+5,y+8,w,h,9,g('edge'))+rect(x+1,y+3,w,h,9,g('paper'))+rect(x,y,w,h,9,g('paper'),'stroke="#dad2c5" stroke-width="1.2"')+line(x+2,y+h-3,x+w-2,y+h-3,'#fff9e9');}
function rings(x=94,y=47,count=2,spacing=133){return Array.from({length:count},(_,i)=>{let X=x+i*spacing;return circle(X,y+11,5,'#725f5f')+path(`M${X-3} ${y+12}V${y-5}Q${X} ${y-15} ${X+5} ${y-6}V${y+8}`,'none',`stroke="${g('metal')}" stroke-width="5"`)+path(`M${X-3.5} ${y+9}V${y-5}Q${X-1} ${y-10} ${X+1} ${y-9}`,'none','stroke="#fff" stroke-width="1.4"');}).join('');}
function calendar(mode='month'){
 const w=mode==='week'?224:184,x=(320-w)/2,y=45,h=178;
 let s=paper(x,y,w,h)+path(`M${x} ${y+9}Q${x} ${y} ${x+9} ${y}H${x+w-9}Q${x+w} ${y} ${x+w} ${y+9}V${y+47}H${x}Z`,g('wine'))+line(x+10,y+2,x+w-12,y+2,'#e6a7b9',1.3)+rings(x+29,y,2,w-58);
 if(mode==='year'){
  s+=text(x+15,y+35,'2027',27,'#fff9f0');
  for(let j=0;j<6;j++){let bx=x+14+(j%3)*53,by=y+64+Math.floor(j/3)*54;s+=rect(bx,by,43,44,2,'#fffcf4')+rect(bx,by,43,6,1,'#bc6d80');for(let row=0;row<4;row++)for(let col=0;col<5;col++)s+=rect(bx+5+col*7,by+12+row*7,3.5,3.5,.8,col===4?'#a64961':'#b2b4ab');}
 }else if(mode==='week'){
  s+=text(x+16,y+32,'NEDĒĻA',18,'#fffaf1');
  for(let i=0;i<7;i++){let X=x+14+i*28;s+=text(X+8,y+67,String(i+4),11,'#593745','text-anchor="middle"')+rect(X-2,y+76,24,85,3,i>4?'#f1e0e3':'#e9ece5');for(let j=0;j<4;j++)s+=line(X+3,y+88+j*16,X+17,y+88+j*16,'#abb6b0',1);if(i<5)s+=rect(X+2,y+92+(i%3)*14,16,9,2,i%2?'#78a89a':'#ba7184');}
 }else{
  s+=text(x+14,y+32,'JANVĀRIS',15,'#fffaf1')+text(x+w-15,y+32,'2027',12,'#f4d5dc','text-anchor="end"');
  const labels=['P','O','T','C','Pk','S','Sv'];labels.forEach((v,i)=>s+=text(x+21+i*24,y+67,v,8,i>4?'#9b2c4c':'#6d7473','text-anchor="middle"'));
  for(let d=1;d<=31;d++){let c=(d+3)%7,r=Math.floor((d+3)/7),X=x+21+c*24,Y=y+88+r*18;if(d===18)s+=circle(X,Y-3,9,g('wine'));s+=text(X,Y,String(d),9,d===18?'#fff':c>4?'#943047':'#525b5a','text-anchor="middle"');}
 }
 return `<g transform="rotate(-7 160 140)" filter="url(#shadow)">${s}</g>`;
}
function pencil(x=240,y=173,rotate=24){return `<g transform="translate(${x} ${y}) rotate(${rotate})">`+path('M-7 -61H7V39L0 61L-7 39Z',g('gold'))+rect(-7,-61,14,16,2,g('wine'))+rect(-7,-45,14,8,1,g('metal'))+path('M-7 39L0 61L7 39Z','#e7c7a0')+path('M-2 54L0 61L2 54Z','#343f48')+line(-4,-35,-4,36,'#ffe8a1',2)+'</g>';}
function clock(x=157,y=130,r=85){let s=circle(x+4,y+6,r,g('navy'))+circle(x,y,r,g('metal'))+circle(x,y,r-7,'#f6faf7','stroke="#96a8ad" stroke-width="1.8"')+circle(x,y,r-13,g('glass'));
 for(let i=0;i<60;i++){let a=i*Math.PI/30,R=r-15,rr=r-(i%5===0?25:19);s+=line(x+Math.sin(a)*R,y-Math.cos(a)*R,x+Math.sin(a)*rr,y-Math.cos(a)*rr,i%5===0?'#52636b':'#a6b3b6',i%5===0?2.8:1);}
 s+=path(`M${x-3} ${y+3}L${x-27} ${y-32}Q${x-27} ${y-38} ${x-21} ${y-34}L${x+3} ${y-3}Z`,'#334853')+line(x,y,x+40,y-40,'#334853',5)+line(x-16,y+15,x+43,y-40,'#982743',1.5)+circle(x,y,7,g('wine'))+circle(x-1,y-2,2,'#f6c8d1');return s;}
function calculator(work=false){let x=94,y=44,w=141,h=186;let s=rect(x+7,y+7,w,h,17,'#254a4b')+rect(x,y,w,h,17,g('teal'),'stroke="#bed8cd"')+line(x+18,y+3,x+w-19,y+3,'#cce9dc',1.5)+rect(x+12,y+17,w-24,43,7,'#284f50')+rect(x+16,y+21,w-32,34,4,'#d0dfcc')+text(x+w-25,y+44,work?'168 h':'31 + 7',20,'#374e49','text-anchor="end"');
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){let X=x+15+c*29,Y=y+76+r*24; s+=rect(X+1,Y+3,23,18,4,'#264f4d')+rect(X,Y,23,18,4,c===3?g('wine'):g('paper'))+text(X+11.5,Y+12.5,c===3?['÷','×','−','='][r]:r===3?['0','.','+'][c]:String(7-r*3+c),9,c===3?'#fffaf4':'#46605b','text-anchor="middle"');}
 s=`<g transform="rotate(9 165 134)" filter="url(#shadow)">${s}</g>`;
 if(work)s+=`<g transform="translate(-10 40) scale(.55)">${calendar('week')}</g>`;
 return s;
}
function moon(x=159,y=133,r=87,dark=false){
 let s=circle(x,y,r,g('moon'));
 const scale=r/100,features=[['M-63 -16Q-77 -48 -44 -65Q-18 -79 2 -58Q17 -64 30 -48Q39 -21 17 -13Q-7 -8 -19 2Q-44 17 -62 -2Z','#697c7c'],['M13 -53Q38 -67 57 -45Q64 -30 55 -10Q24 -1 14 -18Z','#718281'],['M21 4Q37 -3 57 14Q58 41 39 48Q14 38 21 4Z','#74837d'],['M-62 21Q-29 3 -15 25Q-2 36 -13 49Q-40 63 -60 43Z','#71817e']];
 s+=`<g transform="translate(${x} ${y}) scale(${scale})">`+features.map(([d,c])=>path(d,c,'opacity=".36"')).join('')+'</g>';
 let seed=1729;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<105;i++){let a=random()*Math.PI*2,rr=Math.sqrt(random())*r*.94,X=x+Math.cos(a)*rr,Y=y+Math.sin(a)*rr,R=(i<14?2.7+random()*3.1:.35+random()*1.6)*r/87;s+=circle(X,Y,R,'#7b8985',`opacity="${i<14?.24:.13}"`)+path(`M${X-R*.9} ${Y+R*.2}Q${X-R*.6} ${Y-R*.7} ${X+R*.6} ${Y-R*.6}`,'none',`stroke="#eef0e3" stroke-opacity="${i<14?.44:.3}" stroke-width="${Math.max(.5,R*.22)}"`);}
 s+=circle(x,y,r,g('orb-shade'))+circle(x,y,r,'none','stroke="#b7c3bf" stroke-opacity=".6"');
 if(dark)s+=path(`M${x} ${y-r}A${r} ${r} 0 0 0 ${x} ${y+r}C${x-r*.45} ${y+r*.3} ${x-r*.45} ${y-r*.3} ${x} ${y-r}`,'#15232f','opacity=".94"');return s;
}
function globe(){return earthDisc('directory-earth',153,130,83);}
function book(study=false){let s=path('M57 77Q106 56 158 80Q211 57 261 76V211Q210 192 158 216Q108 193 57 211Z',g('navy'))+path('M62 72Q111 54 158 76Q209 55 255 73V203Q208 187 158 209Q108 188 62 203Z',g('edge'))+path('M67 65Q113 49 158 71Q205 50 250 66V196Q206 183 158 203Q111 183 67 196Z',g('paper'))+line(158,73,158,201,'#b9aa98',2);
 for(let i=0;i<9;i++){let Y=91+i*11;s+=path(`M80 ${Y}q30 -5 64 6`,'none','stroke="#b8b6a9" stroke-width="1.2"')+path(`M171 ${Y+6}q30 -11 65 -6`,'none','stroke="#b8b6a9" stroke-width="1.2"');}
 s+=path('M215 63L228 63V128L221 121L215 129Z',g('wine'));
 if(study)s+=path('M96 56L165 27L235 57L165 90Z',g('navy'))+path('M120 72V92Q164 119 209 92V73L165 93Z','#213c4b')+path('M165 55L224 80V126','none',`stroke="${g('gold')}" stroke-width="3"`)+path('M219 121H229L231 143L218 143Z',g('gold'))+circle(165,55,4,g('gold'));
 return `<g transform="rotate(-6 160 135)" filter="url(#shadow)">${s}</g>`;
}
function scene(id){
 if(['month','week','year'].includes(id))return calendar(id==='month'?'month':id);
 if(id==='maker')return `<g transform="rotate(-7 150 137)" filter="url(#shadow)">${paper(61,44,179,181)}${rect(79,65,143,82,5,'#dae5dd')}${circle(186,86,14,g('sun'))}${path('M79 129L119 86L159 125L184 106L222 138V147H79Z',g('teal'))}${rect(79,163,98,7,3,'#c0c2b5')}${rect(79,178,133,5,2,'#d6d3c7')}${rect(79,190,110,5,2,'#d6d3c7')}</g>${pencil(245,169,26)}${circle(247,65,18,g('wine'))}${path('M239 65H255M247 57V73','none','stroke="#fff5e9" stroke-width="3" stroke-linecap="round"')}`;
 if(id==='family'){
  let s=paper(47,60,226,157)+rect(47,60,226,32,8,g('wood'));
  for(let i=0;i<3;i++){let X=62+i*69;s+=circle(X+23,57,21,[g('wine'),g('teal'),g('gold')][i])+circle(X+23,49,6,'#fff6df')+path(`M${X+11} 70Q${X+11} 56 ${X+23} 57Q${X+35} 57 ${X+35} 70`,'#fff6df')+rect(X,103,60,93,5,['#f2dfe4','#dceae1','#f2e9ce'][i]);for(let j=0;j<4;j++)s+=circle(X+10,118+j*19,2.4,['#9b3854','#418878','#c1984c'][i])+line(X+18,118+j*19,X+48,118+j*19,'#a3aaa2',1.5);}
  return `<g transform="rotate(-4 160 140)" filter="url(#shadow)">${s}</g>`;
 }
 if(id==='vacation')return `<g transform="rotate(-8 160 130)" filter="url(#shadow)">${path('M126 64V45Q126 31 139 31H176Q190 31 190 45V64','none',`stroke="${g('metal')}" stroke-width="10"`)}${rect(81,61,161,156,20,g('wine'),'stroke="#b97c8e"')}${rect(95,72,132,130,13,'none','stroke="#e1a4b6" stroke-opacity=".6" stroke-width="1.6"')}${[115,139,163,187,211].map(x=>line(x,83,x,188,'#571a30',2)+line(x+2,83,x+2,188,'#be6c84',1)).join('')}${rect(107,211,19,17,6,g('navy'))}${rect(201,211,19,17,6,g('navy'))}${path('M210 73L247 93L238 146L208 142Z',g('paper'))}${circle(223,90,3,'#9d4961')}${path('M223 88Q220 59 203 64','none',`stroke="${g('gold')}" stroke-width="2"`)}${line(216,115,237,119,'#b5b5a8',2)}${line(215,125,230,128,'#b5b5a8',2)}</g>`;
 if(id==='shift')return `<g filter="url(#shadow)">${clock(140,125,80)}${circle(219,181,40,g('navy'))}${path('M204 163A22 22 0 1 0 235 191A25 25 0 0 1 204 163',g('paper'))}${circle(232,164,3,g('gold'))}${path('M76 225Q163 253 245 215M236 211L249 214L244 228','none',`stroke="${g('gold')}" stroke-width="5" stroke-linecap="round"`)}</g>`;
 if(id==='work')return calculator(true);
 if(id==='calculator')return calculator();
 if(id==='countdown')return `<g filter="url(#shadow)">${rect(99,34,122,18,8,g('gold'))}${rect(99,216,122,18,8,g('gold'))}${[108,211].map(x=>rect(x,49,7,168,3,g('metal'))).join('')}${path('M123 54H197C197 97 188 112 166 134C189 153 199 171 197 215H123C121 176 131 154 154 134C131 115 123 96 123 54Z',g('glass'),'stroke="#b0c5c7" stroke-width="2"')}${path('M130 82H190Q184 112 160 129Q137 110 130 82Z',g('gold'))}${path('M160 135V174','none','stroke="#d6b15c" stroke-width="2"')}${path('M129 209Q142 170 160 175Q181 181 192 209Z',g('gold'))}${path('M131 61Q132 99 144 113M132 198Q134 172 146 157','none','stroke="#fff" stroke-opacity=".9" stroke-width="3" stroke-linecap="round"')}</g>`;
 if(id==='names'){
  let s=path('M78 145L155 121L249 152V223H78Z',g('paper'))+path('M78 146L162 199L249 153V222H78Z','#e5d7c6')+path('M79 221L136 180L162 199L186 182L248 221Z',g('paper'));
  for(let [x,y,ang] of [[117,76,-18],[168,52,6],[207,88,22]]){s+=path(`M${x} ${y}Q${x+ang} 120 160 176`,'none','stroke="#3f7960" stroke-width="4"')+path(`M${x} ${y+47}q-30 -32 -37 -14q6 25 34 19`,g('teal'));for(let i=0;i<7;i++)s+=`<ellipse cx="${x}" cy="${y-10}" rx="10" ry="20" transform="rotate(${i*51.43} ${x} ${y})" fill="${i%2?'#b85b76':'#92344f'}" stroke="#d698a7" stroke-width=".6"/>`;s+=circle(x,y,8,g('gold'));}
  return `<g filter="url(#shadow)">${s}</g>`;
 }
 if(id==='traditions'){
  let s='';for(let i=0;i<20;i++){let a=i*Math.PI/10,X=160+Math.cos(a)*83,Y=137+Math.sin(a)*77;s+=`<g transform="translate(${X} ${Y}) rotate(${i*18+70})">${path('M0 31C-7 21 -27 21 -22 10C-37 4 -27 -10 -19 -9C-28 -26 -10 -28 -6 -18C-1 -35 16 -30 14 -17C31 -24 34 -7 23 -2C38 8 25 22 13 19L1 33Z',g('teal'),'stroke="#34664b" stroke-width="1"')}${path('M0 26L0 -21M0 13L-16 4M0 4L14 -8','none','stroke="#d3d49a" stroke-opacity=".7" stroke-width="1.4"')}</g>`;}
  return `<g filter="url(#shadow)">${s}${path('M134 211L119 254L147 242L159 258L164 211Z',g('wine'))}${path('M164 212L179 257L191 240L212 245L188 208Z',g('wine'))}${path('M158 218Q112 185 115 215Q120 238 158 218Q199 187 203 213Q205 239 158 218Z',g('gold'))}${circle(159,218,9,g('gold'))}</g>`;
 }
 if(id==='holidays')return `<g filter="url(#shadow)">${rect(87,39,8,185,4,g('metal'))}${circle(91,36,9,g('gold'))}${path('M95 48C137 31 184 67 235 46V158C189 177 144 138 95 156Z',g('wine'))}${path('M95 91C139 75 188 112 235 91V113C189 133 139 97 95 113Z',g('paper'))}${path('M95 51C137 35 184 70 232 49','none','stroke="#e6a0b1" stroke-width="2"')}${path('M128 53C136 81 125 120 136 153M204 58Q191 110 203 161','none','stroke="#f7c5cc" stroke-opacity=".18" stroke-width="7"')}${path('M64 228Q91 210 119 228L127 237H56Z',g('metal'))}</g>`;
 if(id==='school')return `<g filter="url(#shadow)">${path('M130 63V44Q158 15 188 44V63','none',`stroke="${g('teal')}" stroke-width="12"`)}${path('M89 111Q88 59 124 53H190Q225 59 230 106L241 208Q238 228 213 228H109Q84 227 82 206Z',g('teal'),'stroke="#91baac" stroke-width="1.5"')}${path('M111 112V87Q109 59 128 56M211 111V85Q210 64 192 56','none','stroke="#b3d4c8" stroke-opacity=".7" stroke-width="3"')}${rect(98,133,128,76,15,g('wine'),'stroke="#bb7a90"')}${line(106,151,218,151,'#e0b063',2)}${rect(211,149,5,13,2,g('metal'))}${rect(94,109,137,12,5,g('navy'))}${rect(125,81,68,29,7,g('paper'))}${text(159,100,'ABC',15,'#5f3546','text-anchor="middle"')}${rect(62,135,23,87,4,g('gold'))}${line(68,146,68,209,'#fff0af',1.3)}</g>`;
 if(id==='timetable'){
  let s=paper(51,47,218,178)+rect(51,47,218,36,8,g('navy'))+rings(78,47,2,166)+text(71,73,'STUNDU SARAKSTS',14,'#f3f8f2');
  for(let c=0;c<5;c++)for(let r=0;r<5;r++)s+=rect(66+c*37,99+r*21,30,15,3,['#b16b7d','#70a79c','#ceb979','#bac3d4','#c6b5c8'][(r+c*2)%5]);
  return `<g transform="rotate(-5 160 140)" filter="url(#shadow)">${s}</g>`;
 }
 if(id==='study')return book(true);
 if(id==='sunrise')return `<g filter="url(#shadow)">${circle(160,122,71,'#f4ead4')}${circle(160,119,51,g('sun'))}${path('M75 138Q160 119 245 138L270 203Q160 235 50 203Z',g('teal'))}${[0,1,2,3,4].map(i=>path(`M${73-i*3} ${149+i*12}Q154 ${135+i*16} ${247+i*3} ${149+i*12}`,'none','stroke="#bad3c4" stroke-opacity=".7" stroke-width="2"')).join('')}${path('M136 155H185M124 168H196M143 181H179','none','stroke="#f6db96" stroke-width="4" stroke-linecap="round"')}${path('M92 100L80 95M110 66L102 55M160 48V34M208 65L217 53M228 101L242 96','none',`stroke="${g('gold')}" stroke-width="5" stroke-linecap="round"`)}</g>`;
 if(id==='moon')return `<g filter="url(#shadow)">${moon()}${path('M65 215Q160 249 246 214','none',`stroke="${g('metal')}" stroke-width="2" stroke-opacity=".7"`)}</g>`;
 if(id==='phases')return `<g filter="url(#shadow)">${moon(87,143,49,true)}${moon(171,122,77)}${circle(253,153,38,g('navy'))}${path('M253 115A38 38 0 0 1 253 191Q225 153 253 115',g('moon'))}</g>`;
 if(id==='seasons'){
  let s=path('M148 224L153 116L101 87L105 79L154 104L156 55H165L167 108L215 77L219 85L168 123L175 224Z',g('wood'))+path('M160 69L159 195M160 135L168 219','none','stroke="#efd3ae" stroke-opacity=".4" stroke-width="1.8"');
  const clusters=[[107,72,'#dcaebd'],[153,50,'#b7cbaa'],[203,71,'#47866e'],[103,126,'#d0a35b'],[207,129,'#a54b59']];
  for(let [x,y,color] of clusters)for(let i=0;i<7;i++){let a=i*2.4,X=x+Math.cos(a)*14,Y=y+Math.sin(a)*17; s+=`<g transform="translate(${X} ${Y}) rotate(${i*51})">${path('M0 20C-26 7 -21 -16 -1 -21C20 -13 25 9 0 20Z',color,'stroke="#fff6e0" stroke-opacity=".3" stroke-width=".6"')}${path('M0 16L0 -17M0 5L-10 -3M0 -2L9 -10','none','stroke="#e2deb6" stroke-opacity=".5" stroke-width="1"')}</g>`;}
  s+=path('M122 225Q161 211 203 225L209 235H117Z',g('gold'));return `<g filter="url(#shadow)">${s}</g>`;
 }
 if(id==='astronomy')return `<g filter="url(#shadow)">${globe()}${moon(239,201,34)}${path('M57 172Q52 227 160 225Q259 218 258 143','none',`stroke="${g('metal')}" stroke-width="2.5" stroke-opacity=".8"`)}${circle(61,174,5,g('gold'))}</g>`;
 if(id==='garden')return `<g filter="url(#shadow)">${path('M94 153L226 153L210 230H110Z',g('wine'))}${rect(84,143,152,22,5,g('wine'),'stroke="#c58d9e"')}${path('M98 145Q160 129 222 145L219 151H101Z','#544134')}${path('M161 146Q147 84 177 46','none','stroke="#437858" stroke-width="7"')}${path('M158 109Q101 113 99 67Q142 63 158 109Z',g('teal'))}${path('M163 91Q216 89 225 44Q184 40 163 91Z',g('teal'))}${path('M101 68Q133 85 158 110M224 45Q197 67 163 91','none','stroke="#bdd5a0" stroke-width="2"')}${rect(188,174,29,35,3,g('paper'))}${circle(203,188,7,g('gold'))}${line(195,201,210,201,'#a1ac9b',2)}</g>`;
 if(id==='print')return `<g filter="url(#shadow)">${rect(97,43,133,91,3,g('paper'),'stroke="#cac7ba"')}${text(111,66,'2027',21,'#8a2c48')}${[0,1,2].map(i=>rect(112+i*35,78,27,28,2,'#dfdfd3')).join('')}${rect(64,112,194,92,13,g('navy'))}${rect(74,122,173,21,5,g('metal'))}${circle(229,155,4,'#8cc3af')}${rect(99,172,126,51,3,'#182d39')}${path('M109 180H213L224 234H98Z',g('paper'),'stroke="#c4c6bd"')}${line(116,198,207,198,'#bcbeb0',2)}${line(112,211,209,211,'#bcbeb0',2)}${path('M104 129H215','none','stroke="#fff" stroke-opacity=".8" stroke-width="2"')}</g>`;
 if(id==='horoscope'){
  let s=circle(160,134,94,g('gold'))+circle(160,134,87,g('navy'),'stroke="#f2ddb1" stroke-width="1.5"')+circle(160,134,66,'none','stroke="#b4a77e" stroke-width=".8"');
  for(let i=0;i<12;i++){let a=i*Math.PI/6;let x=160+Math.sin(a)*79,y=134-Math.cos(a)*79;s+=circle(x,y,2,g('gold'))+line(160+Math.sin(a)*67,134-Math.cos(a)*67,160+Math.sin(a)*84,134-Math.cos(a)*84,'#b7a77e',.7);}
  s+=path('M160 75L174 118L218 134L174 149L160 194L145 149L101 134L145 118Z',g('gold'))+path('M160 75L160 194L145 149L101 134L145 118Z','#fff3c4','opacity=".65"')+circle(160,134,12,g('wine'));
  return `<g filter="url(#shadow)">${s}</g>`;
 }
 throw Error('Missing artwork '+id);
}
const manifest=[];
for(const item of catalog){const content=scene(item.art),svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 280" role="img" aria-labelledby="title desc"><title id="title">${esc(item.title)}</title><desc id="desc">Kalendārs365 oriģināla vektoru ilustrācija: ${esc(item.artDescription)}. Apjoms veidots ar materiālu gaismēnām, atspīdumiem un perspektīvu.</desc>${defs}${shadow()}${content}</svg>\n`;
 if(/<(?:image|foreignObject|script)\b|data:image|\b(?:NaN|Infinity|undefined)\b/.test(svg))throw Error('Invalid SVG '+item.art);
 const file=`/${dir}/${item.art}.svg`;fs.writeFileSync('.'+file,svg);manifest.push({id:item.art,title:item.title,file,sha256:crypto.createHash('sha256').update(svg).digest('hex'),bytes:Buffer.byteLength(svg),description:item.artDescription});}
fs.writeFileSync('_data/tools-art.json',JSON.stringify({version:1,kind:'original-vector',artworks:manifest},null,2)+'\n');console.log(JSON.stringify({artworks:manifest.length,allPureSVG:true,bytes:manifest.reduce((a,b)=>a+b.bytes,0)}));
