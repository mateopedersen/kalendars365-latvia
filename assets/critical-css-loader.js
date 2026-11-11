(()=>{'use strict';
 const styles=[...document.querySelectorAll('link[data-critical-deferred]')];
 window.K365StylesReady=Promise.all(styles.map(link=>new Promise(resolve=>{
  let complete=false;
  const activate=()=>{if(complete)return;complete=true;link.media=link.getAttribute('data-critical-media')||'all';link.removeAttribute('data-critical-deferred');resolve(true);};
  if(link.sheet)activate();else{link.addEventListener('load',activate,{once:true});link.addEventListener('error',()=>{link.dataset.criticalError='true';resolve(false);},{once:true});}
 })));
})();
