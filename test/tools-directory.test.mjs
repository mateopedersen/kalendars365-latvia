import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {matchesTool,normalizeToolQuery,readSavedTools} from '../assets/tools-directory.mjs';
const tools=JSON.parse(fs.readFileSync('_data/tools-directory.json','utf8'));
const rows=tools.map(t=>({search:[t.title,t.description,{'calendar':'Kalendāri','work':'Darbs un aprēķini','school':'Mācības','personal':'Personīgie plāni','nature':'Saule, Mēness un daba'}[t.kind]].join(' '),kind:t.kind,url:t.url}));
test('directory search handles Latvian accents, punctuation and multiple words',()=>{
 assert.equal(normalizeToolQuery('  MĒNESS – fāzes!  '),'meness fazes');
 const find=query=>rows.filter(row=>matchesTool(row,{query})).map(row=>row.url);
 assert(find('meness fazes').includes('/meness-fazes/'));
 assert(find('darba dienas').includes('/darba-dienu-kalendars/'));
 assert(find('gimenes').includes('/gimenes-kalendars/'));
 assert(find('sējas stādīšanas').includes('/sejas-kalendars/'));
 assert.equal(find('neeksistejossriks').length,0);
 assert.equal(find('').length,24);
});
test('task and saved filters intersect without discarding the catalogue',()=>{
 const saved=['/meness-kalendars/','/gimenes-kalendars/'];
 assert.deepEqual(rows.filter(row=>matchesTool(row,{kind:'nature',savedOnly:true,saved})).map(row=>row.url),['/meness-kalendars/']);
 assert.equal(rows.filter(row=>matchesTool(row,{savedOnly:true,saved:[]})).length,0);
 assert.equal(rows.filter(row=>matchesTool(row)).length,24);
 for(const kind of ['calendar','personal','work','school','nature'])assert(rows.some(row=>matchesTool(row,{kind})));
});
test('existing bookmark storage is retained and malformed records are ignored',()=>{
 const urls=rows.map(r=>r.url);
 assert.deepEqual(readSavedTools('["/gimenes-kalendars/","/gimenes-kalendars/","https://invalid.example",null]',urls),['/gimenes-kalendars/']);
 for(const raw of ['broken','{}','null','[{}]'])assert.deepEqual(readSavedTools(raw,urls),[]);
});
test('all 24 tools are real links in the initial HTML, with independent vector illustrations',()=>{
 const html=fs.readFileSync('_site/visi-riki/index.html','utf8');
 assert.equal((html.match(/data-directory-tool /g)||[]).length,24);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 assert(!html.includes('/assets/category-tools.mjs'));
 assert(!html.includes('/assets/category-data.json'));
 assert(html.includes('/assets/tools-directory.mjs'));
 const names=new Set(),bodies=new Set();
 for(const t of tools){
  assert(fs.existsSync('_site'+t.url+'index.html'),t.url);
  assert(html.includes('data-tool-url="'+t.url+'"'),t.url);
  assert(html.includes('src="/assets/tools-art/'+t.art+'.svg?v='),t.art);
  const art=fs.readFileSync('assets/tools-art/'+t.art+'.svg','utf8');
  assert(!/<(?:image|foreignObject|script)\b|data:image|\b(?:NaN|Infinity|undefined)\b/.test(art),t.art);
  names.add(t.art);bodies.add(art.replace(/<title[\s\S]*?<\/desc>/,''));
 }
 assert.equal(names.size,24);assert.equal(bodies.size,24);
 const manifest=JSON.parse(fs.readFileSync('_data/tools-art.json','utf8'));
 for(const a of manifest.artworks)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('.'+a.file)).digest('hex'),a.sha256,a.id);
});

test('directory reading copy contains no dash separators or dashed year ranges',()=>{
 const html=fs.readFileSync('_site/visi-riki/index.html','utf8');
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];assert(main);
 const copy=main.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g,'').replace(/<[^>]+>/g,' ');
 assert(!/[-\u2010-\u2015\u2212]/u.test(copy),'Visible directory copy must use sentences instead of dash separators');
 assert(!copy.includes('Tavs nākamais plāns sākas te.'));
 assert(html.includes('<h1>Kalendāri un plānošanas rīki</h1>'));
});
