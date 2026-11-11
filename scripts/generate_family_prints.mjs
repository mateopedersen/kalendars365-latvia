// Canonical blank examples, generated from the exact interactive family scenes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {familyModel,familyScenes,familyDesigns,familyFilename} from '../assets/family-planner.mjs';
import {weeklyVectorPDF} from '../assets/planner-vector-pdf.mjs';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'downloads/gimenes'),temp=path.resolve(root,'../reports/family-planners-2026-11-11/scenes');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(temp,{recursive:true});
const resources={PDFLib:require('../assets/vendor/pdf-lib.min.js'),fontkit:require('../assets/vendor/fontkit.umd.min.js'),regular:fs.readFileSync(path.join(root,'assets/fonts/DM-Sans-Regular.ttf')),bold:fs.readFileSync(path.join(root,'assets/fonts/DM-Sans-Bold.ttf')),title:'Ģimenes plānotājs · 2027. gada 1. nedēļa'};
const model=familyModel({},'2027-01-04'),filter=process.argv.find(a=>a.startsWith('--design='))?.split('=')[1],previous=filter&&fs.existsSync(path.join(out,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))).items:[],items=previous.filter(d=>String(d.design)!==filter);
for(const d of familyDesigns.filter(d=>!filter||String(d.id)===filter)){const scenes=familyScenes(model,{design:d.id}),stem=familyFilename(model,d.id),bytes=await weeklyVectorPDF(scenes,resources);fs.writeFileSync(path.join(out,stem+'.pdf'),bytes);fs.writeFileSync(path.join(temp,String(d.id).padStart(2,'0')+'.svg'),scenes[0]);
 items.push({design:d.id,title:d.name,description:d.description,layout:d.layout,paper:'A4',orientation:'landscape',ppi:600,width:7016,height:4961,exampleStart:model.start,pdf:'/downloads/gimenes/'+stem+'.pdf',image:'/downloads/gimenes/'+stem+'.webp',preview:'/downloads/gimenes/'+stem+'-preview.webp',pdfSha256:crypto.createHash('sha256').update(bytes).digest('hex')});console.log('Prepared family PDF '+d.id+' / 15');
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,source:'assets/family-planner.mjs',sample:'2027-W01; interactive exports preserve the selected family week',items:items.sort((a,b)=>a.design-b.design)},null,2)+'\n');
