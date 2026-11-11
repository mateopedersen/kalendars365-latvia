// Original SVG dioramas: four different Latvian seasonal subjects, not recoloured copies.
import fs from 'node:fs';
import crypto from 'node:crypto';
const seasons={
 spring:{title:'Pavasaris',tagline:'Ziedi un jaunās lapas',motif:'blossoming-orchard',alt:'Ziedoša ābele, sniegpulkstenītes un krokusi pie pavasara strauta',cues:['ābeļziedi','sniegpulkstenītes','krokusi']},
 summer:{title:'Vasara',tagline:'Saule un Baltijas jūra',motif:'baltic-beach',alt:'Saulaina Baltijas jūras pludmale ar saulessargu, kāpām un koka laipu',cues:['saule','jūra','saulessargs']},
 autumn:{title:'Rudens',tagline:'Krāsainas lapas un raža',motif:'autumn-woodland',alt:'Vara un zelta lapu mežs, sēņu grozs un krītošas kļavu lapas',cues:['rudens lapas','sēņu grozs','ozolzīles']},
 winter:{title:'Ziema',tagline:'Sniegs un ziemas miers',motif:'snowy-cottage',alt:'Apsnigusi koka mājiņa ar siltiem logiem, baltām eglēm un ledus dīķi',cues:['apsnigta mājiņa','sniegotas egles','ledus']}
};
const f=n=>Number(n.toFixed(2));
const P=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const E=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const C=(x,y,r,fill,extra='')=>`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" ${extra}/>`;
const R=(x,y,w,h,r,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const L=(d,c,w=2,extra='')=>P(d,'none',`stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}`);
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function scene(key){
 const p=seasons[key],prefix='k365-'+key+'-',u=n=>`url(#${prefix+n})`,random=rng(131+Object.keys(seasons).indexOf(key)*173);
 const grad=(n,a,b,c,radial=false)=>`<${radial?'radialGradient':'linearGradient'} id="${prefix+n}" ${radial?'cx="30%" cy="20%" r="85%"':'x1="12%" y1="0" x2="85%" y2="100%"'}><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></${radial?'radialGradient':'linearGradient'}>`;
 let defs=grad('wood','#c3a17c','#866347','#4c3c32')+grad('leaf','#b9d282','#648f5c','#315e4e',true)+grad('pink','#fffdf6','#f6c8d5','#d883a2',true)+grad('pink-deep','#f4c4d3','#d986a4','#a5527d',true)+grad('sand','#fff0c5','#e9cb8b','#b68f57')+grad('sea','#9bdcdf','#3ba9b8','#176c8c')+grad('gold','#fff0b0','#f3c453','#c79028',true)+grad('wine','#d6929a','#a34866','#682e46')+grad('snow','#fffefd','#e9f3f6','#afcbdc')+grad('ice','#e8f7fc','#acd4e4','#6096b8')+grad('pine','#70a598','#3e776f','#234a56')+grad('basket','#dfb56e','#b68046','#775135')+grad('orange','#ffc87c','#dc7840','#a23e32',true)+grad('copper','#f0b354','#c15b32','#843542',true)+grad('grass','#c8dd9b','#86b773','#4c8569')+grad('earth','#ae9173','#7b6552','#4f514c');
 defs+=`<filter id="${prefix}shadow" x="-60%" y="-100%" width="220%" height="300%"><feGaussianBlur stdDeviation="8"/></filter><filter id="${prefix}soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>`;
 defs+=`<g id="${prefix}leaf">${P('M0 1C-19-7-22-29-6-42C-1-43 12-33 15-22C20-9 9 0 0 1Z',u('leaf'))}${L('M0 0L-6-36M-2-15L8-21M-4-24L-13-30','#d7e6b1',1,'opacity=".55"')}</g>`;
 defs+=`<g id="${prefix}maple">${P('M0 18L-5 2L-26 4L-20-8L-37-20L-16-20L-20-39L-5-31L1-54L11-32L26-40L23-20L43-18L25-6L31 7L9 3L5 20Z',u('copper'))}${L('M2 35V-39M2-5L-22-17M3-7L27-20M2-16L-10-29','#f7d38e',1.7,'opacity=".65"')}</g>`;
 function shadow(x,y,rx,ry,opacity='.18'){return E(x,y,rx,ry,'#324757',`opacity="${opacity}" filter="${u('shadow')}"`);}
 function sprig(x,y,s=1,flip=1){return `<g transform="translate(${x} ${y}) scale(${flip*s} ${s})">${L('M0 0Q3-19-1-39','#4c8167',2)}<use href="#${prefix}leaf" transform="translate(-1 -14) rotate(-52) scale(.38)"/><use href="#${prefix}leaf" transform="translate(0 -26) rotate(38) scale(.35)"/></g>`;}
 function bloom(x,y,s=1,t=0){let v=E(1,3,17,8,'#a55d7c','opacity=".17"');for(let i=0;i<5;i++)v+=E(0,-11,10,17,u(i%3===0?'pink-deep':'pink'),`transform="rotate(${i*72} 0 0)" stroke="#fff8f3" stroke-opacity=".5" stroke-width=".5"`);v+=C(0,0,6,u('gold'));for(let i=0;i<8;i++){const a=i*Math.PI/4;v+=L(`M0 0L${f(Math.cos(a)*10)} ${f(Math.sin(a)*10)}`,'#b9964a',.7)+C(Math.cos(a)*10,Math.sin(a)*10,1.6,'#eac675');}return `<g transform="translate(${x} ${y}) rotate(${t}) scale(${s})">${v}</g>`;}
 function snowdrop(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">${L('M0 0Q-2-24 4-48Q14-66 23-48','#477b65',3)}${P('M-3-2Q-27-21-20-44Q-6-34-3-2M3 0Q12-35 22-37Q23-16 3 0',u('leaf'))}${P('M23-51Q7-48 11-29Q19-33 21-29Q24-37 28-29Q39-41 23-51Z','#fffef8','stroke="#b3cabb" stroke-width="1.5"')}${L('M23-45L23-33','#9fb6a0',1.5)}</g>`;}
 function pine(x,y,h,snow=false){let v=shadow(x+7,y+1,h*.26,7,'.12');v+=P(`M${x-3} ${y}L${x-2} ${y-h+12}L${x+3} ${y-h+12}L${x+5} ${y}`,u('wood'));for(let i=0;i<5;i++){const yy=y-h+h*.17+i*h*.158,w=h*(.12+i*.043);v+=P(`M${x} ${yy-h*.21}Q${x-w*.5} ${yy} ${x-w} ${yy+h*.14}Q${x} ${yy+h*.25} ${x+w} ${yy+h*.13}Q${x+w*.3} ${yy-h*.07} ${x} ${yy-h*.21}Z`,u('pine'));if(snow)v+=P(`M${x} ${yy-h*.2}Q${x-w*.45} ${yy-h*.01} ${x-w*.88} ${yy+h*.11}Q${x-w*.4} ${yy+h*.07} ${x-w*.23} ${yy+h*.14}Q${x+w*.3} ${yy+h*.19} ${x+w*.87} ${yy+h*.1}Q${x+w*.35} ${yy-h*.03} ${x} ${yy-h*.2}Z`,u('snow'),'stroke="#fffefa" stroke-width="1"');else v+=L(`M${x} ${yy-h*.16}Q${x-w*.4} ${yy} ${x-w*.7} ${yy+h*.1}`,'#a3c7a0',1,'opacity=".35"');}return v;}
 function island(top,front,fill,edge){return shadow(301,452,207,16)+P(front,edge)+P(top,fill);}
 let b='';
 if(key==='spring'){
  b+=C(143,102,52,'#fff3c5','opacity=".75"')+C(143,102,35,u('gold'),'opacity=".55"');
  b+=island('M63 346Q100 287 236 272Q393 253 524 331Q570 373 501 413Q370 472 175 425Q74 405 63 346Z','M63 346L66 370Q79 428 205 449Q385 486 506 433Q552 414 538 370L524 331L501 413Q370 472 175 425Q74 405 63 346Z',u('grass'),u('earth'));
  b+=P('M65 349Q144 314 220 340Q253 353 222 380Q206 400 259 442L306 450Q242 404 267 378Q303 337 216 324Q138 299 78 327Z',u('sea'))+L('M81 343Q149 317 205 340M228 369Q213 385 238 412','#e5faf7',3,'opacity=".7"');
  b+=shadow(335,361,94,14,'.14');
  const branches=[['M322 360Q313 298 324 244Q326 191 300 154',17],['M321 291Q276 268 257 205Q251 177 225 157',11],['M322 258Q365 227 378 169Q382 141 409 124',10],['M328 223Q310 172 333 112',8],['M281 248Q232 245 206 202',6],['M360 215Q405 205 436 162',6],['M303 178Q262 154 272 114',5]];
  for(const [d,w] of branches)b+=L(d,'#765742',w)+L(d,'#c9a27a',Math.max(1,w*.25),'transform="translate(-3 -1)"');
  b+=P('M309 361Q322 349 332 361L345 373Q319 380 302 372Z',u('wood'));
  const flowers=[[213,160,1.04,-13],[248,125,1.2,8],[286,114,1.12,20],[329,93,1.1,0],[363,112,1.2,17],[400,131,1.06,8],[434,161,1.1,35],[385,176,1.13,0],[344,145,1.22,10],[301,159,1.28,30],[258,182,1.13,0],[218,211,.9,12],[283,221,1.05,22],[332,196,1.05,17],[372,226,.95,0],[421,205,.8,6]];
  for(const [x,y,s,r] of flowers){b+=`<use href="#${prefix}leaf" transform="translate(${x+15} ${y+11}) rotate(68) scale(.75)"/>`;b+=bloom(x,y,s,r);}
  b+=snowdrop(116,389,1.05)+snowdrop(157,412,.83)+snowdrop(190,420,.68);
  for(const [x,y,s] of [[391,407,1],[420,424,.8],[453,400,.7]]){b+=sprig(x,y,s);b+=`<g transform="translate(${x-1} ${y-43}) scale(${s})">${P('M0 6Q-24-6-13-26Q-3-23 0-7Q4-28 14-28Q28-6 0 6Z','#9c729e')}${P('M0 5Q-12-8-3-26Q7-21 10-7Q9 1 0 5Z','#c4a3c5')}${L('M1-1L1-13','#f6d078',2)}</g>`;}
  b+=L('M453 98Q469 87 476 98M476 98Q486 85 499 93','#527b75',2.3);
  b+=bloom(482,296,.43,5)+sprig(482,333,.5);b+=E(360,388,27,6,'#cfe2b6','opacity=".55"');
 }else if(key==='summer'){
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=148+Math.cos(a)*70,y=105+Math.sin(a)*70;b+=L(`M${f(x)} ${f(y)}l${f(Math.cos(a)*11)} ${f(Math.sin(a)*11)}`,'#edbe53',3.5,'opacity=".65"');}
  b+=C(148,105,55,u('gold'))+C(134,88,19,'#fff5c7','opacity=".17"');
  const seaShape='M66 332C66 295 174 250 301 248C432 246 540 289 541 335C541 371 432 413 302 411C179 410 67 374 66 332Z';defs+=`<clipPath id="${prefix}sea-surface">${P(seaShape,'#fff')}</clipPath>`;b+=P(seaShape,u('sea'));b+=`<g clip-path="${u('sea-surface')}">`;
  for(let i=0;i<7;i++){const y=257+i*16;b+=L(`M${82+i*7} ${y}q32-8 61 0t60 0m53-1q27-8 59-1m33-2q20-4 39 0`,'#d7f4ef',i%2?1.4:2.4,`opacity="${.3+i*.055}"`);}
  b+='</g>';
  b+=shadow(308,451,204,16)+P('M63 354L71 378Q103 436 251 454Q433 477 531 401L534 374Q393 439 228 406Q103 390 63 354Z',u('sand'));
  b+=P('M62 346Q127 293 224 310Q289 315 333 348Q387 374 534 356L529 391Q425 444 273 429Q111 417 62 364Z',u('sand'));
  b+=L('M74 336Q136 303 221 322Q274 330 330 359Q398 386 531 368','#fffbee',7,'opacity=".8"');
  b+=P('M196 313L230 312L382 426L342 438Z','#896a48','opacity=".16"');
  b+=P('M189 311L215 302L376 418L350 430Z','#c99960');
  for(let i=0;i<11;i++){const t=i/10,x=189+161*t,y=311+107*t;b+=P(`M${f(x)} ${f(y)}l26-9 10 7-26 9Z`,i%2?'#e0bd82':'#f0d69f','stroke="#b58a57" stroke-width=".8"');}
  b+=pine(100,314,126)+pine(129,329,100);
  b+=shadow(380,367,100,13,'.12');
  b+=L('M390 348L396 193','#9b7754',7)+L('M388 344L394 194','#f4deb5',2);
  // Convex cloth panels with a scalloped edge make the umbrella unmistakable.
  b+=P('M273 202Q309 135 398 135Q478 144 515 208Q464 207 439 230Q406 204 376 224Q340 203 313 219Q293 203 273 202Z',u('wine'));
  b+=P('M273 202Q310 144 398 135Q350 163 344 214Q324 204 313 219Q293 203 273 202Z','#fff6db');
  b+=P('M398 135Q421 159 439 230Q410 208 390 215Q394 168 398 135Z','#fff2ce');
  b+=P('M398 135Q474 152 515 208Q482 205 463 214Q446 161 398 135Z','#b3657a');
  b+=L('M273 202Q309 135 398 135Q478 144 515 208','#f2cda9',1.5)+L('M398 135Q350 163 344 214M398 135Q421 159 439 230','#e3b899',1.2,'opacity=".65"')+C(398,133,5,u('gold'));
  b+=P('M340 343L393 354L419 322L367 312Z','#f3f0d9','stroke="#8b9c95" stroke-width="3"')+P('M340 343L369 367L420 378L393 354Z','#a34e66');
  b+=L('M341 344L335 385M393 354L401 393M367 312L355 369M418 323L424 369','#dcc7a0',4)+L('M344 348L394 359M353 355L403 365','#fff1d8',2);
  b+=P('M433 388L456 379L481 393L457 404Z','#b99c70')+P('M438 383L459 375L479 386L455 395Z','#f8e8c7')+L('M442 383L455 389L468 383','#bd7d7b',2);
  for(const [x,y,s] of [[177,364,1],[149,388,.8],[253,401,.7]]){b+=L(`M${x} ${y}q-6-23-12-32m12 32q-3-31 4-39m-4 39q8-28 17-33`,'#779778',1.5);b+=E(x+5,y-43,3*s,8*s,'#c4ab6c');}
  b+=L('M330 85q13-15 26-2m0 0q14-19 29-10','#517d8e',2.7);
 }else if(key==='autumn'){
  b+=C(461,115,51,'#f0c47e','opacity=".48"');
  b+=island('M62 351Q89 290 233 277Q417 266 526 339Q571 391 468 427Q320 479 157 420Q73 396 62 351Z','M62 351L67 378Q93 434 229 455Q376 481 493 430Q549 407 540 371L526 339L468 427Q320 479 157 420Q73 396 62 351Z',u('sand'),u('earth'));
  function tree(x,y,h,color,wide){let v=shadow(x+15,y,wide*.7,10,'.12');v+=L(`M${x} ${y}Q${x-4} ${y-h*.4} ${x+2} ${y-h*.84}`,'#715241',12)+L(`M${x} ${y-58}L${x-45} ${y-h*.66}M${x} ${y-90}L${x+42} ${y-h*.74}`,'#715241',6);v+=`<g transform="translate(${x} ${y}) scale(${wide/100} ${h/220})">${P('M-91-83C-123-91-126-124-103-138C-123-165-103-195-76-194C-78-220-44-236-24-221C-6-249 27-242 36-222C64-235 90-213 87-192C113-192 127-163 110-148C133-129 118-99 96-100C84-75 60-76 43-85C24-63-2-76-14-84C-42-65-65-76-69-92C-79-83-87-83-91-83Z',u(color))}</g>`;
const leafCount=wide>90?160:95;
for(let i=0;i<leafCount;i++){const a=random()*Math.PI*2,r=Math.sqrt(random()),xx=x+Math.cos(a)*r*wide,yy=y-h*.73+Math.sin(a)*r*h*.3,scale=.28+random()*.23;v+=`<use href="#${prefix}maple" transform="translate(${f(xx)} ${f(yy)}) rotate(${f(random()*360)}) scale(${f(scale)})" opacity="${f(.75+random()*.25)}"/>`;}
v+=L(`M${x-3} ${y-3}L${x-4} ${y-84}`,'#d1a279',2);return v;}
  b+=tree(171,336,170,'orange',72)+tree(303,345,236,'copper',104)+tree(443,337,163,'orange',67);
  for(let i=0;i<22;i++){const x=100+random()*390,y=329+random()*92;b+=`<use href="#${prefix}maple" transform="translate(${f(x)} ${f(y)}) rotate(${f(random()*350)}) scale(${f(.15+random()*.15)})"/>`;}
  // A foreground wicker basket, instead of another copy of the tree diorama.
  b+=shadow(333,428,82,12,'.19')+E(333,357,67,24,'#755037');
  b+=P('M267 355L279 415Q332 444 387 415L400 355Q344 381 267 355Z',u('basket'));
  for(let i=0;i<7;i++){const y=367+i*8;b+=L(`M${271+i*.9} ${y}Q334 ${y+25} ${396-i*1.2} ${y}`,'#e2b77c',2.4,'opacity=".65"');}
  for(let i=0;i<12;i++){const x=279+i*9;b+=L(`M${x} 364Q${333+(x-333)*.84} 395 ${333+(x-333)*.78} 426`,'#775334',1.6,'opacity=".5"');}
  b+=L('M285 363C277 265 390 265 383 361','#815736',11)+L('M285 359C281 269 385 269 383 357','#e0b076',4);
  function mushroom(x,y,s){return `<g transform="translate(${x} ${y}) scale(${s})">${P('M-8 4L-6-35Q1-44 8-34L12 7Q2 15-8 4Z','#f0dab4')}${P('M-35-29Q-35-64 0-64Q34-64 38-31Q11-17-35-29Z',u('orange'))}${E(-10,-47,14,5,'#ffe0a0','opacity=".36"')}${L('M-31-29Q0-17 34-29','#f8d8a0',2)}</g>`;}
  b+=mushroom(304,360,.92)+mushroom(351,351,1.12)+mushroom(381,366,.68);
  b+=E(333,358,65,19,'none','stroke="#e0b67a" stroke-width="6"')+E(333,357,65,19,'none','stroke="#9d7042" stroke-width="1.3"');
  b+=mushroom(153,405,.62)+mushroom(183,419,.42);
  b+=`<use href="#${prefix}maple" transform="translate(470 231) rotate(31) scale(1.02)"/>`+`<use href="#${prefix}maple" transform="translate(213 408) rotate(-40) scale(.62)"/>`;
  b+=L('M482 165Q534 170 512 202M86 227Q55 247 83 259','#c18565',2,'opacity=".55"');
  b+=`<g transform="translate(436 420) rotate(24)">${E(0,0,10,16,'#bb7e3d')}${E(0,-10,13,6,'#72523d')}${L('M0-15Q4-25 11-23','#71573f',3)}</g>`;
 }else{
  for(const [x,y,r] of [[104,123,3],[170,74,4],[302,69,3],[457,83,5],[518,188,3],[81,263,3],[468,368,3]])b+=C(x,y,r,'#fbffff','stroke="#c0dbe9" stroke-width="1"');
  for(const [x,y,s] of [[110,190,1],[459,135,.95],[492,286,.6]]){let a='';for(let i=0;i<3;i++)a+=L('M0-12V12M-4-8L0-4L4-8M-4 8L0 4L4 8','#8ab3cd',1.2,`transform="rotate(${i*60})"`);b+=`<g transform="translate(${x} ${y}) scale(${s})">${a}</g>`;}
  b+=island('M64 349Q85 292 225 271Q394 251 524 333Q571 375 505 417Q368 478 173 428Q80 408 64 349Z','M64 349L67 376Q88 431 211 454Q384 488 509 436Q552 416 541 371L524 333L505 417Q368 478 173 428Q80 408 64 349Z',u('snow'),'#9ebccc');
  b+=pine(456,322,190,true)+pine(490,351,136,true);
  b+=shadow(286,362,119,17,'.13');
  b+=P('M179 272L316 272L316 370L179 370Z',u('wood'))+P('M316 272L416 220L416 318L316 370Z','#74534b');
  for(let i=0;i<6;i++){const y=285+i*14;b+=L(`M181 ${y}H314M318 ${y}L414 ${y-52}`,'#4e4241',1.2,'opacity=".4"');}
  b+=P('M179 272L247 185L316 272Z','#aa7c65');
  b+=P('M166 279L247 177L347 125L266 227Z','#7b6870')+P('M247 177L347 125L429 227L329 279Z','#8d4f64');
  b+=P('M161 276L245 168Q251 165 257 168L350 116Q357 119 360 125L435 219Q438 227 430 232L328 287Q316 288 316 276L248 191L176 284Q163 289 161 276Z',u('snow'),'stroke="#fffefa" stroke-width="2"');
  b+=L('M251 176L349 125L426 222','#fffefd',4,'opacity=".85"')+L('M325 280L425 227','#cadfe9',3);
  b+=P('M344 178V123L367 112L367 166Z','#8f7280')+P('M367 112L382 121V174L367 166Z','#624f66')+P('M340 122L365 106L388 116L369 131Z','#e6f0f4');
  b+=L('M364 98Q350 85 363 70Q378 56 366 42','#e8f2f6',8,'opacity=".6"');
  b+=R(193,292,48,49,4,'#e6e7dc')+R(198,297,38,39,2,'#e5b65d')+L('M217 298V335M199 315H235','#9b6a55',3)+R(254,309,37,61,3,'#724c5d')+R(260,315,24,28,2,'#f3ca74')+C(283,350,2,'#e2c68f');
  b+=P('M340 278L377 259L377 300L340 319Z','#dfE9e6')+P('M346 281L371 268L371 297L346 310Z','#edc979')+L('M358 275V304M347 294L370 282','#a17963',2);
  b+=P('M169 369Q201 357 223 369Q256 358 279 371Q310 358 330 370L326 384H168Z',u('snow'));
  b+=pine(116,372,245,true);
  b+=P('M286 399Q327 369 404 385Q456 396 435 425Q408 449 338 442Q284 439 286 419Z',u('ice'),'stroke="#faffff" stroke-width="4"')+L('M317 405L395 395M332 422L421 408M359 432L401 425','#f7ffff',2.3,'opacity=".8"');
  for(const [x,y,rx] of [[159,408,27],[229,428,34],[477,389,25]])b+=E(x,y,rx,11,'#c1d5df','opacity=".45"')+E(x-3,y-4,rx,10,'#fffefd');
  b+=L('M264 388l8 2m-18 9l8 2m-18 9l8 2','#96b4c4',3,'opacity=".6"');
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" role="img" aria-labelledby="${prefix}title ${prefix}desc" data-season-scene="${key}" data-season-motif="${p.motif}"><title id="${prefix}title">${p.title}</title><desc id="${prefix}desc">${p.alt}. Kalendārs365 oriģināla telpiska vektoru ilustrācija.</desc><defs>${defs}</defs>${b}</svg>\n`;
}
fs.mkdirSync('assets/season-scenes',{recursive:true});
const scenes=Object.entries(seasons).map(([key,p])=>{const svg=scene(key),src='/assets/season-scenes/'+key+'.svg';fs.writeFileSync('.'+src,svg);return {key,...p,alt:p.alt+' · vektoru ilustrācija',src,width:600,height:500,bytes:Buffer.byteLength(svg),sha256:crypto.createHash('sha256').update(svg).digest('hex')};});
fs.writeFileSync('_data/season-scenes.json',JSON.stringify({source:'scripts/build_season_scenes.mjs',copyright:'Kalendārs365 oriģinālas vektoru ilustrācijas',scenes},null,2)+'\n');
console.log(JSON.stringify({seasonScenes:scenes.length,uniqueMotifs:new Set(scenes.map(s=>s.motif)).size,bytes:scenes.reduce((n,s)=>n+s.bytes,0)}));
