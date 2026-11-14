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
uniform float u_bearing,u_elevation,u_fov,u_time,u_seed,u_season;
uniform int u_landscape;
const float PI=3.14159265359;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=noise(p)*a;p=mat2(1.6,-1.2,1.2,1.6)*p+3.7;a*=.5;}return v;}
vec3 sunColor(){return mix(vec3(1.,.28,.065),vec3(1.,.94,.81),smoothstep(-.015,.30,u_sun.y));}
vec3 skyBase(vec3 rd){
 float h=max(rd.y,0.),day=smoothstep(-.15,.16,u_sun.y);
 float facing=pow(max(0.,dot(normalize(vec3(rd.x,.02,rd.z)),normalize(vec3(u_sun.x,.02,u_sun.z)))),5.);
 float dusk=exp(-pow((u_sun.y+.025)/.13,2.));
 vec3 zenith=mix(vec3(.002,.006,.018),vec3(.045,.20,.48),day);
 zenith=mix(zenith,vec3(.11,.095,.24),dusk*.32);
 vec3 horizon=mix(vec3(.018,.025,.05),vec3(.60,.76,.83),day);
 horizon=mix(horizon,vec3(1.05,.36,.12),dusk*(.15+.77*facing));
 vec3 col=mix(horizon,zenith,1.-exp(-h*3.5));
 float a=acos(clamp(dot(rd,u_sun),-1.,1.));
 float mie=.007/(.004+a*a)+.30*exp(-a*5.);
 col+=sunColor()*mie*smoothstep(-.10,.015,u_sun.y)*(.20+dusk*.40);
 return col;
}
vec3 sky(vec3 rd,bool disc){
 vec3 col=skyBase(rd);float day=smoothstep(-.15,.15,u_sun.y);
 // Multi-scale cloud thickness and directional shading give the sky depth.
 if(rd.y>.018){
  vec2 p=rd.xz/(rd.y+.10)*.60+vec2(u_seed,u_time*.003);
  float bulk=fbm(p*.80),detail=noise(p*7.5)*.10;
  float density=smoothstep(.48,.71,bulk-detail);
  float next=fbm(p*.80+normalize(u_sun.xz+vec2(.001))*.19);
  float light=clamp(.44+(bulk-next)*3.8,0.,1.);
  float edge=pow(1.-density,3.)*pow(max(0.,dot(rd,u_sun)),20.);
  vec3 shadow=mix(vec3(.012,.017,.034),vec3(.33,.43,.54),day);
  vec3 lit=mix(vec3(.09,.10,.14),vec3(1.04,1.07,1.03),day);
  float warm=exp(-pow(u_sun.y/.14,2.));lit=mix(lit,sunColor()*1.24,warm*.70);
  vec3 cloud=mix(shadow,lit,light)+sunColor()*edge*.85*day;
  float fade=smoothstep(.018,.14,rd.y)*(1.-smoothstep(.80,1.,rd.y));
  col=mix(col,cloud,density*fade*.76);
  float cirrus=smoothstep(.65,.84,fbm(p*vec2(.36,2.6)+15.));
  col=mix(col,lit,cirrus*.10*fade);
 }
 float night=1.-smoothstep(-.30,-.10,u_sun.y);
 vec2 sp=vec2(atan(rd.x,rd.z),asin(clamp(rd.y,-1.,1.)))*440.;
 float star=(1.-smoothstep(.015,.16,length(fract(sp)-.5)))*step(.9980,hash(floor(sp)));
 col+=vec3(.68,.78,1.)*star*night*smoothstep(.02,.20,rd.y);
 if(disc&&u_sun.y>-.00466){
  float separation=acos(clamp(dot(rd,u_sun),-1.,1.)),edge=max(fwidth(separation),.00013);
  float disk=1.-smoothstep(.004653-edge,.004653+edge,separation);
  col+=sunColor()*disk*16.;
 }
 return col;
}
vec3 forest(vec3 rd,vec3 col){
 float az=atan(rd.x,rd.z),day=smoothstep(-.14,.20,u_sun.y);
 for(int layer=0;layer<4;layer++){
  float z=float(layer),count=150.+z*84.;
  float n=floor((az+u_seed*.017)*count),local=fract((az+u_seed*.017)*count);
  float seed=hash(vec2(n,z+u_seed)),base=-.006-z*.004;
  float ridge=.004*sin(az*11.+u_seed)+.002*sin(az*29.);
  float pine=pow(1.-abs(local-.5)*2.,.8)*( .006+seed*.017);
  float crown=sqrt(max(0.,1.-pow((local-.5)*2.,2.)))*(.007+seed*.012);
  float top=base+ridge+mix(pine,crown,step(.56,seed));
  if(u_landscape==2)top=base+ridge+(top-base-ridge)*2.;
  float aa=max(.0004,fwidth(rd.y));
  float mask=(1.-smoothstep(top-aa,top+aa,rd.y))*smoothstep(base-.004,base,rd.y);
  float side=.5+.5*sin(local*PI);
  float rim=max(0.,sin(az-u_bearing))*max(0.,1.-u_sun.y*3.);
  vec3 trees=mix(vec3(.004,.009,.015),vec3(.025,.085,.057)*( .65+side*.50),day);
  trees+=sunColor()*rim*day*.016*(1.-z*.15);
  trees=mix(trees,skyBase(vec3(rd.x,.035,rd.z)),.65-z*.15);
  col=mix(col,trees,mask);
 }
 return col;
}
vec3 ground(vec3 rd){
 float distance=1.8/max(-rd.y,.00003);vec2 p=rd.xz*distance;
 float day=smoothstep(-.10,.20,u_sun.y),warm=exp(-pow(u_sun.y/.15,2.));
 vec3 fog=skyBase(vec3(rd.x,.018,rd.z)),col;
 if(u_landscape==0){
  vec2 w=p*.24;
  float a=dot(w,vec2(.85,.32))+u_time*.63,b=dot(w,vec2(1.61,-.43))-u_time*.45;
  float fine=sin(dot(w,vec2(3.7,1.1))+u_time*.9);
  float lod=1.-smoothstep(30.,180.,distance);
  vec3 normal=normalize(vec3(cos(a)*.036+cos(b)*.018+fine*.009*lod,1.,cos(a)*.025-cos(b)*.016+fine*.006*lod));
  vec3 reflected=reflect(rd,normal);reflected.y=max(.002,reflected.y);
  float fresnel=.025+.975*pow(1.-max(0.,dot(-rd,normal)),5.);
  vec3 deep=mix(vec3(.003,.009,.016),vec3(.010,.067,.087),day);
  col=mix(deep,sky(normalize(reflected),false),.35+.65*fresnel);
  float spec=pow(max(0.,dot(normalize(reflected),u_sun)),380.);
  col+=sunColor()*spec*(3.5+warm*6.)*smoothstep(-.008,.025,u_sun.y);
  col+=vec3(.008,.015,.018)*(sin(a)+.35*sin(b))*day;
  // Curved near bank, damp sand and foam place the viewer inside the scene.
  float bank=4.3+sin(p.x*.6+u_seed)*.32-length(p*vec2(.43,.78));
  float shore=smoothstep(-.10,.20,bank);
  vec3 sand=mix(vec3(.013,.016,.023),vec3(.22,.19,.13),day);
  sand*=.70+.30*noise(p*23.);sand=mix(sand,sand*.55,1.-smoothstep(0.,.8,bank));
  // Small shaded shore stones give the near bank a readable foreground.
  vec2 cell=floor(p*2.5),stoneUV=fract(p*2.5)-.5;
  float stoneMask=(1.-smoothstep(.14,.23,length(stoneUV)))*step(.79,hash(cell));
  vec3 stoneNormal=normalize(vec3(stoneUV.x*2.,.5,stoneUV.y*2.));
  float stoneLight=.25+.75*max(0.,dot(stoneNormal,u_sun));
  sand=mix(sand,mix(vec3(.008,.012,.019),vec3(.26,.25,.23)*stoneLight,day),stoneMask*smoothstep(.35,1.2,bank));
  col=mix(col,sand,shore);
  float foam=(1.-smoothstep(.025,.14,abs(bank+.08+sin(a)*.035)))*lod;
  col=mix(col,vec3(.48,.54,.53)*(.18+.82*day),foam*.48);
 }else{
  float grassPatch=fbm(p*.16+u_seed),detail=noise(p*13.);
  float winter=max(1.-smoothstep(1.8,3.,u_season),smoothstep(10.5,12.,u_season));
  vec3 grass=mix(vec3(.075,.18,.052),vec3(.19,.145,.063),grassPatch*.7);
  grass=mix(grass,vec3(.67,.73,.73),winter*.82);
  float slopeX=(noise(p*.42+vec2(.1,0))-noise(p*.42-vec2(.1,0)))*.32;
  float slopeZ=(noise(p*.42+vec2(0,.1))-noise(p*.42-vec2(0,.1)))*.32;
  vec3 normal=normalize(vec3(slopeX,1.,slopeZ));
  float light=.24+.70*max(0.,dot(normal,u_sun));
  col=grass*light*(.73+detail*.44);col=mix(vec3(.004,.010,.016),col,day);
  col+=sunColor()*.035*warm*day;
 }
 float haze=1.-exp(-distance*.004);return mix(col,fog,min(.90,haze));
}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 float b=u_bearing,e=u_elevation,t=tan(u_fov*PI/360.);
 vec3 forward=vec3(sin(b)*cos(e),sin(e),cos(b)*cos(e));
 vec3 right=vec3(cos(b),0.,-sin(b)),up=vec3(-sin(b)*sin(e),cos(e),-cos(b)*sin(e));
 vec3 rd=normalize(forward+right*v_uv.x*t*u_size.x/u_size.y+up*v_uv.y*t);
 vec3 col=rd.y>=0.?sky(rd,true):ground(rd);col=forest(rd,col);
 float vignette=1.-.055*pow(length(v_uv*vec2(.65,.8)),2.);
 col=pow(aces(max(col,0.)*1.03),vec3(1./2.2))*vignette;
 col+=(hash(gl_FragCoord.xy)-.5)/255.;fragColor=vec4(col,1.);
}`;

function webglRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {alpha:false,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:true});
  if (!gl) return null;
  let program, buffer, uniforms, attribute, lost=false, checked=false;
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
    uniforms=Object.fromEntries(['size','sun','bearing','elevation','fov','time','seed','season','landscape'].map(k=>[k,gl.getUniformLocation(program,'u_'+k)]));
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
    gl.uniform1f(uniforms.bearing,view.bearing*RAD);gl.uniform1f(uniforms.elevation,view.elevation*RAD);gl.uniform1f(uniforms.fov,view.fov);
    gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.seed,view.seed);gl.uniform1f(uniforms.season,view.season);
    gl.uniform1i(uniforms.landscape,view.landscape);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    // Some drivers accept the program but return only black. Check once, then
    // preserve working controls and scenery with the Canvas fallback.
    if(!checked){
      checked=true;const pixel=new Uint8Array(4);let light=0;
      for(const y of [.45,.7,.9]){gl.readPixels(Math.floor(canvas.width/2),Math.floor(canvas.height*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);light+=pixel[0]+pixel[1]+pixel[2];}
      if(gl.getError()!==gl.NO_ERROR||light===0)throw Error('Solar renderer did not produce a visible frame');
    }
  },destroy(){
    canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestore);
    gl.deleteBuffer(buffer);gl.deleteProgram(program);
  }};
}

// The complete control and astronomy experience still works without WebGL.
function canvasRenderer(canvas) {
  const ctx=canvas.getContext('2d',{alpha:false}),random=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
  return {kind:'canvas2d',draw(view,time=0) {
    const w=canvas.width,h=canvas.height,c=atmosphere(view.altitude);
    const horizon=h*(.5+Math.tan(view.elevation*RAD)/(2*Math.tan(view.fov*RAD/2))),waterline=Math.min(h,horizon);
    const azimuth=Math.atan2(view.sun[0],view.sun[2])/RAD;
    const sun=projectPanorama(view.altitude,azimuth,view,w,h);
    const gradient=ctx.createLinearGradient(0,0,0,horizon);gradient.addColorStop(0,c.sky);gradient.addColorStop(.7,c.horizon);gradient.addColorStop(1,c.horizon);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    if(view.altitude> -8&&sun.x>-w&&sun.x<w*2){
      const glow=ctx.createRadialGradient(sun.x,sun.y,1,sun.x,sun.y,h*.42);glow.addColorStop(0,'#ffdfbabb');glow.addColorStop(.24,'#efa6734a');glow.addColorStop(1,'#ed9d6200');
      ctx.fillStyle=glow;ctx.fillRect(0,0,w,waterline);
    }
    // Direction-bound cloud banks have lit crowns and soft undersides.
    for(let i=0;i<17;i++){
      const n=view.seed+i*17.1,alt=7+random(n)*28,az=random(n+1)*360;
      const p=projectPanorama(alt,az,view,w,h);if(!p.visible)continue;
      const width=h*(.13+random(n+2)*.22),height=width*(.19+random(n+3)*.13);
      const cloud=ctx.createLinearGradient(0,p.y-height,0,p.y+height);cloud.addColorStop(0,c.daylight>.3?'#fff5e1':'#8e91ac');cloud.addColorStop(.5,c.daylight>.3?'#c3cbd0':'#505b72');cloud.addColorStop(1,c.daylight>.3?'#96a7b5':'#303e54');
      ctx.save();ctx.globalAlpha=.20+c.daylight*.35;ctx.fillStyle=cloud;ctx.beginPath();
      for(let puff=0;puff<5;puff++){const x=p.x+(puff-2)*width*.23,y=p.y-Math.sin(puff/4*Math.PI)*height*.4;ctx.ellipse(x,y,width*.30,height*(.55+random(n+puff)*.4),0,0,Math.PI*2);}
      ctx.fill();ctx.restore();
    }
    if(sun.visible){const r=h/(2*Math.tan(view.fov*RAD/2))*.004653;ctx.fillStyle=c.sun;ctx.shadowColor=c.sun;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(sun.x,sun.y,Math.max(1.3,r),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
    const ground=ctx.createLinearGradient(0,waterline,0,h);ground.addColorStop(0,c.horizon);ground.addColorStop(.22,view.landscape===0?c.water:c.green);ground.addColorStop(1,view.landscape===0?'#18313d':c.land);ctx.fillStyle=ground;ctx.fillRect(0,waterline,w,h-waterline);
    if(view.landscape===0){
      for(let y=waterline+2;y<h;y+=1+(y-waterline)/h*6){
        const depth=(y-waterline)/Math.max(1,h-waterline),wave=Math.sin(y*.22+time*.45+view.seed);
        ctx.strokeStyle=c.daylight>.5?'#c5dde029':'#65718324';ctx.lineWidth=.5+depth*.8;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.3,y+wave*depth*3,w*.7,y-wave*depth*3,w,y);ctx.stroke();
        if(view.altitude>-.3&&sun.x>-w*.2&&sun.x<w*1.2){
          const spread=8+depth*depth*w*.11,start=sun.x-spread*(.25+random(y)*.75)+wave*depth*15;
          ctx.globalAlpha=(.12+random(y+time*.04)*.28)*(1-depth*.4)*Math.max(0,1-view.altitude/55);ctx.strokeStyle=c.sun;ctx.lineWidth=1+depth*2;ctx.beginPath();ctx.moveTo(start,y);ctx.lineTo(start+spread*(.6+random(y+1)*.9),y);ctx.stroke();ctx.globalAlpha=1;
        }
      }
    }
    // Atmospheric perspective separates the far tree line from its reflection.
    for(let layer=0;layer<3;layer++){
      ctx.save();ctx.fillStyle=layer===0?c.horizon:layer===1?c.land:c.green;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(0,horizon+4+layer*3);
      for(let x=0;x<=w;x+=2){const v=(x+w*view.bearing/360)*.06+view.seed;const ridge=2+Math.sin(v*.12)*2+random(Math.floor(v))*(layer===2?10:5);ctx.lineTo(x,horizon+layer*3-ridge*(view.landscape===2?2:1));}
      ctx.lineTo(w,horizon+10+layer*3);ctx.lineTo(0,horizon+10+layer*3);ctx.fill();ctx.restore();
    }
    const vignette=ctx.createRadialGradient(w*.5,h*.4,h*.1,w*.5,h*.4,Math.max(w,h)*.75);vignette.addColorStop(0,'#10162200');vignette.addColorStop(1,'#07101b40');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  },destroy(){}};
}

// Keep the backing buffer bounded. CSS still fills the viewport at every size.
// Resize measurements are cached; playback does not force a layout per frame.
export function createSolarPanorama(element) {
  let canvas=element,renderer,width=1,height=1,scale=1,lastView,lastTime=0;
  let drawCount=0,slowFrames=0,lastDrawAt=0,disposed=false;
  const resize=()=>{
    const rect=canvas.getBoundingClientRect();
    const budget=(innerWidth<700?280000:520000)*scale;
    const ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(budget/Math.max(1,rect.width*rect.height)));
    width=Math.max(1,Math.round(rect.width*ratio));height=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  };
  const useFallback=()=>{
    renderer?.destroy();
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
    renderer=canvasRenderer(canvas);canvas.dataset.engine=renderer.kind;resize();
    if(lastView)renderer.draw(lastView,lastTime);
  };
  try {renderer=webglRenderer(canvas);} catch(error) {console.warn('Solar panorama fallback:',error.message);}
  if(!renderer)useFallback();
  canvas.dataset.engine=renderer.kind;resize();
  const observer=new ResizeObserver(resize);observer.observe(element.parentElement);
  const contextLost=event=>{event.preventDefault();if(!disposed)useFallback();};
  canvas.addEventListener('webglcontextlost',contextLost,{once:true});
  return {kind:renderer.kind,get canvas(){return canvas;},draw(view,time=0){
    if(disposed)return;
    const now=performance.now();lastView=view;lastTime=time;
    // A congested GPU gets a smaller render target rather than an ever-growing queue.
    if(lastDrawAt&&now-lastDrawAt>85&&now-lastDrawAt<400)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>=8&&scale>.40){scale=Math.max(.40,scale*.75);slowFrames=0;resize();}
    lastDrawAt=now;
    try{renderer.draw(view,time);}catch(error){useFallback();}
    canvas.dataset.frames=String(++drawCount);
  },destroy(){disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);renderer.destroy();}};
}
