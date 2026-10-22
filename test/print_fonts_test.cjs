// Check the actual print fonts before spending time on full-size raster exports.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),P=require('../assets/print.js'),fontkit=require('../assets/vendor/fontkit.umd.min.js');
const fonts=['Regular','Bold'].map(style=>fontkit.create(fs.readFileSync(path.join(root,`assets/fonts/DM-Sans-${style}.ttf`))));
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/calendar-data.json'))),widths=new Map(),glyphs=new Map();
for(const f of fonts){
 assert(/DM.?Sans/i.test(f.postscriptName),`Unexpected print font: ${f.postscriptName}`);
 for(const c of 'ĀČĒĢĪĶĻŅŠŪŽāčēģīķļņšūž')assert(f.hasGlyphForCodePoint(c.codePointAt(0)),`Missing Latvian glyph: ${c}`);
}
let scenes=0,commands=0;
for(const year of [2027,2028,2029,2030])for(let month=1;month<=12;month++)for(const type of P.types)for(let design=1;design<=15;design++){
 const scene=P.buildScene({type,year,month,design,week:1,name:type==='named'?'Emīlija':''},data);scenes++;
 for(const c of scene.commands){
  if(c.op!=='text')continue;commands++;
  const index=Number(c.bold),f=fonts[index],key=index+':'+c.text;
  if(!glyphs.has(key)){
   for(const character of c.text)assert(f.hasGlyphForCodePoint(character.codePointAt(0)),`Missing glyph ${character} in ${f.postscriptName}`);
   glyphs.set(key,true);
  }
  if(!widths.has(key))widths.set(key,f.layout(c.text).positions.reduce((sum,p)=>sum+p.xAdvance,0)/f.unitsPerEm);
  const width=widths.get(key)*c.size,start=c.x-(c.align==='right'?width:c.align==='center'?width/2:0);
  assert(start>=-0.05&&start+width<=scene.width+0.05,`Text outside ${type}/${year}/${month}/${design}: ${c.text}`);
 }
}
console.log(JSON.stringify({passed:true,scenes,textCommands:commands,uniqueFontStrings:widths.size,fonts:fonts.map(f=>f.postscriptName),checks:['actual DM Sans font identity','Latvian glyph coverage','all scene text glyph coverage','actual-font horizontal bounds']}));
