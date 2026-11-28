import markupText from './markup-text.cjs';
const {decodeMarkupText}=markupText;
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const route='/svetki-un-tradicijas/staro-riga/';
const calendarPath='/kalendari/staro-riga-2026.ics';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const festival=read('_data/staro-riga.json');
const occasion=read('_data/occasions.json').find(item=>item.slug==='staro-riga');
const html=fs.readFileSync('_site'+route+'index.html','utf8');
const dates=['2026-11-15','2026-11-16','2026-11-17','2026-11-18'];
const decode=value=>decodeMarkupText(value);
const plain=value=>decode(value.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const anchors=[...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(match=>({href:decode(match[1]),label:plain(match[2])}));
const meta=name=>{
 const tag=(html.match(/<meta\b[^>]*>/g)||[]).find(tag=>tag.includes(`name="${name}"`));
 assert(tag,'Missing '+name+' metadata');
 return decode(tag.match(/\bcontent="([^"]*)"/)?.[1]||'');
};

test('confirmed festival data retains the four 2026 evenings and distinguishes the event from a statutory holiday',()=>{
 assert.equal(festival.year,2026);
 assert.equal(festival.startDate,dates[0]);assert.equal(festival.endDate,dates.at(-1));
 assert.equal(festival.startTime,'17:00');assert.equal(festival.endTime,'23:00');
 assert.equal(festival.timeZone,'Europe/Riga');
 assert(occasion,'The festival must be in the discoverable topic catalog');
 assert.equal(occasion.type,'festival');assert.equal(occasion.verified,true);assert.equal(occasion.dayOff,false);
 assert.deepEqual(occasion.dates.map(item=>item.date).sort(),dates);
});

test('the published festival page has a single current-event heading, specific metadata and its stable canonical route',()=>{
 const headings=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(match=>plain(match[1]));
 assert.equal(headings.length,1);assert.match(headings[0],/Staro Rīga/);assert.match(headings[0],/\b2026\b/);
 const title=plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');
 assert.match(title,/Staro Rīga.*2026/);assert.match(title,/\| Kalendārs365$/);
 const description=meta('description');assert.match(description,/Staro Rīga/);assert.match(description,/\b2026\b/);
 assert.doesNotMatch(title,/\b2027\b/,'An unconfirmed future schedule must not replace the current event title');
 assert.doesNotMatch(description,/\b2027\b/,'The current festival snippet should describe verified 2026 information');
 const canonical=(html.match(/<link\b[^>]*>/g)||[]).find(tag=>tag.includes('rel="canonical"'));
 assert(canonical?.includes('href="https://kalendars365.lv'+route+'"'));
 assert(!meta('robots').includes('noindex'));
 assert(anchors.some(a=>a.href===calendarPath),'The stable Safari-compatible calendar download is visible');
});

test('readers can open named official municipal, programme and map sources',()=>{
 const official=anchors.filter(a=>a.href.startsWith('https://')).map(a=>({...a,url:new URL(a.href)}));
 assert(official.some(a=>(a.url.hostname==='riga.lv'||a.url.hostname.endsWith('.riga.lv'))&&/staro-riga/i.test(a.url.pathname)),'A Riga municipal event source is linked');
 const organiser=official.filter(a=>a.url.hostname==='staroriga.lv'||a.url.hostname==='www.staroriga.lv');
 assert(organiser.some(a=>a.href===festival.programmeUrl&&/programm/i.test(a.label)),'Official programme link is named for readers');
 assert(official.some(a=>a.href===festival.mapUrl&&/kart/i.test(a.label)),'The organiser-linked map is named for readers');
});

test('each confirmed 2026 date opens the existing home calendar without invented monthly routes',()=>{
 const dayLinks=new Set(anchors.filter(a=>a.href.startsWith('/?date=2026-')).map(a=>a.href));
 assert.deepEqual([...dayLinks].sort(),dates.map(date=>'/?date='+date+'&view=day'));
 assert.doesNotMatch(html,/href="\/kalendars\/2026\//);
 for(const href of dayLinks){const target=new URL(href,'https://kalendars365.lv');assert.equal(target.pathname,'/');assert.equal(target.hash,'');assert.equal(target.searchParams.get('view'),'day');}
});

test('the reviewed festival hero remains source-bound and historical photographs are visibly dated 2011',()=>{
 const photo=occasion.photo;
 assert.match(photo.caption,/\b2011\b/,'The historical hero is not labelled as a 2026 photograph');
 const checksum=crypto.createHash('sha256').update(fs.readFileSync(photo.sourceCopy)).digest('hex');
 assert.equal(checksum,photo.sourceSha256);assert.equal(checksum,photo.visualReview.sourceSha256);
 const gallery=festival.galleryPhoto;
 const galleryChecksum=crypto.createHash('sha256').update(fs.readFileSync(gallery.sourceCopy)).digest('hex');
 assert.equal(galleryChecksum,gallery.sourceSha256);assert.equal(galleryChecksum,gallery.visualReview.sourceSha256);
 const credits=fs.readFileSync('_site/pilsetas-un-fotografijas/index.html','utf8');
 for(const image of [photo,gallery]){assert(credits.includes(image.sourceUrl));assert(credits.includes(image.licenseUrl));assert(credits.includes(image.author));}
 assert(anchors.some(a=>a.href==='/pilsetas-un-fotografijas/#occasion-photo-occasion-staro-riga'));
 assert(anchors.some(a=>a.href==='/pilsetas-un-fotografijas/#staro-riga-foto'));
 for(const file of gallery.files){const bytes=fs.readFileSync('_site'+file.src);assert.equal(bytes.length,file.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256);}
 const figures=[...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)].map(match=>match[1]).filter(block=>/staro[- ]r[iī]ga/i.test(block));
 assert(figures.length>=2,'The festival has a real-photo hero and gallery context');
 for(const figure of figures){const caption=plain(figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/)?.[1]||'');assert.match(caption,/\b2011\b/,'Every historical festival figure states its actual year');}
});

test('the downloaded ICS contains exactly four non-recurring six-hour UTC events, preserving Riga local evening hours',()=>{
 const raw=fs.readFileSync('_site'+calendarPath,'utf8');
 assert(raw.startsWith('BEGIN:VCALENDAR\r\n'));assert(raw.endsWith('END:VCALENDAR\r\n'));
 assert(!raw.replaceAll('\r\n','').includes('\n'),'Calendar uses RFC 5545 CRLF line endings');
 for(const line of raw.split('\r\n'))assert(Buffer.byteLength(line,'utf8')<=75,'Physical ICS lines are safely folded');
 const unfolded=raw.replace(/\r\n[ \t]/g,'');
 assert(unfolded.includes('VERSION:2.0\r\n'));assert.doesNotMatch(unfolded,/\r\nRRULE[;:]/,'No invented future annual recurrence');
 const events=[...unfolded.matchAll(/BEGIN:VEVENT\r\n([\s\S]*?)\r\nEND:VEVENT/g)].map(match=>match[1]);
 assert.equal(events.length,4);
 const uids=new Set();
 events.forEach((event,index)=>{
  const day=dates[index].replaceAll('-','');
  const properties=event.split('\r\n');
  assert(properties.includes('DTSTART:'+day+'T150000Z'),dates[index]+' starts at 17:00 in Riga');
  assert(properties.includes('DTEND:'+day+'T210000Z'),dates[index]+' ends at 23:00 in Riga');
  assert.match(event,/SUMMARY:.*Staro Rīga.*2026/);
  const uid=event.match(/(?:^|\r\n)UID:([^\r\n]+)/)?.[1];assert(uid,'Each evening has an event identity');assert(!uids.has(uid),'Event identities are distinct');uids.add(uid);
 });
});
