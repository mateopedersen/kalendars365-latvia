import fs from 'node:fs';
const labels={calendar:'Kalendārs',sun:'Saules laiki',moon:'Mēness fāzes',garden:'Sējas kalendārs',zodiac:'Zodiaks',school:'Mācību gads',work:'Darba dienas',holiday:'Latvijas svētki',memorial:'Atceres dienas',culture:'Latvijas kultūra',astronomy:'Astronomija',city:'Latvijas pilsētas',names:'Vārda dienas',print:'Drukājams kalendārs',week:'Nedēļas plānotājs',family:'Ģimenes kalendārs',tools:'Plānošanas rīki',privacy:'Privātums',about:'Par projektu'};
const C={wine:'#922b48',gold:'#ddb66b',paper:'#f2e9d9',green:'#417d63',navy:'#344b65',dark:'#283341',terra:'#b77051'};
let faces=[],primitiveCounter=0,activePrimitive=0;
function primitive(fn){const prior=activePrimitive;activePrimitive=++primitiveCounter;try{return fn();}finally{activePrimitive=prior;}}
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{let l=Math.hypot(...a)||1;return a.map(x=>x/l)};
function camera([x,y,z]){const a=-.48,b=.32;const X=x*Math.cos(a)+z*Math.sin(a),Z=-x*Math.sin(a)+z*Math.cos(a);return [X,y*Math.cos(b)-Z*Math.sin(b),y*Math.sin(b)+Z*Math.cos(b)];}
function face(v,color,n){faces.push({v,color,group:activePrimitive||++primitiveCounter,n:n||unit(cross(sub(v[1],v[0]),sub(v[2],v[0])))});}
function boxMesh(x,y,z,w,h,d,c){let p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>[x+a*w/2,y+b*h/2,z+e*d/2]);for(const ids of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]])face(ids.map(i=>p[i]),c);}
function bevelBoxMesh(x,y,z,w,h,d,r,c){
 const dims=[w/2,h/2,d/2];r=Math.min(r,...dims.map(n=>n*.45));
 const emit=v=>{let n=unit(cross(sub(v[1],v[0]),sub(v[2],v[0]))),mid=v.reduce((a,p)=>a.map((q,k)=>q+p[k]/v.length),[0,0,0]);if(n.reduce((a,q,k)=>a+q*mid[k],0)<0)v.reverse();face(v.map(p=>[p[0]+x,p[1]+y,p[2]+z]),c);};
 for(let axis=0;axis<3;axis++)for(let sign of [-1,1]){let b=(axis+1)%3,e=(axis+2)%3;emit([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{let p=[0,0,0];p[axis]=sign*dims[axis];p[b]=u*(dims[b]-r);p[e]=v*(dims[e]-r);return p;}));}
 for(let axis=0;axis<3;axis++)for(let u of [-1,1])for(let v of [-1,1]){let b=(axis+1)%3,e=(axis+2)%3;emit([[-1,0],[1,0],[1,1],[-1,1]].map(([a,t])=>{let p=[0,0,0];p[axis]=a*(dims[axis]-r);p[b]=u*(dims[b]-(t?r:0));p[e]=v*(dims[e]-(t?0:r));return p;}));}
 for(let a of [-1,1])for(let b of [-1,1])for(let e of [-1,1])emit([[a*dims[0],b*(dims[1]-r),e*(dims[2]-r)],[a*(dims[0]-r),b*dims[1],e*(dims[2]-r)],[a*(dims[0]-r),b*(dims[1]-r),e*dims[2]]]);
}
function discMesh(x,y,z,r,d,c){
 const n=64;face(Array.from({length:n},(_,i)=>[x+r*Math.cos(i*2*Math.PI/n),y+r*Math.sin(i*2*Math.PI/n),z+d/2]),c,[0,0,1]);for(let i=0;i<n;i++){let a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;face([[x+r*Math.cos(a),y+r*Math.sin(a),z-d/2],[x+r*Math.cos(b),y+r*Math.sin(b),z-d/2],[x+r*Math.cos(b),y+r*Math.sin(b),z+d/2],[x+r*Math.cos(a),y+r*Math.sin(a),z+d/2]],c,[Math.cos((a+b)/2),Math.sin((a+b)/2),0]);}
}
function coneMesh(x,y,z,r0,r1,h,c){for(let i=0;i<64;i++){let a=i*Math.PI/32,b=(i+1)*Math.PI/32;face([[x+r0*Math.cos(a),y-h/2,z+r0*Math.sin(a)],[x+r1*Math.cos(a),y+h/2,z+r1*Math.sin(a)],[x+r1*Math.cos(b),y+h/2,z+r1*Math.sin(b)],[x+r0*Math.cos(b),y-h/2,z+r0*Math.sin(b)]],c,unit([Math.cos((a+b)/2),(r0-r1)/h,Math.sin((a+b)/2)]));}}
function petalMesh(x,y,z,len,width,angle,c,lobes=0){
 const point=(u,v)=>{const w=width*Math.sin(Math.PI*u)*(1+lobes*Math.cos(8*Math.PI*u)),a=len*u,b=w*v;return [x+Math.cos(angle)*a-Math.sin(angle)*b,y+Math.sin(angle)*a+Math.cos(angle)*b,z+.13*Math.sin(Math.PI*u)*(1-v*v)+.05*u*u];};
 for(let j=0;j<20;j++)for(let k=0;k<6;k++){let u=j/20,v=-1+k/3;face([point(u,v),point(u+.05,v),point(u+.05,v+1/3),point(u,v+1/3)],c);}
}
function bowRibbonMesh(points,width,c,twist=1){
 const pos=t=>points[0].map((v,k)=>v*(1-t)**3+3*points[1][k]*(1-t)**2*t+3*points[2][k]*(1-t)*t*t+points[3][k]*t**3);
 const edge=(t,v)=>{const p=pos(t),a=twist*(t-.5)*Math.PI,dir=unit([.12*Math.sin(a),Math.sin(a),Math.cos(a)]);return p.map((n,k)=>n+dir[k]*width*v);};
 for(let j=0;j<72;j++){let a=j/72,b=(j+1)/72,v=[edge(a,-1),edge(b,-1),edge(b,1),edge(a,1)];face(v,c);face([...v].reverse(),c);}
}
function paintedBand(x,y,z,rx,ry,rz,theta,c){primitive(()=>{for(let i=0;i<80;i++){let a=i*Math.PI/40,b=(i+1)*Math.PI/40;const pt=(t,f)=>[x+rx*Math.sin(t)*Math.cos(f),y+ry*Math.cos(t),z+rz*Math.sin(t)*Math.sin(f)];let t0=theta-.055,t1=theta+.055,v=[pt(t0,a),pt(t0,b),pt(t1,b),pt(t1,a)],mid=(a+b)/2;face(v,c,unit([Math.sin(theta)*Math.cos(mid)/rx,Math.cos(theta)/ry,Math.sin(theta)*Math.sin(mid)/rz]));}});}
function grain(x,y,z,side){const first=faces.length;sphere(x,y,z,.075,.16,.065,'#d9ad60');const angle=-side*.48,co=Math.cos(angle),si=Math.sin(angle);for(const f of faces.slice(first)){f.v=f.v.map(p=>{let a=p[0]-x,b=p[1]-y;return [x+a*co-b*si,y+a*si+b*co,p[2]];});f.n=[f.n[0]*co-f.n[1]*si,f.n[0]*si+f.n[1]*co,f.n[2]];}}
function candle(x,y,z,w,h){cone(x,y,z,w,w,h,C.paper);cone(x,y+.1,z,w*1.008,w*1.008,.16,C.wine);primitive(()=>{for(let i=0;i<64;i++){let a=i*Math.PI/32,b=(i+1)*Math.PI/32;face([[x,y+h/2,z],[x+w*Math.cos(a),y+h/2,z+w*Math.sin(a)],[x+w*Math.cos(b),y+h/2,z+w*Math.sin(b)]],C.paper,[0,1,0]);}});box(x,y+h/2+.055,z,.025,.11,.025,C.dark);for(let j=0;j<20;j++){let a=j/20,b=(j+1)/20;for(let i=0;i<32;i++){let u=i*Math.PI/16,v=(i+1)*Math.PI/16;const point=(t,f)=>[x+.10*Math.sin(Math.PI*t)*Math.cos(f)+.05*(1-t),y+h/2+.09+.41*(1-t),z+.075*Math.sin(Math.PI*t)*Math.sin(f)];let poly=[point(a,u),point(b,u),point(b,v),point(a,v)];face(poly,C.gold,unit([Math.cos((u+v)/2),.2,Math.sin((u+v)/2)]));}}}
function clock(x,y,z,r,hour,minute){disc(x,y,z,r,.16,C.navy);disc(x,y,z+.1,r*.9,.04,C.paper);for(let i=0;i<60;i++){let a=i*Math.PI/30,len=i%5? .045:.10;tube([[x+Math.sin(a)*r*.78,y+Math.cos(a)*r*.78,z+.135],[x+Math.sin(a)*r*(.78-len),y+Math.cos(a)*r*(.78-len),z+.135]],r*.012,i%5?'#958c7f':C.dark);}let a=(hour%12+minute/60)*Math.PI/6,b=minute*Math.PI/30;tube([[x,y,z+.17],[x+Math.sin(a)*r*.46,y+Math.cos(a)*r*.46,z+.17]],r*.035,C.dark);tube([[x,y,z+.19],[x+Math.sin(b)*r*.66,y+Math.cos(b)*r*.66,z+.19]],r*.022,C.wine);sphere(x,y,z+.21,r*.06,r*.06,r*.035,C.gold);}
function sphereMesh(x,y,z,rx,ry,rz,c){const pixels=Math.max(rx,ry,rz)*90,rows=Math.min(32,Math.max(8,Math.ceil(Math.sqrt(pixels)*3.4))),cols=rows*2;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let p=[];for(const [a,b] of [[j,i],[j,i+1],[j+1,i+1],[j+1,i]]){let t=a*Math.PI/rows,f=b*Math.PI*2/cols;p.push([x+rx*Math.sin(t)*Math.cos(f),y+ry*Math.cos(t),z+rz*Math.sin(t)*Math.sin(f)]);}let m=p.reduce((a,v)=>a.map((n,k)=>n+v[k]/4),[0,0,0]);face(p,c,unit([(m[0]-x)/(rx*rx),(m[1]-y)/(ry*ry),(m[2]-z)/(rz*rz)]));}}
function tubeMesh(points,r,c){for(let i=1;i<points.length;i++){let a=points[i-1],b=points[i],axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);for(let j=0;j<20;j++){let f=j*Math.PI/10,g=(j+1)*Math.PI/10;let normal=unit(u.map((x,k)=>x*Math.cos((f+g)/2)+v[k]*Math.sin((f+g)/2)));face([[a,f],[b,f],[b,g],[a,g]].map(([p,t])=>p.map((x,k)=>x+r*(u[k]*Math.cos(t)+v[k]*Math.sin(t)))),c,normal);}}for(const [p,near,sign] of [[points[0],points[1],-1],[points.at(-1),points.at(-2),1]]){let axis=unit(sub(p,near)),u=unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);face(Array.from({length:20},(_,i)=>{let a=i*Math.PI/10;return p.map((n,k)=>n+r*(Math.cos(a)*u[k]+Math.sin(a)*v[k]));}),c,axis);}}
function ringMesh(x,y,z,r,t,c){for(let i=0;i<64;i++){let a=i*Math.PI/32,b=(i+1)*Math.PI/32;const pts=[];for(let k=0;k<10;k++){let u=k*Math.PI/5,v=(k+1)*Math.PI/5;face([[a,u],[b,u],[b,v],[a,v]].map(([f,q])=>[x+(r+t*Math.cos(q))*Math.cos(f),y+(r+t*Math.cos(q))*Math.sin(f),z+t*Math.sin(q)]),c,unit([Math.cos((a+b)/2)*Math.cos((u+v)/2),Math.sin((a+b)/2)*Math.cos((u+v)/2),Math.sin((u+v)/2)]));}}}
function book(x=0,y=0,z=0){box(x,y,z,1.65,1.85,.4,C.wine);box(x+.06,y+.02,z+.1,1.48,1.69,.3,C.paper);box(x-.73,y,z+.16,.13,1.85,.12,C.gold);for(let i=0;i<5;i++)box(x+.05,y+.5-i*.23,z+.265,.98,.025,.015,'#baa993');}
function calendar(week=false){box(0,0,0,1.95,1.85,.3,C.paper);box(0,.62,.19,1.95,.57,.12,C.wine);for(let x of [-.58,.58])ring(x,.93,.14,.12,.037,C.gold);for(let j=0;j<3;j++)for(let i=0;i<4;i++)box(-.64+i*.43,.18-j*.37,.19,.25,.19,.05,week&&i===1?C.gold:(i===3?C.wine:'#b8b7ad'));}
function leaf(x,y,z,side=1){petal(x-side*.36,y-.07,z,.82,.19,side===1?.17:Math.PI-.17,C.green);tube([[x-side*.33,y-.06,z+.015],[x,y+.03,z+.13],[x+side*.35,y+.07,z+.07]],.012,'#9bb885');}
function box(...args){return primitive(()=>boxMesh(...args));}
function sphere(...args){return primitive(()=>sphereMesh(...args));}
function tube(...args){return primitive(()=>tubeMesh(...args));}
function ring(...args){return primitive(()=>ringMesh(...args));}
function bevelBox(...args){return primitive(()=>bevelBoxMesh(...args));}
function disc(...args){return primitive(()=>discMesh(...args));}
function cone(...args){return primitive(()=>coneMesh(...args));}
function petal(...args){return primitive(()=>petalMesh(...args));}
function bowRibbon(...args){return primitive(()=>bowRibbonMesh(...args));}
function openBook(){
 for(let sign of [-1,1])for(let layer=0;layer<4;layer++){let c=layer===0?C.wine:C.paper,extra=layer===0?.04:0;const pt=(u,v)=>[sign*(.05+u*(.78+extra)),v*(1.62+extra),.09+u*.22+.10*Math.sin(Math.PI*u)+layer*.018];for(let i=0;i<20;i++){let a=i/20,b=(i+1)/20,v=[pt(a,-.5),pt(b,-.5),pt(b,.5),pt(a,.5)];if(sign<0)v.reverse();face(v,c);} }
 for(let sign of [-1,1])for(let row=0;row<6;row++){const y=.50-row*.18,us=[.15,.38,.6,.83];tube(us.map(u=>[sign*(.05+u*.78),y,.16+u*.22+.10*Math.sin(Math.PI*u)]),.006,'#a69c8d');}
 face([[.59,.79,.37],[.72,.79,.39],[.72,-.68,.39],[.655,-.59,.38],[.59,-.68,.37]],C.wine,[0,0,1]);
}
function model(k){
switch(k){

case'phases':for(let i=0;i<4;i++){let x=-.9+i*.6;sphere(x,0,0,.25,.25,.25,i===0?C.dark:'#b5bdc4');if(i===1||i===3)sphere(x+(i===1?-.09:.09),0,.14,.19,.25,.16,C.dark);}break;
case'seasons':box(0,-.45,0,.14,1.4,.14,C.terra);for(let [x,y,c]of [[-.42,.3,C.green],[.42,.3,C.gold],[-.42,.88,'#c98491'],[.42,.88,'#b3c7d4']])sphere(x,y,0,.4,.36,.24,c);break;
case'timetable':box(0,0,0,2.1,1.5,.18,C.navy);box(0,0,.12,1.95,1.35,.06,C.paper);for(let i=0;i<5;i++)for(let j=0;j<4;j++)box(-.76+i*.38,.47-j*.31,.18,.28,.2,.05,[C.wine,C.gold,C.green,C.navy][(i+j)%4]);break;
case'shift':clock(-.48,.3,0,.59,9,0);clock(.48,-.3,.12,.59,17,0);tube([[-.75,-.55,.0],[-.45,-.83,.0],[0,-.9,.0]],.035,C.gold);tube([[.1,-.77,0],[0,-.9,0],[-.12,-1.01,0]],.035,C.gold);break;
case'vacation':bevelBox(0,-.1,0,1.4,1.65,.65,.12,C.green);box(0,.87,0,.62,.32,.2,C.gold);for(let x of [-.52,.52]){sphere(x,-1,0,.12,.12,.12,C.dark);box(x,-.1,.37,.08,1.45,.08,C.gold);}break;
case'alltools':box(-.48,-.45,.12,.8,.8,.8,C.wine);sphere(.45,.4,0,.52,.52,.52,C.gold);ring(-.4,.65,0,.42,.08,C.green);box(.6,-.7,0,.6,.45,.65,C.navy);break;
case'sunrise':sphere(0,-.25,0,.65,.65,.65,C.gold);box(0,-.62,.25,2.2,.12,1.2,'#7ca9ad');for(let i=0;i<3;i++)box(0,-.54,.6-i*.27,1.8-i*.3,.02,.07,C.paper);break;
case'pdf':book();box(0,-.35,.31,1.5,.52,.12,C.wine);tube([[.48,.55,.35],[.48,.1,.35],[.3,.28,.35],[.48,.1,.35],[.66,.28,.35]],.028,C.gold);break;
case'webp':box(0,0,0,2,1.55,.22,C.paper);box(0,0,.15,1.8,1.35,.08,'#9dbcc9');sphere(.52,.4,.24,.16,.16,.04,C.gold);face([[-.85,-.6,.24],[.1,.5,.24],[.8,-.6,.24]],C.green,[0,0,1]);face([[-.2,-.6,.28],[.5,.12,.28],[.86,-.6,.28]],C.navy,[0,0,1]);break;
case'planner':box(0,-.1,0,2.15,1.45,.22,C.paper);for(let i=0;i<3;i++)box(-.63+i*.63,-.1,.15,.48,.98,.06,[C.wine,C.green,C.gold][i]);break;

case'month-1':for(let i=0;i<6;i++){let a=i*Math.PI/3,x=Math.cos(a),y=Math.sin(a);tube([[0,0,0],[x,y,0]],.035,'#94bacb');for(let d of [-1,1])tube([[x*.58,y*.58,0],[x*.76-y*.25*d,y*.76+x*.25*d,0]],.025,C.paper);}break;
case'month-2':for(let x of [-.42,.42]){sphere(x,-.1,0,.32,.62,.22,C.wine);sphere(x+(x<0?.28:-.28),.15,.05,.15,.27,.16,C.wine);box(x,-.65,.02,.62,.22,.4,C.paper);}break;
case'month-3':{const p=[[0,-.95,0],[.02,1.1,0],[.78,.95,0],[.55,.27,0]],pts=Array.from({length:28},(_,i)=>{let t=i/27;return p[0].map((v,k)=>v*(1-t)**3+3*p[1][k]*(1-t)**2*t+3*p[2][k]*(1-t)*t*t+p[3][k]*t**3);});tube(pts,.027,C.green);leaf(-.35,-.6,0);for(let d of [-1,0,1])petal(.55,.27,.03+d*.006,.38,.105,-Math.PI/2+d*.35,C.paper);sphere(.55,.28,.04,.08,.07,.06,C.green);break;}
case'month-4':for(let [x,y,c]of [[-.55,-.2,C.wine],[.05,.25,C.gold],[.6,-.25,C.green]]){sphere(x,y,0,.34,.51,.34,c);paintedBand(x,y,0,.344,.514,.344,1.4,C.paper);paintedBand(x,y,0,.344,.514,.344,1.75,C.paper);}break;
case'month-5':tube([[0,-.94,0],[0,.32,0]],.035,C.green);leaf(.3,-.55,0);for(let i=0;i<8;i++)petal(0,.32,.03,.62,.22,i*Math.PI/4,'#cd859a');sphere(0,.32,.17,.17,.17,.09,C.gold);break;
case'month-6':ring(0,0,0,.68,.025,'#655b32');for(let i=0;i<12;i++){let a=i*Math.PI/6;petal(Math.cos(a)*.62,Math.sin(a)*.62,.01,.46,.16,a+.7,i%2?C.green:'#76935c',.2);}for(let x of [-.18,.18]){sphere(x,-.76,.07,.09,.12,.07,C.terra);sphere(x,-.69,.08,.10,.055,.07,'#7f763b');}break;
case'month-7':for(let [x,y]of [[-.4,.3],[0,.6],[.4,.3],[-.2,-.1],[.2,-.1],[0,-.5]])sphere(x,y,0,.26,.26,.26,C.wine);leaf(-.45,.85,0);break;
case'month-8':for(let x of [-.5,0,.5]){tube([[x,-1,0],[x,.86,0]],.021,C.gold);for(let j=0;j<6;j++)for(let d of [-1,1])grain(x+d*.10,-.12+j*.15,0,d);}break;
case'month-9':book(-.3,-.1,0);sphere(.55,-.5,.4,.43,.4,.36,C.wine);tube([[.55,-.14,.4],[.6,.05,.4]],.025,C.terra);leaf(.8,.02,.4);break;
case'month-10':for(let i=0;i<7;i++){let a=i*Math.PI*2/7;sphere(Math.cos(a)*.38,0,Math.sin(a)*.3,.36,.66,.36,'#cb7e3b');}tube([[0,.5,0],[.08,.9,0]],.07,C.green);break;
case'month-11':for(let x of [-.4,.4]){candle(x,-.2,0,.22,1.05);}break;
case'month-12':for(let [y,r,h]of [[-.48,.78,.9],[.05,.59,.85],[.52,.4,.75]])cone(0,y,0,r,.02,h,C.green);for(let [x,y,z]of [[-.4,-.42,.4],[.3,-.13,.3],[-.15,.4,.28],[.34,-.65,.48]])sphere(x,y,z,.075,.075,.075,C.gold);box(0,-1.05,0,.16,.3,.16,C.terra);break;
case'calendar':calendar();break;case'week':box(0,0,0,2.2,1.35,.2,C.navy);for(let i=0;i<7;i++){box(-.9+i*.3,0,.15,.24,1.12,.07,i===5||i===6?C.wine:C.paper);box(-.9+i*.3,.36,.2,.18,.16,.05,C.gold);}break;
case'sun':sphere(0,0,0,.69,.69,.69,C.gold);for(let i=0;i<12;i++){let a=i*Math.PI/6;tube([[Math.cos(a)*.87,Math.sin(a)*.87,0],[Math.cos(a)*1.14,Math.sin(a)*1.14,0]],.038,C.gold);}break;
case'moon':sphere(0,0,0,.91,.91,.91,'#b5bdc4');for(let [x,y,r]of [[-.4,.25,.14],[.21,.36,.19],[.36,-.3,.13],[-.22,-.45,.2],[.02,-.02,.09]])sphere(x,y,Math.sqrt(Math.max(.1,.82-x*x-y*y))-.035,r,r,.035,'#8c969f');break;
case'garden':box(0,-.65,0,1.2,.67,1,C.terra);sphere(0,-.28,0,.61,.08,.51,'#514039');tube([[0,-.25,0],[0,.25,0],[.06,.88,0]],.035,C.green);leaf(-.4,.35,.05);leaf(.43,.7,0,-1);break;
case'zodiac':disc(0,0,0,.94,.14,C.navy);ring(0,0,.13,.88,.035,C.gold);for(let i=0;i<12;i++){let a=i*Math.PI/6;sphere(Math.cos(a)*.76,Math.sin(a)*.76,.15,.035,.035,.025,C.gold);}for(let i=0;i<5;i++){let a=i*Math.PI*.8+.3,b=(i+1)*Math.PI*.8+.3;tube([[Math.cos(a)*.55,Math.sin(a)*.55,.17],[Math.cos(b)*.55,Math.sin(b)*.55,.17]],.017,C.gold);sphere(Math.cos(a)*.55,Math.sin(a)*.55,.20,.055,.055,.025,C.paper);}break;
case'school':openBook();bevelBox(1,-.04,.13,.13,1.5,.13,.035,C.gold);cone(1,-.89,.13,.07,0,.2,C.dark);break;
case'about':book();sphere(.52,-.4,.5,.36,.36,.14,C.gold);sphere(.52,-.32,.67,.1,.1,.05,C.paper);box(.52,-.58,.65,.19,.23,.05,C.paper);break;
case'work':bevelBox(0,-.2,0,1.9,1.4,.7,.10,C.terra);box(0,.6,0,.9,.4,.25,C.dark);box(0,.6,.02,.65,.23,.3,C.paper);box(0,.05,.39,1.9,.17,.1,C.dark);box(0,0,.48,.27,.36,.12,C.gold);break;
case'holiday':
 bevelBox(0,-.32,0,1.65,1.42,1.28,.055,C.wine);
 bevelBox(0,.48,0,1.82,.25,1.45,.045,C.paper);
 box(0,-.35,.66,.25,1.31,.025,C.gold);box(.0,.616,0,.25,.025,1.42,C.gold);box(0,.48,.739,.25,.245,.018,C.gold);
 bowRibbon([[0,.72,.08],[-1.07,1.49,-.08],[-.92,.80,-.38],[-.03,.70,.12]],.16,C.gold,1.25);
 bowRibbon([[.02,.72,.08],[.94,1.48,-.18],[1.05,.80,-.37],[.06,.71,.14]],.16,C.gold,-1.25);
 bowRibbon([[-.05,.7,.05],[-.3,.61,.33],[-.45,.6,.59],[-.36,.35,.77]],.12,C.gold,.35);
 bowRibbon([[.07,.7,.05],[.38,.63,.18],[.54,.61,.39],[.66,.42,.64]],.12,C.gold,-.35);
 bevelBox(0,.75,.16,.31,.22,.31,.055,C.gold);break;
case'memorial':candle(0,-.23,0,.33,1.36);leaf(-.65,-.89,.2);leaf(.65,-.89,.2);break;
case'culture':for(let i=0;i<7;i++)box(-.84+i*.28,0,Math.sin(i*.65)*.12,.3,1.6,.16,i%2?C.wine:C.paper);for(let i=0;i<3;i++)sphere(-.56+i*.56,0,.23,.13,.13,.03,C.gold);break;
case'astronomy':tube([[-.75,.5,0],[.75,.8,0]],.26,C.navy);ring(.76,.8,0,.27,.055,C.gold);tube([[0,.4,0],[0,-.65,0],[-.65,-1,0]],.035,C.dark);tube([[0,-.4,0],[.65,-1,0]],.035,C.dark);break;
case'city':for(let [x,h]of [[-.85,.9],[-.25,1.6],[.35,1.15],[.9,.75]]){box(x,-.9+h/2,0,.45,h,.55,C.wine);for(let y=-.65;y<-.9+h;y+=.3)box(x,y,.29,.12,.13,.03,C.gold);}sphere(-.24,.97,0,.12,.2,.13,C.gold);break;
case'names':
 for(let [x,y,c]of [[-.56,.3,'#c57f92'],[.04,.74,C.gold],[.58,.4,'#c57f92']]){tube([[-.06,-.9,0],[x*.4,-.2,0],[x,y,0]],.022,C.green);for(let i=0;i<6;i++)petal(x,y,.02,.3,.11,i*Math.PI/3,c);sphere(x,y,.13,.09,.09,.05,C.gold);}leaf(-.3,-.5,0);bevelBox(.5,-.63,.26,.62,.55,.04,.03,C.paper);box(.5,-.52,.30,.37,.035,.01,C.wine);box(.5,-.65,.30,.37,.02,.01,'#b5a48e');bevelBox(-.06,-.65,.1,.20,.19,.14,.03,C.wine);break;
case'print':bevelBox(0,-.2,0,1.9,.8,1.15,.12,C.navy);box(0,.53,-.25,1.35,.7,.06,C.paper);box(0,-.65,.63,1.3,.7,.06,C.paper);for(let i=0;i<4;i++)box(0,-.43-i*.13,.675,.95,.025,.01,'#aca291');sphere(.69,.02,.59,.07,.07,.025,C.green);break;
case'family':
 for(let [x,y,r,c,z]of [[-.55,.35,.27,C.wine,0],[.55,.35,.27,C.navy,0],[0,-.12,.22,C.green,.38]]){bevelBox(x,y-.58,z,r*2.45,.7,r*1.4,.14,c);sphere(x,y,z,r,r*1.13,r*.85,'#d7ad8e');sphere(x,y+.16,z-.035,r*1.02,r*.64,r*.87,C.dark);for(let dx of [-1,1])sphere(x+dx*r*.29,y+.01,z+r*.83,r*.035,r*.035,r*.025,C.dark);sphere(x,y-.25,z,r*.24,r*.17,r*.22,'#d7ad8e');}break;
case'tools':clock(0,0,0,.96,10,10);break;
case'privacy':{
 const outline=[[-.83,.85],[0,1.05],[.83,.85],[.73,-.34],[.38,-.82],[0,-1.08],[-.38,-.82],[-.73,-.34]];
 face(outline.map(([x,y])=>[x,y,.12]).reverse(),C.wine,[0,0,1]);for(let i=0;i<outline.length;i++){let a=outline[i],b=outline[(i+1)%outline.length];face([[...a,-.12],[...b,-.12],[...b,.12],[...a,.12]].reverse(),C.dark);}
 ring(0,.28,.22,.26,.065,C.gold);bevelBox(0,-.14,.31,.82,.65,.18,.065,C.paper);disc(0,-.09,.43,.075,.02,C.wine);box(0,-.22,.44,.06,.15,.02,C.wine);break;}

}
}
function shade(hex,n){let rgb=hex.match(/\w\w/g).map(x=>parseInt(x,16)),l=unit([-.55,.8,1.3]);let diff=Math.max(0,n.reduce((s,x,i)=>s+x*l[i],0)),gloss=hex===C.paper?.06:hex===C.gold?.17:.11,spec=Math.pow(Math.max(0,n.reduce((s,x,i)=>s+x*unit([-.25,.4,2])[i],0)),28)*gloss;return '#'+rgb.map(v=>Math.round(Math.max(0,Math.min(255,v*(.40+.65*diff)+255*spec)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
function render(k){faces=[];primitiveCounter=0;activePrimitive=0;model(k);let projected=faces.map(f=>{let v=f.v.map(camera),n=camera(f.n);return {...f,v,n,depth:v.reduce((s,p)=>s+p[2],0)/v.length};}).filter(f=>f.n[2]>-.01);let bounds=projected.reduce((a,f)=>{for(const p of f.v){a[0]=Math.min(a[0],p[0]);a[1]=Math.max(a[1],p[0]);a[2]=Math.min(a[2],p[1]);a[3]=Math.max(a[3],p[1]);}return a;},[Infinity,-Infinity,Infinity,-Infinity]),[left,right,bottom,top]=bounds,scale=Math.min(90,278/(right-left),201/(top-bottom)),mid=(left+right)/2;let out=projected.sort((a,b)=>a.group-b.group||a.depth-b.depth).map(f=>{let c=shade(f.color,f.n);return '<polygon points="'+f.v.map(([x,y])=>(160+(x-mid)*scale).toFixed(2)+','+(222-(y-bottom)*scale).toFixed(2)).join(' ')+'" fill="'+c+'" stroke="'+c+'" stroke-width=".22" stroke-linejoin="round"/>';}).join('');return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" role="img" aria-labelledby="title desc"><title id="title">'+labels[k]+'</title><desc id="desc">Oriģināls trīsdimensiju modelis ar aprēķinātu perspektīvu un studijas apgaismojumu.</desc><defs><radialGradient id="floor"><stop stop-color="#383039" stop-opacity=".18"/><stop offset="1" stop-color="#383039" stop-opacity="0"/></radialGradient></defs><ellipse cx="160" cy="227" rx="95" ry="12" fill="url(#floor)"/>'+out+'</svg>';}
Object.assign(labels,{phases:'Mēness fāžu cikls',seasons:'Četri gadalaiki',timetable:'Stundu saraksts',shift:'Maiņu grafiks',vacation:'Atvaļinājuma plānotājs',alltools:'Visi rīki',sunrise:'Saullēkts un saulriets',pdf:'PDF kalendārs',webp:'WebP attēls',planner:'Kalendāri un plānošana'});
for(let [i,n] of ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'].entries())labels['month-'+(i+1)]=n;
fs.mkdirSync('assets/category-art',{recursive:true});for(let k of Object.keys(labels).filter(k=>!['moon','phases','astronomy'].includes(k)))fs.writeFileSync('assets/category-art/'+k+'.svg',render(k));
console.log('Built '+Object.keys(labels).length+' distinct category models from 3D geometry.');
