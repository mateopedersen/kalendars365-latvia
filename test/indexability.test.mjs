import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const read = name => fs.readFileSync(name, 'utf8');
const manifest = JSON.parse(read('docs/route-manifest.json'));
const origin = 'https://kalendars365.lv';
const site = process.env.K365_SITE || '_site';
const photo = '/pilsetas-un-fotografijas/';
const errors = ['/404.html', '/500.html'];
const xml = read(path.join(site, 'image-sitemap.xml'));
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const htmlFor = url => read(path.join(site, url, url.endsWith('/') ? 'index.html' : ''));
const robots = html => html.match(/<meta name="robots" content="([^"]+)"/)?.[1].split(',');
const records = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)].map(match => ({url: unescape(match[1]), images: [...match[2].matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(image => unescape(image[1]))}));
const images = new Set(records.flatMap(row => row.images));

test('only photo licensing and genuine error documents are excluded across every built HTML page', () => {
  const files = fs.readdirSync(site, {recursive: true}).filter(name => name.endsWith('.html'));
  assert.equal(files.length, manifest.length + errors.length);
  const actual = [];
  for (const file of files) {
    const html = read(path.join(site, file));
    const canonical = unescape(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || '');
    const url = decodeURI(new URL(canonical).pathname);
    assert.equal(canonical.startsWith(origin + '/'), true, file);
    assert.equal(robots(html).includes('nofollow'), false, url);
    assert.equal(robots(html).includes('noimageindex'), false, url);
    if (robots(html).includes('noindex')) actual.push(url);
    else {
      assert(robots(html).includes('max-image-preview:large'), url);
      assert(manifest.some(row => row.url === url && row.indexable), url);
    }
  }
  assert.deepEqual(actual.sort(), [photo, ...errors].sort());
  for (const row of manifest.filter(row => row.status === 'school_dates_pending')) {
    assert(row.indexable, row.url);
    assert(htmlFor(row.url).includes('Oficiālais brīvlaiku grafiks vēl nav publicēts'), row.url);
  }
  assert(manifest.find(row => row.url === '/meklesana/').indexable);
  assert(manifest.find(row => row.url === '/nedelas-kalendars/2031/01/').indexable);
});

test('image sitemap uses canonical content pages, valid image namespace and real public image files', () => {
  execFileSync('ruby', ['-rrexml/document', '-e', 'document=REXML::Document.new(File.read(ARGV.fetch(0))); raise "Invalid sitemap root" unless document.root.name=="urlset" && document.root.namespace=="http://www.sitemaps.org/schemas/sitemap/0.9"', path.join(site, 'image-sitemap.xml')], {stdio: 'pipe'});
  assert(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
  assert(Buffer.byteLength(xml) < 50 * 1024 * 1024);
  assert.equal(new Set(records.map(row => row.url)).size, records.length);
  assert.deepEqual(records.map(row => decodeURI(new URL(row.url).pathname)).sort(), manifest.filter(row => row.indexable).map(row => row.url).sort());
  for (const row of records) {
    assert(row.images.length > 0 && row.images.length <= 1000, row.url);
    assert.equal(new Set(row.images).size, row.images.length, row.url);
  }
  for (const image of images) {
    const url = new URL(image);
    assert.equal(url.origin, origin);
    assert.equal(url.search + url.hash, '');
    assert.match(url.pathname, /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i);
    assert(fs.statSync(path.join(site, decodeURIComponent(url.pathname))).size > 0, image);
  }
  for (const url of [photo, ...errors]) assert(!records.some(row => row.url === origin + url));
});

test('all current page-bound social covers and accepted calendar Image downloads are discoverable', () => {
  const covers = JSON.parse(read('_data/social-images.json')).pages;
  for (const page of manifest.filter(row => row.indexable)) {
    const record = records.find(row => decodeURI(new URL(row.url).pathname) === page.url);
    assert(record.images.includes(origin + covers[page.url].src), page.url);
  }
  for (const item of JSON.parse(read('assets/print-library-data.json')).items) {
    assert(images.has(origin + item.image), item.image);
    assert(images.has(origin + item.preview), item.preview);
  }
});

test('robots and static response headers permit crawling all public image formats and pages', () => {
  const text = read(path.join(site, 'robots.txt'));
  assert.match(text, /User-agent: \*\nAllow: \/\n/);
  assert.doesNotMatch(text, /^Disallow:\s*\S+/im);
  assert(text.includes('Sitemap: ' + origin + '/sitemap.xml'));
  assert(text.includes('Sitemap: ' + origin + '/image-sitemap.xml'));
  assert.doesNotMatch(read(path.join(site, '_headers')), /X-Robots-Tag:\s*[^\n]*(?:noindex|noimageindex|none)/i);
  const audit = JSON.parse(read('docs/indexability-audit.json'));
  assert.equal(audit.contentPages, manifest.filter(row => row.indexable).length);
  assert.equal(audit.sitemapImages, images.size);
  assert(audit.publicImageFiles >= images.size);
});

test('build guard rejects unintended noindex, unsafe URLs and missing images while preserving responsive sources', () => {
  execFileSync('ruby', ['-e', String.raw`
    require 'tmpdir'
    require 'fileutils'
    require File.expand_path('scripts/image_sitemap', Dir.pwd)
    raise unless CalendarIndexingPolicy.noindex?('/pilsetas-un-fotografijas/')
    begin
      CalendarIndexingPolicy.validate!('/kalendars/2027/', true)
      raise 'Noindex was accepted'
    rescue RuntimeError => error
      raise unless error.message.include?('Unexpected indexing setting')
    end
    Dir.mktmpdir do |dir|
      FileUtils.mkdir_p(File.join(dir,'assets'))
      %w[first.webp second.webp og.jpg].each { |name| File.write(File.join(dir,'assets',name),'fixture') }
      File.write(File.join(dir,'assets','Mēness attēls.svg'),'fixture')
      html = '<img src="/assets/first.webp?v=2" srcset="/assets/first.webp 320w, /assets/second.webp 640w"><meta property="og:image" content="https://kalendars365.lv/assets/og.jpg"><image href="/assets/M%C4%93ness%20att%C4%93ls.svg#moon"/><img src="blob:local"><img src="data:image/png;base64,aaaa"><img src="https://other.example/photo.jpg">'
      found = CalendarImageSitemap.images_in(html,origin:'https://kalendars365.lv',destination:dir)
      raise 'Sources were lost or private images leaked' unless found.length==4 && found.include?('https://kalendars365.lv/assets/second.webp') && found.include?('https://kalendars365.lv/assets/M%C4%93ness%20att%C4%93ls.svg')
      ['/assets/missing.jpg','/assets/../escape.jpg'].each do |url|
        begin
          CalendarImageSitemap.local_image(url,origin:'https://kalendars365.lv',destination:dir)
          raise 'Bad image was accepted'
        rescue RuntimeError => error
          raise unless error.message.match?(/missing file|Unsafe image/)
        end
      end
    end
  `], {cwd: process.cwd(), stdio: 'pipe'});
});
