import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const origin='https://kalendars365.lv';

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
   assert(!image.creator,'Do not infer a person or transfer photographic authorship to the publisher');
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
