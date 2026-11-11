/* Keep the native details menu inside the currently visible viewport. */
(() => {
  function init() {
    const menu=document.querySelector('.nav-more'),panel=menu?.querySelector('.nav-directory');
    if(!menu||!panel)return;
    const summary=menu.querySelector('summary'),nav=menu.closest('.secondary-nav');
    let frame=0;
    function fit(){
      frame=0;if(!menu.open)return;
      const viewport=window.visualViewport,height=viewport?.height||window.innerHeight;
      const offset=viewport?.offsetTop||0,box=nav.getBoundingClientRect();
      if(box.bottom<offset||box.top>offset+height){menu.open=false;return;}
      let top=Math.max(offset+8,box.bottom+5);
      // Keep all three desktop columns visible, even on a short laptop screen.
      // Narrow screens retain the contained, touch-friendly scrolling layout.
      if(window.matchMedia('(min-width:901px)').matches)top=Math.min(top,Math.max(offset+8,offset+height-472));
      else top=Math.min(top,offset+Math.max(16,height*.12));
      const available=Math.max(120,offset+height-top-12);
      menu.style.setProperty('--nav-top',top+'px');menu.style.setProperty('--nav-available',available+'px');
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(fit);};
    menu.addEventListener('toggle',()=>{if(menu.open){panel.scrollTop=0;fit();}});
    panel.querySelector('[data-nav-directory-close]').addEventListener('click',()=>{menu.open=false;summary.focus();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){event.preventDefault();menu.open=false;summary.focus();}});
    document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
    window.addEventListener('resize',schedule,{passive:true});window.addEventListener('scroll',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
    new ResizeObserver(schedule).observe(nav);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
