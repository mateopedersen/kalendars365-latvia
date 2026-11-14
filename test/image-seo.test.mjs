import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const origin='https://kalendars365.lv';
const imageRightsPage=origin+'/pilsetas-un-fotografijas/#kopigosanas-vaki';
const reviewedCreators=new Map([
 ['Diego Delso',{'@type':'Person',name:'Diego Delso'}],
 ['NASA · Apollo 17',{'@type':'Organization',name:'NASA'}],
 ['NASA/Apollo 17 crew; taken by either Harrison Schmitt or Ron Evans',{'@type':'Organization',name:'NASA'}],
 ['NASA/Bill Ingalls',{'@type':'Person',name:'Bill Ingalls'}],
 ['Saeima',{'@type':'Organization',name:'Saeima'}],
 ['Ernests Dinka / Saeima',{'@type':'Person',name:'Ernests Dinka'}],
 ['Reinis Inkēns / Saeima',{'@type':'Person',name:'Reinis Inkēns'}],
 ['Olgerts V',{'@type':'Person',name:'Olgerts V'}],
 ['Xil',{'@type':'Person',name:'Xil'}],
 ['Rīgas pašvaldības aģentūra “Rīgas investīciju un tūrisma aģentūra”',{'@type':'Organization',name:'Rīgas pašvaldības aģentūra “Rīgas investīciju un tūrisma aģentūra”'}]
]);

test('image metadata resolver distinguishes original compositions, known creators and source rights before a build',()=>{
 const result=JSON.parse(execFileSync('ruby',['-e',String.raw`
 require 'ostruct'
 require File.expand_path('lib/seo_contract',Dir.pwd)
 records=JSON.parse(File.read('docs/route-manifest.json')).to_h { |row| [row.fetch('url'),row] }
 data=%w[social-images internal-navigation blog page-revisions].to_h { |name| [name,JSON.parse(File.read("_data/#{name}.json"))] }
 site=OpenStruct.new(source:Dir.pwd,data:data,config:{'owner'=>'Silvis Balodis'})
 graphs={}
 data.fetch('social-images').fetch('pages').each_key do |path|
   record=records[path] || {'family'=>'not_found','title'=>'Atbalsta lapa','description'=>'Atbalsta lapa.'}
   document=OpenStruct.new(url:path,data:record.merge('blog_slug'=>path.split('/').last))
   graph=JSON.parse(CalendarSeoContract.page_metadata(document,site,records).fetch('jsonld')).fetch('@graph')
   graphs[path]=graph.select { |node| node['@type']=='ImageObject' }
 end
 puts JSON.generate(graphs)
 `],{encoding:'utf8',maxBuffer:8*1024*1024}));
 const covers=JSON.parse(read('_data/social-images.json')).pages;
 let photos=0;
 for(const [route,images] of Object.entries(result)){
  const primary=images.find(row=>row['@id']===origin+route+'#primaryimage');
  assert.deepEqual(primary.creator,{'@type':'Organization',name:'Kalendārs365',url:origin+'/'});
  assert.equal(primary.license,imageRightsPage);assert.equal(primary.acquireLicensePage,imageRightsPage);
  assert(primary.copyrightNotice.startsWith('Kalendārs365 — kopīgošanas vāka makets.'),route);
  assert(primary.creditText,route);
  for(const source of covers[route].sources||[]){
   photos++;
   const photo=images.find(row=>row['@id']===origin+source.src+'#image');
   assert.deepEqual(photo.creator,reviewedCreators.get(source.author),source.src);
   assert.equal(photo.acquireLicensePage,source.sourceUrl);
   assert.equal(photo.creditText,source.author);
   assert(photo.copyrightNotice.includes(source.author),source.src);
   assert(photo.copyrightNotice.includes(source.license),source.src);
   assert(!photo.copyrightNotice.includes('Kalendārs365'),source.src);
   if(source.license==='Public domain'||source.license==='CC0'||source.author.startsWith('NASA')){
    assert(!photo.copyrightNotice.includes('©'),source.src);
    if(source.license!=='CC0')assert(!photo.copyrightNotice.includes('CC0'),source.src);
   }
  }
 }
 assert.equal(Object.keys(result).length,901);assert.equal(photos,415);
 // GSC's four reported source photographs also appear on related pages.
 // Check their actual rendered source nodes, not only the composed social cover.
 const reportedSources=new Map([
  ['/assets/tradition-covers/police-ac9de63c462a-960.webp','Reinis Inkēns'],
  ['/assets/tradition-covers/november21-39fca328832d-960.webp','Olgerts V'],
  ['/assets/blog/flag-780.webp','Xil'],
  ['/assets/tradition-covers/november18-cb7a425db689-960.webp','Ernests Dinka']
 ]);
 for(const [src,name] of reportedSources){
  const matching=Object.values(result).flat().filter(row=>row.contentUrl===origin+src);
  assert(matching.length>0,src);
  for(const image of matching)assert.deepEqual(image.creator,{'@type':'Person',name},src);
 }
 const homepage=result['/'];
 for(const image of homepage)for(const field of ['creator','creditText','copyrightNotice','license','acquireLicensePage'])assert(image[field],field);
 const unknown=Object.values(covers).flatMap(row=>row.sources||[]).find(row=>row.author.startsWith('original download by'));
 assert(unknown,'Keep an ambiguous uploader-only regression case');
 const unknownImage=Object.values(result).flat().find(row=>row['@id']===origin+unknown.src+'#image');
 assert(!unknownImage.creator,'Uploader or transfer credit is not verified photographic authorship');
 assert(read('_includes/social-cover-credits.html').includes('id="kopigosanas-vaki"'));
 assert(read('pilsetas-un-fotografijas.html').includes('{% include social-cover-credits.html %}'));
});

test('all built images have accessible markup, layout dimensions, valid formats and real responsive files',()=>{
 const result=JSON.parse(execFileSync('python3',['scripts/audit_image_seo.py'],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024}));
 assert.equal(result.totals.pages,901);
 assert.equal(result.totals.hiddenPrivateUploadSlots,1);
 assert(result.totals.descriptiveImages>3000);
 assert(result.totals.responsiveImages>1500);
 assert.deepEqual(result.errors,[]);
});

test('photo-based social covers preserve exact third-party credit, source identity and documented rights',()=>{
 const covers=JSON.parse(read('_data/social-images.json')).pages;
 let pages=0,sources=0;
 for(const [route,cover] of Object.entries(covers)){
  const html=read('_site'+route+(route.endsWith('/')?'index.html':''));
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const primary=graph.find(row=>row['@id']===origin+route+'#primaryimage');
  assert.equal(primary.contentUrl,origin+cover.src);
  assert.deepEqual(primary.creator,{'@type':'Organization',name:'Kalendārs365',url:origin+'/'});
  assert.equal(primary.license,imageRightsPage);assert.equal(primary.acquireLicensePage,imageRightsPage);
  assert(primary.copyrightNotice.startsWith('Kalendārs365 — kopīgošanas vāka makets.'),route);
  const credits=cover.sources||[];
  if(!credits.length){assert(!primary.isBasedOn,route);continue;}
  pages++;sources+=credits.length;
  assert.equal(primary.creditText,'Fotogrāfiju avoti: '+[...new Set(credits.map(row=>row.author))].join('; '));
  assert.equal(primary.isBasedOn.length,new Set(credits.map(row=>row.src)).size);
  for(const source of credits){
   const image=graph.find(row=>row['@id']===origin+source.src+'#image');
   assert(image,route);assert.equal(image.contentUrl,origin+source.src);
   assert.equal(image.creditText,source.author);assert.equal(image.isBasedOn,source.sourceUrl);
   const rights=(source.licenseUrl||source.rightsUrl||(source.license==='Public domain'?source.sourceUrl:''))
     .replace(/^http:\/\/creativecommons\.org\//,'https://creativecommons.org/');
   assert.equal(image.license,rights,route);
   assert.equal(image.acquireLicensePage,source.sourceUrl);
   assert(image.copyrightNotice.includes(source.author));assert(image.copyrightNotice.includes(source.license));
   assert.deepEqual(image.creator,reviewedCreators.get(source.author),'Use reviewed source identities without assigning third-party photographs to the publisher');
  }
 }
 assert.equal(pages,332);assert.equal(sources,415);
});

test('image sitemap associates content and download artwork without navigation icons or CSS decoration',()=>{
 execFileSync('ruby',['-e',String.raw`
 require 'tmpdir'
 require 'fileutils'
 require File.expand_path('scripts/image_sitemap',Dir.pwd)
 Dir.mktmpdir do |dir|
  FileUtils.mkdir_p(File.join(dir,'assets'))
  %w[photo.webp large.webp download.webp social.jpg logo.svg decor.svg texture.webp].each {|name|File.write(File.join(dir,'assets',name),'fixture')}
  File.write(File.join(dir,'assets/style.css'),'a{background:url(/assets/texture.webp)}')
  html='<head><meta property="og:image" content="https://kalendars365.lv/assets/social.jpg"><link rel="stylesheet" href="/assets/style.css"></head><body><header><img src="/assets/logo.svg" alt="Logo"></header><main><img alt="A photograph" src="/assets/photo.webp" srcset="/assets/large.webp 960w"><img src="/assets/decor.svg" alt=""><use href="/assets/decor.svg#icon"/><a href="/assets/download.webp" download>Image</a></main><footer><img src="/assets/logo.svg"></footer></body>'
  actual=CalendarImageSitemap.document_images(html,origin:'https://kalendars365.lv',destination:dir,css_cache:{})
  expected=%w[download.webp large.webp photo.webp social.jpg].map{|name|'https://kalendars365.lv/assets/'+name}.sort
  raise actual.inspect unless actual==expected
 end
 `],{stdio:'pipe'});
});
