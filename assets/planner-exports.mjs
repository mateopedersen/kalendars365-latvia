import {fitSize,wrapText} from './planner-font-metrics.mjs';
/* Personal planner exports: the calendar and an overflow appendix share one data snapshot. */
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const plannerDesigns=['Karmīna klasika','Tintes piezīmes','Meža miers','Baltijas līnijas','Dzintara lapa','Tīrs balts','Nakts plāns','Darba ritms','Rīta raksti','Smalks režģis','Silta krēmkrāsa','Ziemeļu skaidrība','Bordo un tinte','Redaktora stils','Terakotas dienas'];
const palettes={1:['#852843','#fffdf8','#f6e9e5'],2:['#3d4355','#faf9f5','#e8e9ef'],3:['#3f6858','#f9fbf5','#e0ebde'],4:['#316d80','#fbfdfd','#dfedf0'],5:['#a9682f','#fffcf3','#f7e9ca'],6:['#3e3c43','#ffffff','#f3f2f2'],7:['#f0c5a2','#302532','#473544'],8:['#283e4a','#ffffff','#e9eef1'],9:['#a04461','#fff8f6','#f2dfe6'],10:['#6b6570','#fffefa','#eee9e7'],11:['#677955','#fffefa','#edf1e7'],12:['#416473','#f6fbfc','#e3eff1'],13:['#862840','#fffdf8','#eae4ee'],14:['#745961','#fffdf9','#f4ebe8'],15:['#a95137','#fff9f1','#f1dfd0']};
export function plannerScenes(model,{design=1}={}){
 const [accent,paper,pale]=palettes[design]||palettes[1],ink=Number(design)===7?'#f8eee8':'#352e37',font='DM Sans, Arial, Helvetica, sans-serif';const out=[],extra=[];
 const text=(value,x,y,size=12,color=ink,bold=false,width=960-x)=>`<text x="${x}" y="${y}" font-family="${font}" font-size="${fitSize(value,size,width,bold)}" fill="${color}"${bold?' font-weight="700"':''}>${E(value)}</text>`;
 const wrapPage=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="707" viewBox="0 0 1000 707"><rect width="1000" height="707" fill="${paper}"/>${body}<path d="M40 666H960" stroke="#e0d7d0"/>${text('KALENDARS365.LV',802,686,10,accent,true)}</svg>`;
 const header=()=>{
  const dark=[7,8,12,15].includes(Number(design));
  if(dark)return `<rect x="0" width="1000" height="106" fill="${accent}"/>`+text(model.periodLabel||'TAVS PERSONĪGAIS PLĀNS',40,31,10,Number(design)===7?'#3b2834':'#fff8eb',true)+text(model.title,40,76,32,Number(design)===7?'#302532':'#ffffff',true);
  let decoration='';
  if([2,4,9,13].includes(Number(design)))decoration+=`<rect x="40" y="34" width="4" height="50" fill="${accent}"/>`;
  if([3,5,11].includes(Number(design)))decoration+=`<rect x="0" width="1000" height="8" fill="${accent}"/><rect x="940" y="25" width="20" height="13" rx="6" fill="${pale}"/>`;
  if(Number(design)===10)decoration+=`<path d="M40 24H960M40 101H960" stroke="${accent}" stroke-width=".5"/>`;
  if(Number(design)===13)decoration+=`<rect x="40" y="98" width="460" height="4" fill="${accent}"/><rect x="500" y="98" width="460" height="4" fill="#364052"/>`;
  const inset=[2,4,9,13].includes(Number(design))?54:40;
  return decoration+text(model.periodLabel||'TAVS PERSONĪGAIS PLĀNS',inset,39,Number(design)===6?9:10,accent,true)+text(model.title,inset,80,Number(design)===6?29:32,accent,true)+`<path d="M40 100H960" stroke="${accent}" stroke-width="${[6,10,14].includes(Number(design))?1:3}"/>`;
 };
 const dateLabel=date=>new Intl.DateTimeFormat('lv-LV',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric'}).format(new Date(date+'T12:00:00Z'));
 let body=header();
 if(['day','list'].includes(model.type)){
  let y=136;const rows=model.type==='list'?model.rows.filter(r=>r.text):model.rows;
  if(!rows.length)body+=text('Atlasītajā periodā nav notikumu vai piezīmju.',40,y,14);
  for(const row of rows){if(y>580){out.push(wrapPage(body));body=header();y=136;}body+=text(dateLabel(row.date),40,y,16,accent,true);y+=28;const lines=wrapText(row.text||'Vieta taviem plāniem.',900,12);for(const line of lines){if(y>636){out.push(wrapPage(body));body=header();y=136;body+=text(dateLabel(row.date)+' · turpinājums',40,y,14,accent,true);y+=27;}body+=text(line,40,y,12);y+=18;}y+=26;}
  out.push(wrapPage(body));return out;
 }
 const weekday=['P','O','T','C','Pk','S','Sv'];let cells,rowsCount;
 if(model.type==='week'){cells=model.rows.map((r,i)=>({...r,index:i}));rowsCount=1;}else{const d=new Date(Date.UTC(model.year,model.month-1,1)),offset=(d.getUTCDay()+6)%7;rowsCount=Math.ceil((offset+new Date(Date.UTC(model.year,model.month,0)).getUTCDate())/7);cells=model.rows.map(r=>({...r,index:offset+Number(r.date.slice(8))-1}));}
 const cw=920/7,ch=(model.type==='week'?480:495)/rowsCount,top=150;
 weekday.forEach((d,i)=>{body+=text(d,40+i*cw+8,132,11,accent,true,cw-16);});
 for(const row of cells){const col=row.index%7,line=Math.floor(row.index/7),x=40+col*cw,y=top+line*ch;body+=`<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${col>=5?pale:paper}" stroke="#ded3cd" stroke-width=".7"/>`;body+=text(model.type==='week'?row.date.slice(8)+'. '+row.date.slice(5,7)+'.':Number(row.date.slice(8)),x+9,y+24,16,accent,true,cw-18);const wrapped=wrapText(row.text,cw-18,10.5),cap=Math.max(1,Math.floor((ch-42)/13));wrapped.slice(0,cap).forEach((t,i)=>body+=text(t,x+9,y+43+i*13,10.5,ink,false,cw-18));if(wrapped.length>cap){body+=text('Pilns teksts pielikumā ↗',x+9,y+ch-6,7,accent,false,cw-18);extra.push(row);}}
 out.push(wrapPage(body));
 if(extra.length){let y=143,body=text('PIEZĪMJU PIELIKUMS',40,42,11,accent,true)+text(model.title,40,80,28,accent,true);for(const row of extra){const wrapped=wrapText(row.text,920,12);if(y>590){out.push(wrapPage(body));body=text('PIEZĪMJU PIELIKUMS',40,42,11,accent,true);y=80;}body+=text(row.date,40,y,14,accent,true);y+=24;for(const line of wrapped){if(y>638){out.push(wrapPage(body));body=text('PIEZĪMJU TURPINĀJUMS',40,42,11,accent,true);y=80;}body+=text(line,40,y,12);y+=18;}y+=18;}out.push(wrapPage(body));}
 return out;
}
let embeddedFont;
async function fontStyle(){if(!embeddedFont)embeddedFont=fetch('/assets/fonts/DM-Sans.woff2').then(r=>{if(!r.ok)throw Error('Kalendāra fontu nevar ielādēt.');return r.blob();}).then(b=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(`<style>@font-face{font-family:"DM Sans";src:url("${reader.result}") format("woff2");font-weight:100 1000}</style>`);reader.onerror=reject;reader.readAsDataURL(b);}));return embeddedFont;}
async function raster(svg,format){svg=svg.replace('><rect','>'+await fontStyle()+'<rect');const canvas=document.createElement('canvas');canvas.width=7016;canvas.height=4961;const img=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{img.src=url;await img.decode();const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,format,.96));if(!blob)throw Error('Pārlūks nevar sagatavot attēlu. Izmanto PDF.');return blob;}finally{URL.revokeObjectURL(url);canvas.width=canvas.height=1;}}
export async function makePlannerFile(model,{format='pdf',design=1}={}){const scenes=plannerScenes(model,{design}),name='kalendars365-'+model.year+'-'+String(model.month).padStart(2,'0')+'-'+model.type+'-'+String(design).padStart(2,'0');if(format==='webp'){if(scenes.length>1){const files={};for(let i=0;i<scenes.length;i++)files[`${name}-${String(i+1).padStart(2,'0')}.webp`]=new Uint8Array(await (await raster(scenes[i],'image/webp')).arrayBuffer());return{blob:new Blob([window.CategoryCore.zipStore(files)],{type:'application/zip'}),name:name+'-atteli.zip',pages:scenes.length};}return{blob:await raster(scenes[0],'image/webp'),name:name+'.webp',pages:1};}const images=[];for(const svg of scenes){const blob=await raster(svg,'image/jpeg');images.push({width:7016,height:4961,bytes:new Uint8Array(await blob.arrayBuffer())});}const version=document.querySelector('meta[name=asset-version]')?.content||'',{createPDF}=await import('./studio/engine.mjs?v='+version);return{blob:new Blob([createPDF(images,297,210)],{type:'application/pdf'}),name:name+'.pdf',pages:images.length};}
