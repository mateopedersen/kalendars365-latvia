const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const config=JSON.parse(fs.readFileSync('_data/contact.json'));
function contact(topic=''){
 const listeners={},frame={src:config.embedUrl,hidden:false,addEventListener:(type,fn)=>listeners[type]=fn},notice={hidden:true},links=[{href:config.formUrl},{href:config.formUrl}];
 const doc={querySelector:s=>s.includes('iframe')?frame:s==='.contact-form-notice'?notice:null,querySelectorAll:()=>links,addEventListener:(type,fn)=>listeners[type]=fn};
 vm.runInNewContext(fs.readFileSync('assets/contact-page.js','utf8'),{URL,URLSearchParams,location:{search:topic},document:doc});return{frame,notice,links,listeners};
}
test('Google Forms passive account check is narrowly allowed without broad frame access',()=>{
 const headers=fs.readFileSync('_headers','utf8'),directive=headers.match(/frame-src ([^;]+)/)[1];assert.equal(directive,"'self' https://docs.google.com https://accounts.google.com");assert(headers.includes("object-src 'none'"));assert(headers.includes("frame-ancestors 'none'"));
});
test('topic prefills both the embedded form and the direct form links',()=>{const c=contact('?tema=pieklustamiba');for(const url of [c.frame.src,...c.links.map(x=>x.href)])assert.equal(new URL(url).searchParams.get('entry.164533219'),'Piekļūstamība');assert.equal(c.frame.hidden,false);});
test('a blocked Google frame collapses to a readable fallback instead of leaving a tall blank area',()=>{
 const c=contact();c.listeners.securitypolicyviolation({effectiveDirective:'script-src',blockedURI:'https://docs.google.com/'});assert.equal(c.frame.hidden,false);c.listeners.securitypolicyviolation({effectiveDirective:'frame-src',blockedURI:'https://accounts.google.com/'});assert.equal(c.frame.hidden,true);assert.equal(c.notice.hidden,false);
 const network=contact();network.listeners.error();assert.equal(network.notice.hidden,false);
});
test('the direct form action precedes the iframe and does not depend on the embedded document loading',()=>{const template=fs.readFileSync('_includes/contact-page.html','utf8');assert(template.indexOf('class="contact-form-direct"')<template.indexOf('<iframe'));assert(template.includes('target="_blank" rel="noopener noreferrer"'));});
