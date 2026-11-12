import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const ruby=script=>JSON.parse(execFileSync('ruby',['-e',`require 'json';require File.expand_path('scripts/name_day_sources',Dir.pwd);${script}`],{encoding:'utf8'}));

test('all published Latvian name/date records match the verified VVC sources exactly',()=>{
  const result=ruby('puts JSON.generate(NameDaySources.validate!(Dir.pwd))');
  assert.deepEqual(result.counts,{traditional:1032,extendedOnly:4620,total:5652});
  assert.equal(result.matched,5652);assert.equal(result.extra,0);assert.equal(result.missing,0);assert.equal(result.duplicates,0);assert.equal(result.sourceLanguageMarkers,6);
});

test('the source gate rejects invented names, changed dates, wrong lists and language markers',()=>{
  const results=ruby(`original=JSON.parse(File.read('_data/name-days-current.json'));cases={}
  changes={name:->(data){data['records'][0]['name']='SlovenijaPrimer'},date:->(data){data['records'][0]['day']=2},kind:->(data){data['records'][0]['kind']='extended'},language:->(data){data['records'].find{|row|row['name']=='Muora'}['language']='lv'},duplicate:->(data){data['records'][0]['id']=data['records'][1]['id']}}
  changes.each do |name,change|
    data=Marshal.load(Marshal.dump(original));change.call(data)
    begin;NameDaySources.validate!(Dir.pwd,data);cases[name]=false;rescue RuntimeError;cases[name]=true;end
  end
  puts JSON.generate(cases)`);
  assert(Object.values(results).every(Boolean),JSON.stringify(results));assert.equal(Object.keys(results).length,5);
});

test('source annotations are not mistaken for names, and replaced source bytes invalidate verification',()=>{
  const result=ruby(`require 'tmpdir';require 'fileutils'
  traditional,=NameDaySources.read_rows('docs/sources/vvc-2026/ckan-traditional-current.csv')
  extended,ltg=NameDaySources.read_rows('docs/sources/vvc-2026/vvc-extended-current.csv',extended:true)
  rejected=false
  Dir.mktmpdir do |temporary|
    FileUtils.mkdir_p(temporary+'/_data');FileUtils.mkdir_p(temporary+'/docs/sources');FileUtils.cp_r('docs/sources/vvc-2026',temporary+'/docs/sources/vvc-2026')
    FileUtils.cp('_data/name-days-verification.json',temporary+'/_data/name-days-verification.json')
    File.open(temporary+'/docs/sources/vvc-2026/vvc-extended-current.csv','a'){|file|file.write("\n01.01.,InventedName\n")}
    begin;NameDaySources.validate!(temporary);rescue RuntimeError=>error;rejected=error.message.include?('source bytes changed');end
  end
  puts JSON.generate({annotationAbsent:!(traditional|extended).any?{|name,month,day|%w[Visu LTG diena].include?(name)},emilija:traditional.include?(['Emīlija',5,22]),latgalian:ltg.include?(['Juoņs',6,24]),tamperRejected:rejected})`);
  assert(Object.values(result).every(Boolean),JSON.stringify(result));
});
