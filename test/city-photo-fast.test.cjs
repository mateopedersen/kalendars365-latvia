const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {createCityPhotoLoader}=require('../assets/city-card.js');
function harness(){
 const requests=[],changes=[];let shown;
 const image={src:'old-accepted.webp',alt:'Old city',sizes:'320px',attributes:[{name:'id',value:'city-photo'},{name:'width',value:'960'},{name:'height',value:'600'}],replaceWith(next){shown=next;}};shown=image;
 const figure={dataset:{photoCity:'old'},classList:{toggle(){},remove(){}},setAttribute(name,value){this[name]=value;}},status={hidden:true};
 const loader=createCityPhotoLoader({image,figure,status,onDisplay:city=>changes.push(city.id),makeImage:()=>{const pending={attributes:[],setAttribute(name,value){this[name]=value;this.attributes.push({name,value});},replaceWith(next){shown=next;},decode:async()=>{}};requests.push(pending);return pending;}});
 return{requests,get image(){return shown;},figure,status,changes,loader};
}
const city=id=>({id,name:id,countryName:'Latvija',photo:{src:'/assets/cities/'+id+'-960.webp',fastSrc:'/assets/city-fast/'+id+'-320.webp',preview:'data:image/webp;base64,'+id,alt:id}});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('a cold city never replaces the clear photograph with an enlarged low-resolution preview',async()=>{
 const h=harness(),before=h.image,done=h.loader.update(city('riga'));assert.equal(h.image,before);assert.equal(h.image.src,'old-accepted.webp');assert.equal(h.requests[0].src,city('riga').photo.src);assert.equal(h.figure.dataset.photoCity,'old');
 let decoded;h.requests[0].decode=()=>new Promise(resolve=>decoded=resolve);const loading=h.requests[0].onload();await flush();assert.equal(h.image,before,'Network load alone must not paint before decoding');decoded();await loading;await done;assert.equal(h.image,h.requests[0]);assert.equal(h.image.id,'city-photo');assert.equal(h.image.alt,'riga');assert.equal(h.figure.dataset.photoStage,'ready');assert.deepEqual(h.changes,['riga']);
});
test('rapid selections ignore stale loads; revisiting a decoded city swaps synchronously',async()=>{
 const h=harness();h.loader.update(city('riga'));h.loader.update(city('mazsalaca'));await h.requests[0].onload();await flush();assert.equal(h.image.src,'old-accepted.webp');assert.equal(h.changes.length,0);await h.requests[1].onload();await flush();assert.equal(h.image.src,city('mazsalaca').photo.src);h.loader.update(city('riga'));assert.equal(h.image.src,city('riga').photo.src);assert.equal(h.requests.length,2);assert.deepEqual(h.changes,['mazsalaca','riga']);
});
test('intent preloading reuses the same full photograph without a selection-time request',async()=>{
 const h=harness(),c=city('karsava');h.loader.preload(c);assert.equal(h.requests[0].fetchPriority,'low');await h.requests[0].onload();await flush();h.loader.update(c);assert.equal(h.image.src,c.photo.src);assert.equal(h.requests.length,1);
});
test('failed download or decoding preserves the previous photograph and permits retry',async()=>{
 const h=harness();h.loader.update(city('riga'));h.requests[0].onerror(Error('offline'));await flush();assert.equal(h.image.src,'old-accepted.webp');assert.equal(h.figure.dataset.photoCity,'old');assert.equal(h.status.hidden,false);h.loader.update(city('riga'));assert.equal(h.requests.length,2);h.requests[1].decode=async()=>{throw Error('Invalid image')};await h.requests[1].onload();await flush();assert.equal(h.image.src,'old-accepted.webp');h.loader.update(city('riga'));assert.equal(h.requests.length,3);
});
test('all 82 previews and responsive derivatives remain bound to the accepted photographs',()=>{const entries=JSON.parse(fs.readFileSync('_data/city-photo-previews.json')).cities;assert.equal(Object.keys(entries).length,82);for(const [id,e] of Object.entries(entries)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync('.'+e.source)).digest('hex'),e.sourceSha256,id);assert(e.preview.startsWith('data:image/webp;base64,'));for(const f of e.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('.'+f.src)).digest('hex'),f.sha256,id);}});
