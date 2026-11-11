import {atmosphere, RAD} from './sun-scene-core.mjs';
import {projectPanorama} from './solar-panorama-core.mjs';

// Original, procedural landscape. It illustrates light, not local terrain/weather.
const vertex = `#version 300 es
in vec2 a_position;out vec2 v_uv;
void main(){v_uv=a_position;gl_Position=vec4(a_position,0.,1.);}`;
export const panoramaFragment = `#version 300 es
precision highp float;
in vec2 v_uv;out vec4 fragColor;
uniform vec2 u_size;
uniform vec3 u_sun;
uniform float u_bearing,u_elevation,u_time,u_seed,u_season;
uniform int u_landscape;
const float PI=3.14159265359;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
float fbm(vec2 p){
 float value=0.,weight=.5;
 for(int i=0;i<4;i++){value+=noise(p)*weight;p=mat2(1.6,-1.2,1.2,1.6)*p+3.7;weight*=.5;}
 return value;
}
vec3 sunColor(){return mix(vec3(1.,.22,.035),vec3(1.,.91,.72),smoothstep(-.015,.22,u_sun.y));}
vec3 sky(vec3 rd,bool disc){
 float h=max(rd.y,0.);
 float day=smoothstep(-.15,.13,u_sun.y),night=1.-smoothstep(-.30,-.12,u_sun.y);
 float facing=pow(max(0.,dot(normalize(vec3(rd.x,.04,rd.z)),normalize(vec3(u_sun.x,.04,u_sun.z)))),8.);
 float dusk=exp(-pow((u_sun.y+.025)/.15,2.));
 vec3 zenith=mix(vec3(.003,.008,.024),vec3(.065,.21,.49),day);
 zenith=mix(zenith,vec3(.07,.08,.22),dusk*.4);
 vec3 horizon=mix(vec3(.025,.033,.065),vec3(.57,.72,.80),day);
 horizon=mix(horizon,vec3(.85,.25,.075),dusk*(.3+facing*.7));
 vec3 col=mix(horizon,zenith,1.-exp(-h*3.1));
 float separation=acos(clamp(dot(rd,u_sun),-1.,1.));
 float glow=(.055/(.045+separation*separation)+.23*exp(-separation*3.8));
 float light=smoothstep(-.11,.02,u_sun.y);
 col+=sunColor()*glow*light*(.20+dusk*.45);
 // Thin, distant wisps; fixed scene texture, never presented as a weather feed.
 vec2 cp=rd.xz/(max(rd.y,.04))*.65+vec2(u_seed,2.);
 float cirrus=smoothstep(.60,.79,fbm(cp*vec2(.75,2.9)));
 cirrus*=smoothstep(.035,.22,rd.y)*(1.-smoothstep(.68,.95,rd.y));
 vec3 cloud=mix(vec3(.035,.04,.075),vec3(.8,.86,.87),day);
 cloud=mix(cloud,vec3(1.1,.43,.19),dusk*facing*.75);
 col=mix(col,cloud,cirrus*.36*(.25+.75*day));
 // Direction-bound, static stars. These are decorative, not a star catalogue.
 vec2 sp=vec2(atan(rd.x,rd.z),asin(clamp(rd.y,-1.,1.)))*430.;
 vec2 cell=floor(sp);float seed=hash(cell);
 float star=(1.-smoothstep(.015,.17,length(fract(sp)-.5)))*step(.9978,seed);
 col+=vec3(.68,.78,1.)*star*night*smoothstep(.03,.2,rd.y);
 if(disc && u_sun.y>-.00466){
  float edge=max(fwidth(separation),.00015);
  float solarDisc=1.-smoothstep(.004653-edge,.004653+edge,separation);
  col+=sunColor()*solarDisc*14.;
 }
 return col;
}
vec3 forest(vec3 rd,vec3 col){
 float az=atan(rd.x,rd.z);
 float daytime=smoothstep(-.13,.22,u_sun.y);
 for(int layer=0;layer<3;layer++){
  float depth=float(layer),density=180.+depth*55.;
  float cell=floor((az+u_seed*.013)*density);
  float local=abs(fract((az+u_seed*.013)*density)-.5)*2.;
  float height=.007+noise(vec2(cell*.19,depth+u_seed))*.012;
  height+=(1.-local)*(.005+hash(vec2(cell,depth))*.013);
  height*=u_landscape==2?1.9:1.;
  float base=-.003-depth*.005;
  float silhouette=(1.-smoothstep(base+height-.001,base+height+.001,rd.y))*smoothstep(base-.002,base+.001,rd.y);
  vec3 trees=mix(vec3(.006,.012,.022),vec3(.06,.12,.105),daytime);
  trees=mix(trees,sky(vec3(rd.x,.035,rd.z),false),.55-depth*.17);
  col=mix(col,trees,silhouette);
 }
 return col;
}
vec3 ground(vec3 rd){
 float distance=3.5/max(-rd.y,.00001);
 vec2 p=rd.xz*distance;
 float day=smoothstep(-.10,.20,u_sun.y);
 float warm=exp(-pow(u_sun.y/.18,2.));
 vec3 fog=sky(vec3(rd.x,.025,rd.z),false);
 bool water=u_landscape==0;
 vec3 col;
 if(water){
  vec2 w=p*.12;
  float wave=sin(w.x*.9+w.y*.54+u_time*.6)*.35+sin(w.x*1.7-w.y*.23-u_time*.42)*.18;
  float nx=cos(w.x*.9+w.y*.54+u_time*.6)*.032+cos(w.x*1.7-w.y*.23-u_time*.42)*.015;
  float nz=cos(w.x*.9+w.y*.54+u_time*.6)*.026-cos(w.x*1.7-w.y*.23-u_time*.42)*.012;
  float detail=(noise(w*3.+u_time*.07)-.5)*.026;
  vec3 n=normalize(vec3(nx+detail,1.,nz+detail));
  vec3 reflection=reflect(rd,n);
  reflection.y=max(.005,reflection.y);
  float fresnel=.055+.945*pow(1.-max(0.,dot(-rd,n)),5.);
  vec3 deep=mix(vec3(.004,.012,.02),vec3(.014,.095,.12),day);
  col=mix(deep,sky(normalize(reflection),false),.32+.68*fresnel);
  float spec=pow(max(0.,dot(normalize(reflection),u_sun)),320.);
  col+=sunColor()*spec*(3.+warm*5.)*smoothstep(-.012,.025,u_sun.y);
  col+=vec3(.018,.027,.03)*wave*day;
  // A close shoreline gives scale and perspective without inventing local geometry.
  float bank=1.-smoothstep(4.2,5.1,length(p));
  vec3 sand=mix(vec3(.016,.016,.025),vec3(.22,.19,.13),day);
  sand*=.78+noise(p*16.)*.32;
  col=mix(col,sand,bank);
 }else{
  float grain=fbm(p*.18+u_seed),fine=noise(p*5.);
  float winter=1.-smoothstep(0.,2.,min(abs(u_season-1.),abs(u_season-13.)));
  vec3 grass=mix(vec3(.09,.17,.065),vec3(.18,.14,.08),winter*.75);
  grass=mix(grass,vec3(.19,.14,.065),grain*.5);
  float light=.20+max(0.,u_sun.y)*.7;
  col=grass*light*(.75+fine*.4);
  col=mix(vec3(.005,.012,.018),col,day);
  col+=sunColor()*.018*warm*day;
 }
 float haze=1.-exp(-distance*.0035);
 return mix(col,fog,min(.88,haze));
}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 float b=u_bearing,e=u_elevation,t=tan(72.*PI/360.);
 vec3 forward=vec3(sin(b)*cos(e),sin(e),cos(b)*cos(e));
 vec3 right=vec3(cos(b),0.,-sin(b));
 vec3 up=vec3(-sin(b)*sin(e),cos(e),-cos(b)*sin(e));
 vec3 rd=normalize(forward+right*v_uv.x*t*u_size.x/u_size.y+up*v_uv.y*t);
 vec3 col=rd.y>=0.?sky(rd,true):ground(rd);
 col=forest(rd,col);
 float vignette=1.-.12*pow(length(v_uv*vec2(.65,.8)),2.);
 col=pow(aces(max(col,0.)*1.05),vec3(1./2.2))*vignette;
 col+=(hash(gl_FragCoord.xy)-.5)/255.;
 fragColor=vec4(col,1.);
}`;

function webglRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {alpha:false,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:true});
  if (!gl) return null;
  let program, buffer, uniforms, attribute, lost=false;
  function setup() {
    const compile = (type, source) => {
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(message);
      }
      return shader;
    };
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,panoramaFragment);
    program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    attribute=gl.getAttribLocation(program,'a_position');
    uniforms=Object.fromEntries(['size','sun','bearing','elevation','time','seed','season','landscape'].map(k=>[k,gl.getUniformLocation(program,'u_'+k)]));
  }
  setup();
  const onLost=event=>{event.preventDefault();lost=true;};
  const onRestore=()=>{setup();lost=false;};
  canvas.addEventListener('webglcontextlost',onLost);
  canvas.addEventListener('webglcontextrestored',onRestore);
  return {kind:'webgl2',draw(view,time) {
    if(lost)return;
    gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    gl.uniform2f(uniforms.size,canvas.width,canvas.height);gl.uniform3fv(uniforms.sun,view.sun);
    gl.uniform1f(uniforms.bearing,view.bearing*RAD);gl.uniform1f(uniforms.elevation,view.elevation*RAD);
    gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.seed,view.seed);gl.uniform1f(uniforms.season,view.season);
    gl.uniform1i(uniforms.landscape,view.landscape);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  },destroy(){
    canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestore);
    gl.deleteBuffer(buffer);gl.deleteProgram(program);
  }};
}

// The complete control and astronomy experience still works without WebGL.
function canvasRenderer(canvas) {
  const ctx=canvas.getContext('2d',{alpha:false});
  return {kind:'canvas2d',draw(view) {
    const w=canvas.width,h=canvas.height,c=atmosphere(view.altitude);
    const horizon=h*(.5+Math.tan(view.elevation*RAD)/(2*Math.tan(view.fov*RAD/2)));
    const sun=projectPanorama(view.altitude,Math.atan2(view.sun[0],view.sun[2])/RAD,view,w,h);
    const gradient=ctx.createLinearGradient(0,0,0,horizon);
    gradient.addColorStop(0,c.sky);gradient.addColorStop(.8,c.horizon);gradient.addColorStop(1,c.horizon);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    if(view.altitude> -6 && sun.x>-w && sun.x<w*2){
      const glow=ctx.createRadialGradient(sun.x,sun.y,1,sun.x,sun.y,h*.30);
      glow.addColorStop(0,'#ffdcadbb');glow.addColorStop(.3,'#ed9d6255');glow.addColorStop(1,'#ed9d6200');
      ctx.fillStyle=glow;ctx.fillRect(0,0,w,Math.min(h,horizon));
      if(sun.visible){ctx.fillStyle=c.sun;ctx.beginPath();ctx.arc(sun.x,sun.y,Math.max(2,h*.0035),0,Math.PI*2);ctx.fill();}
    }
    const ground=ctx.createLinearGradient(0,horizon,0,h);
    ground.addColorStop(0,c.horizon);ground.addColorStop(1,view.landscape===0?c.water:c.green);
    ctx.fillStyle=ground;ctx.fillRect(0,horizon,w,h-horizon);
    for(let layer=0;layer<3;layer++){
      ctx.fillStyle=layer===0?c.land:layer===1?c.green:'#172b2c';
      ctx.globalAlpha=.35+layer*.16;ctx.beginPath();ctx.moveTo(0,horizon+9*layer);
      for(let x=0;x<=w;x+=3)ctx.lineTo(x,horizon+9*layer-(3+Math.sin(x*.04+view.seed)*2+Math.sin(x*.27)*4)*(1+layer*.35));
      ctx.lineTo(w,horizon+15+9*layer);ctx.lineTo(0,horizon+15+9*layer);ctx.fill();
    }
    ctx.globalAlpha=1;
  },destroy(){}};
}

export function createSolarPanorama(element) {
  let canvas=element,renderer;
  try {renderer=webglRenderer(canvas);} catch(error) {console.warn('Solar panorama fallback:',error.message);renderer=null;}
  if(!renderer){
    // A canvas cannot change context type after a failed shader compilation.
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
    renderer=canvasRenderer(canvas);
  }
  canvas.dataset.engine=renderer.kind;
  return {kind:renderer.kind,canvas,draw(view,time=0){
    const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1050000/Math.max(1,rect.width*rect.height)));
    const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    renderer.draw(view,time);
  },destroy:()=>renderer.destroy()};
}
