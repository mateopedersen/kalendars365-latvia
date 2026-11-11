// Calendar Studio: UTC calendar arithmetic and a shared SVG source for preview/export.
export const VERSION = 1;
import {LATVIA_HOLIDAYS,STUDIO_PHOTOS} from './latvia-data.mjs?v=b93e5f0b2ed6';
export {STUDIO_PHOTOS};
export const FONTS = {
 sans:{label:'Mūsdienīgs · Arial',family:'Arial, Helvetica, sans-serif'},
 editorial:{label:'Žurnāls · Georgia',family:'Georgia, Times New Roman, serif'},
 classic:{label:'Klasika · Times',family:'Times New Roman, Times, serif'},
 rounded:{label:'Mājīgs · Trebuchet',family:'Trebuchet MS, Arial, sans-serif'},
 clean:{label:'Skaidrs · Verdana',family:'Verdana, Arial, sans-serif'},
 mono:{label:'Tehnisks · Courier',family:'Courier New, Courier, monospace'}
};
export const PRESETS = [
 {id:'latvia',label:'Latvijas karmīns',note:'Bordo, balts un silts papīrs',colors:{accent:'#8a2946',ink:'#352c35',paper:'#fffdf8',weekend:'#a53753',grid:'#e3d4cb'},font:'sans'},
 {id:'editorial',label:'Gada stāsts',note:'Izteiksmīgs gads un eleganti burti',colors:{accent:'#79474a',ink:'#352c35',paper:'#fffcf5',weekend:'#a53753',grid:'#e4d6cb'},font:'editorial'},
 {id:'photo',label:'Tava fotogrāfija',note:'Atmiņas kalendāra priekšplānā',colors:{accent:'#42635d',ink:'#2d3b39',paper:'#ffffff',weekend:'#a53753',grid:'#dce4de'},font:'sans'},
 {id:'minimal',label:'Tīra lapa',note:'Mierīgas līnijas, vairāk telpas',colors:{accent:'#57535b',ink:'#322f36',paper:'#ffffff',weekend:'#96324d',grid:'#e3dfe3'},font:'clean'},
 {id:'business',label:'Darba ritms',note:'Skaidrs plāns tavam uzņēmumam',colors:{accent:'#33505d',ink:'#263b43',paper:'#ffffff',weekend:'#8a2946',grid:'#d7e0e2'},font:'sans'},
 {id:'bold',label:'Saules akcents',note:'Spēcīgs virsraksts un silts tonis',colors:{accent:'#bd7938',ink:'#392f32',paper:'#fffcf6',weekend:'#8a2946',grid:'#e9dbca'},font:'rounded'}
];
export const PRESET_LAYOUTS={
 latvia:{view:'year',orientation:'landscape',showGrid:true,showNotes:false,showWeekNumbers:false,titleAlign:'left',titleSize:40},
 editorial:{view:'year',orientation:'portrait',showGrid:false,showNotes:false,showWeekNumbers:false,titleAlign:'left',titleSize:54},
 photo:{view:'month',orientation:'portrait',showGrid:true,showNotes:false,showWeekNumbers:false,titleAlign:'left',titleSize:40,photoPlacement:'banner'},
 minimal:{view:'year',orientation:'portrait',showGrid:false,showNotes:false,showWeekNumbers:false,titleAlign:'center',titleSize:32},
 business:{view:'month',orientation:'landscape',showGrid:true,showNotes:true,showWeekNumbers:true,titleAlign:'left',titleSize:38},
 bold:{view:'year',orientation:'landscape',showGrid:false,showNotes:false,showWeekNumbers:false,titleAlign:'center',titleSize:55}
};
export function applyPreset(state,id){const p=PRESETS.find(p=>p.id===id);if(!p)return state;return {...state,...PRESET_LAYOUTS[id],template:id,colors:{...p.colors},font:p.font};}
export const LOCALES={lv:{months:['janvāris','februāris','marts','aprīlis','maijs','jūnijs','jūlijs','augusts','septembris','oktobris','novembris','decembris'],days:['Sv','P','O','T','C','Pk','S'],week:'Ned.',notes:'PIEZĪMES',events:'MANI NOTIKUMI',more:'vēl'}};
export const PAPERS={a4:[210,297],a3:[297,420],letter:[215.9,279.4]};
export function moveMonth(s,delta){const index=(s.year-2027)*12+s.month-1+delta;if(index<0||index>47)return {year:s.year,month:s.month};return {year:2027+Math.floor(index/12),month:index%12+1};}
export const uid=()=>globalThis.crypto?.randomUUID?.() || `k${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const clamp=(value,min,max,fallback=min)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export const iso=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
export const clone=s=>({...s,colors:{...s.colors},events:s.events.map(e=>({...e})),layers:s.layers.map(l=>({...l}))});
export function initialState(year=2027){
  return {version:VERSION,year,month:1,view:'year',template:'latvia',weekStart:1,locale:'lv',paper:'a4',orientation:'landscape',margin:12,
    schema:'kalendars365-studio.v1',title:'Mans gads',subtitle:'Vieta tam, kas tev svarīgs.',name:'',footer:'Mans laiks. Mani plāni.',
    font:'sans',titleSize:40,textScale:1,titleAlign:'left',colors:{...PRESETS[0].colors},showHolidays:true,showHolidayNames:true,
    showWeekends:true,showWeekNumbers:false,showAdjacent:false,showGrid:true,showNotes:false,notes:'',includeAgenda:true,
    photo:'',photoCredit:'',photoRatio:1.5,photoPlacement:'banner',photoPosition:50,photoHeight:25,photoOpacity:18,photoFit:'cover',events:[],layers:[],quality:300};
}
export function validDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;
  const [y,m,d]=value.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
  return y>=1900&&y<=2100&&dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;
}
const hex=(v,f)=>/^#[0-9a-f]{6}$/i.test(v)?v:f;
const text=(v,max)=>String(v??'').slice(0,max).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const image=v=>typeof v==='string'&&v.length<=8000000&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)?v:'';
export function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Fails nav Kalendārs365 projekts.');
  if(input.version!==VERSION)throw Error('Šī projekta versija netiek atbalstīta.');
  const s=initialState();
  for(const k of ['year','month','margin','titleSize','textScale','photoPosition','photoHeight','photoOpacity','quality']){
    const bounds={year:[2027,2030],month:[1,12],margin:[6,25],titleSize:[20,76],textScale:[.8,1.3],photoPosition:[0,100],photoHeight:[15,40],photoOpacity:[0,65],quality:[150,600]}[k];
    s[k]=clamp(input[k]??s[k],...bounds,s[k]);
  }
  s.year=Math.round(s.year);s.month=Math.round(s.month);s.quality=s.quality>=450?600:s.quality>=225?300:150;
  const options={view:['year','month'],template:PRESETS.map(p=>p.id),weekStart:[0,1],locale:['lv'],paper:Object.keys(PAPERS),orientation:['landscape','portrait'],font:Object.keys(FONTS),titleAlign:['left','center','right'],photoPlacement:['banner','background'],photoFit:['cover','contain']};
  for(const [k,values] of Object.entries(options))if(values.includes(input[k]))s[k]=input[k];
  for(const k of ['showHolidays','showHolidayNames','showWeekends','showWeekNumbers','showAdjacent','showGrid','showNotes','includeAgenda'])if(typeof input[k]==='boolean')s[k]=input[k];
  for(const [k,n] of Object.entries({title:90,subtitle:180,name:100,footer:200,notes:300,photoCredit:350}))s[k]=text(input[k]??s[k],n);
  for(const k of Object.keys(s.colors))s.colors[k]=hex(input.colors?.[k],s.colors[k]);
  s.photo=image(input.photo);
  s.photoRatio=clamp(input.photoRatio,.05,20,1.5);
  s.events=(Array.isArray(input.events)?input.events:[]).slice(0,500).filter(e=>e&&validDate(e.date)&&String(e.title??'').trim()).map(e=>({id:/^[a-zA-Z0-9_-]{1,100}$/.test(e.id||'')?e.id:uid(),date:e.date,title:text(e.title,120),color:hex(e.color,'#8a2946'),annual:e.annual===true}));
  s.layers=(Array.isArray(input.layers)?input.layers:[]).slice(0,16).filter(l=>l&&['text','image'].includes(l.type)).map(l=>({
    id:/^[a-zA-Z0-9_-]{1,100}$/.test(l.id||'')?l.id:uid(),type:l.type,text:text(l.text,400),src:image(l.src),x:clamp(l.x,0,100,50),y:clamp(l.y,0,100,50),
    width:clamp(l.width,3,100,20),height:clamp(l.height,3,100,12),size:clamp(l.size,8,100,24),color:hex(l.color,s.colors.ink),
    font:FONTS[l.font]?l.font:s.font,align:['start','middle','end'].includes(l.align)?l.align:'start',bold:l.bold===true,italic:l.italic===true,
    rotation:clamp(l.rotation,-180,180,0),opacity:clamp(l.opacity,10,100,100)
  })).filter(l=>l.type==='text'||l.src);
  return s;
}
export function monthGrid(year,month,weekStart=1){
  const first=new Date(Date.UTC(year,month-1,1)),offset=(first.getUTCDay()-weekStart+7)%7;
  return Array.from({length:42},(_,i)=>{const dt=new Date(Date.UTC(year,month-1,1-offset+i));return {year:dt.getUTCFullYear(),month:dt.getUTCMonth()+1,day:dt.getUTCDate(),weekday:dt.getUTCDay(),date:iso(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate()),current:dt.getUTCMonth()===month-1};});
}
export function isoWeek(date){
  const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  return Math.ceil(((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000+1)/7);
}
export function holidays(year){return (LATVIA_HOLIDAYS[year]||[]).map(e=>({...e}));}
export function eventsFor(s,month=null,includeHolidays=true){
  const events=s.events.flatMap(e=>{const date=e.annual?`${s.year}${e.date.slice(4)}`:e.date;return validDate(date)&&Number(date.slice(0,4))===s.year?[{...e,date}]:[];});
  if(includeHolidays&&s.showHolidays)events.push(...holidays(s.year).map(e=>({...e,color:s.colors.weekend})));
  return events.filter(e=>!month||Number(e.date.slice(5,7))===month).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
}
export function dimensions(s){const [a,b]=PAPERS[s.paper]||PAPERS.a4;const mm=s.orientation==='landscape'?[b,a]:[a,b];return {width:1000,height:1000*mm[1]/mm[0],mmWidth:mm[0],mmHeight:mm[1]};}
function mix(color,amount=.9){return '#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*(1-amount)+255*amount).toString(16).padStart(2,'0')).join('');}
function svgText(value,x,y,size,fill,font,extra=''){return `<text x="${x}" y="${y}" font-family="${esc(FONTS[font]?.family||FONTS.sans.family)}" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>`;}
function lines(value,max){const words=String(value).split(/\s+/),out=[];let line='';for(let word of words){if((line+' '+word).trim().length>max&&line){out.push(line);line='';}while(word.length>max){out.push(word.slice(0,max));word=word.slice(max);}line=(line+' '+word).trim();}if(line)out.push(line);return out;}
function shorten(value,max){return String(value).length>max?String(value).slice(0,max-1)+'…':value;}
export function renderCalendar(s,{month=s.month,editing=false,selected=null,idPrefix='studio-art'}={}){
  const {width:w,height:h,mmWidth}=dimensions(s),m=s.margin/mmWidth*w,c=s.colors,L=LOCALES[s.locale],scale=s.textScale;
  const isMonth=s.view==='month',hasBanner=!!s.photo&&s.photoPlacement==='banner',photoH=hasBanner?(isMonth?h*s.photoHeight/100:Math.min(165,h*.16)):0;
  const header=hasBanner&&isMonth?photoH+128:Math.max(125,h*.18),foot=h-m-16,notesH=s.showNotes?Math.min(100,h*.13):0;
  const art=[];
  art.push(`<rect width="${w}" height="${h}" fill="${c.paper}"/>`);
  if(s.photo&&s.photoPlacement==='background')art.push(`<image href="${s.photo}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${s.photoOpacity/100}"/>`);
  if(hasBanner){const bw=isMonth?w-m*2:230,bx=isMonth?m:w-m-bw,bh=photoH,ratio=s.photoRatio||1.5;let iw=bw,ih=bh,ix=bx,iy=m;if(s.photoFit==='cover'){const factor=Math.max(bw/ratio,bh);iw=factor*ratio;ih=factor;ix=bx-(iw-bw)/2;iy=m-(ih-bh)*s.photoPosition/100;}const clipId=`${idPrefix}-photo-clip-${month}`;art.push(`<defs><clipPath id="${clipId}"><rect x="${bx}" y="${m}" width="${bw}" height="${bh}" rx="3"/></clipPath></defs><image href="${s.photo}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`);}
  const titleY=hasBanner&&isMonth?m+photoH+53:m+54;
  const align=s.titleAlign==='center'?'middle':s.titleAlign==='right'?'end':'start',textEnd=hasBanner&&!isMonth?w-m-255:w-m,tx=align==='middle'?(m+textEnd)/2:align==='end'?textEnd:m;
  const heading=isMonth?`${L.months[month-1]} ${s.year}`:s.title||String(s.year);
  if(s.template==='bold')art.push(`<rect x="${m}" y="${titleY-47}" width="8" height="54" fill="${c.accent}"/>`);
  const titleAvailable=textEnd-m-(!isMonth&&!hasBanner&&align==='start'?170:0)-(s.template==='bold'?22:0),titleSize=Math.min(s.titleSize,titleAvailable/Math.max(1,heading.length*.58));
  art.push(svgText(heading,tx+(s.template==='bold'&&align==='start'?22:0),titleY,Math.max(13,titleSize),c.ink,s.font,`font-weight="700" text-anchor="${align}"`));
  const second=[s.name,isMonth?s.title:s.subtitle,!isMonth&&(hasBanner||align!=='start')?s.year:''].filter(Boolean).join(' · ');
  art.push(svgText(shorten(second,Math.floor((textEnd-m)/(6.5*scale))),tx,titleY+25,13*scale,c.ink,s.font,`text-anchor="${align}" opacity=".7"`));
  if(!isMonth&&align==='start'&&!hasBanner)art.push(svgText(s.year,w-m,titleY,s.template==='editorial'?75:52,c.accent,s.font,'text-anchor="end" font-weight="700"'));
  if(s.template!=='minimal')art.push(`<path d="M${m} ${titleY+45}H${w-m}" stroke="${c.grid}"/><path d="M${m} ${titleY+45}h${(w-2*m)/3}" stroke="${c.accent}" stroke-width="3"/><path d="M${m+(w-2*m)/3} ${titleY+45}h${(w-2*m)/6}" stroke="${c.weekend}" stroke-width="3"/>`);
  const top=Math.max(header,titleY+66),bottom=foot-28-notesH;
  const allEvents=eventsFor(s),eventMap=new Map();for(const e of allEvents){if(!eventMap.has(e.date))eventMap.set(e.date,[]);eventMap.get(e.date).push(e);}
  if(isMonth)art.push(drawMonth(month,m,top,w-2*m,bottom-top,true));
  else{const columns=s.orientation==='landscape'?4:3,rows=12/columns,gap=22,cw=(w-2*m-gap*(columns-1))/columns,ch=(bottom-top-gap*(rows-1))/rows;for(let mo=1;mo<=12;mo++){art.push(drawMonth(mo,m+((mo-1)%columns)*(cw+gap),top+Math.floor((mo-1)/columns)*(ch+gap),cw,ch,false));}}
  if(s.showNotes){const y=bottom+20;art.push(svgText(L.notes,m,y,9,c.accent,s.font,'font-weight="700" letter-spacing="1.5"'));lines(s.notes,120).slice(0,3).forEach((t,i)=>art.push(svgText(t,m,y+19+i*16,11,c.ink,s.font)));if(!s.notes)for(let i=1;i<=3;i++)art.push(`<path d="M${m} ${y+19+i*14}H${w-m}" stroke="${c.grid}"/>`);}
  art.push(`<path d="M${m} ${foot-8}H${w-m}" stroke="${c.grid}"/>`);
  art.push(svgText(shorten(s.footer,Math.max(20,Math.floor((w-2*m-165)/5.5))),m,foot+8,9,c.ink,s.font,'opacity=".6"'));
  art.push(svgText('KALENDARS365.LV',w-m,foot+8,8,c.accent,'sans','text-anchor="end" letter-spacing="1.3"'));
  if(s.photo&&s.photoCredit)art.push(svgText(s.photoCredit,m,foot+22,Math.min(6.2,(w-2*m)/Math.max(1,s.photoCredit.length*.6)),c.ink,'sans','opacity=".7"'));
  for(const layer of s.layers){const x=layer.x/100*w,y=layer.y/100*h,lw=layer.width/100*w,lh=layer.height/100*h;
    let content=layer.type==='image'?`<image href="${layer.src}" x="0" y="0" width="${lw}" height="${lh}" preserveAspectRatio="xMidYMid meet"/>`:layer.text.split('\n').map((t,i)=>svgText(t,0,i*layer.size*1.2,layer.size,layer.color,layer.font,`font-weight="${layer.bold?'700':'400'}" font-style="${layer.italic?'italic':'normal'}" text-anchor="${layer.align}"`)).join('');
    if(editing&&layer.id===selected){const estimate=layer.type==='image'?lw:Math.max(45,...layer.text.split('\n').map(t=>t.length*layer.size*.57)),eh=layer.type==='image'?lh:layer.size*1.2*layer.text.split('\n').length;const bx=layer.type==='text'&&layer.align==='middle'?-estimate/2:layer.type==='text'&&layer.align==='end'?-estimate:0;content+=`<rect x="${bx-7}" y="${layer.type==='image'?-7:-layer.size-4}" width="${estimate+14}" height="${eh+14}" fill="none" stroke="#8a2946" stroke-width="1.5" stroke-dasharray="5 3" pointer-events="none"/>`;}
    art.push(`<g ${editing?`data-layer="${esc(layer.id)}" tabindex="0" role="button" aria-label="${esc(layer.type==='image'?'Attēls':layer.text)}" style="cursor:move"`:''} transform="translate(${x} ${y}) rotate(${layer.rotation})" opacity="${layer.opacity/100}">${content}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc((isMonth?L.months[month-1]+' ':'')+'Kalendārs '+s.year)}"><title>${esc(s.title||'Kalendārs')} ${s.year}</title>${art.join('')}</svg>`;
  function drawMonth(mo,x,y,cw,ch,large){
    const out=[],grid=monthGrid(s.year,mo,s.weekStart),weekW=s.showWeekNumbers?(large?24:16):0,cellW=(cw-weekW)/7;
    const rows=large?Math.ceil((grid.findIndex(day=>day.current)+new Date(Date.UTC(s.year,mo,0)).getUTCDate())/7):6;
    const labelH=large?0:27,dayH=large?27:17,rowH=(ch-labelH-dayH)/rows,base=y+labelH+dayH;
    if(!large)out.push(svgText(L.months[mo-1].toUpperCase(),x,y+15,14*scale,c.accent,s.font,'font-weight="700" letter-spacing=".8"'));
    if(s.showWeekNumbers)out.push(svgText(L.week,x+weekW/2,y+labelH+dayH*.67,large?10:7,c.ink,s.font,'text-anchor="middle" opacity=".45"'));
    for(let col=0;col<7;col++){const day=(col+s.weekStart)%7;out.push(svgText(L.days[day],x+weekW+cellW*(col+.5),y+labelH+dayH*.67,(large?12:7.5)*scale,s.showWeekends&&[0,6].includes(day)?c.weekend:c.ink,s.font,'font-weight="700" text-anchor="middle" opacity=".75"'));}
    for(let row=0;row<rows;row++){
      if(s.showWeekNumbers)out.push(svgText(isoWeek(grid[row*7+(s.weekStart===0?1:0)].date),x+weekW/2,base+row*rowH+(large?22:rowH*.65),large?10:7,c.ink,s.font,'text-anchor="middle" opacity=".4"'));
      for(let col=0;col<7;col++){
        const day=grid[row*7+col];if(!day.current&&!s.showAdjacent)continue;
        const dx=x+weekW+cellW*col,dy=base+row*rowH,list=day.current?(eventMap.get(day.date)||[]):[],holiday=list.some(e=>e.holiday),weekend=[0,6].includes(day.weekday),color=!day.current?mix(c.ink,.65):holiday?c.weekend:weekend&&s.showWeekends?c.weekend:c.ink;
        if(large&&s.showWeekends&&weekend)out.push(`<rect x="${dx}" y="${dy}" width="${cellW}" height="${rowH}" fill="${mix(c.weekend,.97)}"/>`);
        if(s.showGrid)out.push(`<path d="M${dx} ${dy}H${dx+cellW}" stroke="${c.grid}" stroke-width="${large?1:.65}"/>`);
        out.push(svgText(day.day,large?dx+9:dx+cellW/2,large?dy+Math.min(25,rowH*.62):dy+rowH*.62,Math.min((large?20:11.5)*scale,rowH*.78),color,s.font,`text-anchor="${large?'start':'middle'}" font-weight="${holiday?'700':'400'}"`));
        if(large){const visible=list.filter(e=>!e.holiday||s.showHolidayNames),cap=Math.max(0,Math.min(4,Math.floor((rowH-29)/16))),max=Math.max(9,Math.floor(cellW/(6*scale)));visible.slice(0,cap).forEach((e,i)=>{out.push(`<rect x="${dx+8}" y="${dy+28+i*16}" width="3" height="9" rx="1" fill="${e.color||c.accent}"/>`);out.push(svgText(shorten(e.title,max),dx+16,dy+36+i*16,9*scale,e.color||c.accent,s.font));});if(visible.length>cap&&cap>0)out.push(svgText(`+${visible.length-cap} ${L.more}`,dx+9,dy+rowH-4,8,c.ink,s.font,'opacity=".65"'));else if(visible.length&&cap===0)out.push(`<circle cx="${dx+cellW-12}" cy="${dy+Math.min(20,rowH*.5)}" r="3" fill="${visible[0].color||c.accent}"/>`);}
        else if(list.some(e=>!e.holiday)){out.push(`<circle cx="${dx+cellW*.76}" cy="${dy+rowH*.40}" r="2" fill="${list.find(e=>!e.holiday).color||c.accent}"/>`);}
      }
    }
    return out.join('');
  }
}
export function renderAgenda(s,entries,page=1){
  const {width:w,height:h,mmWidth}=dimensions(s),m=s.margin/mmWidth*w,L=LOCALES[s.locale],out=[`<rect width="${w}" height="${h}" fill="${s.colors.paper}"/>`];
  out.push(svgText(L.events,m,m+32,27,s.colors.ink,s.font,'font-weight="700"'),svgText(`${s.title||s.year} · ${s.year} · ${page}`,m,m+56,12,s.colors.accent,s.font));
  entries.forEach((e,i)=>{const y=m+95+i*43;out.push(`<path d="M${m} ${y+24}H${w-m}" stroke="${s.colors.grid}"/>`,svgText(e.date.split('-').reverse().join('.'),m,y,12,s.colors.ink,s.font));lines(e.title,Math.max(30,Math.floor((w-m*2-106)/7))).forEach((line,n)=>out.push(svgText(line,m+106,y+n*16,13,e.color||s.colors.accent,s.font)));});
  out.push(svgText('KALENDARS365.LV',w-m,h-m+8,8,s.colors.accent,'sans','text-anchor="end" letter-spacing="1.3"'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out.join('')}</svg>`;
}
export function exportPages(s,scope='current'){
  const months=s.view==='month'&&scope==='all'?Array.from({length:12},(_,i)=>i+1):[s.month],pages=months.map(month=>renderCalendar(s,{month}));
  const events=eventsFor(s,s.view==='month'&&scope!=='all'?s.month:null,false);
  if(s.includeAgenda&&events.length){const {height,mmWidth}=dimensions(s),perPage=Math.max(5,Math.floor((height-s.margin/mmWidth*2000-110)/43));for(let i=0;i<events.length;i+=perPage)pages.push(renderAgenda(s,events.slice(i,i+perPage),i/perPage+1));}
  return pages;
}
export function parseEvents(source,kind='csv'){
  const out=[];
  if(kind==='ics'){
    const unfolded=source.replace(/\r?\n[ \t]/g,'');
    for(const block of unfolded.split('BEGIN:VEVENT').slice(1)){
      const date=block.match(/(?:^|\n)DTSTART(?:;[^:\n]*)?:(\d{8})/)?.[1],title=block.match(/(?:^|\n)SUMMARY(?:;[^:\n]*)?:(.*)/)?.[1];
      if(date&&title)out.push({date:`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,title:title.replace(/\\n/gi,' ').replace(/\\([,;\\])/g,'$1'),annual:/RRULE:[^\n]*FREQ=YEARLY/.test(block),color:'#8a2946'});
    }
  }else{
    for(const line of source.split(/\r?\n/)){
      const cells=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'&&quoted){value+='"';i++;}else if(c==='"')quoted=!quoted;else if((c===','||c===';')&&!quoted){cells.push(value);value='';}else value+=c;}cells.push(value);
      if(cells.length>=2)out.push({date:cells[0].trim(),title:cells[1].trim(),annual:/^(1|true|yes|jā|ja)$/i.test(cells[2]?.trim()||''),color:hex(cells[3]?.trim(),'#8a2946')});
    }
  }
  return out.filter(e=>validDate(e.date)&&e.title).slice(0,500).map(e=>({...e,id:uid(),title:text(e.title,120)}));
}
export function eventsICS(s){
  const slash=String.fromCharCode(92),crlf=String.fromCharCode(13,10);
  const escape=value=>[...String(value)].filter(c=>c.charCodeAt(0)!==13).map(c=>c===slash?slash+slash:c.charCodeAt(0)===10?slash+'n':c===','||c===';'?slash+c:c).join('');
  const fold=line=>{const out=[];let part='',size=0;for(const char of line){const n=new TextEncoder().encode(char).length;if(size+n>75){out.push(part);part=' ';size=1;}part+=char;size+=n;}out.push(part);return out.join(crlf);};
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalendars365//Kalendara darbnica//LV','CALSCALE:GREGORIAN'];
  const stamp=new Date().toISOString().replaceAll('-','').replaceAll(':','').split('.')[0]+'Z';
  for(const e of s.events){const end=new Date(e.date+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);lines.push('BEGIN:VEVENT',`UID:${e.id}@kalendars365.lv`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${e.date.replaceAll('-','')}`,`DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replaceAll('-','')}`,`SUMMARY:${escape(e.title)}`,...(e.annual?['RRULE:FREQ=YEARLY']:[]),'END:VEVENT');}
  return [...lines,'END:VCALENDAR'].map(fold).join(crlf)+crlf;
}
export function createPDF(images,mmWidth,mmHeight){
  // Multi-page PDF with 150/300/600 dpi JPEG pages, generated entirely in the browser.
  const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length;};
  add('%PDF-1.4\n');const count=images.length,info=3+count*3;
  const obj=(id,body)=>{offsets[id]=length;add(`${id} 0 obj\n`);if(Array.isArray(body))body.forEach(add);else add(body);add('\nendobj\n');};
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Count ${count} /Kids [${images.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
  const pw=mmWidth/25.4*72,ph=mmHeight/25.4*72;
  images.forEach((im,i)=>{const id=3+i*3,stream=`q\n${pw} 0 0 ${ph} 0 0 cm\n/Im0 Do\nQ\n`;obj(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);obj(id+1,[`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`,im.bytes,'\nendstream']);obj(id+2,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`);});
  obj(info,'<< /Producer (Kalendars365) /Title (Kalendars365 kalendars) >>');const xref=length;add(`xref\n0 ${info+1}\n0000000000 65535 f \n`);for(let i=1;i<=info;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${info+1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const result=new Uint8Array(length);let at=0;for(const part of parts){result.set(part,at);at+=part.length;}return result;
}
