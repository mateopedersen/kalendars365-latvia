// Static sponsored content never depends on analytics permission. Only bridge the existing cookie controls.
document.addEventListener('click',event=>{const b=event.target.closest?.('[data-cookie-preferences],[data-cookie-open],[data-advertising-open]');if(!b)return;event.preventDefault();window.K365Analytics?.open();});
