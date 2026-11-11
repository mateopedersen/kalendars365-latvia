import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const articles=read('assets/category-data.json').articles;
const covers=read('_data/tradition-covers.json');
const social=read('_data/social-images.json').pages;
const photoSources=new Map(read('_data/occasions.json').map(a=>[a.photo.id,a.photo]));
for(const photo of [...read('_data/tradition-photos.json').photos,...read('_data/occasion-photo-overrides.json').photos])photoSources.set(photo.id,photo);
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'",'&#39;');

test('each of the 73 day pages has its own topic-bound photographic header, one photo, one h1 and a date destination',()=>{
 const ids=[];
 for(const a of articles){
  const slug=a.url.split('/').filter(Boolean).at(-1),html=fs.readFileSync('_site'+a.url+'index.html','utf8');
  const hero=html.match(/<header class="page-heading tradition-photo-hero"[^>]*>[\s\S]*?<\/header>/)?.[0];
  assert(hero,slug);assert(hero.includes(`data-tradition-hero="${slug}"`));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,slug);
  assert.equal((html.match(/data-tradition-photo=/g)||[]).length,1,slug+' duplicated day photo');
  assert(hero.includes(`src="${a.photo.src}"`),slug);
  assert(hero.includes(`alt="${esc(a.photo.alt)}"`),slug);
  assert(hero.includes('loading="eager" fetchpriority="high"'));
  assert(hero.includes('#occasion-photo-'+a.photo.id));
  assert(hero.includes('href="#datumi"'));assert(html.includes('id="datumi"'),slug);
  assert.equal((html.match(/href="#datumi"/g)||[]).length,1,slug+' repeated date button');
  assert(!hero.includes('.svg'),slug+' decorative vector left in header');
  assert(!html.includes('class="page-reading-art"'),slug+' repeated decorative illustration');
  assert(!html.includes('id="i-month-'),slug+' unused month illustrations');
  ids.push(a.photo.id);
 }
 assert.equal(new Set(ids).size,73,'Different days must not silently share a generic photo');
});

test('all day photos, social previews and credits use the same reviewed identity',()=>{
 const credits=fs.readFileSync('_site/pilsetas-un-fotografijas/index.html','utf8');
 const usage=read('_data/tradition-photo-usage.json');
 for(const a of articles){
  const html=fs.readFileSync('_site'+a.url+'index.html','utf8'),photo=covers[a.photo.id],largest=photo.files.at(-1),preview=social[a.url];
  assert(preview,a.url+' missing page-specific sharing cover');
  const source=preview.sources.find(source=>source.src===largest.src);
  assert(source,a.url+' sharing cover must use the reviewed day photograph');
  for(const field of ['author','license','licenseUrl','sourceUrl'])assert.equal(source[field],photoSources.get(a.photo.id)[field],a.url+' '+field);
  assert.equal(source.sourceSha256,photo.sourceSha256,a.url+' reviewed source checksum');
  assert(html.includes('property="og:image" content="https://kalendars365.lv'+preview.src+'"'),a.url);
  assert(html.includes('property="og:image:alt" content="'+esc(preview.alt)+'"'),a.url);
  assert(credits.includes('id="occasion-photo-'+a.photo.id+'"'),a.url);
  assert.deepEqual(usage[a.photo.id],[{title:a.title,url:a.url}]);
 }
});

test('seven replacements have unique licensed sources and checksum-bound visual reviews',()=>{
 const photos=read('_data/occasion-photo-overrides.json').photos;
 assert.equal(photos.length,7);assert.equal(new Set(photos.map(p=>p.sourceUrl)).size,7);
 for(const p of photos){
  const actual=crypto.createHash('sha256').update(fs.readFileSync(p.sourceCopy)).digest('hex');
  assert.equal(actual,p.sourceSha256,p.slug);assert.equal(p.visualReview.sourceSha256,actual);
  assert(p.visualReview.evidence.length>20);assert(p.author.length>2);
  assert.match(p.license,/^CC BY/);assert.match(p.licenseUrl,/^https:\/\/creativecommons.org\//);
  assert.match(p.sourceUrl,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert.equal(articles.find(a=>a.url==='/svetki-un-tradicijas/'+p.slug+'/').photo.id,p.id);
 }
 const all=new Map(read('_data/occasions.json').map(a=>[a.slug,a.photo]));
 for(const p of [...read('_data/tradition-photos.json').photos,...photos])all.set(p.slug,p);
 const sourceFiles=articles.map(a=>decodeURIComponent(new URL(all.get(a.url.split('/').filter(Boolean).at(-1)).sourceUrl).pathname).replaceAll('_',' '));
 assert.equal(new Set(sourceFiles).size,73,'Distinct IDs must not conceal repeated source photographs');
});
