(function(){
'use strict';
const key='kalendars365.v1';let record=null;
try{record=JSON.parse(localStorage.getItem(key)||'null');}catch{}
if(record&&typeof record==='object'&&!Array.isArray(record))record={...record,consent:window.K365PrivacyChoice?.normalize(record.consent)||null};
window.K365BootstrapStore=record;
document.documentElement.toggleAttribute('data-consent-saved',Boolean(record&&record.consent));
// This acknowledges an information notice, without authorizing future trackers.
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-consent]');
 if(!button||window.K365||button.dataset.consent!=='necessary'||!window.K365PrivacyChoice)return;
 event.preventDefault();event.stopImmediatePropagation();
 record={...(record&&typeof record==='object'&&!Array.isArray(record)?record:{}),consent:window.K365PrivacyChoice.acknowledge()};
 window.K365BootstrapStore=record;
 try{localStorage.setItem(key,JSON.stringify(record));}catch{}
 document.documentElement.setAttribute('data-consent-saved','');
 const banner=document.getElementById('consent-banner');if(banner)banner.hidden=true;
});
})();
