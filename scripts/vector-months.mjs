// Original, code-native seasonal drawings. Four composed arrangements per month.
// All detail is SVG geometry; no photographs, bitmap textures or traced assets.
export const monthNames = ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'];
export const monthSubjects = ['Apsarmojis egles zars un ledus kristāls','Čiekuri un ziemas skujas','Sniegpulkstenītes','Bērza pumpuri un jaunās lapas','Ceriņu ziedkopa','Ozollapu vainags un margrietiņas','Zemenes','Rudzu vārpas','Āboli un rudens lapas','Kļavas lapas un ozolzīles','Sveces gaisma un Latvijas krāsu lente','Egles zari un stikla rotājumi'];
const f = n => Number(n.toFixed(2));
const path = (d, fill, extra='') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const stroke = (d, color, width=1, opacity=1) => path(d,'none',`stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"`);
const group = (x,y,scale,angle,body) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${body}</g>`;
const circle = (x,y,r,fill,extra='') => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" ${extra}/>`;
const ellipse = (x,y,rx,ry,fill,extra='') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const material = (id,name) => `url(#${id}-m-${name})`;
function definitions(id) {
  const gradients = {
    green:['#b1c6a0','#62866b','#244c43'], leaf:['#d4dca3','#8ba66c','#43674e'],
    ice:['#ffffff','#dbeaf0','#8aafb9'], petal:['#ffffff','#f4f3e7','#c2d0c0'],
    wood:['#dfb47d','#956b43','#523a2d'], woodDark:['#c49866','#7e583b','#422e26'],
    purple:['#e4d8e7','#ad8bb8','#6a4f7e'], berry:['#f7a3a0','#b13a51','#67283b'],
    apple:['#f0b89d','#b95855','#762e43'], gold:['#fae4a3','#c8a463','#80603f'],
    copper:['#efbf82','#ce8251','#854b3c'], amber:['#fff1bb','#dfb256','#a16c31'],
    wax:['#fffdf0','#ece4cd','#c6bc9f'], pearl:['#ffffff','#ede6dc','#b1aaa3']
  };
  return `<defs>${Object.entries(gradients).map(([key,c])=>`<radialGradient id="${id}-m-${key}" cx="28%" cy="22%" r="85%"><stop stop-color="${c[0]}"/><stop offset=".47" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`).join('')}
    <linearGradient id="${id}-m-glass" x1="0" x2="1"><stop stop-color="#d9e4df" stop-opacity=".8"/><stop offset=".12" stop-color="#fff" stop-opacity=".72"/><stop offset=".4" stop-color="#e3ebe3" stop-opacity=".1"/><stop offset=".82" stop-color="#baccc6" stop-opacity=".38"/><stop offset="1" stop-color="#718e88" stop-opacity=".48"/></linearGradient>
    <linearGradient id="${id}-m-ribbon" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b95f70"/><stop offset=".43" stop-color="#853a50"/><stop offset=".72" stop-color="#9d425a"/><stop offset="1" stop-color="#60283d"/></linearGradient>
    <radialGradient id="${id}-m-flame" cx="40%" cy="70%"><stop stop-color="#fffce2"/><stop offset=".42" stop-color="#ffe1a2"/><stop offset=".8" stop-color="#e6ab5c"/><stop offset="1" stop-color="#c47c48"/></radialGradient>
    <filter id="${id}-m-shadow" x="-40%" y="-40%" width="180%" height="195%"><feDropShadow dx="1" dy="4" stdDeviation="2.4" flood-color="#2b3330" flood-opacity=".16"/></filter>
    <filter id="${id}-m-blur" x="-50%" y="-150%" width="200%" height="400%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>`;
}
function leaf(id,x,y,s=1,a=0,type='green') {
  const body=path('M0 12C-33-8-38-38 0-66C34-41 30-6 0 12Z',material(id,type))+
    path('M0 11C-17-13-20-39 0-65C-7-36-5-12 0 11Z','#f5f7db','opacity=".16"')+
    stroke('M0 17Q-7-23 0-61','#466453',1.1,.75)+
    stroke('M-2-5-17-16m14-5-16-12m17-1-11-12M-2-4 15-16M-3-20 15-32M-1-36 10-47','#dee7bc',.8,.62);
  return group(x,y,s,a,body);
}
function oak(id,x,y,s=1,a=0,autumn=false) {
  return group(x,y,s,a,
    path('M0 62C-9 52-27 56-28 43C-30 36-12 34-24 25C-49 17-41 3-24 6C-17 6-16 0-25-7C-42-17-31-29-17-23C-11-20-8-27-12-35C-21-51-5-59 0-70C8-59 23-51 14-36C9-27 13-21 20-24C36-31 44-17 27-8C17-3 20 5 27 4C46 1 48 18 29 24C17 27 19 34 29 39C42 48 22 59 9 54L0 62Z',material(id,autumn?'copper':'leaf'))+
    path('M0 61C-12 28-9-29 0-69C4-34 1 21 0 61Z','#edf1ce','opacity=".2"')+
    stroke('M0 75C-4 30-2-23 0-65',autumn?'#9b633e':'#47735a',1.9,.9)+
    stroke('M-1 39-22 43M-1 22-26 14M-1 4-25-13M0-15-16-33M0 40 24 44M-1 22 28 12M0 2 26-16M0-16 16-35',autumn?'#f9d29d':'#d4e1aa',1,.7));
}
function fir(id,x,y,s=1,a=0,snow=false) {
  let body=stroke('M0 10Q-4-45 0-114','#6e6248',2.2);
  for(let i=0;i<17;i++)for(const side of [-1,1]){
    const yy=-i*6.1, w=30-i*1.1;
    for(let j=0;j<3;j++){
      const xx=side*(w+j*2.2), tip=yy-19-j*3;
      body+=path(`M${f(-i*.09)} ${f(yy+4-j)}Q${f(xx*.56)} ${f(yy-5)} ${f(xx)} ${f(tip)}Q${f(xx*.47)} ${f(yy-8)} ${f(-i*.09)} ${f(yy+1-j)}Z`,material(id,j===2?'leaf':'green'));
      if(j===1)body+=stroke(`M${f(side*2)} ${f(yy+1)}Q${f(xx*.6)} ${f(yy-8)} ${f(xx)} ${f(tip)}`,'#b7c6a1',.55,.7);
    }
    if(snow&&i%3===0)body+=stroke(`M${f(side*8)} ${f(yy-1)}Q${f(side*21)} ${f(yy-8)} ${f(side*w)} ${f(yy-18)}`,'#f4faf6',3.1,.9);
  }
  return group(x,y,s,a,body);
}
function crystal(id,x,y,r,a=0) {
  let body='';
  for(let i=0;i<6;i++){
    const arm=path('M0 0-5-29 0-59 5-29Z',material(id,'ice'),'stroke="#a5c3cd" stroke-width=".65"')+
      path('M0-12-18-29-15-34 0-23 15-34 18-29Z',material(id,'ice'))+
      stroke('M0-2V-56m0 33-15-10m15 10 15-10','#fff',1.15,.85);
    body+=`<g transform="rotate(${i*60})">${arm}</g>`;
  }
  body+=circle(0,0,7,material(id,'ice'),'stroke="#aecad2" stroke-width=".8"');
  return group(x,y,r/59,a,body);
}
function cone(id,x,y,s=1,a=0) {
  let body=path('M0-62C26-51 41-21 37 12C34 39 18 60 0 65C-22 56-37 34-37 8C-38-25-25-53 0-62Z',material(id,'woodDark'));
  for(let row=0;row<9;row++){
    const yy=-47+row*12, extent=31*Math.sqrt(Math.max(.08,1-((yy+3)/66)**2)), count=row<2?3:row>6?4:5;
    for(let j=0;j<count;j++){
      const xx=(j-(count-1)/2)*(extent*2/count),w=extent/count+2;
      body+=path(`M${f(xx-w)} ${yy}Q${f(xx)} ${yy-10} ${f(xx+w)} ${yy}Q${f(xx+w-1)} ${yy+11} ${f(xx)} ${yy+16}Q${f(xx-w+1)} ${yy+10} ${f(xx-w)} ${yy}Z`,material(id,(row+j)%3===0?'woodDark':'wood'));
      body+=stroke(`M${f(xx-w+2)} ${yy+2}Q${f(xx)} ${yy-4} ${f(xx+w-2)} ${yy+2}`,'#f1c58d',.8,.62);
    }
  }
  return group(x,y,s,a,body);
}
function snowdrop(id,x,y,s=1,a=0,bud=false) {
  const body=stroke('M-10 87C-17 29-22-47 14-56Q41-63 39-26','#446f57',2.5)+
    path('M-10 85C-52 36-44-9-36-34C-38 13-20 49-10 85Z',material(id,'green'))+
    path('M-7 84C-1 48 18 8 26-2C20 37 6 66-7 84Z',material(id,'leaf'))+
    path('M25-24Q39-42 51-22L47-9 28-8Z',material(id,'green'))+
    (bud?ellipse(39,-1,10,24,material(id,'petal'),'transform="rotate(-12 39 -1)"'):
      path('M37-19C7-12 12 26 25 42C35 30 43-2 37-19Z',material(id,'petal'),'stroke="#b9cebd" stroke-width=".65"')+
      path('M39-19C32 0 34 35 43 44C62 25 68-7 39-19Z',material(id,'petal'),'stroke="#bdcdbc" stroke-width=".65"')+
      path('M39-16C30-1 29 22 37 31C48 18 51-2 39-16Z','#eef3dd')+
      path('M33 20Q37 15 42 20L38 27Z','#719470')+
      stroke('M26-9Q18 11 25 31M47-8Q54 8 44 32','#fff',1,.8));
  return group(x,y,s,a,body);
}
function birch(id,x,y,s=1,a=0,count=4) {
  let body=stroke('M-18 93Q8 4 3-92','#8d7250',3)+stroke('M-18 92Q5 1 2-91','#d1b98b',.8,.8);
  for(let i=0;i<count;i++){
    const yy=52-i*34, side=i%2?1:-1;
    body+=stroke(`M${f(-3-i)} ${yy+8}Q${side*16} ${yy-5} ${side*26} ${yy-24}`,'#8d7952',1.5);
    body+=leaf(id,side*27,yy-25,.49+i*.045,side*37,'leaf');
    body+=ellipse(side*7,yy-4,3.3,7,material(id,'amber'),`transform="rotate(${side*25} ${side*7} ${yy-4})"`);
  }
  body+=ellipse(5,-80,4,11,material(id,'amber'),'transform="rotate(14 5 -80)"');
  body+=path('M-28 12Q-36 26-28 32Q-19 25-28 12Z',material(id,'ice'),'stroke="#c9d7ce" stroke-width=".6"');
  return group(x,y,s,a,body);
}
function lilac(id,x,y,s=1,a=0,rows=7) {
  let body=stroke('M0 107Q4 37 0-28','#6a7652',3.5)+leaf(id,-5,83,.92,-51,'green')+leaf(id,8,89,.75,57,'leaf');
  for(let row=rows-1;row>=0;row--){
    const count=1+Math.floor(row*.8),yy=-76+row*17;
    for(let j=0;j<count;j++){
      const xx=(j-(count-1)/2)*17+(row%2?3:-2),cy=yy+(j%2?3:0);
      let flower='';for(let k=0;k<4;k++)flower+=`<ellipse cx="0" cy="-5.3" rx="4.6" ry="7.1" fill="${material(id,'purple')}" transform="rotate(${k*90})"/>`;
      flower+=circle(0,0,1.7,'#f5dfb9');
      body+=group(xx,cy,.84+(row%3)*.08,(row*17+j*31)%90,flower);
    }
  }
  return group(x,y,s,a,body);
}
function daisy(id,x,y,s=1,a=0) {
  let body='';for(let k=0;k<13;k++)body+=`<ellipse cx="0" cy="-18" rx="4.6" ry="17" fill="${material(id,'petal')}" stroke="#d8dfcf" stroke-width=".4" transform="rotate(${k*360/13})"/>`;
  body+=circle(0,0,10,material(id,'gold'));
  for(let i=0;i<18;i++){const angle=i*2.3999,r=Math.sqrt(i/18)*8;body+=circle(Math.cos(angle)*r,Math.sin(angle)*r,.75,i%2?'#e4c06d':'#886c38','opacity=".65"');}
  return group(x,y,s,a,body);
}
function berry(id,x,y,s=1,a=0) {
  let body=path('M0-23C-12-34-27-24-29-9C-33 10-12 41 0 48C13 41 34 8 28-11C24-30 10-33 0-23Z',material(id,'berry'));
  for(let row=0;row<7;row++){
    const yy=-16+row*8, width=23*(1-row/8),count=row<5?5:3;
    for(let j=0;j<count;j++){
      const xx=(j-(count-1)/2)*width*1.55/count+(row%2?1.5:-1.5);
      body+=ellipse(xx+.4,yy+.6,1.3,2.3,'#742c3e','opacity=".48"');
      body+=ellipse(xx,yy,0.7,1.6,'#f4d58f',`transform="rotate(${xx*.8} ${f(xx)} ${yy})"`);
    }
  }
  body+=stroke('M-21-9Q-25 5-13 23','#ffd8c7',1.6,.4);
  for(let i=0;i<5;i++)body+=`<path d="M0-20Q-7-27-5-38Q3-32 5-21Z" fill="${material(id,'green')}" transform="rotate(${i*72} 0 -20)"/>`;
  body+=stroke('M0-24Q-4-38 4-45','#557652',2);
  return group(x,y,s,a,body);
}
function rye(id,x,y,s=1,a=0,length=107) {
  let body=stroke('M0 98Q-4 20 0-82','#b49a62',1.7);
  for(let row=0;row<10;row++)for(const side of [-1,1]){
    const yy=-68+row*10,xx=side*(row<2?5:8);
    body+=path(`M0 ${yy+9}Q${side*14} ${yy+2} ${xx} ${yy-9}Q${side*1} ${yy-5} 0 ${yy+9}Z`,material(id,'gold'));
    body+=stroke(`M${xx} ${yy-7}Q${side*15} ${yy-26} ${side*(20+row*.65)} ${yy-41}`,'#c5ad75',.65,.85);
    body+=stroke(`M${side*2} ${yy+3} ${xx} ${yy-6}`,'#f9e6b0',.7,.72);
  }
  body+=path('M-1 77C-33 50-43 13-44-5Q-20 21-1 77Z',material(id,'leaf'),'opacity=".7"');
  return group(x,y,s*length/107,a,body);
}
function apple(id,x,y,s=1,a=0,cut=false) {
  let body;
  const outline='M0-39C-35-60-62-25-54 14C-48 45-22 64 0 54C25 66 49 43 54 12C64-29 34-58 0-39Z';
  if(cut){
    body=path(outline,material(id,'apple'))+path('M0-34C-29-52-55-23-48 13C-42 40-19 57 0 48C21 59 44 38 48 10C57-24 29-52 0-34Z',material(id,'wax'));
    body+=path('M-1-26Q-16-1-11 24Q-1 39 10 23Q16-1-1-26Z','#d2bc95','opacity=".45"');
    body+=ellipse(-6,11,3.3,6.2,'#77543c','transform="rotate(22 -6 11)"')+ellipse(7,12,3.2,6.3,'#79543b','transform="rotate(-23 7 12)"');
    body+=stroke('M0-29Q-5-8-1 30','#fdf9e7',1.1,.7);
  }else{
    body=path(outline,material(id,'apple'));
    for(let i=0;i<34;i++){const t=i*2.39996,r=Math.sqrt((i+.4)/34)*40;body+=ellipse(Math.cos(t)*r,Math.sin(t)*r+6,.65,1.2,'#f8d49d','opacity=".36"');}
    body+=path('M-38-12C-35-33-19-41-9-34C-18-32-30-18-31 2Z','#fff4da','opacity=".25"');
    body+=stroke('M8 47Q24 52 39 32','#692b3a',1.1,.22);
  }
  body+=stroke('M0-38Q-3-56 7-66','#70533c',4)+stroke('M0-40Q0-53 5-60','#bfa476',1,.9)+leaf(id,12,-47,.42,54,'green');
  return group(x,y,s,a,body);
}
function maple(id,x,y,s=1,a=0,type='copper') {
  return group(x,y,s,a,
    path('M0 65-13 37-32 44-31 24-61 12-45-1-60-28-32-22-28-49-12-38 0-73 13-38 30-48 33-20 60-27 47 0 62 13 31 25 32 44 13 37Z',material(id,type))+
    path('M0 63-12 3 0-71 7-8Z','#fff0c2','opacity=".2"')+
    stroke('M0 83V-64M0 6-47-19M0 6 48-18M0 22-43 16M0 22 43 16M0-6-23-38M0-6 24-38','#f5d1a0',1.5,.78)+
    stroke('M0 66 12 39M0 65-13 38','#865c3f',1,.45));
}
function acorn(id,x,y,s=1,a=0) {
  let body=path('M-18-12C-24 10-12 37 0 42C14 36 24 9 18-12Z',material(id,'amber'))+path('M-25-13Q-22-37 0-37Q22-35 25-13L20-2Q0 6-20-2Z',material(id,'wood'));
  for(let row=0;row<4;row++)for(let j=0;j<7-row;j++){const xx=(j-(6-row)/2)*6,yy=-28+row*7;body+=stroke(`M${xx-2} ${yy}q2 4 5 0`,'#ddbb83',.65,.72);}
  body+=stroke('M0-36Q-3-48 5-53','#6d6245',2.8)+stroke('M-11 5Q-13 19-3 29','#fff0bd',1.7,.6);
  return group(x,y,s,a,body);
}
function candle(id,x,y,s=1,a=0) {
  let body=path('M-42-50Q0-59 42-50L38 53Q0 67-38 53Z',material(id,'glass'),'stroke="#9eafa1" stroke-width="1"');
  body+=path('M-34-37Q0-45 34-37L30 47Q0 59-30 47Z',material(id,'wax'))+ellipse(0,-37,34,7,material(id,'pearl'));
  body+=ellipse(0,49,37,8,'#a6aa96','opacity=".2"')+stroke('M-31-39-29 43M32-42 29 42','#fff',2.4,.64)+stroke('M-39-49Q0-59 39-49','#f7fbf1',1.6,.9);
  body+=stroke('M0-37Q-3-48 0-54','#61513d',2.2)+path('M0-108C9-91 25-71 6-53C-13-51-20-70-8-87Q-1-98 0-108Z',material(id,'flame'))+
    path('M0-81C9-70 12-59 1-55C-8-58-6-72 0-81Z','#fff9de');
  return group(x,y,s,a,body);
}
function ribbon(id,x,y,s=1,a=0) {
  return group(x,y,s,a,
    path('M-90-7Q-26 15 31-2Q62-11 92-1L84 22Q53 9 24 20Q-35 40-94 13L-76 12Z',material(id,'ribbon'))+
    path('M-89 1Q-24 22 29 7Q60-3 89 7L87 12Q58 2 26 12Q-31 29-91 6Z','#fff3e7')+
    path('M-94 13-76 12-84 22Z','#672438')+stroke('M-88-5Q-23 17 30 1Q64-9 90 1','#d18a93',.8,.8));
}
function bauble(id,x,y,r=44,type='berry') {
  let body=circle(0,0,r,material(id,type),'stroke="#694e4c" stroke-width=".45"');
  body+=ellipse(-r*.31,-r*.36,r*.23,r*.4,'#fff9ee',`opacity=".38" transform="rotate(32 ${-r*.31} ${-r*.36})"`);
  body+=stroke(`M${f(-r*.67)} ${f(-r*.2)}A${f(r*.73)} ${f(r*.73)} 0 0 1 ${f(-r*.09)} ${f(-r*.75)}`,'#fff8e8',1.7,.75);
  body+=path(`M-9 ${-r-5}h18l1 9h-20Z`,material(id,'gold'))+ellipse(0,-r-8,5,6,'none',`stroke="${material(id,'gold')}" stroke-width="1.8"`);
  body+=stroke(`M-5 ${-r-3}v5m5-5v5m5-5v5`,'#fff0bd',.8,.8);
  for(let i=0;i<12;i++){const t=i*2.39996,rr=Math.sqrt((i+.4)/12)*r*.78;body+=circle(Math.cos(t)*rr,Math.sin(t)*rr,.6,'#efd3a4','opacity=".3"');}
  return group(x,y,1,0,body);
}

export function monthArt(month,id,year=2027) {
  const v=((Number(year)-2027)%4+4)%4;
  let body='';
  switch(Number(month)){
    case 1: {
      const arrangements=[[[107,215,1.13,27],[211,112,59,8]],[[198,222,1.23,-33],[108,112,62,-4]],[[92,221,1.14,40],[202,103,48,0]],[[207,224,1.27,-24],[117,125,58,17]]];
      const [a,b]=arrangements[v];body=fir(id,...a,true)+crystal(id,...b);
      if(v===2)body+=crystal(id,241,178,24,17);
      if(v===3)body+=crystal(id,206,62,23,12);
      body+=ellipse(160,226,47,6,material(id,'ice'),'opacity=".5"');break;
    }
    case 2:
      body=fir(id,v%2?104:225,209,1.19,v%2?36:-35,true);
      for(const a of [ [[143,153,1.02,-21]], [[114,160,.84,-28],[196,163,.9,19]], [[160,154,1.08,7],[100,193,.55,-39]], [[107,181,.68,-36],[166,144,.9,-8],[221,182,.65,31]] ][v])body+=cone(id,...a);
      break;
    case 3:
      for(const a of [ [[111,151,.7,-21],[159,140,.93,-7],[199,154,.76,17]], [[114,148,.95,-25],[178,145,.86,12],[207,171,.56,31,true]], [[103,170,.61,-28],[130,137,.84,-15],[180,139,.93,11],[206,175,.56,29]], [[117,141,.91,-17],[170,131,.98,9],[218,179,.55,34,true]] ][v])body+=snowdrop(id,...a);
      break;
    case 4:
      for(const a of [ [[155,130,1.02,16,4]], [[124,142,.85,-19,4],[200,139,.75,21,3]], [[156,137,.99,-16,5]], [[123,147,.77,-33,3],[194,137,.92,17,4]] ][v])body+=birch(id,...a);
      break;
    case 5:
      for(const a of [ [[157,118,1.0,-8,7]], [[121,133,.76,-23,6],[194,127,.88,16,7]], [[202,146,.59,26,5],[143,118,1.0,-6,7]], [[102,148,.58,-26,6],[160,128,.83,0,7],[217,150,.57,27,6]] ][v])body+=lilac(id,...a);
      break;
    case 6: {
      const count=[10,12,9,11][v],rx=[70,66,74,68][v],ry=[66,72,60,68][v];
      body=ellipse(160,133,rx,ry,'none','stroke="#8d8e61" stroke-width="2.2"');
      for(let i=0;i<count;i++){const t=(i/count)*Math.PI*2-.3;body+=oak(id,160+Math.cos(t)*rx,133+Math.sin(t)*ry,.49+(i%3)*.04,i*360/count+v*13);}
      if(v===2){body=stroke('M160 211C134 168 112 120 122 81M160 211Q196 182 216 149','#648568',1.6)+oak(id,115,153,.83,-42)+oak(id,184,137,.96,13)+oak(id,221,161,.64,42)+ribbon(id,160,219,.43,-7);}
      if(v===3){body=stroke('M94 187C191 254 275 110 173 59','#8d8e61',2)+stroke('M94 187Q81 164 99 128','#648568',1.6);for(let i=0;i<9;i++){const t=-1.6+i*.33;body+=oak(id,170+Math.cos(t)*64,133+Math.sin(t)*72,.5+i%2*.05,i*21+10);}}
      for(const a of [[[108,96,.57,17],[214,163,.62,8]],[[107,162,.59,0],[210,99,.55,12],[177,204,.4,0]],[[122,81,.59,15],[216,149,.65,0]],[[99,128,.61,0],[203,88,.48,11],[206,190,.48,0]]][v])body+=daisy(id,...a);
      break;
    }
    case 7:
      body=leaf(id,123,139,1.1,-37,'green')+leaf(id,197,135,.85,49,'leaf');
      for(const a of [ [[124,165,.95,-28],[190,172,1.12,17],[160,109,.6,-8]], [[112,158,.76,-33],[158,187,1.05,-7],[210,153,.97,22]], [[120,182,1.12,-28],[201,165,1.08,22]], [[104,176,.73,-36],[162,169,1.15,1],[216,183,.72,32],[186,109,.59,11]] ][v])body+=berry(id,...a);
      break;
    case 8:
      for(const a of [ [[121,138,.87,-21],[163,124,.97,0],[201,141,.8,22]], [[103,146,.76,-24],[144,130,.96,-9],[184,130,.95,9],[218,151,.73,27]], [[129,138,.97,-17],[199,137,.96,19]], [[95,160,.65,-37],[127,141,.83,-22],[159,128,.99,-4],[195,136,.87,16],[226,157,.69,34]] ][v])body+=rye(id,...a);
      body+=ribbon(id,160,205,.37,v-1);break;
    case 9:
      body=leaf(id,v%2?113:210,145,1.05,v%2?-44:48,'leaf');
      for(const a of [ [[148,159,1.05,-10],[214,194,.56,19,true]], [[112,180,.79,-16],[197,155,1.0,8]], [[154,164,1.05,8,true],[219,192,.52,24]], [[118,178,.87,-17],[199,165,.97,11],[154,213,.46,-38,true]] ][v])body+=apple(id,...a);
      break;
    case 10:
      for(const a of [ [[151,121,1.02,-24,'copper'],[213,169,.58,37,'gold']], [[112,147,.78,-40,'gold'],[191,129,.96,18,'copper']], [[151,126,.98,9,'copper'],[93,171,.55,-39,'amber']], [[123,138,.88,-30,'copper'],[206,131,.7,33,'gold']] ][v])body+=maple(id,...a);
      if(v===2)body+=maple(id,226,159,.51,32,'gold');
      if(v===3)body+=oak(id,168,161,.57,15,true);
      body+=acorn(id,183,204,.72,31)+(v===2?'':acorn(id,139,214,.57,-35));break;
    case 11:
      if(v===0)body=candle(id,166,161,.99,0)+ribbon(id,159,217,.88,-7);
      if(v===1)body=candle(id,122,172,.76,-3)+candle(id,199,150,.9,2)+ribbon(id,161,220,.84,4);
      if(v===2)body=oak(id,110,177,.65,-49,true)+candle(id,188,157,.96,0)+ribbon(id,153,219,.86,-6);
      if(v===3)body=ellipse(162,219,88,12,material(id,'pearl'))+candle(id,146,168,.85,-1)+ribbon(id,189,210,.64,19);
      break;
    case 12: {
      body=fir(id,v%2?230:101,158,1.11,v%2?-48:48)+fir(id,v%2?145:223,109,.83,v%2?22:-24);
      const balls=[[[179,176,48,'berry']],[[133,174,46,'pearl'],[212,188,29,'berry']],[[126,178,36,'gold'],[198,170,49,'berry']],[[163,171,49,'berry'],[224,111,23,'pearl']]][v];
      for(const [x,y,r,t]of balls){body+=stroke(`M${x} ${y-r-15}Q${x-3} 89 ${x+8} ${v%2?56:64}`,'#bb9f72',1.1,.85)+bauble(id,x,y,r,t);}
      break;
    }
    default: throw new RangeError('Month must be 1–12');
  }
  const winter=[1,2,12].includes(Number(month));
  return `${definitions(id)}<ellipse cx="160" cy="140" rx="112" ry="98" fill="${winter?'#eef3f1':'#f6f2e7'}" opacity=".46"/><ellipse cx="163" cy="235" rx="77" ry="6" fill="#445049" opacity=".12" filter="url(#${id}-m-blur)"/><g data-month-composition="${year}-${month}" filter="url(#${id}-m-shadow)">${body}</g>`;
}
