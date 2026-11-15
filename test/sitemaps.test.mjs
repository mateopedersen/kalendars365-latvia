import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

test('sitemap audit rejects seeded protocol, indexing, privacy, date and discovery regressions',()=>{
 execFileSync('python3',['test/sitemap_test.py','-v'],{stdio:'pipe'});
});

test('sitemap generation is deterministic and preserves meaningful revision dates',()=>{
 execFileSync('ruby',['-e',String.raw`
  require File.expand_path('scripts/sitemap',Dir.pwd)
  require 'tmpdir'
  rows = ['/lietošanas-noteikumi/','/'].map { |path| {'url'=>path,'canonicalPath'=>path,'indexable'=>true,'lastmod'=>'2026-11-10','significantModifiedAt'=>'2026-11-10'} }
  first=CalendarSitemap.page_xml(rows,today:Date.new(2026,11,12))
  raise 'Clock changed lastmod' unless first==CalendarSitemap.page_xml(rows.reverse,today:Date.new(2030,12,31))
  raise 'Latvian escaping' unless first.include?('lieto%C5%A1anas-noteikumi')
  raise 'Missing UTF-8 header' unless first.start_with?('<?xml version="1.0" encoding="UTF-8"?>')
  Dir.mktmpdir do |dir|
    CalendarSitemap.write_source!(rows,source:dir)
    raise 'Source and XML differ' unless File.read(File.join(dir,'sitemap.xml')).end_with?(first)
    raise 'Missing robot discovery' unless File.read(File.join(dir,'robots.txt')).scan('Sitemap:').length==2
  end
  [rows+[rows.first], [rows.first.merge('lastmod'=>'2026-11-09')], [rows.first.merge('significantModifiedAt'=>'2030-01-01','lastmod'=>'2030-01-01')],
   [rows.first.merge('indexable'=>false)], [rows.first.merge('indexable'=>'true')], [rows.first.merge('canonicalPath'=>'/other/')],
   [rows.first.merge('url'=>'/%2e%2e/','canonicalPath'=>'/%2e%2e/')]].each do |bad|
    begin; CalendarSitemap.page_xml(bad,today:Date.new(2026,11,12));raise 'Invalid registry accepted';
    rescue RuntimeError=>e;raise if e.message=='Invalid registry accepted';end
  end
 `],{stdio:'pipe'});
});

test('both built XML sitemaps cover every canonical page and its actual images',()=>{
 const report=JSON.parse(execFileSync('python3',['scripts/audit_sitemaps.py'],{encoding:'utf8',maxBuffer:2*1024*1024}));
 assert.deepEqual(report.errors,[]);
 const manifest=JSON.parse(fs.readFileSync('docs/route-manifest.json','utf8'));
 const supportDocuments=['/404.html','/500.html'],indexable=manifest.filter(r=>r.indexable);
 assert.equal(new Set(manifest.map(r=>r.url)).size,manifest.length,'Canonical route inventory has no duplicate pages');
 assert.deepEqual(manifest.filter(r=>!r.indexable).map(r=>r.url),['/pilsetas-un-fotografijas/'],'Only the intended photo-credit page is excluded from the content sitemap');
 assert.equal(report.pageUrls,indexable.length);
 assert.equal(report.imagePages,indexable.length,'Every indexable page retains a corresponding image-sitemap entry');
 assert.equal(report.htmlDocuments,manifest.length+supportDocuments.length,'Audit covers all content pages and both error documents');
 for(const family of ['calendar_month','lunar_month','print_month'])assert.equal(report.families[family],48);
 assert.equal(report.families.year,4);
});
