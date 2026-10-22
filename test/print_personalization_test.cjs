// Personal titles must survive every renderer and remain clear of a local photo.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../assets/print.js'),fontkit=require('../assets/vendor/fontkit.umd.min.js');
const fonts=['Regular','Bold'].map(s=>fontkit.create(fs.readFileSync(path.join(__dirname,`../assets/fonts/DM-Sans-${s}.ttf`))));
const data=require('../assets/calendar-data.json'),name='ĢŽMW'.repeat(20);
let scenes=0,headlines=0;
for(const type of P.types)for(let design=1;design<=15;design++)for(const orientation of ['portrait','landscape']){
 const scene=P.buildScene({type,year:2028,month:2,week:9,design,name,orientation,photo:'local-test-photo'},data);
 const title=scene.commands.filter(c=>c.op==='text'&&c.text===name);
 assert.equal(title.length,1,`Missing or duplicate title: ${type}/${design}/${orientation}`);
 const photo=scene.commands.find(c=>c.op==='image');
 assert(title[0].y<photo.y-3,`Title overlaps photo: ${type}/${design}/${orientation}`);
 for(const c of scene.commands){
  if(c.op==='rect'||c.op==='image')assert(c.w>=0&&c.h>=0,`Invalid shape: ${type}/${design}/${orientation}`);
  if(c.op!=='text')continue;
  const f=fonts[Number(c.bold)],units=f.layout(c.text).positions.reduce((sum,p)=>sum+p.xAdvance,0)/f.unitsPerEm;
  const size=P.fittedTextSize(scene,c,(_,s)=>units*s),width=units*size;
  const left=c.x-(c.align==='right'?width:c.align==='center'?width/2:0);
  assert(size>0&&size<=c.size,`Invalid fit: ${type}/${design}/${orientation}`);
  assert(left>=-0.05&&left+width<=scene.width+0.05,`Text leaves paper: ${type}/${design}/${orientation}: ${c.text}`);
  if(c.maxWidth)assert(width<=c.maxWidth+0.0001);
 }
 scenes++;headlines+=title.length;
}
// Exact user-reported title is visible, not just part of the downloaded filename.
for(const type of P.types){
 const scene=P.buildScene({type,year:2029,month:2,name:'Ģirts un Žanete'},data);
 assert(scene.commands.some(c=>c.text==='Ģirts un Žanete'),`${type} omits the personal title`);
}
console.log(`PASS ${scenes} personal-title scenes across 13 types, 15 designs and both orientations; ${headlines} fitted 80-character Latvian titles, safe photo spacing, all actual-font bounds.`);
