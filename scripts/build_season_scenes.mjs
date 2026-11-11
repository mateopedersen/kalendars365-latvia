// Original vector landscape miniatures. All surfaces and vegetation are SVG geometry.
import fs from 'node:fs';
import crypto from 'node:crypto';

const palettes={
 spring:{title:'Pavasaris',alt:'Pavasara ainava ar bērzu pumpuriem, jaunām lapām, strautu un sniegpulkstenītēm',sky:'#e9eee0',ground:['#c2c88b','#8da274','#536b4d'],leaf:['#d5dda0','#95b768','#5c8055'],water:['#b9d8d6','#719c9c','#486f78']},
 summer:{title:'Vasara',alt:'Vasaras ainava ar kuplu ozolu, zaļu bērzu, ziedošu pļavu un dzidru strautu',sky:'#f7ebc9',ground:['#b4bf6c','#758c48','#3b5d3a'],leaf:['#bdcf71','#6e984c','#365d3c'],water:['#b7dbd5','#5f9e9d','#346f7b']},
 autumn:{title:'Rudens',alt:'Rudens ainava ar zeltainu bērzu, vara krāsas ozola lapām un kritušu lapu segu',sky:'#f3e3d5',ground:['#d6b77f','#b38a58','#775a44'],leaf:['#edc56f','#c5853e','#934e35'],water:['#d4d7c9','#8ca9a6','#536f79']},
 winter:{title:'Ziema',alt:'Ziemas ainava ar apsnigušu egli, kailiem koku zariem un apledojušu strautu',sky:'#e1ebed',ground:['#fffdf6','#e0e9e8','#adc3cc'],leaf:['#d7e4e1','#b0c8ca','#6d929b'],water:['#f0f7f3','#bdD5dc','#80a9bc']}
};
const fmt=n=>Number(n.toFixed(2));
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${fmt(x)}" cy="${fmt(y)}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function render(type){
 const p=palettes[type],id='season-scene-'+type,u=n=>`url(#${id}-${n})`,rand=random(365);
 const gradient=(name,colors,radial=false)=>`<${radial?'radialGradient':'linearGradient'} id="${id}-${name}" ${radial?'cx="29%" cy="20%" r="84%"':'x1="15%" y1="0" x2="86%" y2="100%"'}>${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${c}"/>`).join('')}</${radial?'radialGradient':'linearGradient'}>`;
 const leafShapes={oak:'M0 0C-7-2-9-7-5-9C-12-12-8-17-3-15C-8-21-3-25 1-21C0-29 7-29 8-22C14-26 19-21 13-16C21-18 22-10 15-8C20-4 15 1 8 0L2 4Z',birch:'M0 2L-4-3-9-5-7-9-12-12-8-16-10-20-5-23-4-28 2-30 9-38 13-27 18-24 16-19 20-15 16-11 17-6 11-4 9 0Z'};
 let defs=gradient('ground',p.ground)+gradient('leaf',p.leaf,true)+gradient('leaf-light',[p.leaf[0],p.leaf[1],p.leaf[2]],true)+gradient('wood',['#c8a27a','#795c43','#403b30'])+gradient('soil',['#cbb28a','#89765c','#514f43'])+gradient('water',p.water)+gradient('stone',['#e6e4d7','#abae9e','#6b7872'])+gradient('pine',['#719b80','#3b6855','#24483e'])+gradient('snow',['#fffefa','#edf2ed','#b4cbd2'])+gradient('sun',['#fff8d9','#edc17b','#c58a51'],true);
 defs+=`<radialGradient id="${id}-air"><stop stop-color="${p.sky}" stop-opacity=".9"/><stop offset="1" stop-color="${p.sky}" stop-opacity="0"/></radialGradient><filter id="${id}-shadow" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>`;
 for(const kind of ['oak','birch'])defs+=`<g id="${id}-${kind}-leaf">${path(leafShapes[kind],u('leaf'))}${path(kind==='oak'?'M2 2Q7-9 7-22M6-10L-3-16M7-14L13-19':'M1 1L9-31M5-14L-4-22M6-18L15-24','none','stroke="#fff2c6" stroke-width=".8" opacity=".25"')}</g>`;
 const top='M83 326C65 307 103 274 153 257C202 236 236 227 282 232C333 212 386 230 434 253C479 271 526 292 518 324C496 355 426 383 351 400C290 415 221 404 164 385C118 375 77 355 83 326Z';
 let body=ellipse(299,239,260,215,u('air'));
 const sx=type==='winter'?465:type==='autumn'?465:448,sy=type==='winter'?235:type==='autumn'?166:type==='spring'?99:71,sr=type==='winter'?24:29;
 body+=ellipse(sx,sy,sr*1.8,sr*1.8,u('air'))+`<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${u('sun')}" opacity="${type==='winter'?'.68':'.88'}"/>`;
 body+=ellipse(304,423,206,15,'#5c4c44','opacity=".17" filter="'+u('shadow')+'"');
 body+=path('M83 326C65 307 103 274 153 257C202 236 236 227 282 232C333 212 386 230 434 253C479 271 526 292 518 324L516 345C489 378 421 402 351 419C290 434 222 422 164 404C117 395 78 374 82 349Z',u('soil'));
 body+=path('M88 347Q115 373 170 385T277 410Q348 429 432 386M125 377L122 389M176 393L172 409M219 402L222 418M381 407L376 417','none','stroke="#eee2c5" stroke-opacity=".22" stroke-width="1.2"');
 body+=path(top,u('ground'),'stroke="'+p.ground[1]+'" stroke-width="1"');
 body+=path('M89 325C80 343 126 366 164 377C228 398 285 408 345 394','none','stroke="'+p.ground[0]+'" stroke-width="3" opacity=".75"');
 // A shallow stream follows the terrain rather than floating above its surface.
 const river='M463 278C421 280 452 297 417 311C383 326 382 329 398 342C421 362 378 383 334 402L366 396C414 381 445 358 426 340C403 325 425 322 441 313C481 295 446 290 482 287Z';
 body+=path(river,u('water'),'stroke="'+p.water[2]+'" stroke-opacity=".35" stroke-width="1"');
 body+=path('M465 282C435 283 467 298 426 315M412 334Q392 332 414 348M406 370L380 383M375 391L351 400','none','stroke="#f7fff9" stroke-width="1.5" stroke-linecap="round" opacity=".65"');
 if(type==='winter')body+=path('M430 301L443 307L432 316L435 325M408 346L421 352L409 359M388 379L393 383L379 389','none','stroke="#6995a6" stroke-width=".9" opacity=".6"');
 function stone(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">${ellipse(0,4,14,5,'#364f41','opacity=".13"')}${path('M-12 2L-9-8L1-13L13-5L16 2L6 7L-4 7Z',u('stone'))}${path('M-9-7L1-12L9-7L3-3L-8-2Z','#f0eee0','opacity=".42"')}${type==='winter'?path('M-12-2Q-13-8-7-10Q0-17 8-10Q17-7 14-1L7 2L-2 0Z',u('snow')):''}</g>`;}
 body+=stone(380,371,.8)+stone(458,320,.65)+stone(144,337,.95)+stone(159,345,.55);
 // Fine ground blades, foliage and flowers are kept inside the miniature's footprint.
 let ground='';for(let i=0;i<105;i++){const x=116+rand()*369,y=290+rand()*91;if(((x-300)/205)**2+((y-325)/74)**2>1||x>365&&x<460)continue;const h=3+rand()*10;
 if(type==='winter'){if(i%5===0)ground+=path(`M${fmt(x)} ${fmt(y)}q-2-${fmt(h)} 1-${fmt(h+3)}`,'none','stroke="#929f8c" stroke-width=".8" opacity=".55"');}
 else if(type==='autumn'){ground+=`<use href="#${id}-oak-leaf" transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rand()*360)}) scale(${fmt(.12+rand()*.08)} .13)" opacity=".85"/>`;}
 else ground+=path(`M${fmt(x)} ${fmt(y)}q-3-${fmt(h)}-6-${fmt(h-1)}m6 ${fmt(h-1)}q1-${fmt(h+3)} 4-${fmt(h+4)}`,'none',`stroke="${i%2?'#577c47':'#d0cf9d'}" stroke-width=".85" opacity=".8"`);
 }body+=ground;
 function pine(x,y,height){let s=ellipse(x+7,y+2,28,7,'#385144','opacity=".13"')+path(`M${x-3} ${y}L${x-2} ${y-height}L${x+2} ${y-height}L${x+4} ${y}`,u('wood'));
 for(let i=7;i>=0;i--){const yy=y-height+13+i*(height-20)/8,w=9+i*4.8;s+=path(`M${x} ${yy-30}Q${x-w*.35} ${yy-7} ${x-w} ${yy+9}L${x-w*.73} ${yy+7}L${x-w*.8} ${yy+14}Q${x} ${yy+23} ${x+w} ${yy+11}Q${x+w*.4} ${yy-5} ${x} ${yy-30}Z`,u('pine'));s+=path(`M${x} ${yy-25}Q${x-w*.3} ${yy-3} ${x-w*.7} ${yy+7}`,'none','stroke="#adc8a0" stroke-width="1" opacity=".3"');if(type==='winter')s+=path(`M${x} ${yy-28}Q${x-w*.3} ${yy-8} ${x-w*.79} ${yy+5}Q${x-w*.27} ${yy+3} ${x-w*.16} ${yy+7}Q${x+w*.25} ${yy+13} ${x+w*.7} ${yy+7}Q${x+w*.28} ${yy-8} ${x} ${yy-28}Z`,u('snow'));}
 return s;}
 body+=pine(444,291,145)+pine(478,303,100);
 function tree(kind,x,y,height,seed){const rng=random(seed),branches=[],tips=[];const birch=kind==='birch';
 function grow(ax,ay,len,angle,width,depth){const lean=(rng()-.5)*.2,ex=ax+Math.cos(angle+lean)*len,ey=ay+Math.sin(angle+lean)*len;branches.push({ax,ay,ex,ey,width,depth});if(depth<=1)tips.push([ex,ey,depth]);if(depth){grow(ex,ey,len*(birch?.69:.73),angle-.42-rng()*.12,width*.63,depth-1);grow(ex,ey,len*(birch?.67:.7),angle+.39+rng()*.18,width*.6,depth-1);}}
 grow(0,0,height*.34,-Math.PI/2,birch?7:13,4);let s=ellipse(x+17,y+5,height*.32,8,'#304e3a','opacity=".13"');let wood='';
 for(const b of branches){const d=`M${fmt(b.ax)} ${fmt(b.ay)}Q${fmt((b.ax+b.ex)/2+2)} ${fmt((b.ay+b.ey)/2)} ${fmt(b.ex)} ${fmt(b.ey)}`;wood+=path(d,'none',`stroke="${birch?(b.width>2?'#e7e3d5':'#788577'):'#66513c'}" stroke-width="${fmt(b.width)}" stroke-linecap="round"`)+path(d,'none',`stroke="${birch?'#4b5c54':'#d2ac7b'}" stroke-opacity="${birch?'.38':'.27'}" stroke-width="${fmt(Math.max(.6,b.width*.18))}" stroke-linecap="round"`);
 if(type==='winter'&&b.depth>0&&b.width>2)wood+=path(`M${fmt(b.ax-1)} ${fmt(b.ay-2)}Q${fmt((b.ax+b.ex)/2)} ${fmt((b.ay+b.ey)/2-3)} ${fmt(b.ex-1)} ${fmt(b.ey-2)}`,'none',`stroke="#f3f6ef" stroke-width="${fmt(b.width*.5)}" stroke-linecap="round"`);}
 if(birch)for(let i=0;i<15;i++){const yy=-i*8.6-4;wood+=path(`M-2 ${fmt(yy)}l${i%3===0?5:3} -1M-3 ${fmt(yy-4)}h2`,'none','stroke="#455148" stroke-width="1.3" opacity=".8"');}
 else wood+=path('M-3-4Q-7-39-2-67M3-10Q0-41 3-57','none','stroke="#d0aa76" stroke-width="1.1" opacity=".5"');
 let foliage='';
 if(type!=='winter'){
 const crown=birch?'M-62-149C-78-168-61-193-46-195C-49-218-20-230-6-215C10-234 38-220 39-203C63-211 80-187 68-173C84-155 65-137 51-139C48-119 19-115 9-128C-8-108-33-118-34-134C-48-124-65-135-62-149Z':'M-103-137C-126-156-111-185-88-188C-91-212-66-228-45-215C-33-245-2-246 17-229C39-248 68-230 66-213C95-224 120-201 107-179C132-163 113-137 93-136C88-113 58-109 42-121C28-99 0-108-12-119C-33-101-63-113-65-131C-83-118-103-123-103-137Z';
 foliage+=path(crown,u('leaf'),`opacity="${type==='spring'?(birch?'.45':'.17'):'.94'}"`);
 const count=type==='spring'?70:300;
 for(let i=0;i<count;i++){const a=rng()*Math.PI*2,r=Math.sqrt(rng()),xx=Math.cos(a)*r*(birch?57:94),yy=-(birch?169:171)+Math.sin(a)*r*(birch?48:54);foliage+=`<use href="#${id}-${kind}-leaf" transform="translate(${fmt(xx)} ${fmt(yy)}) rotate(${fmt(rng()*335)}) scale(${fmt(.23+rng()*.2)})"/>`;}
 for(const [tx,ty,depth] of tips){const count=type==='spring'?(birch?9:5):birch?22:25;for(let i=0;i<count;i++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*(birch?18:24),xx=tx+Math.cos(a)*r,yy=ty+Math.sin(a)*r*.8;foliage+=`<use href="#${id}-${kind}-leaf" transform="translate(${fmt(xx)} ${fmt(yy)}) rotate(${fmt(rng()*335)}) scale(${fmt((birch?.22:.28)+rng()*.22)})" ${type==='autumn'&&i%4===0?'style="filter:brightness(1.15)"':''}/>`;}}
 }
 if(type==='spring')for(const [tx,ty] of tips)foliage+=ellipse(tx,ty,2,3,'#d1bd8e','transform="rotate(-25 '+fmt(tx)+' '+fmt(ty)+')"');
 return s+`<g transform="translate(${x} ${y})">${wood}${foliage}</g>`;}
 body+=tree('birch',204,296,213,31)+tree('oak',335,316,229,178);
 function flower(x,y,scale){let s=path('M0 0Q-3-15 1-24','none','stroke="#638655" stroke-width="1.8"')+path('M-1-3Q-12-14-8-22Q-1-18-1-3M0-6Q5-23 9-24Q10-10 0-6','#8ca573');
 if(type==='spring')s+=path('M1-24Q12-32 14-19Q18-12 11-10Q5-12 8-19Q8-27 1-24Z','#faf9e9','stroke="#c3d1be" stroke-width=".8"')+path('M9-19Q12-16 11-12','none','stroke="#d5d8c0" stroke-width="1.2"');
 else {for(let i=0;i<8;i++)s+=ellipse(2+Math.cos(i*Math.PI/4)*5,-24+Math.sin(i*Math.PI/4)*4,3,2.4,'#fffbed',`transform="rotate(${i*45} 2 -24)"`);s+=ellipse(2,-24,3.2,3,'#dfb65f');}
 return `<g transform="translate(${x} ${y}) scale(${scale})">${s}</g>`;}
 if(['spring','summer'].includes(type))for(const [x,y,scale] of [[170,368,.9],[185,372,.7],[249,388,.8],[287,379,.65],[139,321,.6],[306,354,.5]])body+=flower(x,y,scale);
 if(type==='autumn')body+=path('M223 365v-16m14 20v-11','none','stroke="#d5bc8c" stroke-width="4" stroke-linecap="round"')+path('M209 351Q211 332 225 334Q238 334 239 350Q226 356 209 351Z','#8e6349','stroke="#c29c75" stroke-width="1"')+path('M229 359Q230 347 239 348Q247 348 249 358Q241 362 229 359Z','#ab7c51');
 if(type==='winter')body+=path('M112 336Q129 329 145 334M174 367Q201 360 223 367M273 390Q297 386 318 389','none','stroke="#fffef9" stroke-width="5" stroke-linecap="round"');
 body+=ellipse(167,395,25,5,'#fff9e7','opacity=".12"');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" role="img" aria-labelledby="${id}-title ${id}-desc" data-season-scene="${type}"><title id="${id}-title">${p.title}</title><desc id="${id}-desc">${p.alt}. Oriģināla telpiska vektoru ilustrācija, nevis konkrētās dienas laikapstākļi.</desc><defs>${defs}</defs>${body}</svg>\n`;
}
fs.mkdirSync('assets/season-scenes',{recursive:true});
const scenes=Object.entries(palettes).map(([key,p])=>{const svg=render(key),src='/assets/season-scenes/'+key+'.svg';fs.writeFileSync('.'+src,svg);return {key,title:p.title,alt:p.alt+' · vektoru ilustrācija',src,width:600,height:500,bytes:Buffer.byteLength(svg),sha256:crypto.createHash('sha256').update(svg).digest('hex')};});
fs.writeFileSync('_data/season-scenes.json',JSON.stringify({source:'scripts/build_season_scenes.mjs',copyright:'Kalendārs365 oriģinālas vektoru ilustrācijas',scenes},null,2)+'\n');
console.log(JSON.stringify({seasonScenes:scenes.length,bytes:scenes.reduce((n,s)=>n+s.bytes,0)}));
