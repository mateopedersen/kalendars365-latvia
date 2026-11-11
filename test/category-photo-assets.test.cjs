const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const catalog=JSON.parse(fs.readFileSync('_data/category-photos.json','utf8'));
const hash=body=>crypto.createHash('sha256').update(body).digest('hex');
test('photographic category sources retain checksum-bound pixel reviews and attribution',()=>{
  assert.equal(catalog.sources.length,20);
  for(const source of catalog.sources){
    const bytes=fs.readFileSync('.'+source.file);
    assert.equal(hash(bytes),source.sourceSha256,source.id);
    assert.equal(source.visualReview.sourceSha256,source.sourceSha256,source.id);
    for(const key of ['author','license','licenseUrl','sourceUrl','originalUrl'])assert.ok(source[key],source.id+' '+key);
    assert.ok(source.visualReview.observation.length>20,source.id+' visible observation');
    assert.match(source.sourceUrl,/^https:\/\//,source.id);
  }
});
test('all nineteen category artworks are distinct, local, self-contained and bounded in size',()=>{
  const sourceIds=new Set(catalog.sources.map(s=>s.id));
  assert.equal(catalog.artworks.length,19);
  assert.equal(new Set(catalog.artworks.map(a=>a.sha256)).size,19);
  let total=0;
  for(const art of catalog.artworks){
    const bytes=fs.readFileSync('.'+art.svg),svg=bytes.toString('utf8');total+=bytes.length;
    assert.equal(hash(bytes),art.sha256,art.id);
    assert.equal(art.visualReview.svgSha256,art.sha256,art.id+' review is invalidated by an SVG change');
    assert.equal(bytes.length,art.bytes,art.id);
    assert.ok(art.sources.every(s=>sourceIds.has(s)),art.id);
    assert.ok(svg.includes('data:image/jpeg;base64,'),art.id+' actual photo pixels');
    assert.ok(!/<(?:script|foreignObject)\b/i.test(svg),art.id);
    assert.ok(!/<image[^>]+href="(?:https?:|\/)/i.test(svg),art.id+' no external photo requests');
    assert.ok(svg.includes('<metadata>'),art.id+' embedded credits');
  }
  assert.ok(total<700000,'all menu artwork bytes stay below 700 kB');
});
