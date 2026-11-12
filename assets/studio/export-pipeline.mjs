import {normalize,dimensions,renderCalendar,exportPages,createPDF} from './engine.mjs?v=541569fccac8';
import {pngDpi,jpegDpi,zipStore} from './binary-exports.mjs?v=19ef4cc4602d';
import {createDocx,createXlsx} from './office-exports.mjs?v=b424f72aeb7a';

const TYPES={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',jpg:'image/jpeg',png:'image/png',svg:'image/svg+xml;charset=utf-8'};
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
function check(signal){if(signal?.aborted)throw new DOMException('Lejupielādes sagatavošana atcelta.','AbortError');}
export function rasterDimensions(s){const d=dimensions(s);return {width:Math.round(d.mmWidth/25.4*s.quality),height:Math.round(d.mmHeight/25.4*s.quality)};}
export function physicalSVG(svg,s){const d=dimensions(s);return svg.replace(/width="1000" height="[^"]+"/,`width="${d.mmWidth}mm" height="${d.mmHeight}mm"`);}
export function exportName(s,scope='current'){
 const stem=(s.title||'kalendars').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,50)||'kalendars';
 const yearStem=stem===String(s.year)||stem.endsWith('-'+s.year)?stem:`${stem}-${s.year}`;
 return `${yearStem}${s.view==='month'&&scope!=='all'?'-'+String(s.month).padStart(2,'0'):''}`;
}
export async function rasterize(svg,s,mime='image/png',signal){
 check(signal);const size=rasterDimensions(s),canvas=document.createElement('canvas');
 if(size.width*size.height>80000000)throw Error('Izvēlētā lapa ir pārāk liela. Izvēlies 300 dpi vai mazāku papīru.');
 const sized=svg.replace(/width="1000" height="[^"]+"/,`width="${size.width}" height="${size.height}"`),url=URL.createObjectURL(new Blob([sized],{type:'image/svg+xml'})),image=new Image();
 try{
  canvas.width=size.width;canvas.height=size.height;
  const context=canvas.getContext('2d',{alpha:false});if(!context)throw Error('Šajā ierīcē nepietiek atmiņas. Izvēlies 300 dpi un mēģini vēlreiz.');
  await document.fonts.ready;
  check(signal);
  await new Promise((resolve,reject)=>{
   const abort=()=>{image.src='';finish(new DOMException('Lejupielādes sagatavošana atcelta.','AbortError'));};
   const timer=setTimeout(()=>finish(Error('Attēlu nevar sagatavot. Izvēlies 300 dpi un mēģini vēlreiz.')),30000);
   function finish(error){clearTimeout(timer);signal?.removeEventListener('abort',abort);image.onload=null;image.onerror=null;error?reject(error):resolve();}
   image.onload=()=>finish();image.onerror=()=>finish(Error('Kalendāra attēlu nevar sagatavot.'));signal?.addEventListener('abort',abort,{once:true});image.src=url;
  });
  check(signal);context.fillStyle=s.colors.paper;context.fillRect(0,0,size.width,size.height);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,0,0,size.width,size.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,.98));check(signal);
  if(!blob||blob.type!==mime)throw Error('Šis pārlūks neatbalsta izvēlēto attēla formātu. Izvēlies PDF vai PNG.');
  const bytes=new Uint8Array(await blob.arrayBuffer());return {...size,bytes:mime==='image/png'?pngDpi(bytes,s.quality):jpegDpi(bytes,s.quality)};
 }finally{URL.revokeObjectURL(url);image.src='';canvas.width=canvas.height=1;}
}
export async function makeExport(input,format,{scope='current',signal,onProgress=()=>{},raster=rasterize}={}){
 if(!Object.hasOwn(TYPES,format))throw Error('Izvēlies atbalstītu lejupielādes formātu.');
 const s=normalize(input),name=exportName(s,scope);check(signal);
 if(format==='svg')return {blob:new Blob([physicalSVG(renderCalendar(s),s)],{type:TYPES.svg}),name:exportName(s,'current')+'.svg',pages:1};
 const office=format==='docx'||format==='xlsx',months=s.view==='month'&&scope==='all'?Array.from({length:12},(_,i)=>i+1):[s.month];
 const pages=office?months.map(month=>renderCalendar(s,{month})):exportPages(s,scope),images=[];
 for(let i=0;i<pages.length;i++){
  check(signal);onProgress({percent:Math.round(5+i/pages.length*80),message:`Sagatavojam ${i+1}. lapu no ${pages.length} · ${s.quality} dpi`});await pause();
  images.push(await raster(pages[i],s,format==='pdf'||format==='jpg'?'image/jpeg':'image/png',signal));
 }
 check(signal);onProgress({percent:92,message:office?'Veidojam dokumentu ar tavu kalendāru…':'Pabeidzam faila sagatavošanu…'});await pause();check(signal);
 let bytes,type=TYPES[format],filename=name+'.'+format;
 if(format==='pdf'){const d=dimensions(s);bytes=createPDF(images,d.mmWidth,d.mmHeight);}
 else if(format==='docx')bytes=createDocx(s,images,{scope});
 else if(format==='xlsx')bytes=createXlsx(s,images,{scope});
 else if(images.length===1)bytes=images[0].bytes;
 else{bytes=zipStore(Object.fromEntries(images.map((image,i)=>[`${name}-${String(i+1).padStart(2,'0')}.${format}`,image.bytes])));type='application/zip';filename=name+'-'+format+'-lapas.zip';}
 check(signal);onProgress({percent:100,message:'Fails ir sagatavots lejupielādei.'});return {blob:new Blob([bytes],{type}),name:filename,pages:pages.length,width:images[0].width,height:images[0].height,dpi:s.quality};
}
