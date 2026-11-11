import {fitSize,wrapText} from './planner-font-metrics.mjs';

// One exact month snapshot powers the live preview, print, PDF and Image.
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const labels={day:'Dienas maiņa',night:'Nakts maiņa',off:'Brīvdiena'},codes={day:'D',night:'N',off:'B'};
const weekdays=['P.','O.','T.','C.','Pk.','S.','Sv.'];
const dateLabel=date=>new Intl.DateTimeFormat('lv-LV',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric'}).format(new Date(date+'T12:00:00Z'));
const num=n=>Number(n).toLocaleString('lv-LV',{maximumFractionDigits:2});
export const shiftDesigns=[
 ['Karmīna maiņas','Mēneša režģis ar darba un atpūtas kopsavilkumu.','calendar','#852843','#fffdf8','#f2e4e5','clock'],
 ['Diena un nakts','Divas laika līnijas, kas parāda arī nakts maiņas turpinājumu.','timeline','#345565','#fbfdfe','#e5edf2','orbit'],
 ['Darba ajanda','Mēneša dienas divās detalizētās tabulās.','ledger','#315d52','#fcfdf7','#e4ede5','leaves'],
 ['Baltijas ritms','Dienu kartītes mierīgos Baltijas piekrastes toņos.','cards','#316d7b','#fcfefe','#e3eff0','coast'],
 ['Dzintara stundas','Atskaites tabula ar laikiem, pauzēm un stundām.','ledger','#8b6027','#fffdf5','#f4e8cc','amber'],
 ['Tīrs darba mēnesis','Skaidrs mēneša režģis taupīgai melnbaltai drukai.','calendar','#34393e','#ffffff','#f0f1ef','paper'],
 ['Nakts maiņu karte','Precīzs stundas pārskats ar zvaigžņotas nakts ilustrāciju.','timeline','#354861','#fcfdff','#e7ebf3','stars'],
 ['Maiņu mehānika','Dienu kartītes ar ritma un mehānisma ilustrāciju.','cards','#66516e','#fffdfd','#ede6ef','gears'],
 ['Rīgas darba dienas','Mēneša režģis ar oriģinālu Rīgas silueta zīmējumu.','calendar','#84354a','#fffdf6','#f2e3dc','riga'],
 ['Meža atelpa','Gaiša dienu kartīšu lapa ar meža iedvesmotu noformējumu.','cards','#506846','#fcfdf6','#e8eedf','forest'],
 ['Latvju ritms','Maiņu saraksts ar oriģinālu ģeometrisku rakstu joslu.','ledger','#942d43','#fffdf7','#f5e5e3','weave'],
 ['Ziemeļu laiks','Laika joslas un precīzi maiņu intervāli vēsos toņos.','timeline','#416879','#fbfefe','#e2edf1','aurora'],
 ['Nedēļas nogales','Mēneša skats ar mierīgu brīvo dienu akcentu.','calendar','#685565','#fffcfa','#eee6eb','compass'],
 ['Profesionālais pārskats','Kompakta tabula katras maiņas pārbaudei.','ledger','#2b5056','#ffffff','#e5eeed','architecture'],
 ['Rīta sākums','Dienu kartītes ar siltu saullēkta ilustrāciju.','cards','#935a37','#fffbf5','#f4e6d5','sunrise']
].map(([name,description,layout,accent,paper,pale,motif],i)=>({id:i+1,name,description,layout,accent,paper,pale,motif}));

export function shiftModel(state,year,month,K){
 const s=K.normalizeShift(state),rows=K.shiftMonth(s,Number(year),Number(month));
 const periodLabel=new Intl.DateTimeFormat('lv-LV',{timeZone:'UTC',month:'long',year:'numeric'}).format(new Date(Date.UTC(Number(year),Number(month)-1,1)));
 // The first displayed day may carry the tail of the preceding month's night.
 const priorDate=new Date(Date.UTC(Number(year),Number(month)-1,0)).toISOString().slice(0,10),offset=(Date.parse(priorDate)-Date.parse(s.anchor))/86400000,base=s.cycle[(offset%s.cycle.length+s.cycle.length)%s.cycle.length],override=s.overrides[priorDate];
 const prior=override?(override.kind==='off'?{kind:'off'}:s.cycle.find(r=>r.kind===override.kind)||{kind:override.kind,start:override.kind==='night'?'20:00':'08:00',end:override.kind==='night'?'08:00':'20:00'}):base;
 const previousShift={...prior,date:priorDate,overnight:prior.kind!=='off'&&prior.end<=prior.start};
 return {kind:'shift',type:'month',title:s.name,periodLabel:periodLabel[0].toUpperCase()+periodLabel.slice(1),year:Number(year),month:Number(month),anchor:s.anchor,cycle:s.cycle.map(r=>({...r})),previousShift,rows:rows.map(r=>({...r,text:[labels[r.kind],r.kind==='off'?'':r.start+'-'+r.end+(r.overnight?' (+1 diena)':''),r.note||''].filter(Boolean).join(' · ')}))};
}
export const shiftFilename=(model,design)=>`kalendars365-mainu-grafiks-${model.year}-${String(model.month).padStart(2,'0')}-${String(design).padStart(2,'0')}`;

export function shiftScenes(model,{design=1}={}){
 const cfg=shiftDesigns[Number(design)-1];if(!cfg)throw Error('Izvēlies vienu no 15 maiņu grafika dizainiem.');
 const year=Number(model.year),month=Number(model.month),total=new Date(Date.UTC(year,month,0)).getUTCDate(),prefix=`${year}-${String(month).padStart(2,'0')}-`;
 if(!Number.isInteger(year)||year<2027||year>2030||!Number.isInteger(month)||month<1||month>12)throw Error('Izvēlies mēnesi 2027.–2030. gadā.');
 const rows=Array.from({length:total},(_,i)=>model.rows?.find(r=>r.date===prefix+String(i+1).padStart(2,'0')));
 if(rows.some(r=>!r||!Object.hasOwn(labels,r.kind)||!Number.isFinite(r.hours)))throw Error('Maiņu pārskatā trūkst derīgu dienu.');
 const {accent,paper,pale,layout,motif}=cfg,ink='#30353d',muted='#626772',rule='#d7d8d4',dayFill='#e4eee8',nightFill='#e7e9f2',offFill='#f4f1ea',extra=[];
 const rect=(x,y,w,h,fill='none',stroke='none',rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width=".7"/>`;
 const path=(d,fill='none',stroke='none',w=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
 const line=(x1,y1,x2,y2,c=rule,w=.6)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
 const circle=(cx,cy,r,fill,stroke='none')=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width=".8"/>`;
 const text=(value,x,y,size=12,c=ink,bold=false,width=920,anchor='start')=>`<text x="${x}" y="${y}" font-family="DM Sans, Arial, sans-serif" font-size="${fitSize(value,size,width,bold)}" fill="${c}"${bold?' font-weight="700"':''}${anchor!=='start'?` text-anchor="${anchor}"`:''}>${E(value)}</text>`;
 const color=r=>r.kind==='day'?dayFill:r.kind==='night'?nightFill:offFill;
 const shortDate=d=>d.slice(8)+'.'+d.slice(5,7)+'.';
 function icon(kind,x,y,r=8){if(kind==='off')return circle(x,y,r,'none','#7f8278')+path(`M${x-r*.4} ${y}L${x-r*.05} ${y+r*.35}L${x+r*.5} ${y-r*.38}`,'none','#7f8278',1.2);if(kind==='night')return path(`M${x+3} ${y-r}C${x-r-7} ${y-r} ${x-r-7} ${y+r+3} ${x+3} ${y+r}C${x-5} ${y+r-1} ${x-6} ${y-r+2} ${x+3} ${y-r}Z`,'#687b9e');let s=circle(x,y,r*.58,'#cc9b4e');for(let i=0;i<8;i++){const a=i*Math.PI/4;s+=line(x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8,x+Math.cos(a)*r*1.13,y+Math.sin(a)*r*1.13,'#b88b43',.9);}return s;}
 function clock(x,y,r){let s=circle(x,y,r,pale,accent)+circle(x,y,r-5,paper,accent);for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=line(x+Math.sin(a)*(r-10),y-Math.cos(a)*(r-10),x+Math.sin(a)*(r-7),y-Math.cos(a)*(r-7),accent,1);}return s+line(x,y,x+17,y-17,accent,2)+line(x,y,x-11,y-19,accent,2.5)+circle(x,y,2.5,accent);}
 function art(){switch(motif){
  case 'clock':return clock(853,66,40)+path('M744 105Q744 38 790 38M774 32L790 38L778 50','none',accent,1.5)+text('D / N / B',743,101,12,accent,true,70);
  case 'orbit':return icon('day',771,61,24)+icon('night',906,61,24)+path('M800 47Q836 28 876 47M800 79Q836 97 876 79','none',accent,1.3)+circle(838,36,3,accent)+circle(838,90,3,accent);
  case 'leaves':return [0,1,2,3].map(i=>{const x=746+i*59;return path(`M${x} 112Q${x+5} 69 ${x-2} 37`,'none',accent,1)+path(`M${x} 76Q${x-34} 47 ${x-12} 39Q${x+4} 49 ${x} 76Z`,pale,accent,.8)+path(`M${x} 91Q${x+39} 53 ${x+22} 49Q${x+6} 59 ${x} 91Z`,'#b4c5a5',accent,.6);}).join('');
  case 'coast':return circle(888,44,22,'#dbb578')+[0,1,2,3].map(i=>path(`M714 ${71+i*10}C767 ${44+i*10} 805 ${98+i*10} 860 ${71+i*10}S924 ${51+i*10} 960 ${75+i*10}`,'none',i%2?accent:'#98b8bd',1.5)).join('');
  case 'amber':return path('M827 24L885 35L915 77L870 112L811 94L788 55Z','#e4bf75',accent,.8)+path('M827 24L846 68L885 35M846 68L870 112M811 94L846 68L915 77','none',paper,1)+clock(737,72,24);
  case 'paper':return rect(754,30,172,78,paper,accent,4)+rect(754,30,172,16,pale)+[0,1,2].map(i=>rect(767,56+i*15,6,6,'none',accent)+line(785,61+i*15,911,61+i*15,accent,.65)).join('');
  case 'stars':return icon('night',880,62,33)+Array.from({length:16},(_,i)=>circle(726+(i*47)%234,26+(i*19)%80,i%3?1:1.8,'#a79b82')).join('')+line(714,113,960,113,accent,.6);
  case 'gears':return [0,1,2].map(i=>{const x=758+i*70,y=i%2?45:81,r=i%2?22:28;return circle(x,y,r,pale,accent)+circle(x,y,r*.45,paper,accent)+Array.from({length:8},(_,j)=>{const a=j*Math.PI/4;return line(x+Math.cos(a)*(r-3),y+Math.sin(a)*(r-3),x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7),accent,3);}).join('');}).join('');
  case 'riga':return Array.from({length:11},(_,i)=>{const x=715+i*22,h=28+(i*17)%39,y=111-h;return rect(x,y,19,h,accent)+path(`M${x-1} ${y}L${x+9} ${y-(i===5?29:9)}L${x+20} ${y}Z`,accent)+rect(x+5,y+10,3,7,paper)+rect(x+12,y+10,3,7,paper);}).join('')+line(712,113,960,113,accent,1);
  case 'forest':return Array.from({length:7},(_,i)=>{const x=737+i*34,h=40+(i%3)*14;return path(`M${x} ${110-h}L${x-18} 95H${x-10}L${x-23} 110H${x+23}L${x+10} 95H${x+18}Z`,i%2?accent:'#99ac89')+rect(x-1.5,110,3,5,accent);}).join('');
  case 'weave':return Array.from({length:7},(_,i)=>{const x=729+i*35;return path(`M${x} 35L${x+15} 62L${x} 89L${x-15} 62Z`,'none',accent,1.4)+path(`M${x-13} 42L${x+13} 82M${x+13} 42L${x-13} 82`,'none',accent,.8);}).join('')+line(714,105,960,105,accent,1.5);
  case 'aurora':return [0,1,2,3].map(i=>path(`M713 ${105-i*16}C770 ${15+i*6} 811 ${110-i*7} 867 ${48+i*7}S925 ${22+i*8} 960 ${84-i*12}`,'none',i%2?accent:'#9dbbb7',1.7)).join('');
  case 'compass':return circle(839,67,44,pale,accent)+circle(839,67,33,paper,accent)+path('M839 30L850 67L839 105L828 67Z',accent)+path('M839 30V67H850Z','#d9b06e')+circle(839,67,4,paper)+line(713,113,960,113,accent,.6);
  case 'architecture':return [0,1,2].map(i=>rect(732+i*73,29,58,81,pale,accent,1)+line(742+i*73,45,780+i*73,45,accent,1)+[0,1,2].map(j=>rect(742+i*73,58+j*15,7,7,accent)+line(756+i*73,64+j*15,780+i*73,64+j*15,accent,.5)).join('')).join('');
  case 'sunrise':return circle(838,73,31,'#dfb477')+rect(714,78,246,38,paper)+line(714,78,960,78,accent,1.2)+[0,1,2].map(i=>path(`M714 ${91+i*9}Q773 ${78+i*9} 838 ${93+i*9}T960 ${91+i*9}`,'none',i%2?accent:'#c4ac92',1)).join('');
 }return '';}
 function logo(x,y){return rect(x,y+3,21,21,paper,accent,2)+rect(x,y+3,21,6,accent)+line(x+6,y,x+6,y+6,accent,1.6)+line(x+15,y,x+15,y+6,accent,1.6)+[0,1,2,3,4,5].map(i=>rect(x+4+i%3*5,y+12+Math.floor(i/3)*5,3,3,i===4?accent:'#b4b7ad')).join('');}
 const footer=n=>line(40,662,960,662)+logo(40,672)+text('Kalendārs365™',71,685,12,accent,true,180)+text('KALENDARS365.LV',71,697,7.5,muted,true,180)+text('kalendars365.lv',960,690,10,accent,true,225,'end')+text(cfg.name+' · '+(n>1?'Pielikums '+n:'Maiņu grafiks')+' · A4',500,690,8.5,muted,false,390,'middle');
 const gray=value=>value.replace(/(fill|stroke)="(#[0-9a-f]{6})"/gi,(_,attr,c)=>{const n=Math.round(parseInt(c.slice(1,3),16)*.2126+parseInt(c.slice(3,5),16)*.7152+parseInt(c.slice(5,7),16)*.0722).toString(16).padStart(2,'0');return attr+'="#'+n.repeat(3)+'"';});
 const shell=(body,n=1)=>(cfg.id===6?gray(value(body,n)):value(body,n));
 const value=(body,n)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="707" viewBox="0 0 1000 707" data-shift-design="${design}" data-layout="${layout}" role="img" aria-label="${E(cfg.name+': '+model.periodLabel)}">${rect(0,0,1000,707,paper)}${body}${footer(n)}</svg>`;
 function header(appendix=false){return art()+text(appendix?'MAIŅU GRAFIKA PIELIKUMS':'MANS DARBS. MANS RITMS.',40,30,10.5,accent,true,640)+text(model.title||'Mans maiņu grafiks',40,75,34,accent,true,650)+text(model.periodLabel,40,103,14,muted,false,645)+line(40,124,960,124,accent,1.2);}
 const summary=[['D',rows.filter(r=>r.kind==='day').length,'dienas maiņas'],['N',rows.filter(r=>r.kind==='night').length,'nakts maiņas'],['B',rows.filter(r=>r.kind==='off').length,'brīvdienas'],['h',num(rows.reduce((n,r)=>n+r.hours,0)),'plānotās stundas']];
 let body=header();summary.forEach(([code,n,label],i)=>{const x=40+i*233;body+=rect(x,139,221,45,i===3?pale:paper,rule,4)+text(code,x+10,167,13,accent,true,20)+text(n,x+38,168,24,accent,true,70)+text(label,x+110,166,9.5,muted,false,101);});
 const noteRef=r=>r.note?' *':'';
 function details(r){return r.kind==='off'?'Brīvs':r.start+'-'+r.end+(r.overnight?' +1':'');}
 function workLine(r){return r.kind==='off'?'':num(r.hours)+' h · pauze '+r.break+' min';}
 for(const r of rows){if(r.note)extra.push({label:dateLabel(r.date)+' · '+labels[r.kind],value:r.note});if(r.overnight&&r.endDate.slice(0,7)!==r.date.slice(0,7))extra.push({label:'Maiņa pāri mēneša robežai',value:r.date+' '+r.start+' - '+r.endDate+' '+r.end+' · '+num(r.hours)+' h · pauze '+r.break+' min'});}
 if(layout==='calendar'){
  const offset=(new Date(prefix+'01T12:00:00Z').getUTCDay()+6)%7,nrows=Math.ceil((offset+total)/7),x=40,top=218,cw=96,ch=414/nrows;
  ['P.','O.','T.','C.','Pk.','S.','Sv.'].forEach((d,i)=>body+=text(d,x+i*cw+7,207,9.5,muted,true,cw-14));
  rows.forEach((r,i)=>{const index=offset+i,cx=x+index%7*cw,cy=top+Math.floor(index/7)*ch;body+=rect(cx,cy,cw,ch,color(r),rule)+text(r.day,cx+7,cy+18,15,accent,true,35)+text(codes[r.kind]+(r.override?' •':''),cx+cw-7,cy+17,9,ink,true,35,'end')+text(details(r),cx+7,cy+35,9.3,ink,true,cw-14)+text(workLine(r),cx+7,cy+49,8.1,muted,false,cw-14);if(r.note)body+=text('Piezīme *',cx+7,cy+ch-7,7.5,accent,true,cw-14);});
  body+=rect(734,198,226,434,pale,'none',6)+text('TAVA MAIŅU ATSLĒGA',749,223,10,accent,true,195);
  for(const [i,kind] of ['day','night','off'].entries())body+=icon(kind,761,251+i*34,8)+text(codes[kind]+' · '+labels[kind],779,255+i*34,10,ink,true,165);
  const info=['+1 = beigas nākamajā dienā','• = individuāls labojums','* = pilna piezīme pielikumā','Stundas bez neapmaksātās pauzes'];let y=371;for(const value of info){for(const t of wrapText(value,194,10))body+=text(t,749,y,10,muted,false,194),y+=15;y+=12;}
  body+=line(749,500,943,500)+text('CIKLA SĀKUMS',749,524,9,accent,true,190)+text(model.anchor||'',749,545,12,ink,true,190)+text('CIKLA DIENU SKAITS',749,576,9,accent,true,190)+text(String(model.cycle?.length||0),749,600,17,accent,true,190);
 }else if(layout==='ledger'){
  for(let block=0;block<2;block++){const x=40+block*468;body+=rect(x,201,452,28,accent)+text('DATUMS',x+8,219,8.8,paper,true,48)+text('MAIŅA',x+69,219,8.8,paper,true,58)+text('LAIKS',x+135,219,8.8,paper,true,112)+text('PAUZE',x+269,219,8.8,paper,true,59)+text('STUNDAS',x+352,219,8.8,paper,true,92);
   rows.slice(block*16,block*16+16).forEach((r,i)=>{const y=229+i*25.3;body+=rect(x,y,452,25.3,i%2?paper:color(r),rule)+text(shortDate(r.date)+noteRef(r),x+8,y+16,9.2,ink,true,56)+icon(r.kind,x+79,y+12,6)+text(codes[r.kind]+(r.override?' •':''),x+94,y+16,9.5,accent,true,33)+text(details(r),x+135,y+16,10,ink,false,124)+text(r.kind==='off'?'':r.break+' min',x+269,y+16,9.2,muted,false,71)+text(r.kind==='off'?'':num(r.hours)+' h',x+352,y+16,10,accent,true,92);});
  }
 }else if(layout==='cards'){
  const gap=10,w=222.5,h=46.8,top=201;rows.forEach((r,i)=>{const x=40+i%4*(w+gap),y=top+Math.floor(i/4)*(h+7.4);body+=rect(x,y,w,h,color(r),rule,4)+text(r.day,x+10,y+21,18,accent,true,32)+text(weekdays[(new Date(r.date+'T12:00:00Z').getUTCDay()+6)%7],x+10,y+37,7.8,muted,false,30)+icon(r.kind,x+51,y+16,6)+text(codes[r.kind]+(r.override?' •':'')+noteRef(r),x+65,y+20,10,accent,true,36)+text(details(r),x+103,y+20,10.4,ink,true,w-114)+text(workLine(r),x+47,y+37,9,muted,false,w-58);});
 }else{
  const toMinute=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
  for(let block=0;block<2;block++){const x=40+block*468,chart=x+92,cw=352,sy=224,rowH=25.5;body+=text('DIENA / MAIŅA',x+4,205,8.8,accent,true,85);[0,6,12,18,24].forEach(hour=>body+=text(String(hour).padStart(2,'0'),chart+cw*hour/24,205,8,muted,false,20,hour===24?'end':hour===0?'start':'middle'));
   const subset=rows.slice(block*16,block*16+16);for(let i=0;i<subset.length;i++){const r=subset[i],y=sy+i*rowH,prior=rows[block*16+i-1]||(block===0&&i===0?model.previousShift:null);body+=rect(x,y-10,452,rowH,i%2?paper:pale,rule)+text(shortDate(r.date)+noteRef(r),x+5,y+3,9.1,ink,true,52)+text(codes[r.kind]+(r.override?' •':''),x+61,y+3,9.5,accent,true,27);[0,6,12,18,24].forEach(hour=>body+=line(chart+cw*hour/24,y-10,chart+cw*hour/24,y+15.5,rule,.45));
    if(prior?.overnight){const end=toMinute(prior.end);if(end>0)body+=rect(chart,y-7,cw*end/1440,4,'#8794ad').replace('<rect',`<rect data-carry-from="${E(prior.date)}"`);}
    if(r.kind!=='off'){const a=toMinute(r.start),b=r.overnight?1440:toMinute(r.end);body+=rect(chart+cw*a/1440,y-6,cw*(b-a)/1440,5,r.kind==='night'?'#5b6e91':'#56877a')+text(details(r)+' · '+num(r.hours)+' h · '+r.break+' min',chart,y+11,8.6,ink,false,cw);}
    else body+=text('Brīvs'+(prior?.overnight?' · iepriekšējās nakts beigas':''),chart,y+11,8.6,muted,false,cw);
   }
  }
 }
 if(layout==='timeline')body+=text('Smalkā josla rāda iepriekšējā datumā sāktas nakts maiņas turpinājumu.',40,637,8.3,muted,false,920);
 if(layout!=='calendar')body+=text('D = diena · N = nakts · B = brīvs · +1 = beigas nākamajā dienā · • = labojums · * = piezīme pielikumā',40,650,8.6,muted,false,920);
 const pages=[shell(body)];
 if(extra.length){let b=header(true),y=153,n=2;const flush=()=>{pages.push(shell(b,n++));b=header(true);y=153;};for(const item of extra){if(y>584)flush();b+=text(item.label,40,y,12,accent,true,920);y+=24;for(const t of wrapText(item.value,920,12)){if(y>635){flush();b+=text(item.label+' · turpinājums',40,y,11,accent,true,920);y+=24;}b+=text(t,40,y,12,ink,false,920);y+=18;}y+=21;}pages.push(shell(b,n));}
 return pages;
}
