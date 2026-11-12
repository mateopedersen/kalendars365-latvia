// Original solid sculptures. The same geometry supplies SVG previews and the
// interactive, smoothly lit WebGL models; no icon font or photographed object.
export const materials={ivory:'#e9dfc7',gold:'#caa15c',lightGold:'#efcf8b',dark:'#34343e',wine:'#84324b',teal:'#367a7b',water:'#8fc6cb'};
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,t)=>a.map(v=>v*t);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit=a=>mul(a,1/(Math.hypot(...a)||1));
export function sculpture(slug){
 const faces=[],M=materials;
 function quad(p,n,c){faces.push({p,n,c});}
 function sphere(x,y,z,rx,ry,rz,c=M.ivory){
  const first=faces.length;const cols=Math.max(rx,ry,rz)>.3?28:14,rows=cols/2;
  const at=(a,b)=>{const t=a*Math.PI/rows,f=b*2*Math.PI/cols;return {p:[x+rx*Math.sin(t)*Math.cos(f),y+ry*Math.cos(t),z+rz*Math.sin(t)*Math.sin(f)],n:unit([Math.sin(t)*Math.cos(f)/rx,Math.cos(t)/ry,Math.sin(t)*Math.sin(f)/rz])};};
  for(let a=0;a<rows;a++)for(let b=0;b<cols;b++){const v=[[a,b],[a+1,b],[a+1,b+1],[a,b+1]].map(([i,j])=>at(i,j));quad(v.map(q=>q.p),v.map(q=>q.n),c);}
  const shape={x,y,z,rx,ry,rz,c};for(let i=first;i<faces.length;i++)faces[i].sphere=shape;
 }
 function tube(points,r,c=M.gold){
  const first=faces.length;const rings=points.map((p,i)=>{const axis=unit(sub(points[Math.min(i+1,points.length-1)],points[Math.max(0,i-1)])),u=unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u),radius=typeof r==='function'?r(i/(points.length-1)):r;return Array.from({length:12},(_,j)=>{const a=j*Math.PI/6,n=add(mul(u,Math.cos(a)),mul(v,Math.sin(a)));return {p:add(p,mul(n,radius)),n};});});
  for(let i=1;i<rings.length;i++)for(let j=0;j<12;j++){const k=(j+1)%12,v=[rings[i-1][j],rings[i][j],rings[i][k],rings[i-1][k]];quad(v.map(q=>q.p),v.map(q=>q.n),c);}
  for(const i of [0,rings.length-1]){const n=unit(sub(points[i],points[i===0?1:points.length-2]));quad(rings[i].map(q=>q.p),rings[i].map(()=>n),c);}
  const shape={points,r,c};for(let i=first;i<faces.length;i++)faces[i].tube=shape;
 }
 function arc(cx,cy,z,rx,ry,start,end,r,c=M.gold){tube(Array.from({length:Math.max(7,Math.ceil(Math.abs(end-start)*5))+1},(_,i)=>{let a=start+(end-start)*i/Math.max(7,Math.ceil(Math.abs(end-start)*5));return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,z+.045*Math.sin(a)];}),r,c);}
 function horn(side,goat=false){const pts=Array.from({length:35},(_,i)=>{const t=i/34,a=(goat?.45:0)+t*Math.PI*1.68;return [side*(.43+Math.sin(a)*(.38-.17*t)),.36+Math.cos(a)*(.39-.1*t),-.06+.13*t];});tube(pts,t=>.115*(1-t)+.012,M.gold);for(let i=2;i<30;i+=3){const p=pts[i];sphere(...p,.11*(1-i/38),.025,.08*(1-i/38),M.lightGold);}}
 function eye(x,y,z,r=.035){sphere(x,y,z,r,r,r*.55,M.dark);sphere(x-.009,y+.011,z+r*.4,r*.3,r*.3,r*.18,'#fff7de');}
 function head(x,y,z,s=1,hair=M.gold){
  sphere(x,y,z,.21*s,.28*s,.17*s);sphere(x,y+.17*s,z-.04*s,.23*s,.16*s,.19*s,hair);
  sphere(x,y-.01*s,z+.17*s,.034*s,.07*s,.05*s);eye(x-.072*s,y+.035*s,z+.15*s,.015*s);eye(x+.072*s,y+.035*s,z+.15*s,.015*s);
  arc(x,y-.09*s,z+.157*s,.07*s,.025*s,Math.PI,2*Math.PI,.008*s,M.wine);
 }
 function bust(x,y,s=1,hair=M.gold){sphere(x,y-.43*s,0,.34*s,.32*s,.22*s,M.wine);sphere(x,y-.24*s,.04,.095*s,.15*s,.10*s);head(x,y,0,s,hair);for(let j=-1;j<=1;j++)tube([[x+j*.10*s,y-.28*s,.20],[x+j*.15*s,y-.55*s,.22],[x+j*.18*s,y-.67*s,.12]],.012*s,M.lightGold);}
 function bowl(x,y,z,r){sphere(x,y,z,r,.075,r*.66,M.gold);arc(x,y+.025,z+.025,r,.035,0,Math.PI*2,.015,M.lightGold);}
 function fish(cx,cy,sign){
  sphere(cx,cy,0,.42,.19,.15,M.teal);sphere(cx+sign*.30,cy,.045,.18,.17,.15,M.ivory);eye(cx+sign*.34,cy+.05,.16,.027);
  for(let a=0;a<5;a++)for(let b=0;b<3;b++)arc(cx-sign*(a*.095-.08),cy+(b-1)*.08,.13,.05,.045,-1.2,1.2,.009,M.lightGold);
  for(let s of [-1,1]){tube([[cx-sign*.36,cy,0],[cx-sign*.61,cy+s*.23,-.02]],t=>.11*(1-t)+.015,M.gold);}
  tube([[cx-sign*.20,cy+.12,0],[cx-sign*.05,cy+.29,-.01],[cx+sign*.12,cy+.13,0]],t=>.055*Math.sin(t*Math.PI)+.012,M.gold);
 }
 switch(slug){
 case'auns':
  for(const side of [-1,1]){horn(side);sphere(side*.34,.04,.03,.22,.10,.10);}
  sphere(0,-.08,0,.35,.43,.28);for(let i=0;i<13;i++){let a=i*Math.PI*2/13;sphere(Math.sin(a)*.28,.19+Math.cos(a)*.15,.13,.10,.10,.085);}
  sphere(0,-.39,.22,.21,.18,.15);sphere(0,-.40,.36,.09,.05,.05,M.dark);eye(-.15,-.03,.25);eye(.15,-.03,.25);break;
 case'versis':
  for(let s of [-1,1]){tube([[s*.27,.30,0],[s*.50,.40,0],[s*.66,.68,.05]],t=>.14*(1-t)+.012,M.gold);sphere(s*.38,.1,0,.25,.13,.10);}
  sphere(0,-.06,0,.39,.42,.25,M.ivory);sphere(0,-.36,.20,.30,.17,.17);eye(-.16,.04,.23);eye(.16,.04,.23);eye(-.13,-.36,.36,.028);eye(.13,-.36,.36,.028);arc(0,-.35,.37,.20,.18,Math.PI,2*Math.PI,.019,M.gold);break;
 case'dvini':bust(-.31,.30,.88,M.gold);bust(.31,.30,.88,M.dark);tube([[-.14,-.20,.12],[0,-.27,.28],[.14,-.20,.12]],.07,M.ivory);break;
 case'vezis':
  for(let s of [-1,1]){for(let j=0;j<4;j++)tube([[s*.25,-.1+j*.08,0],[s*(.5+j*.02),-.35+j*.16,.01],[s*.68,-.47+j*.18,.08]],t=>.035*(1-t)+.012,M.gold);
  tube([[s*.27,.15,0],[s*.51,.38,.05],[s*.54,.56,.07]],.055,M.gold);sphere(s*.54,.58,.08,.16,.20,.10,M.ivory);sphere(s*.67,.69,.1,.08,.14,.09,M.gold);sphere(s*.45,.70,.1,.05,.13,.07,M.gold);tube([[s*.13,.25,.1],[s*.19,.36,.1]],.022,M.gold);eye(s*.20,.38,.12,.035);}
  sphere(0,0,.025,.38,.28,.19,M.ivory);arc(0,-.04,.20,.31,.15,Math.PI,2*Math.PI,.015,M.gold);break;
 case'lauva':
  for(let i=0;i<18;i++){const a=i*Math.PI/9;sphere(Math.cos(a)*.34,Math.sin(a)*.40,.015,.15,.19,.14,i%2?M.gold:M.lightGold);}
  sphere(0,.03,.17,.27,.34,.22);for(let s of [-1,1]){sphere(s*.12,-.15,.35,.13,.11,.11);eye(s*.12,.11,.35,.025);}sphere(0,-.08,.44,.07,.055,.045,M.dark);tube([[0,-.12,.44],[0,-.24,.43]],.014,M.wine);break;
 case'jaunava':
  bust(-.12,.34,1.05,M.gold);for(let s of [-1,1])tube([[s*.18-.12,.49,-.02],[s*.25-.12,.16,-.03],[s*.24-.12,-.18,.01]],.055,M.gold);
  tube([[.22,-.6,.1],[.43,.16,.08]],.018,M.gold);for(let i=0;i<5;i++)for(let s of [-1,1])sphere(.29+i*.03+s*.06,-.35+i*.11,.12,.055,.08,.028,M.lightGold);break;
 case'svari':
  bowl(0,-.61,0,.38);tube([[0,-.56,0],[0,.55,0]],.055,M.gold);sphere(0,.57,0,.09,.09,.09,M.ivory);tube([[-.65,.30,0],[0,.39,0],[.65,.30,0]],.045,M.gold);
  for(let s of [-1,1]){for(let d of [-1,1])tube([[s*.48,.33,0],[s*.48+d*.20,-.18,.03]],.013,M.lightGold);bowl(s*.48,-.21,.035,.24);}break;
 case'skorpions':
  for(let s of [-1,1]){for(let i=0;i<4;i++)tube([[s*.15,-.25+i*.13,0],[s*.42,-.35+i*.17,0],[s*.62,-.40+i*.17,.03]],.028,M.gold);tube([[s*.17,.20,0],[s*.40,.39,0],[s*.47,.57,.01]],.04,M.gold);sphere(s*.48,.60,0,.13,.16,.09,M.ivory);}
  for(let i=0;i<5;i++)sphere(0,.10-i*.1,.04,.19-i*.012,.085,.12,i%2?M.gold:M.ivory);
  tube([[0,-.31,-.03],[.18,-.52,-.09],[.45,-.4,-.04],[.51,-.11,.02],[.43,.14,.1],[.31,.20,.2]],t=>.085*(1-t)+.015,M.gold);sphere(.30,.17,.22,.055,.10,.06,M.dark);eye(-.06,.25,.13,.025);eye(.06,.25,.13,.025);break;
 case'strelnieks':
  sphere(-.16,-.31,-.04,.43,.21,.18,M.ivory);for(const x of [-.44,.04])for(const z of [-.11,.11])tube([[x,-.37,z],[x+.06,-.69,z]],.044,M.gold);
  sphere(.14,.02,0,.18,.30,.16,M.wine);head(.14,.39,0,.76,M.gold);tube([[.18,.15,0],[.4,.14,.14],[.52,.28,.13]],.06,M.ivory);tube([[.06,.18,0],[-.13,.11,.13],[-.25,.30,.13]],.06,M.ivory);
  arc(.30,.28,.14,.34,.48,-1.25,1.25,.022,M.gold);tube([[.41,-.17,.14],[.41,.73,.14]],.009,M.ivory);tube([[-.25,.29,.15],[.79,.29,.15]],.015,M.gold);tube([[.68,.36,.15],[.80,.29,.15],[.68,.22,.15]],.022,M.gold);break;
 case'mezazis':
  for(let s of [-1,1]){horn(s,true);sphere(s*.29,.03,0,.21,.10,.08);}
  sphere(0,-.08,.05,.27,.40,.24);sphere(0,-.36,.23,.16,.14,.13);tube([[0,-.36,.12],[0,-.64,.15]],t=>.085*(1-t)+.008,M.gold);eye(-.12,.04,.25,.026);eye(.12,.04,.25,.026);break;
 case'udensvirs':
  sphere(-.12,.04,0,.32,.43,.25,M.ivory);tube([[-.25,.38,0],[-.25,.60,0],[.01,.60,0],[.07,.39,0]],.07,M.gold);arc(-.12,-.08,.25,.25,.12,Math.PI,2*Math.PI,.012,M.gold);arc(.20,.18,0,.27,.25,-1.3,1.3,.055,M.gold);
  for(let j=0;j<3;j++)tube([[.08,.58,.04],[.36,.45,.12],[.48,.12,.17],[.54,-.28,.19],[.44+j*.12,-.62,.20]],t=>.04-.015*t,j%2?M.teal:M.water);bowl(.34,-.65,.1,.48);break;
 case'zivis':fish(-.08,.29,1);fish(.08,-.29,-1);arc(0,0,-.10,.63,.65,.7,3.9,.012,M.gold);break;
 default:throw new Error('Unknown zodiac sculpture: '+slug);
 }
 return faces;
}

export function packedSculpture(faces){
 const data=[];
 for(const f of faces){const rgb=f.c.slice(1).match(/../g).map(v=>parseInt(v,16)/255);for(let i=1;i<f.p.length-1;i++)for(const k of [0,i,i+1])data.push(...f.p[k],...f.n[k],...rgb);}
 return new Float32Array(data);
}

export function sculpturePreview(faces,prefix='model'){
 const light=unit([-.45,.7,1.3]),cam=([x,y,z])=>{const a=-.20,b=.10,X=x*Math.cos(a)+z*Math.sin(a),Z=-x*Math.sin(a)+z*Math.cos(a);return [X,y*Math.cos(b)-Z*Math.sin(b),y*Math.sin(b)+Z*Math.cos(b)];};
 const spheres=[...new Set(faces.filter(f=>f.sphere).map(f=>f.sphere))], ids=new Map(spheres.map((s,i)=>[s,prefix+'-surface-'+i]));
 const gradients=spheres.map(s=>{const p=cam([s.x,s.y,s.z]),rx=Math.sqrt((s.rx*Math.cos(-.2))**2+(s.rz*Math.sin(-.2))**2)*102,ry=Math.sqrt((s.ry*Math.cos(.1))**2+(s.rx*Math.sin(-.2)*Math.sin(.1))**2+(s.rz*Math.cos(-.2)*Math.sin(.1))**2)*102;
 const rgb=s.c.slice(1).match(/../g).map(v=>parseInt(v,16)),color=(k,w=0)=>'#'+rgb.map(v=>Math.round(Math.max(0,Math.min(255,v*k+(255-v)*w))).toString(16).padStart(2,'0')).join('');
 return `<radialGradient id="${ids.get(s)}" gradientUnits="userSpaceOnUse" cx="${(128+p[0]*102-rx*.32).toFixed(2)}" cy="${(124-p[1]*102-ry*.36).toFixed(2)}" r="${(rx*1.48).toFixed(2)}" gradientTransform="translate(0 ${(124-p[1]*102)*(1-ry/rx)}) scale(1 ${ry/rx})"><stop stop-color="${color(1,.54)}"/><stop offset=".26" stop-color="${color(1.03,.08)}"/><stop offset=".58" stop-color="${color(.82)}"/><stop offset=".85" stop-color="${color(.47)}"/><stop offset="1" stop-color="${color(.30)}"/></radialGradient>`;
 }).join('');
 const projectedSpheres=spheres.map(s=>{const p=cam([s.x,s.y,s.z]),rx=Math.sqrt((s.rx*Math.cos(-.2))**2+(s.rz*Math.sin(-.2))**2)*102,ry=Math.sqrt((s.ry*Math.cos(.1))**2+(s.rx*Math.sin(-.2)*Math.sin(.1))**2+(s.rz*Math.cos(-.2)*Math.sin(.1))**2)*102;return {depth:p[2],html:`<ellipse cx="${(128+p[0]*102).toFixed(2)}" cy="${(124-p[1]*102).toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="url(#${ids.get(s)})"/>`};});
 const tubes=[...new Set(faces.filter(f=>f.tube).map(f=>f.tube))].filter(t=>Math.max(...[0,.25,.5,.75,1].map(v=>typeof t.r==='function'?t.r(v):t.r))<=.04),tubeDefs=[];
 const projectedTubes=tubes.map((t,index)=>{const points=t.points.map(cam),radii=points.map((_,i)=>(typeof t.r==='function'?t.r(i/(points.length-1)):t.r)*102),edges=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],n=unit([-(b[1]-a[1]),b[0]-a[0],0]);return [p,n];}),left=edges.map(([p,n],i)=>[128+p[0]*102+n[0]*radii[i],124-p[1]*102-n[1]*radii[i]]),right=edges.map(([p,n],i)=>[128+p[0]*102-n[0]*radii[i],124-p[1]*102+n[1]*radii[i]]),id=prefix+'-tube-'+index,mid=edges[Math.floor(edges.length/2)],r=Math.max(...radii),cx=128+mid[0][0]*102,cy=124-mid[0][1]*102,n=mid[1];
 const rgb=t.c.slice(1).match(/../g).map(v=>parseInt(v,16)),color=(k,w=0)=>'#'+rgb.map(v=>Math.round(Math.max(0,Math.min(255,v*k+(255-v)*w))).toString(16).padStart(2,'0')).join('');
 tubeDefs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${cx+n[0]*r}" y1="${cy-n[1]*r}" x2="${cx-n[0]*r}" y2="${cy+n[1]*r}"><stop stop-color="${color(.55)}"/><stop offset=".25" stop-color="${color(1,.5)}"/><stop offset=".50" stop-color="${color(1,.12)}"/><stop offset="1" stop-color="${color(.50)}"/></linearGradient>`);
 return {depth:points.reduce((sum,p)=>sum+p[2],0)/points.length,html:`<path d="M${left.concat([...right].reverse()).map(p=>p.map(v=>v.toFixed(2)).join(' ')).join('L')}Z" fill="url(#${id})" stroke="${color(.6)}" stroke-width=".13" stroke-linejoin="round"/>`};});
 return '<defs>'+gradients+tubeDefs.join('')+'</defs>'+faces.filter(f=>!f.sphere&&(!f.tube||!tubes.includes(f.tube))).map(f=>{const normal=unit(cam(f.n.reduce((a,n)=>add(a,n),[0,0,0])));if(normal[2]<-.08)return null;const p=f.p.map(cam),depth=p.reduce((sum,v)=>sum+v[2],0)/p.length;
  const diffuse=Math.max(0,normal.reduce((s,v,i)=>s+v*light[i],0)),spec=Math.max(0,normal.reduce((s,v,i)=>s+v*unit(add(light,[0,0,1]))[i],0))**36;
  const rgb=f.c.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,Math.round(parseInt(v,16)*(.48+.55*diffuse)+spec*75))));
  const fill=f.sphere?'url(#'+ids.get(f.sphere)+')':'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
  return {depth,html:`<polygon fill="${fill}" stroke="${fill}" stroke-width=".32" stroke-linejoin="round" points="${p.map(v=>(128+v[0]*102).toFixed(1)+','+(124-v[1]*102).toFixed(1)).join(' ')}"/>`};
 }).filter(Boolean).concat(projectedSpheres,projectedTubes).sort((a,b)=>a.depth-b.depth).map(f=>f.html).join('');
}
