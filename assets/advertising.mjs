import {mountDisplayBanner} from './display-runtime.mjs';
const node=document.getElementById('advertising-config');
let bannerConfig;try{bannerConfig=JSON.parse(node?.textContent||'null');}catch{}
if(bannerConfig)mountDisplayBanner(bannerConfig);
document.addEventListener('click',event=>{const b=event.target.closest?.('[data-cookie-preferences],[data-cookie-open]');if(b){event.preventDefault();window.K365Analytics?.open();}});
