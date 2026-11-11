import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const blog=json('_data/blog.json'),manifest=json('docs/route-manifest.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p.replace(/^\//,'')))).digest('hex');
const words=t=>(t.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').match(/[\p{L}\p{N}_]+(?:[’'\-][\p{L}\p{N}_]+)*/gu)||[]).length;
test('20 original Latvian articles stay within 750–1000 actual body words',()=>{
 assert.equal(blog.posts.length,20);assert.equal(new Set(blog.posts.map(x=>x.slug)).size,20);const paras=new Set();
 for(const p of blog.posts){const body=read('_content/blog/'+p.slug+'.md'),count=words(body);assert.ok(count>=750&&count<=1000,p.slug+' '+count);assert.equal(count,p.wordCount);assert.equal(p.author,'Silvis Balodis');assert.equal(p.editorial.nativeEditorReviewed,false);assert.ok(p.toc.length>=8,p.slug);assert.doesNotMatch(body,/lorem ipsum|Slovenija|Slovenia|koledar365|Mateo Pedersen/iu);for(const para of body.split(/\n\n/).filter(x=>!x.startsWith('#'))){assert.ok(!paras.has(para),p.slug+' duplicated paragraph');paras.add(para);}}
});
test('all article routes, metadata, TOC anchors and sources are usable in the generated HTML',()=>{
 const sitemap=read('_site/sitemap.xml'),search=json('assets/search-index.json');
 for(const p of blog.posts){assert.ok(manifest.some(x=>x.url===p.url&&x.indexable));assert.ok(search.some(x=>x.url===p.url));assert.ok(sitemap.includes('https://kalendars365.lv'+p.url));const html=read('_site'+p.url+'index.html');assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);assert.doesNotMatch(html,/{%|{{|data-page-reading/);assert.ok(html.includes(p.title.replaceAll('&','&amp;')),p.slug);for(const item of p.toc){assert.ok(html.includes('id="'+item.id+'"'),p.slug);assert.ok(html.includes('href="#'+item.id+'"'));}assert.ok(html.includes('Silvis Balodis'));assert.ok(html.includes('loading="eager"'));assert.ok(html.includes('fetchpriority="high"'));for(const source of p.sources)assert.ok(html.includes(source.url.replaceAll('&','&amp;')));const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));const article=schemas.find(x=>x['@type']==='BlogPosting');assert.equal(article.author.name,'Silvis Balodis');assert.equal(article.wordCount,p.wordCount);assert.equal(article.url,'https://kalendars365.lv'+p.url);assert.ok(html.includes('rel="canonical" href="https://kalendars365.lv'+p.url+'"'));}
 assert.equal((read('_site/blogs/feed.xml').match(/<item>/g)||[]).length,20);
});
test('each article uses a distinct licensed real photo with source-bound review and intact derivatives',()=>{
 assert.equal(new Set(blog.posts.map(x=>x.photoKey)).size,20);
 const credits=read('_site/pilsetas-un-fotografijas/index.html');
 for(const p of json('_data/blog-photos.json').photos){assert.equal(hash(p.sourceFile),p.sourceSha256,p.id);assert.equal(p.visualReview.sourceSha256,p.sourceSha256);assert.ok(p.author&&p.license&&p.licenseUrl&&p.sourceUrl);assert.ok(credits.includes('id="blog-photo-'+p.id+'"'));for(const file of p.files){assert.equal(hash(file.src),file.sha256);assert.equal(fs.statSync(path.join(root,file.src)).size,file.bytes);assert.ok(file.width<=1200);assert.ok(file.bytes<500000,p.id);}assert.ok(p.width>0&&p.height>0);}
});
test('the owner identity is consistent without a fabricated biography or portrait',()=>{
 assert.match(read('_config.yml'),/owner: Silvis Balodis/);const html=read('_site/par-projektu/index.html');assert.ok(html.includes('id="silvis-balodis"'));assert.ok(html.includes('owner-monogram'));assert.ok(html.includes('mākslīgā intelekta palīdzību'));assert.doesNotMatch(html.split('<main id="main">')[1].split('</main>')[0],/Mateo Pedersen|dzimis|sertificēts|profesionāls astronoms/i);for(const url of ['/privatuma-politika/','/kontakti/','/lietošanas-noteikumi/']){const html=read('_site'+url+'index.html');assert.ok(html.includes('Silvis Balodis'));assert.doesNotMatch(html,/Mateo Pedersen/);}
});
test('blog index remains a full HTML catalog with accessible in-place filters and local-only search',()=>{
 const html=read('_site/blogs/index.html');assert.equal((html.match(/data-blog-card /g)||[]).length,20);assert.ok(html.includes('data-blog-library'));assert.ok(html.includes('aria-live="polite"'));assert.ok(html.includes('aria-pressed="true"'));assert.ok(html.includes('/assets/blog.js'));const script=read('assets/blog.js');assert.ok(script.includes('event.preventDefault()'));assert.ok(script.includes("normalize('NFD')"));assert.doesNotMatch(script,/fetch\(|window\.open|location\.(?:href|assign)/);assert.ok(read('_site/index.html').includes('href="/blogs/"'));
});

test('each guide links to two other articles, tools and a contextual primary source',()=>{for(const p of blog.posts){const body=read('_content/blog/'+p.slug+'.md');assert.ok((body.match(/\]\(\/blogs\//g)||[]).length>=2,p.slug);assert.ok((body.match(/\]\(https:\/\//g)||[]).length>=1,p.slug);}const html=read('_site/blogs/index.html');const urls=[...html.matchAll(/class="journal-(?:card-image|feature-image)" href="([^"]+)"/g)].map(m=>m[1]);assert.equal(urls.length,20);assert.equal(new Set(urls).size,20);});
