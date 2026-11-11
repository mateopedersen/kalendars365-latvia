// Narrow adapter for the controlled stationery SVG vocabulary. Keep text as text
// in PDF; no browser screenshot or lossy full-page JPEG is involved.
const decode=s=>s.replace(/&(amp|lt|gt|quot|apos);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[v]));
export async function weeklyVectorPDF(scenes,{PDFLib,fontkit,regular,bold,display,title='Nedēļas kalendārs'}){
 const doc=await PDFLib.PDFDocument.create();doc.registerFontkit(fontkit);
 const fonts=[await doc.embedFont(regular,{subset:true}),await doc.embedFont(bold,{subset:true})];
 const displayFont=display?await doc.embedFont(display,{subset:true}):null;
 doc.setTitle(title+' | Kalendārs365');doc.setAuthor('Kalendārs365');doc.setLanguage('lv-LV');doc.setCreator('Kalendārs365 vector stationery');
 const width=297/25.4*72,height=210/25.4*72,k=width/1000,ky=height/707;
 const color=s=>{if(!s||s==='none')return undefined;const h=s.replace('#','');return PDFLib.rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255);};
 for(const svg of scenes){const page=doc.addPage([width,height]);
  for(const match of svg.matchAll(/<(rect|line|circle|path|text)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/text>)/g)){
   const [_,tag,raw,content]=match,a=Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],decode(x[2])])),n=key=>Number(a[key]||0);
   const style={color:color(a.fill),borderColor:color(a.stroke),borderWidth:a.stroke&&a.stroke!=='none'?n('stroke-width')*k:0};
   if(tag==='rect')page.drawRectangle({x:n('x')*k,y:height-(n('y')+n('height'))*ky,width:n('width')*k,height:n('height')*ky,...style});
   if(tag==='line')page.drawLine({start:{x:n('x1')*k,y:height-n('y1')*ky},end:{x:n('x2')*k,y:height-n('y2')*ky},color:color(a.stroke),thickness:n('stroke-width')*k});
   if(tag==='circle')page.drawCircle({x:n('cx')*k,y:height-n('cy')*ky,size:n('r')*k,...style});
   if(tag==='path')page.drawSvgPath(a.d,{x:0,y:height,scale:k,...style});
   if(tag==='text'){const value=decode(content),font=a['font-family']==='K365 Literata'&&displayFont?displayFont:fonts[a['font-weight']==='700'?1:0],size=n('font-size')*k,w=font.widthOfTextAtSize(value,size),x=n('x')*k-(a['text-anchor']==='end'?w:a['text-anchor']==='middle'?w/2:0);page.drawText(value,{x,y:height-n('y')*ky,size,font,color:color(a.fill)});}
  }
 }
 return doc.save();
}
