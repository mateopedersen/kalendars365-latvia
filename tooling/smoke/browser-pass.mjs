// Orchestration for the supported CUA tool only; receives an existing tab handle.
// No browser is launched or controlled outside cua_repl.
import fs from 'node:fs/promises';
export async function browserPass({tab,cap,pages,file,profile,origin,geometryCode,runtimeCode,spacingCode}){
 const failures=[];
 for(const item of pages){const row={url:item.url,family:item.family,profile};try{
  const start=await cap.readEvents({methods:['Runtime.exceptionThrown'],limit:1000});
  await tab.goto(origin+item.url);await tab.getAXState({emit:false});
  row.geometry=await tab.playwright.evaluate(geometryCode);
  row.runtime=await tab.playwright.evaluate(runtimeCode);
  if(spacingCode)row.spacing=await tab.playwright.evaluate(spacingCode);
  row.exceptions=(await cap.readEvents({methods:['Runtime.exceptionThrown'],afterSequence:start.cursor,limit:1000})).events.map(e=>e.params);
  const g=row.geometry,r=row.runtime;
  if(g.documentOverflow||g.horizontal.length||g.textClipping.length||g.overlaps.length||!g.stylesReady||r.errors.length||r.brokenImages.length||row.exceptions.length)failures.push(item.url);
 }catch(error){row.error=String(error);failures.push(item.url);}
 await fs.appendFile(file,JSON.stringify(row)+'\n');
 }
 return{count:pages.length,failures};
}
