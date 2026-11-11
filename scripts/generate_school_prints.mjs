// Build the 15 canonical first-week samples from the browser's exact scene.
// Run manually when weekly stationery changes. Production does not need Node.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {schoolScenes,schoolDesigns,schoolFilename,schoolModel} from '../assets/school-planner.mjs';
import {weeklyVectorPDF} from '../assets/planner-vector-pdf.mjs';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
const dir=path.join(root,'downloads/stundas'),temp=path.resolve(root,'../reports/school-planners-2026-11-11/scenes');
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(temp,{recursive:true});
const regular=fs.readFileSync(path.join(root,'assets/fonts/DM-Sans-Regular.ttf')),bold=fs.readFileSync(path.join(root,'assets/fonts/DM-Sans-Bold.ttf'));
const resources={PDFLib:require('../assets/vendor/pdf-lib.min.js'),fontkit:require('../assets/vendor/fontkit.umd.min.js'),regular,bold,display:fs.readFileSync(path.join(root,'assets/fonts/Literata-Display.ttf')),title:'Stundu saraksts · 2027. gada 1. nedēļa'};
const model=schoolModel({},'2027-01-04');
const filter=process.argv.find(a=>a.startsWith('--design='))?.split('=')[1];
const previous=filter&&fs.existsSync(path.join(dir,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))).items:[];
const items=previous.filter(d=>String(d.design)!==filter);
for(const d of schoolDesigns.filter(d=>!filter||String(d.id)===filter)){const scenes=schoolScenes(model,{design:d.id}),stem=schoolFilename(model,d.id),file=path.join(dir,stem+'.pdf');
 const bytes=await weeklyVectorPDF(scenes,resources);fs.writeFileSync(file,bytes);fs.writeFileSync(path.join(temp,String(d.id).padStart(2,'0')+'.svg'),scenes[0]);
 items.push({design:d.id,title:d.name,description:d.description,layout:d.layout,paper:'A4',orientation:'landscape',ppi:600,width:7016,height:4961,exampleStart:model.start,pdf:'/downloads/stundas/'+stem+'.pdf',image:'/downloads/stundas/'+stem+'.webp',preview:'/downloads/stundas/'+stem+'-preview.webp',pdfSha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 console.log('Prepared vector PDF '+d.id+' / 15');
}
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({version:1,source:'assets/school-planner.mjs',sample:'2027-W01; interactive exports use the selected week',items:items.sort((a,b)=>a.design-b.design)},null,2)+'\n');
