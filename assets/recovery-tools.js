(()=>{'use strict';
 const retry=document.querySelector('[data-recovery-retry]');if(retry)retry.addEventListener('click',()=>{if(!navigator.onLine){document.querySelector('[data-recovery-status]').textContent='Pārlūks ziņo, ka savienojums nav pieejams. Atjauno savienojumu un mēģini vēlreiz.';return;}location.reload();});
 document.querySelectorAll('[data-recovery-report]').forEach(a=>{const url=new URL('/kontakti/',location.origin);url.searchParams.set('page','https://kalendars365.lv'+location.pathname);a.href=url.pathname+url.search;});
})();
