import {weeklyPeriod} from './weekly-planner.mjs';
import {fitSize,wrapText} from './planner-font-metrics.mjs';
import {schoolDisplayWidth} from './school-display-metrics.mjs';

// One date-bound snapshot drives the gallery, print sheets, vector PDF and Image.
export const schoolDesigns=[
 ['Karmīna akadēmija','Plašas mācību dienu slejas un atsevišķa nedēļas nogale.','columns','#82263f','#fffdf8','#f3e5e7','academy',true],
 ['Rīgas līnijas','Arhitektūras līnijas, dienu kartītes un darbu saraksts.','cards','#324f63','#fcfcf8','#e8eef0','architecture',true],
 ['Ziemeļu klase','Mierīgi zaļas slejas ar priežu meža ilustrāciju.','columns','#365c50','#fcfdf7','#e7eee5','forest',false],
 ['Bibliotēkas lapa','Horizontāla ajanda ar vietu uzdevumiem un piezīmēm.','agenda','#6d4540','#fffcf3','#f0e6d8','books',true],
 ['Rudzupuķu dienas','Septiņas dienu kartītes un smalka ziedu ilustrācija.','cards','#4e6096','#fdfdff','#eaeaf6','flowers',false],
 ['Balts un skaidrs','Skaidras līnijas un mazāk tintes ikdienas izdrukai.','columns','#303438','#ffffff','#f2f3f1','minimal',false],
 ['Dzintara stunda','Siltas dienu kartītes ar saules ģeometriju.','cards','#885c24','#fffdf6','#f4e8ce','sun',true],
 ['Mācību darbnīca','Trīs plašas dienu slejas katrā rindā un kopīgi termiņi.','studio','#376e72','#fcfffc','#e5f0eb','pencils',false],
 ['Zvaigžņu laboratorija','Gaiša ajanda zem tumša, zvaigžņota virsraksta.','agenda','#354c74','#fdfdff','#e8edf6','stars',false],
 ['Mācību bloknots','Punktots papīrs, mācību dienu slejas un piezīmju lauks.','columns','#5d5168','#fffdfb','#eee9f1','dots',false],
 ['Latvju rakstu klase','Oriģināli ģeometriski raksti un septiņas dienu kartītes.','cards','#8a2a43','#fffdf8','#f3e3e4','ornament',true],
 ['Pasteļu nedēļa','Plaši dienu lauki mierīgos piparmētru un rozā toņos.','studio','#53736a','#fffefa','#e7efe7','pastel',false],
 ['Studiju ajanda','Īsas dienu rindas ar atsevišķu mācību termiņu sleju.','agenda','#79364b','#fffdf9','#f2e6e7','ruler',true],
 ['Grafīta skice','Atturīgs dienu kartīšu plāns ar tehniskām līnijām.','cards','#454b54','#ffffff','#eceef0','geometry',false],
 ['Botānikas lapa','Augu līnijas un plašs plāns mācībām un darbiem.','studio','#506648','#fffef7','#ecedde','botanical',true]
].map(([name,description,layout,accent,paper,pale,art,serif],i)=>({id:i+1,name,description,layout,accent,paper,pale,art,serif}));
const days=['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena'];
const typeNames={homework:'Mājasdarbs',test:'Pārbaudes darbs',project:'Projekts'},priorities={high:'Svarīga',normal:'Parasta',low:'Kad ir laiks'};
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const label=date=>new Intl.DateTimeFormat('lv-LV',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric'}).format(new Date(date+'T12:00:00Z'));
export function schoolModel(data={},date){
 const p=weeklyPeriod({start:date}),rows=p.dates.map(date=>({date,lessons:(data.lessons||[]).filter(l=>Number(l.weekday)===new Date(date+'T12:00:00Z').getUTCDay()&&l.from<=date&&l.until>=date).map(l=>({...l})).sort((a,b)=>a.start.localeCompare(b.start)||a.subject.localeCompare(b.subject,'lv')),tasks:(data.tasks||[]).filter(t=>t.date===date).map(t=>({...t}))}));
 return {kind:'school',type:'week',title:'Stundu saraksts',start:p.start,year:p.year,month:Number(p.start.slice(5,7)),week:p.week,periodLabel:`${label(p.start)} · ${label(p.end)}`,template:Number(data.template)||1,rows};
}
export const schoolFilename=(model,design)=>{const p=weeklyPeriod(model);return `kalendars365-stundu-saraksts-${p.year}-${String(p.week).padStart(2,'0')}-${String(design).padStart(2,'0')}`;};
export function schoolScenes(model,{design=1}={}){
 const cfg=schoolDesigns[Number(design)-1];if(!cfg)throw Error('Izvēlies vienu no 15 stundu saraksta dizainiem.');
 const {accent,paper,pale,layout}=cfg,p=weeklyPeriod(model),ink='#293039',muted='#626973',rule='#d8d8d1';
 const rows=p.dates.map(date=>({date,lessons:[],tasks:[],...model.rows?.find(r=>r.date===date)}));
 const tasks=rows.flatMap((r,i)=>r.tasks.map(t=>({...t,date:r.date,day:i}))),extras=[];
 const rect=(x,y,w,h,fill='none',stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width=".7"/>`;
 const line=(x1,y1,x2,y2,color=rule,width=.65)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
 const path=(d,fill='none',stroke=accent,width=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
 const circle=(x,y,r,fill='none',stroke='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width=".8"/>`;
 const text=(s,x,y,size=11,color=ink,bold=false,w=920,anchor='start',role='')=>`<text x="${x}" y="${y}" font-family="DM Sans, Arial, sans-serif" font-size="${fitSize(s,size,w,bold)}" fill="${color}"${bold?' font-weight="700"':''} text-anchor="${anchor}"${role?` data-role="${role}"`:''}>${E(s)}</text>`;
 const display=(s,x,y,size=38,color=accent,w=620)=>cfg.serif?`<text x="${x}" y="${y}" font-family="K365 Literata" font-size="${Math.min(size,size*w/schoolDisplayWidth(s,size))}" fill="${color}">${E(s)}</text>`:text(s,x,y,size,color,true,w);
 function art(){let out='';const a=cfg.art;
  if(a==='books'){for(let i=0;i<8;i++){const x=710+i*29,h=35+(i%3)*11;out+=rect(x,103-h,21,h,i%2?accent:pale,accent)+line(x+4,108-h,x+17,108-h,paper,1)+line(x+4,96,x+17,96,paper,1);}out+=line(700,107,957,107,accent,1.6);}
  if(a==='academy'){out+=path('M713 40C749 30 791 38 829 52V108C790 92 750 87 713 98Z',pale)+path('M829 52C866 38 906 30 946 40V98C907 87 866 92 829 108Z',paper)+line(829,52,829,108,accent,1.2);for(let i=0;i<4;i++){const y=51+i*11;out+=path(`M725 ${y}Q770 ${y-5} 816 ${y+12}`,'none',accent,.65)+path(`M842 ${y+12}Q887 ${y-5} 934 ${y}`,'none',accent,.65);}out+=path('M899 37V85L906 77L913 85V36Z','#bd995f','none')+line(707,111,953,111,accent,.8);}
  if(a==='architecture'){for(let i=0;i<9;i++){const x=707+i*28,h=30+(i%4)*11;out+=path(`M${x} 104V${104-h}L${x+11} ${94-h}L${x+22} ${104-h}V104Z`,i%2?pale:paper,accent,1)+line(x+7,91,x+7,100)+line(x+15,91,x+15,100);}out+=line(698,107,957,107,accent,1);}
  if(a==='forest'){for(let i=0;i<7;i++){const x=724+i*35,h=35+(i%3)*15;out+=path(`M${x} ${105-h}L${x-14} 91H${x-8}L${x-20} 104H${x+20}L${x+8} 91H${x+14}Z`,i%2?pale:accent,accent,.7)+line(x,104,x,111,accent,1.2);}}
  if(a==='flowers'||a==='botanical'){for(let i=0;i<5;i++){const x=731+i*45,y=103,h=38+(i%3)*11;out+=path(`M${x} ${y}Q${x-5} ${y-h/2} ${x+4} ${y-h}`)+path(`M${x} ${y-10}Q${x-26} ${y-35} ${x-17} ${y-15}Z`,pale)+path(`M${x} ${y-19}Q${x+30} ${y-42} ${x+22} ${y-23}Z`,pale);if(a==='flowers')for(let j=0;j<6;j++)out+=circle(x+4+Math.cos(j*Math.PI/3)*7,y-h+Math.sin(j*Math.PI/3)*7,4,pale,accent);out+=circle(x+4,y-h,3,accent);}}
  if(a==='sun'){out+=circle(866,67,28,pale,accent)+circle(866,67,19,'none',accent);for(let i=0;i<16;i++){const a=i*Math.PI/8;out+=line(866+Math.cos(a)*34,67+Math.sin(a)*34,866+Math.cos(a)*42,67+Math.sin(a)*42,accent,1);}out+=line(709,110,957,110);}
  if(a==='pencils'){for(let i=0;i<5;i++){const x=759+i*35,h=46+(i%2)*16;out+=rect(x,103-h,14,h,i%2?accent:pale,accent)+path(`M${x} ${103-h}L${x+7} ${87-h}L${x+14} ${103-h}Z`,paper)+line(x+7,103-h,x+7,103,paper,1);}}
  if(a==='stars'){for(let i=0;i<19;i++)out+=circle(712+(i*43)%240,28+(i*23)%72,i%4?1:2,'#eee4cb');out+=circle(884,65,28,'none','#eee4cb')+path('M848 65H920M884 29V101','none','#eee4cb',.6);}
  if(a==='dots'){for(let i=0;i<60;i++)out+=circle(722+(i%12)*20,28+Math.floor(i/12)*17,.9,'#ac9eb7');}
  if(a==='ornament'){for(let i=0;i<7;i++){const x=730+i*33;out+=path(`M${x} 46L${x+15} 64L${x} 82L${x-15} 64Z`,'none',accent)+line(x-13,44,x+13,84,accent)+line(x+13,44,x-13,84,accent)+rect(x-2,62,4,4,accent);}}
  if(a==='pastel'){out+=circle(860,62,38,pale)+rect(708,74,154,28,'#efdfe2')+rect(844,85,110,18,accent)+line(706,109,957,109);}
  if(a==='ruler'){out+=rect(715,53,240,35,pale,accent);for(let i=0;i<25;i++)out+=line(720+i*9.5,53,720+i*9.5,i%5?63:73,accent,.8);out+=line(715,104,955,104,accent);}
  if(a==='geometry'){out+=path('M737 106L792 28L847 106Z','none',accent,.8)+circle(868,67,37,'none',accent)+line(712,106,957,106)+line(792,28,792,106)+line(831,67,905,67);}
  if(a==='minimal')out+=text('NEDĒĻA',950,48,10,accent,true,180,'end')+text(String(p.week).padStart(2,'0'),954,101,55,accent,true,150,'end');
  return out;
 }
 function logo(x,y){return rect(x,y+3,19,20,paper,accent)+rect(x,y+3,19,6,accent)+line(x+5,y,x+5,y+6,accent,1.5)+line(x+14,y,x+14,y+6,accent,1.5)+[0,1,2,3,4,5].map(i=>rect(x+4+(i%3)*4.5,y+12+Math.floor(i/3)*4,2.6,2.6,i===4?accent:rule)).join('');}
 const footer=n=>line(36,665,964,665)+logo(36,675)+text('Kalendārs365™',64,689,12,accent,true,190)+text('KALENDARS365.LV',64,699,7,muted,true,190)+text(`${cfg.name} · ${n===1?'Stundu saraksts':'Pielikums '+(n-1)}`,500,689,9,muted,false,420,'middle')+text('kalendars365.lv',964,689,10,accent,true,190,'end');
 const shell=(s,n)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="707" viewBox="0 0 1000 707" data-school-design="${cfg.id}" data-layout="${layout}" role="img" aria-label="${E(cfg.name+' · '+(model.periodLabel||p.label))}">${rect(0,0,1000,707,paper)}${s}${footer(n)}</svg>`;
 function header(appendix=false){const dark=cfg.art==='stars',col=dark?'#fffaf0':accent;return (dark?rect(0,0,1000,119,'#23334d'):'')+art()+text(appendix?'MĀCĪBU NEDĒĻAS PIELIKUMS':'MĀCĪBU NEDĒĻA',36,29,9.5,col,true,640)+display(appendix?'Pilnie ieraksti':'Stundu saraksts',36,75,38,col,640)+text(model.periodLabel||`${label(p.start)} · ${label(p.end)}`,36,101,10.5,dark?'#e7e1d5':muted,false,650)+line(36,121,964,121,accent,1.4);}
 function recordLines(l,w,size){return [
  ...wrapText(`${l.start} līdz ${l.end}${l.room?' · Telpa: '+l.room:''}`,w,size).map(s=>({s,bold:true,color:accent})),
  ...wrapText(l.subject,w,size+1,true).map(s=>({s,bold:true,color:ink,size:size+1})),
  ...wrapText(l.teacher?'Skolotājs: '+l.teacher:'',w,size).map(s=>({s,color:muted}))];}
 const taskLabel=t=>`${t.done?'Paveikts':'Jāpaveic'} · ${typeNames[t.type]||'Uzdevums'} · ${priorities[t.priority]||'Parasta'}`;
 function dayBlock(row,i,x,y,w,h,compact=false){
  let s=rect(x,y,w,h,i>4?pale:paper,rule)+rect(x,y,3,h,accent),yy=y+48,bottom=y+h-16,size=compact?9:10;
  s+=rect(x+3,y,w-3,34,pale)+text(days[i],x+12,y+22,11.5,accent,true,w-73)+text(row.date.slice(8)+'.'+row.date.slice(5,7)+'.',x+w-11,y+22,10,accent,true,52,'end');
  if(!row.lessons.length){for(let ly=yy+10;ly<bottom;ly+=23)s+=line(x+12,ly,x+w-12,ly);return s;}
  for(let j=0;j<row.lessons.length;j++){
   const l=row.lessons[j],lines=compact?wrapText(`${l.start} līdz ${l.end} · ${l.subject}${l.room?' · Telpa: '+l.room:''}${l.teacher?' · Skolotājs: '+l.teacher:''}`,w-24,size).map(t=>({s:t,color:ink})):recordLines(l,w-24,size);
   const needed=lines.reduce((n,l)=>n+(l.size||size)+2.5,0)+6,reserve=j<row.lessons.length-1?12:0;
   if(yy+needed>bottom-reserve){s+=text('Pilni ieraksti pielikumā',x+12,Math.min(yy+4,bottom),8,accent,true,w-24);extras.push({heading:days[i]+' · '+label(row.date),lessons:row.lessons.slice(j)});break;}
   for(const l of lines){s+=text(l.s,x+12,yy,l.size||size,l.color,l.bold,w-24);yy+=(l.size||size)+2.5;}s+=line(x+12,yy-4,x+w-12,yy-4);yy+=6;
  }
  return s;
 }
 function tasksPanel(x,y,w,h){let s=rect(x,y,w,h,pale,rule)+text('UZDEVUMI UN TERMIŅI',x+13,y+24,10,accent,true,w-26),yy=y+45,bottom=y+h-14;
  if(!tasks.length){for(let ly=yy+10;ly<bottom;ly+=23)s+=rect(x+13,ly-6,6,6,'none',rule)+line(x+29,ly,x+w-13,ly);return s;}
  for(let i=0;i<tasks.length;i++){const t=tasks[i],lines=wrapText(`${t.date.slice(8)}.${t.date.slice(5,7)}. · ${t.title}${t.subject?' · '+t.subject:''} · ${taskLabel(t)}`,w-26,9.5),needed=lines.length*13+10;
   if(yy+needed>bottom-(i<tasks.length-1?12:0)){s+=text('Pilni uzdevumi pielikumā',x+13,Math.min(yy+3,bottom),8,accent,true,w-26);extras.push({heading:'Uzdevumi un termiņi',tasks:tasks.slice(i)});break;}
   for(const l of lines){s+=text(l,x+13,yy,9.5,ink,false,w-26);yy+=13;}yy+=10;
  }return s;
 }
 let body=header();
 if(layout==='columns'){const gap=8,w=(928-4*gap)/5;rows.slice(0,5).forEach((r,i)=>body+=dayBlock(r,i,36+i*(w+gap),138,w,350));body+=dayBlock(rows[5],5,36,501,300,146,true)+dayBlock(rows[6],6,348,501,300,146,true)+tasksPanel(660,501,304,146);}
 if(layout==='cards'){const gap=12,w=(928-3*gap)/4,h=248;rows.forEach((r,i)=>body+=dayBlock(r,i,36+(i%4)*(w+gap),138+Math.floor(i/4)*(h+12),w,h));body+=tasksPanel(36+3*(w+gap),398,w,h);}
 if(layout==='agenda'){
  rows.forEach((r,i)=>{const x=36,y=138+i*73,w=649,h=65;body+=rect(x,y,w,h,i>4?pale:paper,rule)+rect(x,y,100,h,pale)+text(days[i],x+10,y+23,10,accent,true,83)+text(r.date.slice(8)+'.'+r.date.slice(5,7)+'.',x+10,y+43,11,accent,true,83);let yy=y+15;
   if(!r.lessons.length){for(let ly=y+24;ly<y+h-8;ly+=18)body+=line(x+113,ly,x+w-12,ly);}
   for(let j=0;j<r.lessons.length;j++){const l=r.lessons[j],lines=wrapText(`${l.start} līdz ${l.end} · ${l.subject}${l.room?' · Telpa: '+l.room:''}${l.teacher?' · Skolotājs: '+l.teacher:''}`,w-126,9.5),needed=lines.length*12;
    if(yy+needed-12>y+h-10-(j<r.lessons.length-1?10:0)){body+=text('Pilni ieraksti pielikumā',x+113,Math.min(yy,y+h-9),8,accent,true,w-126);extras.push({heading:days[i]+' · '+label(r.date),lessons:r.lessons.slice(j)});break;}
    for(const l of lines){body+=text(l,x+113,yy,9.5,ink,false,w-126);yy+=12;}
   }
  });body+=tasksPanel(700,138,264,321);body+=rect(700,475,264,174,pale)+text('PIEZĪMES MĀCĪBĀM',714,500,10,accent,true,236);for(let yy=523;yy<643;yy+=22)body+=line(714,yy,950,yy);
 }
 if(layout==='studio'){const w=(928-24)/3;rows.slice(0,6).forEach((r,i)=>body+=dayBlock(r,i,36+i%3*(w+12),138+Math.floor(i/3)*197,w,185));body+=dayBlock(rows[6],6,36,532,300,115,true)+tasksPanel(348,532,616,115);}
 const scenes=[shell(body,1)];
 if(extras.length){let b=header(true),yy=153,page=2;const flush=()=>{scenes.push(shell(b,page++));b=header(true);yy=153;};
  for(const extra of extras){if(yy>580)flush();b+=text(extra.heading,36,yy,13,accent,true,928);yy+=26;
   const records=extra.lessons?extra.lessons.map(l=>[`${l.start} līdz ${l.end} · ${l.subject}`,l.room&&'Telpa: '+l.room,l.teacher&&'Skolotājs: '+l.teacher].filter(Boolean).join('\n')):extra.tasks.map(t=>[`${label(t.date)} · ${t.title}`,t.subject&&'Priekšmets: '+t.subject,taskLabel(t)].filter(Boolean).join('\n'));
   for(const r of records){for(const l of wrapText(r,928,12)){if(yy>637){flush();b+=text(extra.heading+' · turpinājums',36,yy,11,accent,true,928);yy+=27;}b+=text(l,36,yy,12,ink,false,928);yy+=18;}yy+=13;}yy+=10;
  }scenes.push(shell(b,page));
 }
 return scenes;
}
