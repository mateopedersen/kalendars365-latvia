'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
test('stylesheet bundles preserve cascade and body SVG styles and use their content hash',()=>{
  const script=`require 'tmpdir'; require 'json'; require 'digest'; require File.expand_path('_plugins/css_bundles',Dir.pwd)
Dir.mktmpdir do |root|
 Dir.mkdir(root+'/assets'); File.write(root+'/assets/a.css','a{color:red}')
 html='<html><head><style>p{color:blue}</style><link rel="stylesheet" href="/assets/a.css?v=1"><style media="print">p{color:black}</style></head><body><svg><style>.orbit{stroke:red}</style></svg></body></html>'
 output,bundles=CalendarStyleBundles.rewrite(html,root)
 cases={}
 ['<link rel="stylesheet" href="https://example.org/assets/a.css">','<style>a{background:url(../photo.png)}</style>','<style>a{filter:url(#shadow)}</style>'].each do |unsafe|
  original='<head><style>p{color:red}</style>'+unsafe+'</head>'; changed,files=CalendarStyleBundles.rewrite(original,root); cases[unsafe]=changed==original&&files.empty?
 end
 puts JSON.generate({output:output,bundles:bundles,unsafe:cases.values})
end`;
  const data=JSON.parse(execFileSync('ruby',['-e',script],{encoding:'utf8'}));
  const [path,css]=Object.entries(data.bundles)[0];
  assert.equal(css,'p{color:blue}\na{color:red}\n@media print {\np{color:black}\n}');
  const digest=require('node:crypto').createHash('sha256').update(css).digest('hex').slice(0,24);
  assert.equal(path,`/static/css/${digest}.css`);
  assert.match(data.output,/<head><link rel="stylesheet" href="\/static\/css\/[^\"]+"><\/head>/);
  assert.ok(data.output.includes('<svg><style>.orbit{stroke:red}</style></svg>'));
  assert.ok(data.unsafe.every(Boolean));
});
