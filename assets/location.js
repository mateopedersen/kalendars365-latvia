(()=>{'use strict';
 if(!document.getElementById('city-select')||!window.K365LocationCore||!window.K365Cities?.length)return;
 let storage;try{storage=localStorage;}catch{}
 const controller=window.K365LocationCore.createController({cities:window.K365Cities,storage,
  fetchLocation:async()=>{const response=await fetch('/api/atrasanas-vieta/',{headers:{Accept:'application/json'},cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('Vietu nevar noteikt');return response.json();},
  onChange:detail=>document.dispatchEvent(new CustomEvent('k365:citychange',{detail}))});
 window.K365Location=controller;controller.start();
 window.addEventListener('storage',event=>{if(event.key===window.K365LocationCore.key)controller.sync(event.newValue);});
})();
