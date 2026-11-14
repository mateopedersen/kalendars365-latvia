const revision=new URL(import.meta.url).searchParams.get('v')||'';
const [math,panorama,{panoramaView,projectPanorama,compassTicks}]=await Promise.all([
  import(new URL('./sun-scene-core.mjs?v='+encodeURIComponent(revision),import.meta.url)),
  import(new URL('./solar-panorama.mjs?v='+encodeURIComponent(revision),import.meta.url)),
  import(new URL('./solar-panorama-core.mjs?v='+encodeURIComponent(revision),import.meta.url))
]);
const {atmosphere,compass,discAltitude,projectSun,wrap}=math;
const timeLabel=new Intl.DateTimeFormat('lv-LV',{timeZone:'Europe/Riga',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});

export function createSunScene(root) {
  const nodes=new Map(),q=s=>{if(!nodes.has(s))nodes.set(s,root.querySelector(s));return nodes.get(s);},stage=q('[data-sun-stage]'),host=q('[data-sun-map]');
  const viewport={width:stage.clientWidth,height:stage.clientHeight};
  const painter=panorama.createSolarPanorama(q('[data-sun-panorama]'));
  const state={map:null,current:null,follow:true,bearing:180,mode:'panorama',cityId:null,ready:false,landscape:'water'};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,frame=0,lastFrame=0,started=false,timeout,lastMapPaint=0,disposed=false,dirty=true,lastLabels='';
  const origin=performance.now();
  stage.dataset.renderer='panorama';stage.dataset.ready='true';

  function controls() {
    root.querySelectorAll('[data-sun-renderer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sunRenderer===state.mode)));
    q('[data-sun-follow]').setAttribute('aria-pressed',String(state.follow));
    q('[data-sun-landscape]').disabled=state.mode==='map';
    q('[data-sun-mode]').textContent=state.mode==='map'&&state.ready?'Pilsētas 3D karte':'Saules panorāma';
  }
  function labels() {
    if(!state.current)return;
    const key=[state.current.city.id,state.current.instant.getTime(),state.mode,state.follow,state.bearing,state.map?.getBearing(),viewport.width,viewport.height].join('|');
    if(key===lastLabels)return;lastLabels=key;
    const {position,instant,city}=state.current;
    const angle=state.mode==='map'&&state.map?wrap(state.map.getBearing()):state.follow?position.azimuth:state.bearing;
    q('[data-sun-bearing]').textContent=compass(angle)+' · '+Math.round(wrap(angle))+'°';
    q('[data-sun-compass]').innerHTML=compassTicks(angle).map(t=>'<span'+(t.center?' class="is-center"':'')+'><i></i>'+t.label+'</span>').join('');
    q('[data-sun-light]').textContent=atmosphere(position.altitude).label;
    q('[data-sun-scene-clock]').textContent=timeLabel.format(instant);
    q('[data-sun-city]').textContent=city.name;
    q('[data-sun-coordinates]').textContent=city.lat.toFixed(3)+'° Z · '+city.lon.toFixed(3)+'° A';
    let inView=true;
    const rect=viewport;
    if(state.mode==='map'&&state.map)inView=projectSun(discAltitude(position.altitude),position.azimuth,angle,state.map.getPitch(),rect.width,rect.height).visible;
    else{
      const view=panoramaView(state.current,state);
      inView=projectPanorama(view.altitude,position.azimuth,view,rect.width,rect.height).visible;
    }
    q('[data-sun-view-status]').textContent=discAltitude(position.altitude)<-.2666?'Saule ir zem horizonta':inView?'':'Saule ir ārpus kadra';
    painter.canvas.setAttribute('aria-label',city.name+', '+timeLabel.format(instant)+'. '+atmosphere(position.altitude).label+'. Saules augstums '+position.altitude.toLocaleString('lv-LV',{maximumFractionDigits:1})+' grādi. Ilustratīva ainava.');
  }
  function draw(now=performance.now()) {
    if(!state.current||disposed)return;
    if(state.mode==='panorama'||!state.ready)painter.draw(panoramaView(state.current,state),reduced.matches?0:(now-origin)/1000);
  }
  // One render loop owns the canvas: time updates only request a frame.
  // Never queue two GPU draws for the same animation frame.
  function tick(now) {
    frame=0;
    if(disposed||!visible||document.hidden)return;
    if(state.mode!=='panorama'&&state.ready)return;
    if(dirty||(!reduced.matches&&now-lastFrame>=33)){
      lastFrame=now;dirty=false;draw(now);
    }
    if(!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function animate() {
    dirty=true;
    if(!frame&&visible&&!document.hidden&&(state.mode==='panorama'||!state.ready))frame=requestAnimationFrame(tick);
  }
  function showPanorama(message) {
    stage.dataset.renderer='panorama';stage.dataset.ready='true';
    q('[data-sun-render-status]').textContent=message||'Saules stāvoklis pēc pilsētas koordinātām';
    controls();animate();
  }
  function showMap() {
    if(!state.map||!state.ready||state.mode!=='map')return;
    clearTimeout(timeout);stage.dataset.renderer='maplibre';stage.dataset.ready='true';
    const count=state.map.queryRenderedFeatures({layers:['buildings']}).length;
    q('[data-sun-render-status]').textContent=count?'Īstas ēku kontūras · tuvināti augstumi':'Šajā skatā ēku dati ir nepilnīgi';
    q('[data-sun-retry]').hidden=true;controls();labels();
  }
  function fallback(message) {
    clearTimeout(timeout);state.mode='panorama';showPanorama(message);
    q('[data-sun-retry]').hidden=false;
  }
  function paintMap(force=false) {
    const map=state.map;
    if(!map||!state.ready||!state.current||state.mode!=='map')return;
    const now=performance.now();if(!force&&now-lastMapPaint<160)return;lastMapPaint=now;
    const {city,position}=state.current,colors=atmosphere(position.altitude);
    if(state.mapCity!==city.id){
      state.mapCity=city.id;
      map.jumpTo({center:[city.lon,city.lat],zoom:15.5,pitch:65,bearing:state.follow?position.azimuth:state.bearing});
      map.once('idle',showMap);
    }else if(state.follow)map.jumpTo({bearing:position.azimuth});
    map.setSky({'sky-color':colors.sky,'horizon-color':colors.horizon,'sky-horizon-blend':.65});
    map.setLight({anchor:'map',position:[1.5,position.azimuth,90-position.altitude],color:colors.sun,intensity:.25+colors.daylight*.35},{duration:0});
    for(const [id,property,color] of [
      ['ground','background-color',colors.land],['green','fill-color',colors.green],['park','fill-color',colors.green],
      ['water','fill-color',colors.water],['river','line-color',colors.water],['buildings','fill-extrusion-color',colors.building],
      ['road-edge','line-color',colors.land],['roads','line-color',colors.building]
    ])map.setPaintProperty(id,property,color);
    map.triggerRepaint();labels();
  }
  async function startMap() {
    if(started){paintMap(true);showMap();return;}
    started=true;state.ready=false;
    q('[data-sun-render-status]').textContent='Ielādē pilsētas 3D karti…';
    timeout=setTimeout(()=>fallback('Karte nav ielādēta. Saules panorāma un aprēķini darbojas.'),8000);
    try {
      const helper=await import(new URL('./sun-city-map.mjs?v='+encodeURIComponent(revision),import.meta.url));
      const lib=await helper.loadLibrary();
      if(disposed||state.mode!=='map'){started=false;return;}
      const {city,position}=state.current;
      state.map=new lib.Map({
        container:host,style:helper.mapStyle(atmosphere(position.altitude)),center:[city.lon,city.lat],
        zoom:15.5,minZoom:13,maxZoom:18,pitch:65,maxPitch:75,bearing:position.azimuth,
        attributionControl:{compact:false},keyboard:false,scrollZoom:false,touchPitch:false,
        locale:{'NavigationControl.ZoomIn':'Tuvināt','NavigationControl.ZoomOut':'Attālināt','AttributionControl.ToggleAttribution':'Kartes avoti'},
        fadeDuration:0,pixelRatio:Math.min(devicePixelRatio||1,1.5),canvasContextAttributes:{antialias:true},refreshExpiredTiles:true
      });
      state.map.getCanvas().setAttribute('aria-label','Pilsētas 3D karte. Pagriez skatu ar vadības pogām.');
      state.map.addControl(new lib.NavigationControl({showCompass:false}),'top-right');
      state.map.on('load',()=>{
        state.ready=true;state.map.addLayer(helper.skyLayer(state),'green');
        paintMap(true);showMap();
      });
      state.map.on('move',labels);
      state.map.on('dragstart',()=>{state.follow=false;state.bearing=state.map.getBearing();controls();});
      state.map.on('webglcontextlost',()=>fallback('Kartes skats ir apturēts. Saules panorāma darbojas.'));
      state.map.on('webglcontextrestored',()=>{paintMap(true);state.map.once('idle',showMap);});
      state.map.on('error',()=>{if(!state.ready)q('[data-sun-render-status]').textContent='Kartes savienojums kavējas…';});
    }catch{
      fallback('3D karte nav pieejama. Izmanto Saules panorāmu un laika izvēli.');
    }
  }
  function update() {
    if(!state.current)return;
    const {city}=state.current;
    if(state.cityId!==city.id){
      state.cityId=city.id;
      const photo=q('[data-sun-photo]');photo.src=city.photo.src;photo.alt=city.photo.alt;
      // Different coordinates seed the illustrative horizon, not an invented city survey.
    }
    labels();paintMap();animate();
  }
  root.querySelectorAll('[data-sun-renderer]').forEach(button=>button.addEventListener('click',()=>{
    state.mode=button.dataset.sunRenderer;
    cancelAnimationFrame(frame);frame=0;controls();labels();
    if(state.mode==='map'){showPanorama('Ielādē pilsētas 3D karti…');startMap();}
    else showPanorama();
  }));
  root.addEventListener('k365:sun-fit',()=>{state.follow=true;controls();update();state.map?.resize();});
  q('[data-sun-landscape]').addEventListener('change',event=>{state.landscape=event.target.value;animate();});
  q('[data-sun-follow]').addEventListener('click',()=>{
    state.follow=!state.follow;
    if(!state.follow)state.bearing=state.current.position.azimuth;
    else if(state.map&&state.mode==='map')state.map.jumpTo({center:[state.current.city.lon,state.current.city.lat],zoom:15.5,pitch:65});
    controls();update();
  });
  root.querySelectorAll('[data-sun-rotate]').forEach(button=>button.addEventListener('click',()=>{
    const current=state.mode==='map'&&state.map?state.map.getBearing():state.follow?state.current.position.azimuth:state.bearing;
    state.bearing=wrap(current+Number(button.dataset.sunRotate));state.follow=false;
    if(state.mode==='map'&&state.map)state.map.jumpTo({bearing:state.bearing});
    controls();update();
  }));
  q('[data-sun-retry]').addEventListener('click',()=>{
    clearTimeout(timeout);state.map?.remove();state.map=null;state.ready=false;started=false;state.mode='map';
    q('[data-sun-retry]').hidden=true;controls();startMap();
  });
  const resize=new ResizeObserver(entries=>{const rect=entries[0].contentRect;viewport.width=rect.width;viewport.height=rect.height;state.map?.resize();labels();animate();});resize.observe(stage);
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible){animate();}else{cancelAnimationFrame(frame);frame=0;}
  },{rootMargin:'80px'});observer.observe(stage);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{animate();}};
  const motion=()=>{cancelAnimationFrame(frame);frame=0;animate();};
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);
  window.addEventListener('pageshow',visibility);
  window.addEventListener('pagehide',event=>{
    cancelAnimationFrame(frame);frame=0;
    if(event.persisted)return;
    disposed=true;clearTimeout(timeout);cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();
    painter.destroy();state.map?.remove();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);window.removeEventListener('pageshow',visibility);
  });
  controls();showPanorama();
  return {update(snapshot){state.current=snapshot;update();}};
}
