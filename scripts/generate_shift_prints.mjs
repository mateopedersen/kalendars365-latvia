import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import K from '../assets/category-core.js';
import {shiftModel,shiftScenes,shiftDesigns,shiftFilename} from '../assets/shift-planner.mjs';
import {weeklyVectorPDF} from '../assets/planner-vector-pdf.mjs';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'downloads/mainas'),temp=path.resolve(root,'../reports/shift-planners-2026-11-11/scenes');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(temp,{recursive:true});
const resources={PDFLib:require('../assets/vendor/pdf-lib.min.js'),fontkit:require('../assets/vendor/fontkit.umd.min.js'),regular:fs.readFileSync(path.join(root,'assets/fonts/DM-Sans-Regular.ttf')),bold:fs.readFileSync(path.join(root,'assets/fonts/DM-Sans-Bold.ttf')),title:'Maiņu grafiks · Janvāris 2027'};
const model=shiftModel({version:1,anchor:'2027-01-01',name:'Mans maiņu grafiks',cycle:K.shiftPresets.rotating,overrides:{}},2027,1,K),filter=process.argv.find(a=>a.startsWith('--design='))?.split('=')[1],previous=filter&&fs.existsSync(path.join(out,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))).items:[],items=previous.filter(d=>String(d.design)!==filter);
for(const d of shiftDesigns.filter(d=>!filter||String(d.id)===filter)){
 const scenes=shiftScenes(model,{design:d.id}),stem=shiftFilename(model,d.id),bytes=await weeklyVectorPDF(scenes,resources);fs.writeFileSync(path.join(out,stem+'.pdf'),bytes);fs.writeFileSync(path.join(temp,String(d.id).padStart(2,'0')+'.svg'),scenes[0]);
 items.push({design:d.id,title:d.name,description:d.description,layout:d.layout,paper:'A4',orientation:'landscape',ppi:600,width:7016,height:4961,exampleYear:model.year,exampleMonth:model.month,pages:scenes.length,pdf:'/downloads/mainas/'+stem+'.pdf',image:'/downloads/mainas/'+stem+'.webp',preview:'/downloads/mainas/'+stem+'-preview.webp',pdfSha256:crypto.createHash('sha256').update(bytes).digest('hex')});console.log('Prepared shift PDF '+d.id+' / 15');
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,source:'assets/shift-planner.mjs',sample:'2027-01; day/night/off/off example; interactive exports use the selected month and cycle',items:items.sort((a,b)=>a.design-b.design)},null,2)+'\n');
