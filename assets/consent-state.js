(function(){
'use strict';
const key='kalendars365.v1';let record=null;
try{record=JSON.parse(localStorage.getItem(key)||'null');}catch{}
window.K365BootstrapStore=record;
document.documentElement.toggleAttribute('data-consent-saved',Boolean(record&&record.consent));
// The two choices work even while the larger calendar application is loading.
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-consent]');
 if(!button||window.K365||!['necessary','all'].includes(button.dataset.consent))return;
 event.preventDefault();event.stopImmediatePropagation();
 record={...(record&&typeof record==='object'?record:{}),consent:{choice:button.dataset.consent,date:new Date().toISOString(),version:1,analytics:false,advertising:false}};
 window.K365BootstrapStore=record;
 try{localStorage.setItem(key,JSON.stringify(record));}catch{}
 document.documentElement.setAttribute('data-consent-saved','');
 const banner=document.getElementById('consent-banner');if(banner)banner.hidden=true;
});
})();
