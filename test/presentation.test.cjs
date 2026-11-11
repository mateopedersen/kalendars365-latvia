const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let count=0;
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)]);}
for(const f of walk('_site').filter(x=>x.endsWith('.html'))){
 const s=fs.readFileSync(f,'utf8'),title=s.match(/<title>([^<]+)<\/title>/)?.[1];
 assert.ok(title?.endsWith(' | Kalendārs365'),f+' title suffix');
 assert.ok(!/ [-–—·] /.test(title),f+' title separator');
 assert.ok(s.includes('sizes="96x96" href="/assets/favicon-96.png"'),f+' favicon');count+=3;
 const staleArt=[...s.matchAll(/src="(\/assets\/(?:category-art|zodiac)\/[^"]+)"/g)].filter(m=>!m[1].includes('?v='));assert.equal(staleArt.length,0,f+' versioned category art');count++;
}
const hub=fs.readFileSync('_site/pdf-kalendari/2027/index.html','utf8'),months=[...hub.matchAll(/src="\/assets\/category-vector\/month-2027-(\d+)\.svg\?v=/g)].map(x=>Number(x[1]));
assert.deepEqual([...new Set(months)].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i+1));count++;
const hashes=Array.from({length:12},(_,i)=>crypto.createHash('sha256').update(fs.readFileSync('assets/category-art/month-'+(i+1)+'.svg')).digest('hex'));
assert.equal(new Set(hashes).size,12);count++;
for(const n of [48,96,180,192]){const p=fs.readFileSync('assets/favicon-'+n+'.png');assert.equal(p.readUInt32BE(16),n);assert.equal(p.readUInt32BE(20),n);count+=2;}
assert.equal(fs.readFileSync('favicon.ico').readUInt16LE(4),4);count++;
assert.equal(fs.readFileSync('_site/kalendars/2027/index.html','utf8').match(/<title>([^<]+)/)?.[1],'Kalendārs 2027 | Kalendārs365');count++;
console.log(count+' presentation assertions passed: all titles, favicons, and twelve unique month models.');
