// Small on-demand renderer for the original solid zodiac sculptures.
// No animation loop runs while idle, closed, hidden or in reduced-motion mode.
const vertex=`attribute vec3 position;attribute vec3 normal;attribute vec3 color;uniform mat3 rotation;uniform float aspect;uniform float zoom;varying vec3 vNormal;varying vec3 vColor;varying vec3 vPoint;void main(){vec3 p=rotation*position;vPoint=p;vNormal=rotation*normal;vColor=color;gl_Position=vec4(p.x/(aspect*1.05)*zoom,p.y/1.05*zoom,-p.z/5.,1.);}`;
const fragment=`precision mediump float;varying vec3 vNormal;varying vec3 vColor;varying vec3 vPoint;void main(){vec3 n=normalize(vNormal);vec3 L=normalize(vec3(-.65,.85,1.3));vec3 H=normalize(L+vec3(0.,0.,1.));float diffuse=max(dot(n,L),0.);float rim=pow(1.-abs(n.z),3.);float spec=pow(max(dot(n,H),0.),46.);vec3 base=pow(vColor,vec3(2.2));vec3 col=base*(.35+.75*diffuse)+vec3(.84,.73,.55)*spec*.7+vec3(.14,.18,.21)*rim*.3;gl_FragColor=vec4(pow(col,vec3(1./2.2)),1.);}`;
export function createSculptureViewer(canvas,onError){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 if(!gl)throw Error('WebGL unavailable');
 const compile=(type,code)=>{const shader=gl.createShader(type);gl.shaderSource(shader,code);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw Error('3D shader failed');}return shader;};
 const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('3D program failed');
 const buffer=gl.createBuffer();let count=0,yaw=-.20,pitch=.10,zoom=1,frame=0,playing=false,visible=true,previous=0,down=null;
 const uniforms=Object.fromEntries(['rotation','aspect','zoom'].map(name=>[name,gl.getUniformLocation(program,name)]));
 function draw(){if(!count||gl.isContextLost())return;const dpr=Math.min(devicePixelRatio||1,2),rect=canvas.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,offset]of [['position',0],['normal',12],['color',24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,offset);}
  const c=Math.cos(yaw),s=Math.sin(yaw),C=Math.cos(pitch),S=Math.sin(pitch);gl.uniformMatrix3fv(uniforms.rotation,false,new Float32Array([c,s*S,-s*C,0,C,S,s,-c*S,c*C]));gl.uniform1f(uniforms.aspect,width/height);gl.uniform1f(uniforms.zoom,zoom);gl.drawArrays(gl.TRIANGLES,0,count);
 }
 function animate(time){frame=0;if(!playing||!visible||document.hidden)return;if(previous)yaw+=Math.min(40,time-previous)*.00028;previous=time;draw();frame=requestAnimationFrame(animate);}
 function play(value){playing=!!value;previous=0;cancelAnimationFrame(frame);frame=0;if(playing&&visible&&!document.hidden)frame=requestAnimationFrame(animate);}
 const observer=new ResizeObserver(()=>{if(visible)draw();});observer.observe(canvas);
 canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;down={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');});
 canvas.addEventListener('pointermove',event=>{if(!down||event.pointerId!==down.id)return;const dx=event.clientX-down.x,dy=event.clientY-down.y;yaw+=dx*.012;pitch=Math.max(-1.15,Math.min(1.15,pitch+dy*.009));down.x=event.clientX;down.y=event.clientY;draw();});
 const end=()=>{down=null;canvas.classList.remove('is-dragging');};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
 canvas.addEventListener('keydown',event=>{const actions={ArrowLeft:()=>yaw-=.2,ArrowRight:()=>yaw+=.2,ArrowUp:()=>pitch=Math.max(-1.15,pitch-.15),ArrowDown:()=>pitch=Math.min(1.15,pitch+.15),Home:()=>reset()};if(actions[event.key]){event.preventDefault();actions[event.key]();draw();}});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();play(false);onError();});
 canvas.addEventListener('webglcontextrestored',()=>onError());
 document.addEventListener('visibilitychange',()=>{previous=0;cancelAnimationFrame(frame);if(playing&&visible&&!document.hidden)frame=requestAnimationFrame(animate);});
 function reset(){yaw=-.20;pitch=.10;zoom=1;draw();}
 return {setModel(bytes){const values=new Float32Array(bytes);if(values.length===0||values.length%27||values.some(v=>!Number.isFinite(v)))throw Error('Invalid 3D geometry');count=values.length/9;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);reset();},rotate(delta){yaw+=delta;draw();},zoom(value){zoom=Math.max(.65,Math.min(1.35,Number(value)));draw();},reset,play,setVisible(value){visible=!!value;if(!visible){cancelAnimationFrame(frame);frame=0;}else{draw();if(playing)play(true);}},ready(){return count>0&&!gl.isContextLost();}};
}
