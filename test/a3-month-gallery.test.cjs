const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const months=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const previews=JSON.parse(fs.readFileSync('_data/preview-images.json')).images;
const manifest=JSON.parse(fs.readFileSync('downloads/menesa-a3/manifest.json'));
assert.equal(manifest.sourceZipSha256,'e2d8512fef538b2d3412ebca6e7c088883d82b4a1ae7e2e7fd0b7b4ac5b978ee');
assert.equal(manifest.items.length,720);
let files=0,pages=0;
for(let year=2027;year<=2030;year++)for(let month=1;month<=12;month++){
 const items=manifest.items.filter(x=>x.year===year&&x.month===month);
 assert.deepEqual(items.map(x=>x.design),Array.from({length:15},(_,i)=>i+1));
 for(const dir of ['kalendars','pdf-kalendari']){
  const route=`_site/${dir}/${year}/${months[month-1]}/index.html`;
  const html=fs.readFileSync(route,'utf8');
  assert.equal((html.match(/class="a3-design-card"/g)||[]).length,15,route);
  assert.equal((html.match(/<span>Attēls<\/span>/g)||[]).length,15,route);
  assert(!html.includes('data-print-type="monthly"'),route+' old generator');
  for(const row of items){for(const key of ['pdf','image'])assert(html.includes(row[key]),`${route} ${row[key]}`);const preview=previews[row.preview];assert(preview&&html.includes(preview.src)&&html.includes(preview.srcset),`${route}: responsive preview`);}
  pages++;
 }
 for(const row of items){
  assert.equal(row.paper,'A3');assert.equal(row.dpi,600);
  assert.deepEqual([row.width,row.height].sort((a,b)=>a-b),[7016,9922]);
  for(const [key,hash] of [['pdf','pdfSha256'],['image','imageSha256'],['preview','previewSha256']]){
   const payload=fs.readFileSync('.'+row[key]);
   assert.equal(crypto.createHash('sha256').update(payload).digest('hex'),row[hash]);
   assert(payload.length<25*1024*1024);files++;
  }
 }
}
const old=JSON.parse(fs.readFileSync('downloads/manifest.json'));
assert.equal(old.items.filter(x=>x.type==='monthly').length,0);
for(const year of [2029,2030])assert(!fs.existsSync(`downloads/${year}-gada-februara-menesa-kalendars-01.pdf`));
console.log(`A3 months: 48 months, ${pages} pages, ${files} verified files, old monthly files absent.`);
