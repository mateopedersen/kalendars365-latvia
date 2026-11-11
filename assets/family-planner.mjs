import {fitSize,wrapText} from './planner-font-metrics.mjs';
import {weeklyPeriod} from './weekly-planner.mjs';

// A family snapshot is independent of the UI and never changes stored data.
// Keep identities, time ranges, recurring work and the shopping list intact.
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const colors=['#8b2940','#32796d','#4268a2','#bd7b31','#795b9c','#687947','#bb6683','#596a77'];
const array=v=>Array.isArray(v)?v:[],safeColor=(c,i=0)=>/^#[0-9a-f]{6}$/i.test(c||'')?c:colors[i%colors.length];
const typeLabels={event:'Notikums',task:'Darāmais',chore:'Mājas darbs'};
function entryText(e){
 const span=e.endDate?Math.round((Date.parse(e.endDate)-Date.parse(e.date))/86400000):0,endDate=span>0?new Date(Date.parse(e.occurrenceDate||e.date)+span*86400000).toISOString().slice(0,10):'';
 return `${e.start?(e.start+(e.end?'–'+e.end:'')+' · '):''}${e.memberName||'Kopīgs plāns'} · ${typeLabels[e.type]||typeLabels.event}: ${e.title}${e.done?' (paveikts)':''}${endDate?' · līdz '+endDate:''}${e.location?'\nVieta: '+e.location:''}${e.description?'\n'+e.description:''}`;
}

export function familyModel(data={},date){
 const p=weeklyPeriod({start:date}),members=array(data.members).map((m,i)=>({id:String(m.id??''),name:String(m.name??''),color:safeColor(m.color,i)}));
 const rows=p.dates.map(day=>{
  const entries=array(data.entries).filter(e=>e.date===day||(e.repeat==='weekly'&&e.date<=day&&(Date.parse(day)-Date.parse(e.date))%(7*86400000)===0&&(!e.until||day<=e.until))).map(e=>({...e,occurrenceDate:day,title:String(e.title??''),done:array(e.doneDates).includes(day),memberName:members.find(m=>m.id===e.member)?.name||'Kopīgs plāns',color:members.find(m=>m.id===e.member)?.color||colors[0]})).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||''))||a.title.localeCompare(b.title,'lv'));
  const meals=array(data.meals).filter(m=>m.date===day).map(m=>({...m,title:String(m.title??''),ingredients:String(m.ingredients??'')}));
  const lines=entries.map(entryText);
  lines.push(...meals.map(m=>'Maltīte: '+m.title+(m.ingredients?' · '+m.ingredients:'')));
  return{date:day,entries,meals,text:lines.join('\n')};
 });
 return{kind:'family',type:'week',title:'Mūsu ģimenes nedēļa',periodLabel:p.label,year:Number(p.start.slice(0,4)),month:Number(p.start.slice(5,7)),start:p.start,end:p.end,members,rows,shopping:array(data.shopping).map(s=>({item:String(s.item??''),amount:String(s.amount??''),aisle:String(s.aisle??''),done:!!s.done}))};
}
export const familyDesigns=[
 ['Mājas ritms','Katra cilvēka plāni vienā nedēļas tabulā.','members','#842d43','#fffdf8','#f3e5e6','home'],
 ['Savējie vienuviet','Septiņas dienu kartītes un kopīgs pirkumu saraksts.','cards','#345e65','#fcfdf9','#e5eeea','people'],
 ['Baltijas brīvdienas','Plaša ģimenes ajanda ar mierīgu piekrastes ilustrāciju.','agenda','#3a7080','#fbfefe','#e4eff1','coast'],
 ['Ozola mājas','Katra cilvēka nedēļa ozollapu noformējumā.','members','#566b46','#fffef6','#e8ecdd','oak'],
 ['Pie kopīga galda','Notikumi un ēdienkarte līdzās katras dienas rindā.','meals','#a16a32','#fffdf5','#f5e9d1','table'],
 ['Skola un pulciņi','Dienu kartītes mācībām, pulciņiem un ģimenes darbiem.','cards','#425f87','#fdfdff','#e8edf5','books'],
 ['Tīra ģimenes lapa','Melnbalta nedēļas tabula ar skaidru vietu katram.','members','#34383c','#ffffff','#f1f1ef','paper'],
 ['Ģimenes kompass','Kopīga ajanda darbiem, tikšanās reizēm un atpūtai.','agenda','#295a5c','#fffefa','#e4efeb','compass'],
 ['Dzintara svētdiena','Dienu kartītes siltos toņos ar vietu brīvdienu plāniem.','cards','#986331','#fffaf3','#f3e3cf','sun'],
 ['Pļavas dienas','Cilvēku un dienu pārskats ar vieglu pļavas augu ilustrāciju.','members','#64764f','#fffff8','#ecf0e1','meadow'],
 ['Katram sava vieta','Atsevišķas slejas cilvēkiem un kopīgajiem notikumiem.','members','#8a3854','#fffafb','#f3e4ec','windows'],
 ['Virtuves piezīmes','Dienas darbi, maltītes un pirkumi vienā lapā.','meals','#466b59','#fcfdf7','#e6eee0','kitchen'],
 ['Latvju mājas','Septiņas dienu kartītes ar oriģinālu rakstu joslu.','cards','#912b41','#fffdf7','#f5e5e3','weave'],
 ['Ziemeļu gaisma','Gaiša ajanda ar vietu ģimenes notikumiem un piezīmēm.','agenda','#526777','#fcfeff','#e9eef3','aurora'],
 ['Kopā būšanas laiks','Dienu plāni un ēdienkarte siltā mājas noformējumā.','meals','#7e4350','#fffcf7','#f0e4df','tea']
].map(([name,description,layout,accent,paper,pale,motif],i)=>({id:i+1,name,description,layout,accent,paper,pale,motif}));
export const familyFilename=(model,design)=>{const p=weeklyPeriod(model);return`kalendars365-gimenes-plans-${p.year}-${String(p.week).padStart(2,'0')}-${String(design).padStart(2,'0')}`;};

export function familyScenes(input,{design=1}={}){
 const cfg=familyDesigns[Number(design)-1];if(!cfg)throw Error('Izvēlies vienu no 15 ģimenes dizainiem.');
 const p=weeklyPeriod(input),{accent,paper,pale,layout,motif}=cfg,ink='#303039',muted='#67636c',rule='#d9d2cc',days=['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena'];
 const memberColor=(c,i=0)=>Number(design)===7?['#34383c','#666666','#939393'][i%3]:safeColor(c,i);
 const members=array(input.members),rows=p.dates.map(date=>input.rows?.find(r=>r.date===date)||{date,text:'',entries:[],meals:[]}),shopping=array(input.shopping),extra=[];
 const rect=(x,y,w,h,fill='none',stroke='none',rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width=".7"/>`;
 const line=(x1,y1,x2,y2,c=rule,width=.6)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${width}"/>`;
 const circle=(cx,cy,r,fill,stroke='none')=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width=".9"/>`;
 const path=(d,fill='none',stroke='none',w=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
 const text=(value,x,y,size=12,c=ink,bold=false,width=920,anchor='start')=>`<text x="${x}" y="${y}" font-family="DM Sans, Arial, sans-serif" font-size="${fitSize(value,size,width,bold)}" fill="${c}"${bold?' font-weight="700"':''}${anchor!=='start'?` text-anchor="${anchor}"`:''}>${E(value)}</text>`;
 function home(x,y,w=65){return path(`M${x-6} ${y+26}L${x+w/2} ${y}L${x+w+6} ${y+26}Z`,accent)+rect(x,y+25,w,55,pale,accent,2)+rect(x+w*.41,y+51,w*.2,29,accent)+rect(x+10,y+37,13,14,paper,accent)+rect(x+w-23,y+37,13,14,paper,accent)+line(x+16.5,y+37,x+16.5,y+51,accent,.7);}
 function leaf(x,y,oak=false){return oak?path(`M${x} ${y}C${x-16} ${y-8} ${x-18} ${y-20} ${x-6} ${y-19}C${x-17} ${y-33} ${x-3} ${y-39} ${x+3} ${y-28}C${x+12} ${y-40} ${x+25} ${y-28} ${x+15} ${y-19}C${x+30} ${y-17} ${x+21} ${y-3} ${x} ${y}Z`,pale,accent,.8)+line(x,y+11,x+4,y-29,accent,.8):path(`M${x} ${y}Q${x-27} ${y-27} ${x-1} ${y-34}Q${x+20} ${y-20} ${x} ${y}Z`,pale,accent,.8)+line(x,y+12,x-1,y-26,accent,.7);}
 function illustration(){let s='';switch(motif){
  case 'home':return circle(846,57,48,pale)+home(748,23,75)+home(865,40,48)+path('M827 42C816 28 802 42 827 58C852 42 838 28 827 42Z','#c37982');
  case 'people':return [0,1,2,3].map(i=>circle(744+i*54,49+(i%2)*8,11,i%2?accent:'#b5c6a8')+path(`M${725+i*54} 104V${83+(i%2)*8}Q${744+i*54} ${57+(i%2)*8} ${763+i*54} ${83+(i%2)*8}V104Z`,i%2?pale:accent)).join('')+line(718,111,951,111,accent,.8);
  case 'coast':return circle(862,46,25,'#dfbe80')+[0,1,2,3].map(i=>path(`M708 ${71+i*10}C760 ${46+i*10} 804 ${95+i*10} 852 ${72+i*10}S915 ${54+i*10} 958 ${72+i*10}`,'none',i%2?accent:'#97bcc2',1.7)).join('');
  case 'oak':return home(816,35,58)+leaf(746,84,true)+leaf(914,85,true)+line(715,111,955,111,accent,.8);
  case 'table':return rect(725,64,224,9,accent,'none',3)+rect(747,73,6,37,accent)+rect(920,73,6,37,accent)+circle(780,44,15,paper,accent)+circle(842,44,15,pale,accent)+circle(904,44,15,paper,accent)+line(780,26,780,61,accent,.7)+line(842,26,842,61,accent,.7)+line(904,26,904,61,accent,.7);
  case 'books':return [0,1,2,3,4].map(i=>rect(732+i*39,35+(i%2)*9,29,73-(i%2)*9,i%2?pale:accent,accent,2)+line(738+i*39,48+(i%2)*9,754+i*39,48+(i%2)*9,i%2?accent:paper,1)+line(738+i*39,96,754+i*39,96,i%2?accent:paper,1)).join('')+line(719,112,950,112,accent,2);
  case 'paper':return rect(755,24,170,85,paper,accent)+line(779,41,906,41,accent,1)+[0,1,2].map(i=>rect(769,54+i*16,5,5,'none',accent)+line(784,59+i*16,904,59+i*16,rule,.9)).join('');
  case 'compass':return circle(837,65,43,pale,accent)+circle(837,65,33,paper,accent)+path('M837 27L848 65L837 100L826 65Z',accent)+path('M837 27L837 65H848Z','#d5ac6e')+circle(837,65,5,paper)+line(716,110,955,110,accent,.6);
  case 'sun':return circle(841,61,30,'#e6bc7c')+Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return line(841+40*Math.cos(a),61+40*Math.sin(a),841+49*Math.cos(a),61+49*Math.sin(a),accent,1.2);}).join('')+path('M715 112Q825 87 960 112','none',accent,1);
  case 'meadow':return [0,1,2,3,4].map(i=>{const x=738+i*47,y=109;return path(`M${x} ${y}Q${x+8} 79 ${x} ${42+(i%2)*13}`,'none',accent,1)+leaf(x+8,92)+[0,1,2,3,4].map(j=>circle(x+Math.cos(j*1.256)*7,38+(i%2)*13+Math.sin(j*1.256)*7,4,pale,accent)).join('')+circle(x,38+(i%2)*13,3,'#cba45a');}).join('');
  case 'windows':return [0,1,2,3].map(i=>rect(723+i*58,30,45,70,i%2?pale:paper,accent,16)+line(745+i*58,31,745+i*58,100,accent,.7)+line(723+i*58,65,768+i*58,65,accent,.7)).join('');
  case 'kitchen':return rect(736,32,84,76,pale,accent,4)+rect(750,23,56,12,accent,'none',3)+circle(779,70,20,paper,accent)+path('M846 73H933V96Q891 120 846 96Z',pale,accent,1.3)+line(856,55,926,55,accent,1.2)+path('M875 27Q860 42 875 54M901 27Q886 42 901 54','none',accent,1.2);
  case 'weave':return Array.from({length:7},(_,i)=>{const x=734+i*32;return path(`M${x} 34L${x+13} 62L${x} 90L${x-13} 62Z`,'none',accent,1.2)+path(`M${x-14} 39L${x+14} 85M${x+14} 39L${x-14} 85`,'none',accent,.7);}).join('')+line(715,105,958,105,accent,.9);
  case 'aurora':return [0,1,2].map(i=>path(`M712 ${100-i*15}C764 ${10+i*4} 812 ${120-i*9} 858 ${45+i*10}S926 ${28+i*9} 958 ${84-i*10}`,'none',i%2?'#9ebcc3':accent,2)).join('')+[0,1,2,3].map(i=>circle(746+i*55,24+(i%2)*9,1.7,accent)).join('');
  case 'tea':return [0,1].map(i=>{const x=744+i*113;return rect(x,55,57,43,pale,accent,8)+path(`M${x+57} 64C${x+85} 55 ${x+85} 98 ${x+57} 87`,'none',accent,2)+line(x-7,103,x+69,103,accent,1.4)+path(`M${x+15} 25Q${x+4} 39 ${x+15} 48M${x+34} 25Q${x+23} 39 ${x+34} 48`,'none',accent,1);}).join('');
 }return s;}
 function logo(x,y){return rect(x,y+3,21,21,paper,accent,2)+rect(x,y+3,21,6,accent)+line(x+6,y,x+6,y+6,accent,1.6)+line(x+15,y,x+15,y+6,accent,1.6)+[0,1,2,3,4,5].map(i=>rect(x+4+(i%3)*5,y+12+Math.floor(i/3)*5,3,3,i===4?accent:'#b7b6ae')).join('');}
 const footer=n=>line(40,662,960,662)+logo(40,672)+text('Kalendārs365™',71,685,12,accent,true,180)+text('KALENDARS365.LV',71,697,7.5,muted,true,180)+text('kalendars365.lv',960,690,10,accent,true,240,'end')+text(`${cfg.name} · ${n>1?'Pielikums '+n:'Ģimenes plānotājs'} · A4`,500,690,8.7,muted,false,390,'middle');
 const shell=(b,n=1)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="707" viewBox="0 0 1000 707" data-family-design="${design}" data-layout="${layout}" role="img" aria-label="${E(cfg.name+': '+p.label)}">${rect(0,0,1000,707,paper)}${b}${footer(n)}</svg>`;
 const header=(appendix=false)=>illustration()+text(appendix?'ĢIMENES PLĀNA PIELIKUMS':'ĢIMENES NEDĒĻAS PLĀNOTĀJS',40,30,10.5,accent,true,600)+text(input.title||'Mūsu ģimenes nedēļa',40,75,34,accent,true,645)+text(input.periodLabel||p.label,40,104,12,muted,false,645)+line(40,122,960,122,accent,1.3);
 let b=header();
 const legend=members.length?members:Array.from({length:layout==='members'?3:4},(_,i)=>({name:'Vārds: __________________',color:colors[i]}));
 legend.forEach((m,i)=>{const x=40+(i%4)*233,y=143+Math.floor(i/4)*20;b+=circle(x+4,y-3,3.5,memberColor(m.color,i))+text(m.name,x+15,y,10,ink,true,208);});
 function fitContent(value,x,y,w,h,{size=10.5,key='',label=''}={}){
  const lines=wrapText(value,w,size),step=size*1.4,cap=Math.max(1,Math.floor(h/step)),over=lines.length>cap;
  let s='';lines.slice(0,over?Math.max(0,cap-1):cap).forEach((t,i)=>s+=text(t,x,y+i*step,size,ink,false,w));
  if(over){s+=text('Pilns teksts pielikumā',x,y+(cap-1)*step,8,accent,true,w);extra.push({key,label,text:value});}
  return s;
 }
 const entryLine=entryText;
 const mealLine=m=>m.title+(m.ingredients?' · '+m.ingredients:'');
 function rowText(row){return row.entries?.length||row.meals?.length?[...array(row.entries).map(entryLine),...array(row.meals).map(m=>'Maltīte: '+mealLine(m))].join('\n'):row.text||'';}
 function shopPanel(x,y,w,h){let s=rect(x,y,w,h,pale,'none',4)+text('PIRKUMU SARAKSTS',x+12,y+21,10,accent,true,w-24);const values=shopping.map(item=>(item.done?'Nopirkts · ':'')+item.item+(item.amount?' · '+item.amount:'')+(item.aisle?' · '+item.aisle:''));
  if(values.length)s+=fitContent(values.join('\n'),x+12,y+41,w-24,h-49,{key:'shopping',label:'Pirkumu saraksts'});
  else for(let yy=y+44;yy<y+h-9;yy+=20)s+=rect(x+12,yy-6,6,6,'none',accent)+line(x+26,yy,x+w-12,yy,rule,.6);
  return s;
 }
 function card(row,i,x,y,w,h){let s=rect(x,y,w,h,i>=5?pale:paper,rule,4)+text(days[i],x+11,y+20,11,accent,true,w-80)+text(row.date.slice(8)+'.'+row.date.slice(5,7)+'.',x+w-11,y+20,11,accent,true,55,'end');
  s+=fitContent(rowText(row),x+12,y+43,w-24,h-52,{key:row.date,label:days[i]+' · '+row.date});
  if(!rowText(row))for(let yy=y+58;yy<y+h-9;yy+=20)s+=line(x+12,yy,x+w-12,yy);
  return s;
 }
 if(layout==='cards'){
  const w=221,h=220;rows.forEach((row,i)=>b+=card(row,i,40+(i%4)*233,182+Math.floor(i/4)*232,w,h));b+=shopPanel(739,414,w,h);
 }else if(layout==='agenda'){
  rows.forEach((row,i)=>b+=card(row,i,40,182+i*65,643,58));b+=shopPanel(699,182,261,298)+rect(699,494,261,142,pale,'none',4)+text('KOPĪGĀS PIEZĪMES',711,517,10,accent,true,237);for(let y=542;y<625;y+=21)b+=line(711,y,948,y);
 }else if(layout==='meals'){
  b+=rect(40,180,920,28,accent)+text('DIENA',52,199,10,paper,true,95)+text('NOTIKUMI UN DARĀMAIS',159,199,10,paper,true,442)+text('ĒDIENKARTE',633,199,10,paper,true,314);
  rows.forEach((row,i)=>{const y=208+i*49;b+=rect(40,y,920,49,i>=5?pale:paper,rule)+line(147,y,147,y+49)+line(621,y,621,y+49)+text(days[i],51,y+18,10,accent,true,84)+text(row.date.slice(8)+'.'+row.date.slice(5,7)+'.',51,y+35,10,ink,true,84);
   const entries=array(row.entries).length?row.entries.map(entryLine).join('\n'):row.entries? '':row.text||'';
   b+=fitContent(entries,159,y+18,450,35,{size:10,key:row.date+'-entries',label:days[i]+' · '+row.date+' · Notikumi'})+fitContent(array(row.meals).map(mealLine).join('\n'),633,y+18,315,35,{size:10,key:row.date+'-meals',label:days[i]+' · '+row.date+' · Ēdienkarte'});
  });b+=shopPanel(40,567,920,70);
 }else{
  const people=[{id:'',name:'Kopīgi',color:accent},...(members.length?members:Array.from({length:3},(_,i)=>({id:'blank-'+i,name:'Vārds: __________',color:colors[i]})))],cw=810/people.length;
  b+=rect(40,182,920,31,accent)+text('DIENA',51,202,10,paper,true,89);
  people.forEach((m,i)=>b+=text(m.name,154+i*cw,202,10,paper,true,cw-16));
  rows.forEach((row,i)=>{const y=213+i*53;b+=rect(40,y,920,53,i>=5?pale:paper,rule)+text(days[i],51,y+20,10,accent,true,88)+text(row.date.slice(8)+'.'+row.date.slice(5,7)+'.',51,y+38,10,ink,true,88);
   people.forEach((m,j)=>{const x=150+j*cw,entries=array(row.entries).filter(e=>m.id?e.member===m.id:!members.some(mem=>mem.id===e.member)),content=entries.map(entryLine);if(!m.id)content.push(...array(row.meals).map(meal=>'Maltīte: '+mealLine(meal)));if(!row.entries&&!m.id)content.push(row.text||'');b+=line(x,y,x,y+53)+rect(x+1,y+1,3,51,memberColor(m.color,j))+fitContent(content.join('\n'),x+10,y+17,cw-20,38,{size:9.8,key:row.date+'-'+m.id,label:days[i]+' · '+row.date+' · '+m.name});});
  });b+=shopPanel(40,598,920,44);
 }
 const pages=[shell(b)];
 if(extra.length){let body=header(true),y=153,pageNo=2;const flush=()=>{pages.push(shell(body,pageNo++));body=header(true);y=153;};for(const item of extra){const lines=wrapText(item.text,920,12);if(y>584)flush();body+=text(item.label,40,y,12,accent,true,920);y+=25;for(const value of lines){if(y>636){flush();body+=text(item.label+' · turpinājums',40,y,11,accent,true,920);y+=25;}body+=text(value,40,y,12,ink,false,920);y+=18;}y+=24;}pages.push(shell(body,pageNo));}
 return pages;
}
