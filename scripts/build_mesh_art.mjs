import fs from 'node:fs';
const labels={calendar:'Kalendārs',sun:'Saules laiki',moon:'Mēness fāzes',garden:'Sējas kalendārs',zodiac:'Zodiaks',school:'Mācību gads',work:'Darba dienas',holiday:'Latvijas svētki',memorial:'Atceres dienas',culture:'Latvijas kultūra',astronomy:'Astronomija',city:'Latvijas pilsētas',names:'Vārda dienas',print:'Drukājams kalendārs',week:'Nedēļas plānotājs',family:'Ģimenes kalendārs',tools:'Plānošanas rīki',privacy:'Privātums',about:'Par projektu'};
const C={wine:'#922b48',gold:'#ddb66b',paper:'#f2e9d9',green:'#417d63',navy:'#344b65',dark:'#283341',terra:'#b77051'};
let faces=[];
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{let l=Math.hypot(...a)||1;return a.map(x=>x/l)};
function camera([x,y,z]){const a=-.48,b=.32;const X=x*Math.cos(a)+z*Math.sin(a),Z=-x*Math.sin(a)+z*Math.cos(a);return [X,y*Math.cos(b)-Z*Math.sin(b),y*Math.sin(b)+Z*Math.cos(b)];}
function face(v,color,n){faces.push({v,color,n:n||unit(cross(sub(v[1],v[0]),sub(v[2],v[0])))});}
function box(x,y,z,w,h,d,c){let p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>[x+a*w/2,y+b*h/2,z+e*d/2]);for(const ids of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]])face(ids.map(i=>p[i]),c);}
function sphere(x,y,z,rx,ry,rz,c){const rows=22,cols=40;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let p=[];for(const [a,b] of [[j,i],[j,i+1],[j+1,i+1],[j+1,i]]){let t=a*Math.PI/rows,f=b*Math.PI*2/cols;p.push([x+rx*Math.sin(t)*Math.cos(f),y+ry*Math.cos(t),z+rz*Math.sin(t)*Math.sin(f)]);}let m=p.reduce((a,v)=>a.map((n,k)=>n+v[k]/4),[0,0,0]);face(p,c,unit([(m[0]-x)/rx,(m[1]-y)/ry,(m[2]-z)/rz]));}}
function tube(points,r,c){for(let i=1;i<points.length;i++){let a=points[i-1],b=points[i],axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);for(let j=0;j<20;j++){let f=j*Math.PI/10,g=(j+1)*Math.PI/10;let normal=unit(u.map((x,k)=>x*Math.cos((f+g)/2)+v[k]*Math.sin((f+g)/2)));face([[a,f],[b,f],[b,g],[a,g]].map(([p,t])=>p.map((x,k)=>x+r*(u[k]*Math.cos(t)+v[k]*Math.sin(t)))),c,normal);}}for(const p of [points[0],points.at(-1)])sphere(...p,r,r,r,c);}
function ring(x,y,z,r,t,c){for(let i=0;i<64;i++){let a=i*Math.PI/32,b=(i+1)*Math.PI/32;const pts=[];for(let k=0;k<10;k++){let u=k*Math.PI/5,v=(k+1)*Math.PI/5;face([[a,u],[b,u],[b,v],[a,v]].map(([f,q])=>[x+(r+t*Math.cos(q))*Math.cos(f),y+(r+t*Math.cos(q))*Math.sin(f),z+t*Math.sin(q)]),c,unit([Math.cos((a+b)/2)*Math.cos((u+v)/2),Math.sin((a+b)/2)*Math.cos((u+v)/2),Math.sin((u+v)/2)]));}}}
function book(x=0,y=0,z=0){box(x,y,z,1.65,1.85,.4,C.wine);box(x+.06,y+.02,z+.1,1.48,1.69,.3,C.paper);box(x-.73,y,z+.16,.13,1.85,.12,C.gold);for(let i=0;i<5;i++)box(x+.05,y+.5-i*.23,z+.265,.98,.025,.015,'#baa993');}
function calendar(week=false){box(0,0,0,1.95,1.85,.3,C.paper);box(0,.62,.19,1.95,.57,.12,C.wine);for(let x of [-.58,.58])ring(x,.93,.14,.12,.037,C.gold);for(let j=0;j<3;j++)for(let i=0;i<4;i++)box(-.64+i*.43,.18-j*.37,.19,.25,.19,.05,week&&i===1?C.gold:(i===3?C.wine:'#b8b7ad'));}
function leaf(x,y,z,side=1){sphere(x,y,z,.49,.19,.1,C.green);tube([[x-side*.4,y-.05,z+.07],[x,y+.03,z+.11],[x+side*.4,y+.07,z+.07]],.012,'#a1ba80');}
function model(k){
switch(k){
case'calendar':calendar();break;case'week':calendar(true);box(.8,-.75,.42,.25,.7,.2,C.gold);break;
case'sun':sphere(0,0,0,.69,.69,.69,C.gold);for(let i=0;i<12;i++){let a=i*Math.PI/6;sphere(Math.cos(a)*1.04,Math.sin(a)*1.04,0,.095,.095,.13,'#e0a74c');}break;
case'moon':sphere(0,0,0,.91,.91,.91,'#b5bdc4');for(let [x,y,r]of [[-.4,.25,.14],[.21,.36,.19],[.36,-.3,.13],[-.22,-.45,.2],[.02,-.02,.09]])sphere(x,y,Math.sqrt(Math.max(.1,.82-x*x-y*y))-.035,r,r,.035,'#8c969f');break;
case'garden':box(0,-.65,0,1.2,.67,1,C.terra);sphere(0,-.28,0,.61,.08,.51,'#514039');tube([[0,-.25,0],[0,.25,0],[.06,.88,0]],.035,C.green);leaf(-.4,.35,.05);leaf(.43,.7,0,-1);break;
case'zodiac':ring(0,0,0,.94,.065,C.gold);sphere(0,0,0,.55,.55,.25,C.navy);for(let i=0;i<12;i++){let a=i*Math.PI/6;sphere(Math.cos(a)*.94,Math.sin(a)*.94,.1,.045,.045,.045,C.paper);}break;
case'school':book(-.25,0,0);box(.75,-.4,.4,.16,1.3,.16,C.gold);sphere(.75,.29,.4,.1,.1,.1,C.dark);break;
case'about':book();sphere(.52,-.4,.5,.36,.36,.14,C.gold);sphere(.52,-.32,.67,.1,.1,.05,C.paper);box(.52,-.58,.65,.19,.23,.05,C.paper);break;
case'work':box(0,-.2,0,1.9,1.4,.7,C.terra);box(0,.6,0,.9,.4,.25,C.dark);box(0,.6,.02,.65,.23,.3,C.paper);box(0,.05,.39,1.9,.17,.1,C.dark);box(0,0,.48,.27,.36,.12,C.gold);break;
case'holiday':box(0,-.2,0,1.55,1.4,1.2,C.wine);box(0,.57,0,1.7,.25,1.35,C.paper);box(0,-.1,.66,.24,1.5,.1,C.gold);ring(-.28,.85,0,.3,.08,C.gold);ring(.28,.85,0,.3,.08,C.gold);break;
case'memorial':box(0,-.25,0,.7,1.45,.7,C.paper);box(0,-.1,.38,.72,.18,.05,C.wine);sphere(0,.8,0,.17,.32,.13,C.gold);leaf(-.65,-.78,.2);leaf(.65,-.78,.2);break;
case'culture':for(let i=0;i<7;i++)box(-.84+i*.28,0,Math.sin(i*.65)*.12,.3,1.6,.16,i%2?C.wine:C.paper);for(let i=0;i<3;i++)sphere(-.56+i*.56,0,.23,.13,.13,.03,C.gold);break;
case'astronomy':tube([[-.75,.5,0],[.75,.8,0]],.26,C.navy);ring(.76,.8,0,.27,.055,C.gold);tube([[0,.4,0],[0,-.65,0],[-.65,-1,0]],.035,C.dark);tube([[0,-.4,0],[.65,-1,0]],.035,C.dark);break;
case'city':for(let [x,h]of [[-.85,.9],[-.25,1.6],[.35,1.15],[.9,.75]]){box(x,-.9+h/2,0,.45,h,.55,C.wine);for(let y=-.65;y<-.9+h;y+=.3)box(x,y,.29,.12,.13,.03,C.gold);}sphere(-.24,.97,0,.12,.2,.13,C.gold);break;
case'names':book();sphere(.35,-.2,.38,.22,.22,.1,C.wine);for(let i=0;i<5;i++){let a=i*1.256;sphere(.35+Math.cos(a)*.22,-.2+Math.sin(a)*.22,.43,.13,.13,.06,C.gold);}break;
case'print':box(0,-.2,0,1.9,.8,1.15,C.navy);box(0,.53,-.25,1.35,.7,.06,C.paper);box(0,-.65,.63,1.3,.7,.06,C.paper);for(let i=0;i<4;i++)box(0,-.43-i*.13,.675,.95,.025,.01,'#aca291');sphere(.69,.02,.59,.07,.07,.025,C.green);break;
case'family':for(let [x,y,r,c]of [[-.65,.3,.28,C.wine],[.6,.35,.3,C.navy],[0,-.1,.22,C.green]]){sphere(x,y,0,r,r,r,C.gold);sphere(x,y-.65,0,r*1.3,.45,r,c);}break;
case'tools':sphere(0,0,0,.95,.95,.2,C.navy);sphere(0,0,.18,.8,.8,.08,C.paper);for(let i=0;i<12;i++){let a=i*Math.PI/6;box(Math.cos(a)*.67,Math.sin(a)*.67,.29,.06,.06,.03,C.dark);}tube([[0,0,.34],[0,.5,.34]],.025,C.wine);tube([[0,0,.37],[.4,-.1,.37]],.025,C.gold);break;
case'privacy':sphere(0,0,0,.9,1.05,.22,C.wine);ring(0,.32,.3,.28,.07,C.gold);box(0,-.14,.38,.8,.65,.25,C.paper);sphere(0,-.13,.54,.08,.08,.04,C.navy);box(0,-.26,.55,.055,.16,.04,C.navy);break;
}
}
function shade(hex,n,p){let rgb=hex.match(/\w\w/g).map(x=>parseInt(x,16)),l=unit([-.55,.8,1.3]);let diff=Math.max(0,n.reduce((s,x,i)=>s+x*l[i],0)),spec=Math.pow(Math.max(0,n.reduce((s,x,i)=>s+x*unit([-.25,.4,2])[i],0)),24)*.34;return '#'+rgb.map(v=>Math.round(Math.max(0,Math.min(255,v*(.36+.67*diff)+255*spec)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
function render(k){faces=[];model(k);let out=faces.map(f=>{let v=f.v.map(camera),n=camera(f.n);return {...f,v,n,depth:v.reduce((s,p)=>s+p[2],0)/v.length};}).filter(f=>f.n[2]>-.05).sort((a,b)=>a.depth-b.depth).map(f=>{let c=shade(f.color,f.n);return '<polygon points="'+f.v.map(([x,y,z])=>(160+x*90).toFixed(2)+','+(132-y*90).toFixed(2)).join(' ')+'" fill="'+c+'" stroke="'+c+'" stroke-width=".3" stroke-linejoin="round"/>';}).join('');return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" role="img" aria-labelledby="title desc"><title id="title">'+labels[k]+'</title><desc id="desc">Oriģināls trīsdimensiju modelis ar aprēķinātu perspektīvu un studijas apgaismojumu.</desc><defs><radialGradient id="floor"><stop stop-color="#383039" stop-opacity=".23"/><stop offset="1" stop-color="#383039" stop-opacity="0"/></radialGradient></defs><ellipse cx="163" cy="225" rx="106" ry="17" fill="url(#floor)"/>'+out+'</svg>';}
fs.mkdirSync('assets/category-art',{recursive:true});for(let k of Object.keys(labels))fs.writeFileSync('assets/category-art/'+k+'.svg',render(k));
console.log('Built 19 category models from 3D geometry.');
