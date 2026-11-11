const revision = new URL(import.meta.url).searchParams.get('v') || '';
const {atmosphere, compass, discAltitude, direction, projectSun, wrap, RAD} = await import(new URL('./sun-scene-core.mjs?v=' + encodeURIComponent(revision), import.meta.url));

// MapLibre and its worker are pinned, checksum-verified, and served locally.
// Only public map tiles are requested from OpenFreeMap; no visitor GPS is used.
const library = './vendor/maplibre-6.17.0/';
let mapLibrary;
function loadLibrary() {
  if (!mapLibrary) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = new URL(library + 'maplibre-gl.css', import.meta.url).href;
    document.head.append(css);
    mapLibrary = import(new URL(library + 'maplibre-gl.mjs', import.meta.url)).then(lib => {
      lib.setWorkerUrl(new URL(library + 'maplibre-gl-worker.mjs', import.meta.url).href);
      lib.setWorkerCount(2);
      return lib;
    }).catch(error => {mapLibrary = null; throw error;});
  }
  return mapLibrary;
}
export function mapStyle(colors) {
  return {
    version: 8,
    transition: {duration: 0, delay: 0},
    sources: {city: {type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}},
    sky: {'sky-color': colors.sky, 'horizon-color': colors.horizon, 'sky-horizon-blend': 0.65},
    layers: [
      {id: 'ground', type: 'background', paint: {'background-color': colors.land}},
      {id: 'green', type: 'fill', source: 'city', 'source-layer': 'landcover', filter: ['in', 'class', 'wood', 'grass', 'farmland', 'wetland'], paint: {'fill-color': colors.green, 'fill-opacity': 0.8}},
      {id: 'park', type: 'fill', source: 'city', 'source-layer': 'park', paint: {'fill-color': colors.green}},
      {id: 'water', type: 'fill', source: 'city', 'source-layer': 'water', paint: {'fill-color': colors.water}},
      {id: 'river', type: 'line', source: 'city', 'source-layer': 'waterway', paint: {'line-color': colors.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 12]}},
      {id: 'road-edge', type: 'line', source: 'city', 'source-layer': 'transportation', filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service'], paint: {'line-color': '#9d9c90', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 14]}},
      {id: 'roads', type: 'line', source: 'city', 'source-layer': 'transportation', filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service'], paint: {'line-color': '#dad5c7', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 17, 11]}},
      {id: 'buildings', type: 'fill-extrusion', source: 'city', 'source-layer': 'building', minzoom: 13, filter: ['!=', ['get', 'hide_3d'], true], paint: {
        'fill-extrusion-color': colors.building,
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true
      }}
    ]
  };
}

// A direction-based sky dome, rendered behind the real building geometry.
// The disc has a ~0.53° angular diameter, with a soft atmospheric halo.
const vertex = `#version 300 es
in vec2 a_pos; out vec2 v_pos;
void main(){v_pos=a_pos;gl_Position=vec4(a_pos,0.,1.);}`;
const fragment = `#version 300 es
precision highp float;
in vec2 v_pos; out vec4 frag;
uniform vec2 u_size; uniform vec3 u_sun; uniform float u_bearing;
uniform float u_pitch; uniform float u_day;
uniform vec3 u_sky; uniform vec3 u_horizon; uniform vec3 u_sunColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 float b=u_bearing,p=u_pitch,t=1./3.;
 vec3 forward=vec3(sin(b)*sin(p),-cos(p),cos(b)*sin(p));
 vec3 right=vec3(cos(b),0.,-sin(b));
 vec3 up=vec3(sin(b)*cos(p),sin(p),cos(b)*cos(p));
 vec3 ray=normalize(forward+right*v_pos.x*t*u_size.x/u_size.y+up*v_pos.y*t);
 if(ray.y<0.)discard;
 float elevation=max(0.,ray.y);
 vec3 color=mix(u_horizon,u_sky,pow(clamp(elevation*2.8,0.,1.),.55));
 float angle=acos(clamp(dot(ray,u_sun),-1.,1.));
 float disc=1.-smoothstep(.00445,.00485,angle);
 float halo=exp(-angle*30.)*.35+exp(-angle*6.)*.13;
 float lit=step(-.005,u_sun.y);
 color+=u_sunColor*halo*lit;
 color=mix(color,u_sunColor*1.15,disc*lit);
 // Static, subtle stars only in deep twilight; not a constellation chart.
 vec2 starGrid=vec2(atan(ray.x,ray.z),asin(ray.y))*650.;
 vec2 cell=floor(starGrid); float seed=hash(cell);
 float star=(1.-smoothstep(.04,.15,length(fract(starGrid)-.5)))*step(.997,seed);
 color+=vec3(star*(1.-u_day)*.6);
 color+=(hash(gl_FragCoord.xy)-.5)/255.;
 frag=vec4(color,1.);
}`;
function skyLayer(state) {
  let program, buffer, locations;
  const compile = (gl, type, source) => {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {gl.deleteShader(shader); throw Error('Sky shader unavailable');}
    return shader;
  };
  return {
    id: 'solar-atmosphere', type: 'custom', renderingMode: '2d',
    onAdd(map, gl) {
      const vs = compile(gl, gl.VERTEX_SHADER, vertex), fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Sky program unavailable');
      buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      locations = Object.fromEntries(['size','sun','bearing','pitch','day','sky','horizon','sunColor'].map(k => [k, gl.getUniformLocation(program, 'u_' + k)]));
    },
    render(gl) {
      if (!state.current || !program) return;
      const {position} = state.current, color = atmosphere(position.altitude), map = state.map;
      gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const attr = gl.getAttribLocation(program, 'a_pos'); gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
      const rgb = hex => hex.match(/\w\w/g).map(x => parseInt(x,16)/255);
      gl.uniform2f(locations.size, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform3fv(locations.sun, direction(discAltitude(position.altitude), position.azimuth));
      gl.uniform1f(locations.bearing, map.getBearing()*RAD); gl.uniform1f(locations.pitch, map.getPitch()*RAD);
      gl.uniform1f(locations.day, Math.max(0, Math.min(1, (position.altitude + 12) / 6)));
      gl.uniform3fv(locations.sky, rgb(color.sky)); gl.uniform3fv(locations.horizon, rgb(color.horizon)); gl.uniform3fv(locations.sunColor, rgb(color.sun));
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    onRemove(map, gl) {if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program);}
  };
}

export function createSunScene(root) {
  const q = s => root.querySelector(s), stage = q('[data-sun-stage]'), host = q('[data-sun-map]');
  const state = {map: null, current: null, follow: true, cityId: null, ready: false};
  let started = false, visible = false, timer, paintTimer, lastPaint = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = enabled => root.querySelectorAll('.sun-map-tools button').forEach(button => {button.disabled = !enabled;});
  controls(false);
  function fallback(message) {
    controls(false);
    stage.dataset.ready = 'false'; stage.dataset.renderer = 'photo';
    q('[data-sun-mode]').textContent = 'Arhīva fotogrāfija';
    q('[data-sun-render-status]').textContent = message;
    q('[data-sun-retry]').hidden = false;
  }
  function bearingLabel() {
    if (!state.map || !state.current) return;
    const bearing = wrap(state.map.getBearing());
    q('[data-sun-bearing]').textContent = 'Skata virziens: ' + compass(bearing) + ' · ' + Math.round(bearing) + '°';
    const p = state.current.position, canvas = host.getBoundingClientRect();
    const projected = projectSun(discAltitude(p.altitude), p.azimuth, bearing, state.map.getPitch(), canvas.width, canvas.height);
    q('[data-sun-view-status]').textContent = p.altitude < -0.35 ? 'Saule ir zem horizonta' : projected.visible ? '' : 'Saule ir ārpus kadra · ' + Math.round(p.altitude) + '° virs horizonta';
  }
  function paint(force = false) {
    if (!state.current) return;
    const {city, position} = state.current, colors = atmosphere(position.altitude);
    q('[data-sun-city]').textContent = city.name;
    q('[data-sun-coordinates]').textContent = city.lat.toFixed(3) + '° Z · ' + city.lon.toFixed(3) + '° A';
    q('[data-sun-light]').textContent = colors.label;
    if (state.cityId !== city.id) {
      state.cityId = city.id;
      const photo = q('[data-sun-photo]');
      photo.style.opacity = '0';
      photo.onload = () => {if (state.current.city.id === city.id) photo.style.opacity = '1';};
      photo.src = city.photo.src; photo.alt = city.photo.alt;
      if (photo.complete && photo.naturalWidth) photo.style.opacity = '1';
      if (state.map) {
        stage.dataset.ready = 'false';
        q('[data-sun-render-status]').textContent = 'Ielādē ' + city.name + ' karti…';
        clearTimeout(timer);
        timer = setTimeout(() => fallback('Pilsētas karte nav ielādēta. Aprēķini un laika izvēle darbojas.'), 20000);
        state.map.jumpTo({center: [city.lon, city.lat], zoom: 15.8, bearing: state.follow ? position.azimuth : state.map.getBearing(), pitch: 80});
        state.map.once('idle', showReady);
      }
    }
    const map = state.map;
    if (!map || !state.ready || !visible) return;
    clearTimeout(paintTimer);
    if (!force && performance.now() - lastPaint < 90) {
      paintTimer = setTimeout(() => paint(true), 90 - (performance.now() - lastPaint));
      return;
    }
    lastPaint = performance.now();
    if (state.follow) map.jumpTo({bearing: position.azimuth});
    map.setSky({'sky-color': colors.sky, 'horizon-color': colors.horizon, 'sky-horizon-blend': .65});
    map.setLight({anchor: 'map', position: [1.5, position.azimuth, 90 - position.altitude], color: colors.sun, intensity: .25 + colors.daylight * .35}, {duration: 0});
    for (const [id, property, color] of [
      ['ground','background-color',colors.land], ['green','fill-color',colors.green], ['park','fill-color',colors.green],
      ['water','fill-color',colors.water], ['river','line-color',colors.water], ['buildings','fill-extrusion-color',colors.building],
      ['road-edge','line-color',colors.land], ['roads','line-color',colors.building]
    ]) map.setPaintProperty(id, property, color);
    bearingLabel(); map.triggerRepaint();
  }
  function showReady() {
    if (!state.map || !state.ready) return;
    clearTimeout(timer); stage.dataset.ready = 'true'; stage.dataset.renderer = 'maplibre';
    controls(true);
    q('[data-sun-mode]').textContent = '3D pilsētas skats';
    const count = state.map.queryRenderedFeatures({layers: ['buildings']}).length;
    q('[data-sun-render-status]').textContent = count ? 'Īstas ēku kontūras · tuvināti augstumi' : 'Šajā skatā ēku dati ir nepilnīgi';
    q('[data-sun-retry]').hidden = true;
  }
  async function start() {
    if (started || !state.current) return;
    started = true;
    q('[data-sun-retry]').hidden = true;
    q('[data-sun-render-status]').textContent = 'Ielādē pilsētas 3D karti…';
    timer = setTimeout(() => fallback('3D karte nav ielādēta. Aprēķini un laika izvēle darbojas.'), 20000);
    try {
      const lib = await loadLibrary(), {city, position} = state.current;
      state.map = new lib.Map({
        container: host, style: mapStyle(atmosphere(position.altitude)), center: [city.lon, city.lat],
        zoom: 15.8, minZoom: 13, maxZoom: 18, pitch: 80, maxPitch: 85, bearing: position.azimuth,
        attributionControl: {compact: false}, keyboard: false, scrollZoom: false,
        locale: {'NavigationControl.ZoomIn': 'Tuvināt', 'NavigationControl.ZoomOut': 'Attālināt', 'AttributionControl.ToggleAttribution': 'Kartes avoti'},
        touchPitch: false, fadeDuration: 0, pixelRatio: Math.min(devicePixelRatio || 1, 1.5),
        canvasContextAttributes: {antialias: true}, refreshExpiredTiles: true
      });
      state.map.getCanvas().setAttribute('aria-label', 'Pilsētas 3D karte. Skatu var pagriezt ar pogām zem kartes.');
      state.map.addControl(new lib.NavigationControl({showCompass: false}), 'top-right');
      state.map.on('load', () => {
        state.ready = true;
        state.map.addLayer(skyLayer(state), 'green');
        paint(true); showReady();
      });
      state.map.on('move', bearingLabel);
      state.map.on('dragstart', () => {state.follow = false; q('[data-sun-follow]').setAttribute('aria-pressed', 'false');});
      state.map.on('webglcontextlost', () => fallback('3D skats ir apturēts. Aprēķini joprojām ir pieejami.'));
      state.map.on('webglcontextrestored', () => {paint(true); state.map.once('idle', showReady);});
      state.map.on('error', () => {if (stage.dataset.ready !== 'true') q('[data-sun-render-status]').textContent = 'Kartes savienojums kavējas…';});
    } catch {
      clearTimeout(timer); fallback('Šajā pārlūkā 3D karte nav pieejama. Izmanto laika izvēli un augstuma grafiku.');
    }
  }
  q('[data-sun-retry]').addEventListener('click', () => {
    clearTimeout(timer); if (state.map) state.map.remove(); state.map = null; state.ready = false; started = false; start();
  });
  q('[data-sun-follow]').addEventListener('click', () => {
    state.follow = !state.follow; q('[data-sun-follow]').setAttribute('aria-pressed', String(state.follow));
    if (state.follow && state.map) state.map.jumpTo({center: [state.current.city.lon, state.current.city.lat], zoom: 15.8, pitch: 80});
    paint(true);
  });
  root.querySelectorAll('[data-sun-rotate]').forEach(button => button.addEventListener('click', () => {
    if (!state.map) return;
    state.follow = false; q('[data-sun-follow]').setAttribute('aria-pressed', 'false');
    state.map.jumpTo({bearing: state.map.getBearing() + Number(button.dataset.sunRotate)}); paint(true);
  }));
  const resize = new ResizeObserver(() => {state.map?.resize(); bearingLabel();}); resize.observe(host);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) {start(); paint(true);}
  }, {rootMargin: '240px'}); observer.observe(stage);
  document.addEventListener('visibilitychange', () => {if (!document.hidden) paint(true);});
  reduced.addEventListener('change', () => paint(true));
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    clearTimeout(timer); clearTimeout(paintTimer); observer.disconnect(); resize.disconnect(); state.map?.remove();
  }, {once: true});
  return {update(snapshot) {state.current = snapshot; paint(); if (visible) start();}};
}
