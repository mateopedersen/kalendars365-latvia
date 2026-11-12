import {fitSunViewport} from './sun-player-core.mjs';

export function createSunPlayer(experience) {
  const root=experience.querySelector('[data-sun-player]'),stage=root.querySelector('[data-sun-stage]');
  let pending=0,disposed=false;
  const height=()=>window.visualViewport?.height||innerHeight;
  function fit() {
    pending=0;if(disposed)return;
    const viewport=height();root.dataset.compact=String(viewport<520);
    const style=getComputedStyle(root),number=name=>parseFloat(style[name])||0,children=[...root.children];
    const chrome=children.filter(child=>child!==stage).reduce((sum,child)=>sum+child.getBoundingClientRect().height,0)+number('paddingTop')+number('paddingBottom')+number('borderTopWidth')+number('borderBottomWidth')+number('rowGap')*(children.length-1);
    const maximum=document.fullscreenElement===root?Math.max(80,viewport):520;
    const next=fitSunViewport({viewportHeight:viewport,chromeHeight:Math.max(0,chrome),maximumStage:maximum,inset:document.fullscreenElement===root?8:12});
    if(Math.abs(stage.getBoundingClientRect().height-next)>1)root.style.setProperty('--sun-stage-height',Math.floor(next)+'px');
  }
  const schedule=()=>{if(!pending)pending=requestAnimationFrame(fit);};
  function reveal() {
    fit();if(document.fullscreenElement===root)return;
    const rect=root.getBoundingClientRect(),viewport=height();
    if(rect.top<10||rect.bottom>viewport-10)root.scrollIntoView({block:'start',behavior:'instant'});
  }
  root.querySelector('[data-sun-fit]').addEventListener('click',()=>{experience.dispatchEvent(new CustomEvent('k365:sun-fit'));reveal();});
  const fullscreen=root.querySelector('[data-sun-fullscreen]');
  if(!root.requestFullscreen)fullscreen.hidden=true;
  fullscreen.addEventListener('click',async()=>{
    try{if(document.fullscreenElement===root)await document.exitFullscreen();else await root.requestFullscreen();schedule();}
    catch{reveal();experience.querySelector('[data-sun-render-status]').textContent='Pilnekrāns nav pieejams. Skats ir pielāgots ekrānam.';}
  });
  const fullscreenChanged=()=>{const active=document.fullscreenElement===root;fullscreen.setAttribute('aria-label',active?'Iziet no pilnekrāna':'Atvērt simulāciju pilnekrānā');fullscreen.setAttribute('title',active?'Aizvērt pilnekrānu':'Pilnekrāns');schedule();};
  document.addEventListener('fullscreenchange',fullscreenChanged);
  window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
  const resize=new ResizeObserver(schedule);resize.observe(root);
  const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)experience.dispatchEvent(new CustomEvent('k365:sun-outofview'));},{threshold:0});observer.observe(root);
  window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;cancelAnimationFrame(pending);resize.disconnect();observer.disconnect();window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);document.removeEventListener('fullscreenchange',fullscreenChanged);},{once:true});
  fit();
  return {fit,reveal};
}
