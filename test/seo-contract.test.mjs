import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifyMetadata,verifyHttp} from '../tooling/seo/verify.mjs';
import {interactionEvent} from '../tooling/seo/event-contract.mjs';
const read=f=>fs.readFileSync(f,'utf8'),json=f=>JSON.parse(read(f));
test('all 901 HTML documents have coherent route, sitemap, metadata, image and entity identities',()=>{
 execFileSync('python3',['-c','from tooling.seo.inventory import Document; d=Document(); d.feed(\'<html><head><title>Kalendārs | Kalendārs365</title></head><body><svg><title>Accessible illustration title</title></svg></body></html>\'); assert d.title == "Kalendārs | Kalendārs365"'],{stdio:'pipe'});
 const result=verifyMetadata();assert.equal(result.pages,901);assert.equal(result.entityGraphs,901);assert.deepEqual(result.errors,[]);
});
test('calendar snippets identify actual dates and the homepage declares the crawlable brand icon', () => {
 const pages = json('_data/seo-contract.json').pages;
 assert.equal(pages['/varda-dienas/aprilis/'].title, 'Vārda dienas aprīlī | Kalendārs365');
 assert.match(pages['/meness-kalendars/2028/janvaris/'].description, /12\. janvārī plkst\. 06:03/);
 assert.match(pages['/nedelas-kalendars/2031/01/'].description, /2030\. gada 30\. decembrī un beidzas 5\. janvārī/);
 assert.match(pages['/darba-dienu-kalendars/2028/februaris/'].description, /21/);
 assert.equal(new Set(Object.values(pages).map(page => page.description)).size, Object.keys(pages).length);
 const home = read('_site/index.html');
 assert.match(home, /<link rel="icon" type="image\/png" sizes="96x96" href="\/assets\/favicon-96\.png">/);
 const icon = fs.readFileSync('_site/assets/favicon-96.png');
 assert.deepEqual([icon.readUInt32BE(16), icon.readUInt32BE(20)], [96, 96]);
 const entities = Array.from(home.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), match => JSON.parse(match[1])).flatMap(entry => entry['@graph'] ?? [entry]);
 const site = entities.find(entry => entry['@type'] === 'WebSite');
 assert.equal(site.name, 'Kalendārs365');
 assert.deepEqual(site.alternateName, ['Kalendars365', 'kalendars365.lv']);
});
test('the route factory rejects foreign, parameterized, noncanonical and impossible date inputs',()=>{
 execFileSync('ruby',['-e',String.raw`
  require File.expand_path('lib/seo_contract',Dir.pwd)
  prior={'contentSha256'=>'same-content','lastmod'=>'2026-11-10'}
  raise unless CalendarSeoContract.revision_date(prior,'same-content','2026-11-10','2030-12-31')=='2026-11-10'
  raise unless CalendarSeoContract.revision_date(prior,'changed-content','2026-11-10','2026-11-12')=='2026-11-12'
  raise unless CalendarSeoContract.revision_date({'lastmod'=>'2026-11-10'},'bootstrap','2026-11-10','2026-11-12')=='2026-11-10'
  raise unless CalendarSeoContract.absolute('/kalendars/2028/februaris/')=='https://kalendars365.lv/kalendars/2028/februaris/'
  ['//other.example/x/','https://other.example/x/','/x/?q=private','/x/#private','/x/index.html','/x','/x/../y/'].each do |path|
    begin;CalendarSeoContract.canonical_path(path);raise 'invalid path accepted';rescue RuntimeError=>e;raise if e.message=='invalid path accepted';end
  end
  ['2030-02-29','2028-02-30','2027-13-01','2027-1-01'].each do |date|
    begin;CalendarSeoContract.date(date);raise 'invalid date accepted';rescue ArgumentError;rescue RuntimeError=>e;raise if e.message=='invalid date accepted';end
  end
 `],{stdio:'pipe'});
});
test('public calendar and name directory snapshots are visible before JavaScript, including leap day and boundary weeks',()=>{
 const snapshots=json('_data/calendar-ssr.json');assert.equal(snapshots.timeZone,'Europe/Riga');
 for(const [url,s]of Object.entries(snapshots.pages)){
  const file=url==='/'?'_site/index.html':'_site'+url+'index.html';
  if(fs.existsSync(file)&&read(file).includes('id="calendar-app"'))assert(read(file).includes(s.markup),url);
 }
 assert(snapshots.pages['/kalendars/2028/februaris/'].markup.includes('data-date="2028-02-29"'));
 assert(snapshots.pages['/nedelas-kalendars/2031/01/'].markup.includes('data-date="2030-12-30"'));
 const names=read('_site/varda-dienas/index.html');assert(names.includes(snapshots.names.cards));assert.equal((snapshots.names.cards.match(/class="name-result-card"/g)||[]).length,60);
});
test('preview exclusion cannot leak into production simulation and redirects have no chains or loops',async()=>{
 const result=await verifyHttp();assert.equal(result.requests,18);assert.deepEqual(result.errors,[]);
});
test('measurement contracts drop names, notes, URLs, dates and arbitrary custom labels; they send nothing',()=>{
 const event=interactionEvent('calendar_download_click',{family:'calendar_month',format:'pdf',year:2028,month:2,design:3,name:'PRIVATE_SENTINEL',notes:'PRIVATE_SENTINEL',url:'https://example.test/?q=PRIVATE_SENTINEL',date:'2028-02-29'});
 assert.deepEqual(event,{event:'calendar_download_click',family:'calendar_month',format:'pdf',year:2028,month:2,design:3});assert(!JSON.stringify(event).includes('PRIVATE_SENTINEL'));
 assert.deepEqual(interactionEvent('calculator_result_rendered',{family:'private_person_name'}),{event:'calculator_result_rendered'});
 assert.throws(()=>interactionEvent('download_saved_on_device'));
 assert(!/fetch\s*\(|sendBeacon|localStorage|sessionStorage/.test(read('tooling/seo/event-contract.mjs')));
});
