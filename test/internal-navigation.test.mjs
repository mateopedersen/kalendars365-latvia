import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const catalog = read('_data/internal-navigation.json').pages;
const manifest = read('docs/route-manifest.json');
const indexed = new Set(manifest.filter(row=>row.indexable).map(row=>row.url));
const months=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
const htmlFor = url => fs.readFileSync((process.env.K365_SITE || '_site') + (url.endsWith('/') ? url+'index.html' : url), 'utf8');

test('all 900 routes have acyclic, canonical breadcrumb identities and valid contextual destinations', () => {
  assert.equal(Object.keys(catalog).length, 900);
  for (const [url, page] of Object.entries(catalog)) {
    assert.equal(page.breadcrumbs[0].url, '/');
    assert.equal(page.breadcrumbs.at(-1).url, url);
    assert.equal(new Set(page.breadcrumbs.map(b=>b.url)).size,page.breadcrumbs.length,url);
    const links=[...page.related,...page.pagination,...page.reading,...(page.discover?.links||[])];
    for(const link of links){assert(indexed.has(link.url),`${url} -> ${link.url}`);assert.notEqual(link.url,url);assert(link.title.trim());}
    if(indexed.has(url)&&url!=='/')assert(links.length>0,url);
    assert(page.related.length<=6);
    assert.equal(new Set(page.related.map(link=>link.url)).size,page.related.length,url);
  }
});

test('48 calendar months cross-link the exact matching period without year or month drift', () => {
  for(let year=2027;year<=2030;year++)for(const month of months){
    const url=`/kalendars/${year}/${month}/`;
    const actual=catalog[url].related.map(link=>link.url);
    assert.deepEqual(actual,[`/pdf-kalendari/${year}/${month}/`,`/svetku-dienas/${year}/${month}/`,`/darba-dienu-kalendars/${year}/${month}/`,`/meness-kalendars/${year}/${month}/`]);
    assert.equal(catalog[url].parent,`/kalendars/${year}/`);
  }
});

test('82 cities keep their own reciprocal solar/lunar destinations', () => {
  for(const city of read('_data/cities.json').cities){
    const sun=`/saullekts-saulriets/${city.id}/`,moon=`/meness-lekts-un-riets/${city.id}/`;
    assert.equal(catalog[sun].related[0].url,moon);
    assert.equal(catalog[moon].related[0].url,sun);
    assert.equal(catalog[sun].parent,'/saullekts-saulriets/');
    assert.equal(catalog[moon].parent,'/meness-lekts-un-riets/');
  }
});

test('all twelve name-day month pages are discoverable from their real category hub', () => {
  assert.deepEqual(catalog['/varda-dienas/'].discover.links.map(link=>link.url),months.map(month=>`/varda-dienas/${month}/`));
  for(const month of months)assert.equal(catalog[`/varda-dienas/${month}/`].parent,'/varda-dienas/');
});

test('period pagination is reciprocal and does not create deleted 2026 destinations', () => {
  for(const [url,page] of Object.entries(catalog))for(const link of page.pagination){
    const reverse=catalog[link.url].pagination.find(other=>other.url===url);
    assert(reverse,`${url} -> ${link.url}`);
    assert.equal(reverse.kind,link.kind==='next'?'previous':'next');
    assert(!link.url.includes('/2026/'));
  }
  assert.equal(catalog['/kalendars/2027/janvaris/'].pagination.some(link=>link.kind==='previous'),false);
  assert.equal(catalog['/kalendars/2030/decembris/'].pagination.some(link=>link.kind==='next'),false);
});

test('editorial paragraph linking preserves every original word and avoids repeated targets', () => {
  let linked=0;
  for(const [url,note] of Object.entries(read('_data/page-guides.json').pages)){
    if(!note.linkedParagraphs)continue;
    assert.deepEqual(note.linkedParagraphs.map(p=>p.map(t=>t.text).join('')),note.paragraphs,url);
    const targets=note.linkedParagraphs.flat().filter(t=>t.url).map(t=>t.url);
    assert(targets.length<=4,url);
    for(const paragraph of note.linkedParagraphs)assert(paragraph.filter(t=>t.url).length<=2,url);assert.equal(new Set(targets).size,targets.length,url);
    for(const target of targets){assert(indexed.has(target.split(/[?#]/)[0]));assert.notEqual(target.split(/[?#]/)[0],url);}
    linked+=targets.length;
  }
  assert(linked>400);
});

test('blog recommendations use reviewed related articles and expose the named tools', () => {
  const blogs=read('_data/blog.json').posts;
  for(const blog of blogs){
    const plan=catalog[blog.url];
    assert.equal(plan.blogRelated.length,3);
    for(const slug of plan.blogRelated){assert(blogs.some(b=>b.slug===slug));assert.notEqual(slug,blog.slug);}
    for(const target of blog.related.filter(url=>indexed.has(url)))assert(plan.related.some(link=>link.url===target));
    const html=htmlFor(blog.url);
    for(const slug of plan.blogRelated)assert(html.includes(`href="/blogs/${slug}/"`));
    assert(!html.includes('<a class="journal-read"'));
  }
});

test('rendered breadcrumbs and BreadcrumbList schema describe the same full hierarchy', () => {
  for(const [url,page] of Object.entries(catalog)){
    if(url==='/')continue;
    const html=htmlFor(url);
    const json=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
    const crumbs=json.find(item=>item['@type']==='BreadcrumbList');
    assert(crumbs,url);
    assert.deepEqual(crumbs.itemListElement.map(item=>item.name),page.breadcrumbs.map(item=>item.title),url);
    assert.deepEqual(crumbs.itemListElement.map(item=>new URL(item.item).pathname),page.breadcrumbs.map(item=>encodeURI(item.url)),url);
    if(!['/404.html','/500.html','/nedelas-kalendars/2031/01/'].includes(url)){
      const visible=html.match(/<nav class="[^"]*breadcrumbs[^\"]*"[^>]*>([\s\S]*?)<\/nav>/);
      assert(visible,`Missing visible breadcrumbs: ${url}`);
      for(const crumb of page.breadcrumbs.slice(0,-1))assert(visible[1].includes(`href="${crumb.url}"`),url);
    }
  }
});

test('all generated pages keep the intended indexability and have crawlable contextual links', () => {
  for(const [url,page] of Object.entries(catalog)){
    const html=htmlFor(url);
    assert.equal(/name="robots" content="index,follow"/.test(html),indexed.has(url),url);
    assert(!/<nav class="related-links"/.test(html),url);
    if(page.show){
      assert.equal((html.match(/data-internal-navigation/g)||[]).length,1,url);
      for(const link of page.related)assert(html.includes(`href="${link.url}"`),url);
    }
  }
});

test('known fragment targets exist in the initial HTML, including the four seasons', () => {
  const seasons=htmlFor('/gadalaiki/');
  for(const key of ['spring','summer','autumn','winter'])assert(seasons.includes(`id="season-${key}"`));
  assert(htmlFor('/studiju-kalendars/').includes('id="augstskolas"'));
  assert(!htmlFor('/pilsetas-un-fotografijas/').includes('/studiju-kalendars/#university-directory'));
});
