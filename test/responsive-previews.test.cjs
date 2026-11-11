'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const previews=JSON.parse(fs.readFileSync('_data/preview-images.json')).images;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function size(b){const k=b.subarray(12,16).toString();if(k==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(k==='VP8L'){const n=b.readUInt32LE(21);return[1+(n&0x3fff),1+((n>>>14)&0x3fff)];}assert.equal(k,'VP8 ');return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];}
test('responsive previews stay bound to original artwork, match real bytes and never upscale',()=>{
 const sources=new Set();
 for(const [url,p] of Object.entries(previews)){
  assert.equal(sha(fs.readFileSync('.'+url)),p.sourceSha256,url);
  assert.ok(p.variants.length>=1&&p.variants.length<=2,url);
  for(const v of p.variants){
   const b=fs.readFileSync('.'+v.src);assert.equal(sha(b),v.sha256,v.src);assert.ok(v.src.includes(v.sha256.slice(0,24)),v.src);
   assert.equal(b.length,v.bytes);assert.deepEqual(size(b),[v.width,v.height]);
   assert.ok(v.width<=p.sourceWidth&&v.height<=p.sourceHeight,url);
   assert.ok(Math.abs(v.height-v.width*p.sourceHeight/p.sourceWidth)<=1.1,url);
   sources.add(v.src);
  }
  const fallback=p.variants.find(v=>v.src===p.src);assert.ok(fallback,url);
  assert.deepEqual([p.width,p.height],[fallback.width,fallback.height]);
  assert.equal(p.srcset,p.variants.map(v=>v.src+' '+v.width+'w').join(', '));
 }
 assert.equal(Object.keys(previews).length,988);assert.equal(sources.size,1688);
});
