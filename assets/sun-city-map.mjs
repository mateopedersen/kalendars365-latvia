const revision = new URL(import.meta.url).searchParams.get('v') || '';
const {atmosphere, compass, discAltitude, direction, projectSun, wrap, RAD} = await import(new URL('./sun-scene-core.mjs?v=' + encodeURIComponent(revision), import.meta.url));

// MapLibre and its worker are pinned, checksum-verified, and served locally.
// Only public map tiles are requested from OpenFreeMap; no visitor GPS is used.
const library = './vendor/maplibre-6.17.0/';
let mapLibrary;
export function loadLibrary() {
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
export function skyLayer(state) {
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
