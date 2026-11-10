const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const manifest=JSON.parse(fs.readFileSync('downloads/gada-a3/manifest.json'));
assert.equal(manifest.items.length,60);
for(const year of [2027,2028,2029,2030]){
 const designs=manifest.items.filter(x=>x.year===year);
 assert.deepEqual(designs.map(x=>x.design),Array.from({length:15},(_,i)=>i+1));
 for(const route of [`_site/pdf-kalendari/${year}/index.html`,`_site/kalendars/${year}/index.html`]){
  const html=fs.readFileSync(route,'utf8');
  assert.equal((html.match(/class="a3-design-card"/g)||[]).length,15,route);
  assert.equal((html.match(/<span>Attēls<\/span>/g)||[]).length,15,route);
  for(const row of designs)for(const key of ['pdf','image','preview'])assert(html.includes(row[key]),`${route}: ${row[key]}`);
 }
 for(const row of designs){
  assert.equal(row.dpi,600);
  for(const [key,hash] of [['pdf','pdfSha256'],['image','imageSha256'],['preview','previewSha256']]){
   const bytes=fs.readFileSync('.'+row[key]);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row[hash]);
   assert(bytes.length<25*1024*1024);
  }
 }
}
const old=JSON.parse(fs.readFileSync('downloads/manifest.json'));
assert.equal(old.items.filter(x=>x.type==='yearly').length,0);
assert(!fs.existsSync('downloads/2027-gada-kalendars-01.pdf'));
assert(!fs.existsSync('downloads/2029-gada-kalendars-01.pdf'));
console.log('A3: 60 designs, 120 year-page cards, 180 file hashes, old yearly files absent.');
