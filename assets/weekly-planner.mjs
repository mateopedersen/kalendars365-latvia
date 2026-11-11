import {fitSize,wrapText} from './planner-font-metrics.mjs';

// Original, date-driven weekly stationery. All marks are vector geometry;
// the same scenes are used for previews, printing, PDF and full-size images.
export const weeklyDesigns=[
 ['Karmīna klasika','Septiņas plašas dienu slejas un nedēļas piezīmes.','columns','#87283e','#fffdfa','#f5e7e8'],
 ['Rīgas siluets','Dienu kartītes ar Rīgas arhitektūras iedvesmotu siluetu.','cards','#85283d','#fffcf5','#f4e7dc'],
 ['Meža miers','Horizontāli dienu lauki un vieta nedēļas mērķiem.','agenda','#355b4a','#fbfcf6','#e8eee5'],
 ['Baltijas krasts','Septiņu dienu pārskats un atsevišķs prioritāšu lauks.','columns','#326d7b','#fbfdfb','#e5f0ee'],
 ['Dzintara gaisma','Dienu kartītes siltos dzintara toņos.','cards','#946022','#fffdf6','#f5e8ca'],
 ['Tīrs balts','Pārskatāms melnbalts plāns ar mazāku tintes patēriņu.','agenda','#303238','#ffffff','#f2f2f0'],
 ['Zvaigžņu nakts','Gaišas dienu slejas uz tumša, ilustrēta debesu vāka.','columns','#b58a42','#fffdfa','#f2eadb'],
 ['Darba ritms','Piecas darba dienas, nedēļas nogale un trīs prioritātes.','work','#294553','#ffffff','#e9eef1'],
 ['Pļavas herbārijs','Septiņas dienu kartītes ar smalku augu ilustrāciju.','cards','#627b55','#fffef8','#edf0e2'],
 ['Smalks režģis','Dienas rindās un punktots lauks brīvām piezīmēm.','agenda','#55525f','#ffffff','#efedf2'],
 ['Latvju raksti','Nedēļas slejas ar oriģinālu ģeometrisku rakstu joslu.','columns','#922b42','#fffdf8','#f5e5e5'],
 ['Ziemeļu skaidrība','Dienu kartītes un vēss, atturīgs noformējums.','cards','#3a6374','#fbfefe','#e7f0f2'],
 ['Bordo un tinte','Darba dienu slejas un atsevišķa nedēļas nogale.','work','#85283e','#fffdf9','#eee8ec'],
 ['Redaktora nedēļa','Septiņas dienas rindās, uzdevumi un nedēļas kopsavilkums.','agenda','#6c4b57','#fffdf8','#f0e8e3'],
 ['Ozola nedēļa','Dienu kartītes, ozollapu ornaments un vieta svarīgākajam.','cards','#546c49','#fffdf7','#eceedd']
].map(([name,description,layout,accent,paper,pale],i)=>({id:i+1,name,description,layout,accent,paper,pale}));
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const DAY=86400000,days=['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena'];
const iso=d=>d.toISOString().slice(0,10),add=(d,n)=>new Date(d.getTime()+n*DAY);
function parseDate(s){const d=new Date(s+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(+d)||iso(d)!==s)throw Error('Izvēlies derīgu nedēļas datumu.');return d;}
export function weeklyPeriod(model){
 const first=parseDate(model.start||model.rows?.[0]?.date||`${model.year}-01-04`),monday=add(first,-((first.getUTCDay()+6)%7)),thursday=add(monday,3),year=thursday.getUTCFullYear();
 const jan4=new Date(Date.UTC(year,0,4,12)),start=add(jan4,-((jan4.getUTCDay()+6)%7)),week=1+Math.round((monday-start)/(7*DAY));
 const dates=Array.from({length:7},(_,i)=>iso(add(monday,i)));
 const format=d=>new Intl.DateTimeFormat('lv-LV',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric'}).format(d);
 return {year,week,start:dates[0],end:dates[6],dates,label:`${format(monday)} - ${format(add(monday,6))}`};
}
export const weeklyFilename=(model,design)=>{const p=weeklyPeriod(model);return `kalendars365-${p.year}-${String(p.week).padStart(2,'0')}-nedela-${String(design).padStart(2,'0')}`;};

export function weeklyScenes(model,{design=1}={}){
 const cfg=weeklyDesigns[Number(design)-1];if(!cfg)throw Error('Izvēlies vienu no 15 nedēļas dizainiem.');
 const p=weeklyPeriod(model),{accent,paper,pale,layout}=cfg,ink='#2c3037',muted='#626972',rule='#d8d4ce',W=1000,H=707;
 const rows=p.dates.map(date=>({date,text:(model.rows||[]).filter(r=>r.date===date).map(r=>r.text).filter(Boolean).join('\n')}));
 const rect=(x,y,w,h,fill='none',stroke='none',rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width=".8"/>`;
 const path=(d,fill='none',stroke='none',width=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
 const line=(x1,y1,x2,y2,color=rule,width=.65)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
 const circle=(cx,cy,r,fill)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
 const text=(value,x,y,size=12,color=ink,bold=false,width=920,anchor='start',role='')=>`<text x="${x}" y="${y}" font-family="DM Sans, Arial, sans-serif" font-size="${fitSize(value,size,width,bold)}" fill="${color}"${bold?' font-weight="700"':''}${anchor!=='start'?` text-anchor="${anchor}"`:''}${role?` data-role="${role}"`:''}>${E(value)}</text>`;
 function logo(x,y){return rect(x,y+3,21,21,paper,accent,2)+rect(x,y+3,21,6,accent,'none',1)+line(x+6,y,x+6,y+6,accent,1.6)+line(x+15,y,x+15,y+6,accent,1.6)+[0,1,2,3,4,5].map(i=>rect(x+4+(i%3)*5,y+12+Math.floor(i/3)*5,3,3,i===4?accent:'#b7b6ae')).join('');}
 const footer=(n=1)=>line(40,662,960,662)+logo(40,672)+text('Kalendārs365™',71,685,12,accent,true,180)+text('KALENDARS365.LV',71,697,7.5,muted,true,180)+text('kalendars365.lv',960,690,10,accent,true,260,'end')+text(`${cfg.name} · ${n>1?'Pielikums '+n:'Nedēļas plānotājs'} · A4`,500,690,8.7,muted,false,390,'middle');
 const shell=(body,n=1)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="707" viewBox="0 0 1000 707" data-weekly-design="${design}" data-layout="${layout}" role="img" aria-label="${E(cfg.name+': '+p.label)}">${rect(0,0,W,H,paper)}${body}${footer(n)}</svg>`;
 function skyline(){let s='';const heights=[24,33,27,42,28,48,37,29,51,32,64,32,42,26,34];for(let i=0;i<heights.length;i++){const x=622+i*22,h=heights[i],y=105-h;s+=rect(x,y,19,h,accent);s+=path(`M${x-2} ${y}L${x+9.5} ${y-9}L${x+21} ${y}Z`,accent);if([5,10].includes(i))s+=path(`M${x+6} ${y-8}L${x+9.5} ${y-24}L${x+13} ${y-8}Z`,accent);for(let j=0;j<2;j++)s+=rect(x+4+j*7,y+7,3,5,paper);}return s+line(620,109,958,109,accent,1.3);}
 function forest(){return [0,1,2,3,4,5,6,7].map((i)=>{const x=676+i*38,y=105,h=30+(i%3)*18;return path(`M${x} ${y-h}L${x-17} ${y-12}H${x-10}L${x-23} ${y}H${x+23}L${x+10} ${y-12}H${x+17}Z`,i%2?accent:'#829678')+rect(x-2,y,4,5,accent);}).join('');}
 function waves(){return circle(878,50,30,'#d9b06d')+[0,1,2,3].map(i=>path(`M630 ${75+i*9}C690 ${50+i*9} 735 ${100+i*9} 800 ${75+i*9}S900 ${56+i*9} 960 ${76+i*9}`, 'none',i%2?accent:'#89adb2',1.8)).join('');}
 function diamond(x,y,r,color=accent){return path(`M${x} ${y-r}L${x+r} ${y}L${x} ${y+r}L${x-r} ${y}Z`,'none',color,1.2);}
 function ornament(){return Array.from({length:10},(_,i)=>{const x=648+i*31;return diamond(x,64,12)+line(x-12,43,x+12,85,accent,1)+line(x+12,43,x-12,85,accent,1)+diamond(x,64,4);}).join('');}
 function herbs(oak=false){let s='';for(let i=0;i<5;i++){const x=708+i*48,y=109,h=45+(i%3)*15;s+=path(`M${x} ${y}Q${x+8} ${y-h/2} ${x-4} ${y-h}`,'none',accent,1.1);for(let j=0;j<3;j++){const a=x+(j%2?2:-1),b=y-12-j*14;s+=path(`M${a} ${b}Q${a-30} ${b-22} ${a-8} ${b-19}Q${a+1} ${b-14} ${a} ${b}Z`,oak?'#97a479':pale,accent,.7)+path(`M${a} ${b-5}Q${a+30} ${b-29} ${a+25} ${b-10}Q${a+18} ${b-2} ${a} ${b-5}Z`,oak?pale:'#97a479',accent,.7);}s+=circle(x-4,y-h-3,3,oak?'#aa8851':accent);}return s;}
 function oak(){let s=path('M670 111Q790 85 955 108','none',accent,1.4);for(let i=0;i<5;i++){const x=702+i*51,y=96+(i%2)*6;s+=path(`M${x} ${y}C${x-18} ${y-7} ${x-22} ${y-18} ${x-12} ${y-20}C${x-30} ${y-30} ${x-19} ${y-37} ${x-8} ${y-32}C${x-18} ${y-50} ${x-1} ${y-54} ${x+3} ${y-42}C${x+12} ${y-56} ${x+26} ${y-44} ${x+17} ${y-31}C${x+32} ${y-34} ${x+37} ${y-19} ${x+20} ${y-15}C${x+25} ${y-2} ${x+10} ${y+3} ${x} ${y}Z`,i%2?pale:'#a1ad7e',accent,.7)+line(x,y+10,x+3,y-39,accent,.7);if(i<4)s+=circle(x+30,105,4,'#ab8b5c')+rect(x+25,99,10,4,accent,'none',2);}return s;}
 function art(){switch(Number(design)){
  case 2:return skyline();case 3:return forest();case 4:return waves();case 5:return circle(892,61,43,'#efcf8e')+circle(890,56,28,'#f6dfac')+path('M841 99L862 25L906 104Z','none',accent,.7)+line(786,109,960,109,accent,.8);
  case 7:return Array.from({length:18},(_,i)=>circle(642+(i*47)%310,22+(i*19)%78,i%3===0?1.7:.9,'#f2dfb8')).join('')+circle(885,57,28,'#f8e9cc')+circle(897,50,27,'#233647');
  case 9:return herbs();case 11:return ornament();case 12:return path('M640 103L730 33L803 102L861 51L958 103Z',pale)+path('M704 55L730 33L758 59L737 52L728 58L721 49Z','#b7cfd2')+line(640,109,960,109,accent,.8);
  case 15:return oak();case 13:return rect(724,35,236,28,accent)+rect(724,63,236,9,'#fffdfa')+rect(724,72,236,28,'#2d3c4a');
  case 8:return [0,1,2].map(i=>rect(735+i*77,37,62,59,pale)+text(String(i+1).padStart(2,'0'),747+i*77,77,25,accent,true,45)).join('');
  case 10:return Array.from({length:40},(_,i)=>circle(718+(i%10)*26,29+Math.floor(i/10)*22,1.1,'#c3bbc6')).join('');
  case 14:return line(735,35,960,35,accent,2)+text('PLĀNS / PIEZĪMES',735,57,11,accent,true,225)+line(735,70,960,70)+line(735,87,960,87);
  default:return text(String(p.week).padStart(2,'0'),955,105,94,pale,true,210,'end');}}
 function header(appendix=false){const dark=Number(design)===7;let s=dark?rect(0,0,1000,120,'#233647'):'';const col=dark?'#fff6e7':accent;s+=art()+text(appendix?'NEDĒĻAS PIEZĪMJU PIELIKUMS':'NEDĒĻAS PLĀNOTĀJS',40,31,10.5,col,true,560)+text(model.title||`${p.week}. nedēļa · ${p.year}`,40,75,36,col,true,550)+text(model.periodLabel||p.label,40,103,12,dark?'#e2d9cc':muted,false,560)+line(40,121,960,121,accent,1.5);return s;}
 let body=header(),extra=[];
 function notePanel(x,y,w,h,label='NEDĒĻAS PIEZĪMES',dotted=false){let s=rect(x,y,w,h,Number(design)===6?paper:pale,'none',4)+text(label,x+13,y+23,10.5,accent,true,w-26);if(dotted){for(let row=y+38;row<y+h-8;row+=14)for(let col=x+14;col<x+w-10;col+=14)s+=circle(col,row,.65,'#b9b5b4');}else if(label.startsWith('TRĪS')){for(let i=0;i<3;i++){const yy=y+42+i*(h-48)/3;s+=rect(x+13,yy-6,6,6,'none',accent)+line(x+27,yy,x+w-13,yy,'#c5c1b8',.6);}}else for(let yy=y+39;yy<y+h-10;yy+=17)s+=line(x+13,yy,x+w-13,yy,'#d5cfca',.6);return s;}
 function block(row,i,x,y,w,h,{compact=false,ruled=true}={}){
  const weekend=i>4,fill=weekend?pale:paper;let s=rect(x,y,w,h,fill,rule,3);
  const day=parseDate(row.date),num=String(day.getUTCDate()).padStart(2,'0'),month=String(day.getUTCMonth()+1).padStart(2,'0');
  if(compact){s+=text(days[i],x+12,y+20,11,accent,true,w-65)+text(`${num}.${month}.`,x+w-12,y+20,11,accent,true,48,'end');}
  else{s+=text(days[i],x+11,y+22,11.5,accent,true,w-22)+text(num,x+11,y+56,29,ink,true,w-22)+text(`${month}. ${day.getUTCFullYear()}`,x+w-11,y+55,8.5,muted,false,w-55,'end');}
  const start=y+(compact?40:78),step=15,size=10.6,bottom=y+h-21,cap=Math.max(1,Math.floor((bottom-start)/step)+1),wrapped=wrapText(row.text,w-24,size),overflow=wrapped.length>cap;
  wrapped.slice(0,overflow?Math.max(0,cap-1):cap).forEach((t,n)=>s+=text(t,x+12,start+n*step,size,ink,false,w-24));
  if(overflow){s+=text('Pilns teksts pielikumā',x+12,bottom,8,accent,true,w-24);extra.push(row);}
  else if(ruled){const first=start+Math.max(1,wrapped.length)*step+5;for(let yy=first;yy<y+h-12;yy+=18)s+=line(x+12,yy,x+w-12,yy,rule,.55);}
  return s;
 }
 if(layout==='columns'){
  const gap=7,w=(920-gap*6)/7;rows.forEach((r,i)=>body+=block(r,i,40+i*(w+gap),138,w,411));
  body+=notePanel(40,563,600,82)+notePanel(654,563,306,82,'TRĪS SVARĪGĀKIE DARBI');
 }else if(layout==='cards'){
  const gap=12,w=(920-gap*3)/4,h=245;rows.forEach((r,i)=>body+=block(r,i,40+(i%4)*(w+gap),138+Math.floor(i/4)*(h+12),w,h));
  body+=notePanel(40+3*(w+gap),395,w,h,'NEDĒĻAS PRIORITĀTES');
 }else if(layout==='agenda'){
  const left=40,w=650,h=65,gap=7;rows.forEach((r,i)=>body+=block(r,i,left,138+i*(h+gap),w,h,{compact:true,ruled:false}));
  body+=notePanel(706,138,254,169,'TRĪS SVARĪGĀKIE DARBI')+notePanel(706,323,254,317,Number(design)===14?'NEDĒĻAS KOPSAVILKUMS':'PIEZĪMES',Number(design)===10);
 }else{
  const w=(920-4*9)/5;rows.slice(0,5).forEach((r,i)=>body+=block(r,i,40+i*(w+9),138,w,335));
  body+=block(rows[5],5,40,487,294,153,{compact:true})+block(rows[6],6,347,487,294,153,{compact:true})+notePanel(654,487,306,153,'NĀKAMĀS NEDĒĻAS PRIORITĀTES');
 }
 const pages=[shell(body)];
 if(extra.length){let b=header(true),y=150,n=2;const flush=()=>{pages.push(shell(b,n++));b=header(true);y=150;};for(const row of extra){let lines=wrapText(row.text,888,13);if(y>570)flush();b+=text(row.date,40,y+5,13,accent,true,920);y+=32;for(const t of lines){if(y>632){flush();b+=text(row.date+' · turpinājums',40,y+5,11,accent,true,920);y+=30;}b+=text(t,40,y,13,ink,false,920);y+=19;}y+=23;}pages.push(shell(b,n));}
 return pages;
}
