import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const notes=read('_data/page-guides.json').pages;
const links=read('docs/EDITORIAL_PROSE_LINKS.json').pages;
const blogs=read('_data/blog.json').posts;
const indexed=new Set(read('docs/route-manifest.json').filter(p=>p.indexable).map(p=>p.url));
const site=process.env.K365_SITE||'_site';

test('reviewed paragraph links preserve the complete explanation and resolve to canonical content',()=>{
  for(const [url,note] of Object.entries(notes)){
    assert.deepEqual(note.linkedParagraphs.map(p=>p.map(t=>t.text).join('')),note.paragraphs,url);
    const targets=note.linkedParagraphs.flat().filter(t=>t.url).map(t=>t.url);
    assert.equal(targets.length,new Set(targets).size,url);
    for(const paragraph of note.linkedParagraphs)assert(paragraph.filter(t=>t.url).length<=2,url);
    for(const target of targets){assert(indexed.has(target.split(/[?#]/)[0]),`${url} -> ${target}`);assert.notEqual(target.split(/[?#]/)[0],url);}
  }
});

test('every article has useful body links before its closing section without repeated targets',()=>{
  for(const article of blogs){
    const body=fs.readFileSync(`_content/blog/${article.slug}.md`,'utf8');
    const pairs=[...body.matchAll(/\[([^\]]+)\]\((\/[^)]+)\)/g)];
    assert(pairs.some(m=>m.index<body.length/2&&!m[2].startsWith('/blogs/')),article.slug);
    assert.equal(pairs.length,new Set(pairs.map(m=>m[2])).size,article.slug);
    assert(!/^## .*\]\(/m.test(body),article.slug);
    for(const m of pairs)assert(indexed.has(m[2].split(/[?#]/)[0]),`${article.slug} -> ${m[2]}`);
    const html=fs.readFileSync(`${site}${article.url}index.html`,'utf8');
    const prose=html.match(/<div class="journal-prose">([\s\S]*?)<\/div>/)?.[1];
    assert(prose,article.slug);
    for(const m of pairs)assert(prose.includes(`href="${m[2]}"`),article.slug);
    assert(!body.includes('Saistītie ceļveži:'),'Keep related lists outside the article prose.');
  }
});

test('every long-form guide is reachable from a relevant tool explanation',()=>{
  const incoming=new Map(blogs.map(b=>[b.url,[]]));
  for(const [url,page] of Object.entries(links))for(const item of page.links){
    if(incoming.has(item.url))incoming.get(item.url).push(url);
  }
  for(const [url,sources] of incoming)assert(sources.length>0,`${url} has no link from tool prose`);
});

test('Latvian sentence-leading years remain visible dates instead of list numbers',()=>{
  const html=fs.readFileSync(`${site}/blogs/latvijas-svetku-dienas-2027-planosana/index.html`,'utf8');
  const prose=html.match(/<div class="journal-prose">([\s\S]*?)<\/div>/)[1];
  assert(prose.includes('2027. gada 1. janvāris ir piektdiena.'));
  assert(!/<ol\b[^>]*>\s*<li>\s*gada 1\. janvāris/.test(prose));
  const leap=fs.readFileSync(`${site}/blogs/garais-gads-2028-februaris/index.html`,'utf8');
  assert(leap.includes('2028. gada 29. februāris ir otrdiena.'));
});

test('specific periods, city explanations and crop guides keep their topic context',()=>{
  const targets=url=>links[url].links.map(l=>l.url);
  assert(targets('/kalendars/2028/februaris/').includes('/blogs/garais-gads-2028-februaris/'));
  assert(!targets('/kalendars/2029/februaris/').includes('/blogs/garais-gads-2028-februaris/'));
  assert(targets('/sejas-kalendars/tomati/').includes('/blogs/tomatu-seja-un-izstadisana-latvija/'));
  for(const city of read('_data/cities.json').cities){
    assert(targets(`/saullekts-saulriets/${city.id}/`).includes('/blogs/saullekts-saulriets-latvijas-pilsetas/'));
    assert(targets(`/meness-lekts-un-riets/${city.id}/`).includes('/blogs/meness-fazes-un-vietejais-laiks/'));
  }
});

test('prose audit excludes navigation and cards while preserving real paragraph anchor text',()=>{
  const code=String.raw`import sys,json
sys.path.insert(0,'scripts')
from audit_editorial_links import ProseParser
p=ProseParser();p.feed('<nav><p><a href="/ignore/">Ignore</a></p></nav><div class="journal-prose"><p>Pārbaudi <a href="/kalendars/2028/februaris/"><strong>29. februāri</strong></a> un gadu.</p></div><div class="journal-related"><p><a href="/ignore-too/">Card</a></p></div>')
print(json.dumps(p.paragraphs,ensure_ascii=False))`;
  const result=JSON.parse(execFileSync('python3',['-c',code],{encoding:'utf8'}));
  assert.equal(result.length,1);assert.equal(result[0].links.length,1);
  assert.equal(result[0].links[0].text,'29. februāri');assert.equal(result[0].text,'Pārbaudi 29. februāri un gadu.');
});
