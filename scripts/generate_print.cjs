/* Pre-render production samples from the same scene used by the browser. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
function dependency(name){try{return require(name);}catch(error){if(!process.env.K365_NODE_MODULES)throw Error(`Install print dependencies in scripts/: npm install. Or set K365_NODE_MODULES. Missing: ${name}`);return require(path.join(process.env.K365_NODE_MODULES,name));}}
const {createCanvas,GlobalFonts}=dependency('@napi-rs/canvas');
const sharp=dependency('sharp');sharp.concurrency(1);sharp.cache({memory:24,files:0,items:12});
const root=path.resolve(__dirname,'..'),P=require(path.join(root,'assets/print.js'));
const PDFLib=require(path.join(root,'assets/vendor/pdf-lib.min.js')),fontkit=require(path.join(root,'assets/vendor/fontkit.umd.min.js'));
const regular=fs.readFileSync(path.join(root,'assets/fonts/NotoSans-Regular.ttf')),bold=fs.readFileSync(path.join(root,'assets/fonts/NotoSans-Bold.ttf'));
GlobalFonts.register(regular,'K365 Noto');GlobalFonts.register(bold,'K365 Noto');
let data={};try{data=JSON.parse(fs.readFileSync(path.join(root,'assets/calendar-data.json')))}catch{}
data={holidays:data.holidays||[],names:data.names||[],moon:data.moon||[]};
const sourceFingerprint=crypto.createHash('sha256').update(JSON.stringify(data)).update(fs.readFileSync(path.join(root,'assets/print.js'))).digest('hex');
let previous=[];try{previous=JSON.parse(fs.readFileSync(path.join(root,'downloads/manifest.json'))).items||[];}catch{}
const configurations=[{type:'yearly',year:2027},{type:'yearly',year:2029},{type:'monthly',year:2029,month:2},{type:'monthly',year:2030,month:2}];
const args=new Set(process.argv.slice(2));
const extras=['weekly','daily','lunar','blank','work','family','shift','school','named','lunar-year','work-year'].map(type=>({type,year:2028,month:2,week:9,date:'2028-02-29',name:type==='named'?'Emīlija':''}));
const tasks=[...configurations,...extras].flatMap(config=>(args.has('--quick')?[1]:Array.from({length:15},(_,i)=>i+1)).map(design=>({config,design})));
const records=[];let cursor=0;fs.mkdirSync(path.join(root,'downloads'),{recursive:true});
const writeManifest=complete=>fs.writeFileSync(path.join(root,'downloads/manifest.json'),JSON.stringify({complete,createdAt:new Date().toISOString(),source:'assets/print.js shared vector scene',dataSha256:crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),font:'Noto Sans (SIL Open Font License 1.1)',items:records.slice().sort((a,b)=>a.taskIndex-b.taskIndex).map(({taskIndex,...r})=>r)},null,2));
const save=(file,bytes)=>{fs.writeFileSync(file+'.tmp',bytes);fs.renameSync(file+'.tmp',file);};
async function worker(){
while(cursor<tasks.length){
  const taskIndex=cursor++,{config,design}=tasks[taskIndex],scene=P.buildScene({...config,design},data),stem=scene.filename;
  const pdfPath=path.join(root,'downloads',stem+'.pdf'),webpPath=path.join(root,'downloads',stem+'.webp'),thumbPath=path.join(root,'downloads',stem+'-preview.webp');
  const pixels={width:Math.round(scene.width/25.4*600),height:Math.round(scene.height/25.4*600)};
  let bytes,webp;
  const fingerprint=crypto.createHash('sha256').update(sourceFingerprint).update(JSON.stringify(scene.options)).digest('hex');
  if(args.has('--pdf-only')&&[webpPath,thumbPath].every(f=>fs.existsSync(f))){bytes=await P.pdfBytes(scene,PDFLib,fontkit,regular,bold);save(pdfPath,bytes);webp=fs.readFileSync(webpPath);}
  else if(args.has('--resume')&&!args.has('--force-type='+config.type)&&previous.some(r=>r.pdf==='/downloads/'+stem+'.pdf'&&r.fingerprint===fingerprint)&&[pdfPath,webpPath,thumbPath].every(f=>fs.existsSync(f))){bytes=fs.readFileSync(pdfPath);webp=fs.readFileSync(webpPath);}
  else {
    bytes=await P.pdfBytes(scene,PDFLib,fontkit,regular,bold);save(pdfPath,bytes);
    const canvas=createCanvas(1,1);P.canvasPaint(scene,canvas);
    webp=await sharp(canvas.data(),{raw:{width:pixels.width,height:pixels.height,channels:4}}).withIccProfile('srgb').webp({quality:96,effort:1}).toBuffer();save(webpPath,webp);
    const thumb=await sharp(webp).resize({width:300}).webp({quality:82}).toBuffer();save(thumbPath,thumb);
    canvas.width=1;canvas.height=1;
  }
  records.push({taskIndex,fingerprint,type:config.type,year:config.year,month:config.month||null,design,name:scene.design.name,mode:scene.design.mode,orientation:scene.options.orientation,pdf:'/downloads/'+stem+'.pdf',webp:'/downloads/'+stem+'.webp',preview:'/downloads/'+stem+'-preview.webp',width:pixels.width,height:pixels.height,ppi:600,paper:'A4',pdfBytes:bytes.length,webpBytes:webp.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  writeManifest(false);
  console.log(`${records.length}/${tasks.length} ${config.type} ${config.year} ${String(design).padStart(2,'0')}: PDF ${bytes.length}, WebP ${webp.length}, ${pixels.width}×${pixels.height}`);
}
}
(async()=>{await Promise.all([worker(),worker(),worker()]);writeManifest(true);console.log(`Complete: ${records.length} matching pairs`);})().catch(e=>{console.error(e);process.exitCode=1;});
