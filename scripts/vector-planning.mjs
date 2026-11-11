/* Original smooth vector objects. No photographic or raster elements. */
const n=v=>Math.round(v*100)/100;
const pt=(q,u,v)=>({x:q[0][0]*(1-u)*(1-v)+q[1][0]*u*(1-v)+q[2][0]*u*v+q[3][0]*(1-u)*v,y:q[0][1]*(1-u)*(1-v)+q[1][1]*u*(1-v)+q[2][1]*u*v+q[3][1]*(1-u)*v});
const xy=p=>`${n(p.x)} ${n(p.y)}`;
const panel=(q,u,v,w,h,fill,extra='')=>{const a=pt(q,u,v),b=pt(q,u+w,v),c=pt(q,u+w,v+h),d=pt(q,u,v+h);return `<path d="M${xy(a)}L${xy(b)}L${xy(c)}L${xy(d)}Z" fill="${fill}" ${extra}/>`;};
const rule=(q,u,v,U,V,color,width=1)=>`<path d="M${xy(pt(q,u,v))}L${xy(pt(q,U,V))}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const floor=id=>`<ellipse cx="162" cy="227" rx="104" ry="10" fill="#49343d" opacity=".16" filter="url(#${id}-soft)"/>`;
const brass=(id,x,y,w=15,h=18)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#${id}-gold)" stroke="#8c713b" stroke-width=".7"/><path d="M${x+3} ${y+3}h${w-6}" stroke="#fff3c6" stroke-width="1.4" stroke-linecap="round"/><path d="M${x+4} ${y+h-4}h${w-8}" stroke="#9e7a39" stroke-width="1"/>`;

function calendar(id){
 const q=[[90,105],[226,115],[228,200],[92,191]],cells=[];
 for(let row=0;row<5;row++)for(let col=0;col<7;col++){
  const fill=col>4?'#ead5dc':row===2&&col===3?'#9b3e5b':'#ddd9cd';
  cells.push(panel(q,col/7+.017,row/5+.027,.105,.127,fill));
  if(row===2&&col===3){const p=pt(q,col/7+.069,row/5+.11);cells.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="2.4" fill="#fff4e7"/>`);}
 }
 return `${floor(id)}
 <g filter="url(#${id}-shadow)">
  <path d="M213 65L258 213Q259 217 252 220L224 221L202 72Z" fill="url(#${id}-ink)"/>
  <path d="M222 79L249 211L231 213L209 82Z" fill="#503b42"/>
  <path d="M77 58Q77 50 86 51L229 63Q237 64 238 74L245 210Q245 218 237 219L93 225L81 215Z" fill="#c8c4b8"/>
  <path d="M79 55Q79 48 88 49L230 61L240 208Q240 216 231 217L92 220Q85 219 85 211Z" fill="url(#${id}-paper)" stroke="#b9b7ab" stroke-width="1.1"/>
  <path d="M82 91L235 104L241 208Q241 215 231 216L92 218L87 212Z" fill="#fffcf1"/>
  <path d="M81 55Q81 48 88 49L230 61L234 103L85 91Z" fill="url(#${id}-wine)"/>
  <path d="M88 51L229 63" stroke="#dca6b6" stroke-width="1.5" opacity=".7"/>
  <path d="M86 90L234 102" stroke="#521a32" stroke-width="2.7" opacity=".6"/>
  <path d="M92 216L235 213M92 221L237 218" fill="none" stroke="#999b93" stroke-width=".65"/>
  ${cells.join('')}
  <path d="M93 100L224 111" stroke="#bcb3aa" stroke-width="1"/>
  <path d="M91 205L226 211" stroke="#c8c1b8" stroke-width=".8"/>
  <path d="M102 64C95 54 99 37 107 37C116 37 119 48 118 59" fill="none" stroke="#4b4d4b" stroke-width="7" stroke-linecap="round"/>
  <path d="M102 63C97 53 101 39 107 39C113 39 116 48 115 58" fill="none" stroke="url(#${id}-metal)" stroke-width="4.8" stroke-linecap="round"/>
  <path d="M104 42C107 39 111 42 113 46" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M195 72C188 62 191 45 199 45C208 45 212 57 210 69" fill="none" stroke="#4b4d4b" stroke-width="7" stroke-linecap="round"/>
  <path d="M195 71C190 61 194 47 199 47C206 47 209 58 207 67" fill="none" stroke="url(#${id}-metal)" stroke-width="4.8" stroke-linecap="round"/>
  <path d="M196 51C200 46 205 52 206 56" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
 </g>`;
}

function week(id){
 const q=[[64,93],[266,78],[274,183],[70,202]],parts=[];
 for(let col=0;col<7;col++){
  parts.push(panel(q,col/7+.008,.018,.128,.17,col>4?'#ad6c81':'#8b3854'));
  for(let row=0;row<4;row++)parts.push(rule(q,col/7+.02,.3+row*.16,(col+1)/7-.02,.3+row*.16,'#d7cfc3',.8));
  if(col<6)parts.push(rule(q,(col+1)/7,0,(col+1)/7,.96,'#c8c0b6',.8));
 }
 parts.push(panel(q,.158,.33,.1,.21,'#dce5de'));
 parts.push(panel(q,.439,.49,.105,.24,'#ebd2db'));
 parts.push(panel(q,.731,.29,.104,.17,'#e9d7aa'));
 return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M41 78L267 55Q276 55 278 64L290 193Q291 202 281 205L62 224Q49 226 47 215Z" fill="url(#${id}-wine)"/>
 <path d="M46 72L268 57Q275 56 277 65L286 191L65 214Q55 215 53 206Z" fill="#bdb7a9"/>
 <path d="M46 68L267 53Q273 53 274 61L285 187L62 211Q53 211 52 203Z" fill="url(#${id}-paper)" stroke="#beb8ad" stroke-width=".9"/>
 <path d="M61 87L267 72" stroke="#b8b0a8" stroke-width="1.2"/>
 <path d="M65 209L281 188M64 213L282 193" stroke="#e4ded3" stroke-width="1"/>
 ${parts.join('')}
 ${[86,112,138,164,190].map(y=>`<path d="M56 ${y}C39 ${y+3} 37 ${y-11} 48 ${y-13}C55 ${y-14} 61 ${y-10} 61 ${y-5}" stroke="#545955" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M55 ${y-1}C42 ${y+1} 41 ${y-9} 48 ${y-11}C54 ${y-12} 58 ${y-9} 58 ${y-5}" stroke="url(#${id}-metal)" stroke-width="3.6" fill="none" stroke-linecap="round"/>`).join('')}
 <path d="M246 191L275 187L255 205Z" fill="#f0eadd"/><path d="M246 191L255 205L253 192Z" fill="#c5bbaa"/>
 </g>`;
}

function planner(id){return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M86 38Q91 31 103 35L235 71Q244 73 242 85L218 218Q217 227 206 226L72 188Q64 185 66 175Z" fill="#4e1b31"/>
 <path d="M91 40L230 77L207 216L74 180Z" fill="#d0c9b8"/>
 <path d="M93 42L230 78L207 210L75 177Z" fill="url(#${id}-paper)"/>
 <path d="M84 34Q91 28 102 32L238 69Q244 72 243 81L219 213Q217 219 208 216L74 179Q66 176 68 167L84 34Z" fill="url(#${id}-wine)"/>
 <path d="M91 38L232 75L208 208L76 172Z" fill="none" stroke="#bd7c8d" stroke-width="1.2" stroke-dasharray="2.2 3.2" opacity=".8"/>
 <path d="M85 35L70 168Q67 177 76 180L88 182L112 36L102 32Q91 28 85 35Z" fill="#63233d"/>
 <path d="M91 37L74 169" stroke="#d08da1" stroke-width="2.3" opacity=".52"/>
 <path d="M177 53L194 58L170 207L153 202Z" fill="#64223b"/><path d="M179 54L182 55L158 202L155 201Z" fill="#d58b9d" opacity=".55"/>
 <path d="M125 188L137 192L132 222L126 216L118 218Z" fill="url(#${id}-gold)"/>
 <path d="M112 88L151 98L146 126L108 115Z" fill="none" stroke="#ddbc72" stroke-width="1.3" opacity=".9"/>
 <path d="M114 96L149 105M119 100L116 115M130 103L127 119M141 106L138 122" stroke="#d2a965" stroke-width="1.2" opacity=".8"/>
 <path d="M248 93L261 98L238 207L229 220L227 202Z" fill="url(#${id}-metal)"/>
 <path d="M249 94L257 97L236 198L230 204Z" fill="url(#${id}-teal)"/>
 <path d="M252 110L256 111L251 138Q250 143 246 141" fill="none" stroke="#e8e3ca" stroke-width="2"/>
 <path d="M231 206L234 210L229 220Z" fill="#443b35"/>
 </g>`;}

function timetable(id){
 const q=[[77,89],[244,76],[255,191],[87,207]],cells=[];
 for(let col=0;col<5;col++){
  cells.push(panel(q,col/5+.012,.025,.177,.125,'#85354f'));
  for(let row=0;row<5;row++)cells.push(panel(q,col/5+.018,.205+row*.15,.165,.118,((col*3+row)%6===0?'#a9c5bb':(col+row*2)%5===0?'#deb2c1':(col*2+row)%7===0?'#e4cc95':'#eee8da'),'stroke="#d9d2c3" stroke-width=".4"'));
 }
 return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M60 55L252 38Q265 37 267 49L281 205Q281 214 269 216L78 232Q66 233 64 221L49 69Q48 57 60 55Z" fill="url(#${id}-ink)"/>
 <path d="M58 54L251 39Q260 38 261 48L275 204Q276 212 267 212L76 228Q67 229 66 220L52 65Q51 56 58 54Z" fill="url(#${id}-metal)"/>
 <path d="M66 61L248 47L263 201L78 218Z" fill="url(#${id}-paper)" stroke="#a6ada5" stroke-width=".8"/>
 <path d="M74 81L244 67" stroke="#c3b9ac" stroke-width="1.1"/>
 ${cells.join('')}
 <path d="M128 42L184 37L188 55Q187 62 181 63L139 67Q132 68 131 61Z" fill="url(#${id}-metal)" stroke="#687673" stroke-width=".8"/>
 <path d="M139 42L177 39L178 49L140 53Z" fill="#687873"/><path d="M139 43L177 40" stroke="#fff" stroke-width="1.5"/>
 <path d="M135 61L184 56" stroke="#f8faf3" stroke-width="1.5"/>
 <circle cx="237" cy="61" r="4.4" fill="url(#${id}-gold)"/><circle cx="89" cy="214" r="3" fill="#a06a7e"/>
 </g>`;
}

function school(id){return `${floor(id)}
 <g transform="rotate(16 263 120)" filter="url(#${id}-shadow)"><path d="M257 47Q263 41 269 47L271 182L264 207L257 183Z" fill="url(#${id}-gold)"/><path d="M257 47L262 45L264 182L257 183Z" fill="#e8c67e"/><path d="M263 46L267 47L271 182L266 185Z" fill="#bd8a40"/><path d="M257 182L271 182L264 207Z" fill="#dfc7a0"/><path d="M262 199L264 207L267 199Z" fill="#3b3840"/><path d="M257 49L269 49L269 63L257 63Z" fill="#c58b9d"/><path d="M257 63H269V71H257Z" fill="url(#${id}-metal)"/></g>
 <g filter="url(#${id}-shadow)">
 <path d="M36 69Q92 47 155 72Q206 42 262 58L269 201Q220 201 160 226Q111 205 46 216Z" fill="url(#${id}-wine)"/>
 <path d="M40 61Q94 47 155 72Q207 42 259 57L262 198Q214 197 160 221Q109 202 48 209Z" fill="#c3bdaf"/>
 <path d="M42 57Q96 44 155 69Q207 40 256 54L258 193Q208 192 159 214Q108 194 48 202Z" fill="url(#${id}-paper)" stroke="#c2baac" stroke-width=".8"/>
 <path d="M46 48Q98 40 155 67L158 208Q105 184 53 193Z" fill="#fffaf0"/>
 <path d="M155 67Q207 36 252 45L254 186Q206 181 158 208Z" fill="#f4ecd9"/>
 <path d="M155 67L158 208" fill="none" stroke="#b9ac94" stroke-width="4" opacity=".4"/>
 <path d="M158 68Q206 39 250 47" fill="none" stroke="#fffdf6" stroke-width="2"/>
 <path d="M49 51Q99 43 152 68" fill="none" stroke="#fff" stroke-width="2"/>
 <path d="M226 45L237 44L239 139L232 133L226 142Z" fill="url(#${id}-wine)"/><path d="M229 46L231 46L232 132" stroke="#df9fb1" stroke-width=".8"/>
 ${[84,103,122,141,160].map((y,i)=>`<path d="M${59+i*.6} ${y}Q103 ${y-2} 143 ${y+16}" fill="none" stroke="#b8b0a1" stroke-width="1.4" stroke-linecap="round" opacity=".75"/>`).join('')}
 ${[84,103,122,141,160].map((y,i)=>`<path d="M172 ${y+10}Q208 ${y-8} ${239+i*.5} ${y-8}" fill="none" stroke="#beb19a" stroke-width="1.4" stroke-linecap="round" opacity=".75"/>`).join('')}
 <path d="M52 197Q108 190 157 214Q208 190 258 194M50 203Q109 196 158 219Q211 197 261 200" fill="none" stroke="#e7ddca" stroke-width="1"/>
 </g>`;}

function alltools(id){return `${floor(id)}
 <g filter="url(#${id}-shadow)">
 <path d="M142 72L254 61L266 169L154 181Z" fill="#c4beaf"/>
 <path d="M137 66L250 55L262 164L149 177Z" fill="url(#${id}-paper)" stroke="#c8bcad" stroke-width=".8"/>
 <path d="M151 90L237 81M153 105L240 96M155 121L240 112M157 137L220 130" stroke="#c3b7a8" stroke-width="1.5" stroke-linecap="round"/>
 <path d="M153 67L163 66L163 56Q157 51 153 58Z" fill="url(#${id}-gold)"/>
 <path d="M61 54L70 50L114 159L105 163Z" fill="url(#${id}-gold)"/><path d="M61 54L62 39L70 50Z" fill="#ddc099"/><path d="M61 43L62 39L65 44Z" fill="#3d3540"/>
 <path d="M94 39L104 39L106 161L95 161Z" fill="url(#${id}-teal)"/><path d="M95 39L103 39L103 54L95 54Z" fill="url(#${id}-metal)"/>
 <path d="M125 63L134 68L108 170L98 166Z" fill="url(#${id}-wine)"/><path d="M125 63L131 51L134 68Z" fill="#dec5a2"/><path d="M129 55L131 51L132 57Z" fill="#3d3540"/>
 <path d="M57 139Q60 127 99 127Q137 127 140 138L132 211Q129 224 98 224Q65 222 64 211Z" fill="url(#${id}-wine)"/>
 <ellipse cx="99" cy="138" rx="42" ry="12" fill="#b36e83"/>
 <ellipse cx="99" cy="138" rx="36" ry="8" fill="#59313f"/>
 <path d="M63 145Q66 151 76 151L82 212Q82 218 72 214Z" fill="#cd8ca0" opacity=".38"/>
 <path d="M129 146L123 215" stroke="#491e31" stroke-width="3" opacity=".35"/>
 <path d="M67 208Q95 220 130 210" fill="none" stroke="#c28b9b" stroke-width="1" opacity=".8"/>
 </g>
 ${clock(id+'-desk',216,177,46,true,id)}
 <path d="M179 222L261 213" stroke="#5a4050" stroke-width="2.4" opacity=".17"/>`;
}

function calculator(id){
 const q=[[103,111],[225,124],[212,198],[90,184]],keys=[];
 const labels=['7','8','9','÷','4','5','6','×','1','2','3','−','0','·','=','+'];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const u=col*.25+.025,v=row*.25+.025,p=pt(q,u+.092,v+.105),fill=col===3?`url(#${id}-gold)`:row===3&&col===2?`url(#${id}-wine)`:`url(#${id}-paper)`;
  keys.push(panel(q,u,v+.038,.198,.175,'#1b3b3c'));
  keys.push(panel(q,u,v,.198,.175,fill,'stroke="#d9dbcf" stroke-opacity=".5" stroke-width=".5"'));
  keys.push(`<text x="${n(p.x)}" y="${n(p.y)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(6 ${n(p.x)} ${n(p.y)})" font-family="Arial,sans-serif" font-size="10" font-weight="600" fill="${row===3&&col===2?'#fff5e9':'#4b5051'}">${labels[row*4+col]}</text>`);
 }
 const digit=(x,y,value)=>{
  const map={'3':[0,1,2,3,6],'6':[0,2,3,4,5,6],'5':[0,2,3,5,6]},seg=['M2 1H12','M13 3V11','M13 15V23','M2 25H12','M1 15V23','M1 3V11','M2 13H12'];
  return `<g transform="translate(${x} ${y}) rotate(6)" stroke="#31463d" stroke-width="2.6" stroke-linecap="round">${map[value].map(i=>`<path d="${seg[i]}"/>`).join('')}</g>`;
 };
 return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M104 38L234 52Q248 54 245 70L227 207Q225 221 211 220L84 205Q73 204 75 189L91 52Q92 39 104 38Z" fill="#17393b"/>
 <path d="M100 33L233 48Q244 50 242 63L223 203Q222 213 210 212L82 198Q72 197 74 185L90 46Q91 34 100 33Z" fill="url(#${id}-metal)"/>
 <path d="M101 37L231 52Q239 53 237 63L219 201Q218 208 210 207L82 193Q77 192 78 185L94 46Q95 38 101 37Z" fill="url(#${id}-teal)"/>
 <path d="M106 53L226 66L220 106L101 93Z" fill="#1b3738"/>
 <path d="M110 58L221 70L217 99L106 88Z" fill="#c5d3bc" stroke="#d9e6d6" stroke-width=".7"/>
 <path d="M110 58L221 70L219 78L109 67Z" fill="#e2ead8" opacity=".43"/>
 ${digit(156,65,'3')}${digit(176,67,'6')}${digit(196,69,'5')}
 <path d="M104 100L220 112" stroke="#abc9c0" stroke-width="1" opacity=".55"/>
 ${keys.join('')}
 <path d="M95 44L80 186" stroke="#c2ded3" stroke-width="1.1" opacity=".46"/>
 </g>`;
}

function clock(key,cx,cy,r,night=false,material=key){
 const ticks=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,rr=r*.73,rr2=r*(i%3===0?.59:.66);return `<path d="M${n(cx+Math.sin(a)*rr)} ${n(cy-Math.cos(a)*rr)}L${n(cx+Math.sin(a)*rr2)} ${n(cy-Math.cos(a)*rr2)}" stroke="${night?'#d9c494':'#758181'}" stroke-width="${i%3===0?2.3:1.3}" stroke-linecap="round"/>`;}).join('');
 return `<defs><radialGradient id="${key}-face" cx="34%" cy="23%" r="91%"><stop stop-color="${night?'#4c6571':'#ffffff'}"/><stop offset=".65" stop-color="${night?'#283f4b':'#eaf1ed'}"/><stop offset="1" stop-color="${night?'#172a34':'#b9c9c8'}"/></radialGradient></defs>
 <g filter="url(#${material}-shadow)"><circle cx="${cx+2}" cy="${cy+4}" r="${r}" fill="#32484c"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${material}-metal)" stroke="#aebbb6" stroke-width=".7"/><circle cx="${cx}" cy="${cy}" r="${r*.85}" fill="url(#${key}-face)" stroke="#fff9e7" stroke-width="${r*.025}"/>${ticks}
 <path d="M${cx} ${cy}L${n(cx-r*.29)} ${n(cy-r*.22)}" stroke="${night?'#d7c697':'#334a50'}" stroke-width="${r*.095}" stroke-linecap="round"/>
 <path d="M${cx} ${cy}L${n(cx+r*.39)} ${n(cy-r*.36)}" stroke="${night?'#f4e5bd':'#4b636a'}" stroke-width="${r*.061}" stroke-linecap="round"/>
 <path d="M${n(cx-r*.22)} ${n(cy-r*.43)}L${n(cx+r*.3)} ${n(cy+r*.47)}" stroke="#a74762" stroke-width="${r*.025}" stroke-linecap="round"/>
 <circle cx="${cx}" cy="${cy}" r="${r*.07}" fill="url(#${material}-wine)"/><circle cx="${cx-r*.018}" cy="${cy-r*.022}" r="${r*.026}" fill="#f8dfe8"/>
 <path d="M${n(cx-r*.63)} ${n(cy-r*.22)}A${r*.67} ${r*.67} 0 0 1 ${n(cx+r*.4)} ${n(cy-r*.56)}" stroke="#fff" stroke-width="${r*.045}" opacity=".56" fill="none" stroke-linecap="round"/>
 </g>`;
}

function shift(id){return `${floor(id)}
 <path d="M74 196C33 151 50 64 118 42C183 20 246 45 270 98" stroke="#254b49" stroke-width="11" stroke-linecap="round" fill="none"/>
 <path d="M73 193C36 150 54 66 118 45C181 25 241 48 266 98" stroke="url(#${id}-teal)" stroke-width="7" stroke-linecap="round" fill="none"/>
 <path d="M253 92L270 119L280 90Q268 99 253 92Z" fill="url(#${id}-teal)"/>
 ${clock(id+'-day',126,125,76,false,id)}
 ${clock(id+'-night',223,174,49,true,id)}
 <path d="M261 207C241 231 204 240 176 226" fill="none" stroke="url(#${id}-gold)" stroke-width="7" stroke-linecap="round"/>
 <path d="M177 214L159 219L174 234Z" fill="url(#${id}-gold)"/>`;
}

function work(id){return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M79 73L82 48L177 43L195 74Z" fill="#d5cab5"/>
 <path d="M83 71L85 51L177 47L188 74Z" fill="url(#${id}-paper)"/><path d="M91 58L165 55" stroke="#c0b39d" stroke-width="1.2"/>
 <path d="M132 75L132 50Q132 38 145 37L181 36Q195 36 196 49L197 75L186 77L185 52Q184 47 178 47L149 48Q143 48 144 54L145 76Z" fill="url(#${id}-ink)" stroke="#69685e" stroke-width=".8"/>
 <path d="M138 71L138 51Q138 43 148 42L179 41Q189 41 189 51" fill="none" stroke="#b0a98b" stroke-width="1.8" opacity=".55"/>
 <path d="M70 81L256 71Q268 70 271 83L278 201Q278 214 265 217L79 229Q66 230 64 217L55 96Q54 84 70 81Z" fill="#173e3d"/>
 <path d="M66 79L249 69Q260 68 262 82L270 202Q271 213 259 214L75 225Q64 226 63 214L55 93Q54 81 66 79Z" fill="url(#${id}-teal)"/>
 <path d="M64 87L252 76L257 116Q257 126 245 128L81 140Q69 141 66 130Z" fill="#244c49" opacity=".7"/>
 <path d="M62 79L249 69Q260 68 261 80L264 115Q264 126 251 127L78 139Q65 140 64 129L57 93Q55 82 62 79Z" fill="url(#${id}-teal)" stroke="#71958a" stroke-width=".9"/>
 <path d="M67 86L250 76L254 114Q254 120 247 121L80 132Q74 133 72 125Z" stroke="#b3b895" stroke-width="1" stroke-dasharray="2 3" fill="none" opacity=".7"/>
 <path d="M74 145L81 215L256 204L251 137" stroke="#92ae99" stroke-width="1" stroke-dasharray="2 3" fill="none" opacity=".55"/>
 <path d="M68 145L74 213" stroke="#8eb0a2" stroke-width="2.3" opacity=".25"/>
 ${brass(id,91,119,18,24)}${brass(id,222,110,18,24)}
 <path d="M96 128H104V135H96ZM227 119H235V126H227Z" fill="#69542d"/>
 <path d="M134 157L193 153L194 175L135 179Z" fill="#264c48" stroke="#86a595" stroke-width=".7"/>
 <path d="M144 164L184 161" stroke="#a7b89f" stroke-width="1.1" opacity=".55"/>
 </g>`;}


function downloadArrow(id,x,y,teal=false){return `<g filter="url(#${id}-shadow)">
 <path d="M${x-10} ${y-29}H${x+10}V${y+1}H${x+24}L${x+2} ${y+26}L${x-24} ${y+1}H${x-10}Z" fill="${teal?'#174341':'#501a31'}" transform="translate(2 3)"/>
 <path d="M${x-10} ${y-29}H${x+10}V${y+1}H${x+24}L${x} ${y+25}L${x-24} ${y+1}H${x-10}Z" fill="url(#${id}-${teal?'teal':'wine'})" stroke="${teal?'#326b62':'#8a3a55'}" stroke-width=".8"/>
 <path d="M${x-7} ${y-26}H${x+6}M${x-7} ${y-25}V${y+5}H${x-17}L${x-1} ${y+20}" fill="none" stroke="${teal?'#b0d6c4':'#e5a7bd'}" stroke-opacity=".8" stroke-width="1.3" stroke-linecap="round"/>
 <path d="M${x-31} ${y+31}V${y+40}H${x+32}V${y+31}" fill="none" stroke="url(#${id}-metal)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
 </g>`;}

function pdf(id){return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M85 34Q85 26 95 28L191 36L232 81L236 207Q237 215 227 216L96 226Q87 227 87 218Z" fill="#a99f91"/>
 <path d="M81 30Q81 23 91 25L187 33L229 79L232 203Q233 211 223 212L92 222Q83 222 83 214Z" fill="url(#${id}-paper)" stroke="#bdb5a7" stroke-width="1"/>
 <path d="M88 32L181 39L185 80Q185 88 193 89L223 92L226 201L91 213Z" fill="#fffaf0"/>
 <path d="M187 33L229 79L195 83Q188 82 188 75Z" fill="#e3d7c2"/>
 <path d="M187 33L197 73L229 79L196 83Q188 82 188 75Z" fill="#c1b39b" opacity=".6"/>
 <path d="M187 33L195 73L229 79L194 77Z" fill="#fffdf6"/>
 <path d="M99 99L201 106L201 146L99 139Z" fill="url(#${id}-wine)"/>
 <path d="M102 101L198 108" stroke="#d991ab" stroke-width="1.2" opacity=".7"/>
 <text x="112" y="129" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="700" letter-spacing="1" fill="#fff9ee" transform="rotate(4 112 129)">PDF</text>
 <path d="M101 159L193 164M101 174L176 178M101 188L156 191" fill="none" stroke="#bdb4a6" stroke-width="2" stroke-linecap="round"/>
 <path d="M87 215L221 205" stroke="#fdf8ea" stroke-width="1.4"/>
 </g>${downloadArrow(id,247,171)}`;}

function imageFile(id){return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M63 60L206 42L231 201L86 220Z" fill="#b7b4a4"/>
 <path d="M60 54L204 36L226 193L82 212Z" fill="url(#${id}-paper)" stroke="#c0b5a4" stroke-width="1"/>
 <path d="M80 48L201 33L220 48L239 182L96 204L75 58Q74 50 80 48Z" fill="#e3daca"/>
 <path d="M77 44L197 29L218 45L237 178L94 200L72 54Q71 46 77 44Z" fill="url(#${id}-paper)" stroke="#c1b7a5" stroke-width=".9"/>
 <path d="M197 29L218 45L201 47Z" fill="#fffdf4"/><path d="M201 47L218 45L221 55Z" fill="#bfb39c"/>
 <path d="M89 62L212 47L227 159L104 176Z" fill="url(#${id}-teal)"/>
 <path d="M90 64L210 49L214 83L94 98Z" fill="#a4c7bc" opacity=".6"/>
 <circle cx="123" cy="89" r="13" fill="url(#${id}-gold)"/>
 <path d="M98 131L143 98L172 129L193 109L224 141L227 159L104 176Z" fill="#638777"/>
 <path d="M143 98L172 129L154 124Z" fill="#d1dbc9"/>
 <path d="M98 131L143 98L128 143L104 161Z" fill="#365e56"/>
 <path d="M108 160L158 119L190 146L224 127L227 159L104 176Z" fill="#2c4b48"/>
 <path d="M111 155L158 119L165 143L152 137Z" fill="#a5bba5"/>
 <path d="M89 62L212 47L227 159L104 176Z" fill="none" stroke="#faf7e9" stroke-width="1.1"/>
 <path d="M107 187L166 179" stroke="#c0b4a4" stroke-width="2.2" stroke-linecap="round"/>
 </g>${downloadArrow(id,252,175,true)}`;}

function printer(id){return `${floor(id)}<g filter="url(#${id}-shadow)">
 <path d="M88 36L212 40L230 114L106 119Z" fill="#c6c1b2"/>
 <path d="M84 30L208 34L223 106L100 111Z" fill="url(#${id}-paper)" stroke="#c5bcac" stroke-width=".8"/>
 <path d="M101 50L194 53M104 61L190 64M107 72L179 75" stroke="#c4bba9" stroke-width="1.8" stroke-linecap="round"/>
 <path d="M60 93L250 87Q262 87 266 99L278 172Q281 188 266 191L69 206Q53 207 51 191L42 118Q39 102 60 93Z" fill="#1d4542"/>
 <path d="M57 89L246 83Q258 83 261 96L272 166Q275 180 260 182L65 197Q51 198 49 184L40 112Q38 97 57 89Z" fill="url(#${id}-teal)"/>
 <path d="M57 89L246 83Q258 83 261 96L263 110L47 125L40 112Q38 97 57 89Z" fill="url(#${id}-metal)"/>
 <path d="M61 96L244 90L249 105L51 119Z" fill="#e8e8dd"/>
 <path d="M103 99L220 95L216 106L103 113Z" fill="#314b49"/>
 <path d="M61 129L260 115" stroke="#9fbbac" stroke-width="1.2" opacity=".55"/>
 <path d="M76 143L242 132L246 152L80 164Z" fill="#173a38" stroke="#2b5750" stroke-width="1.2"/>
 <path d="M84 146L235 136" stroke="#0f2828" stroke-width="4"/>
 <path d="M76 163L247 151L252 199L82 211Z" fill="#244d47"/>
 <path d="M85 164L238 153L243 191L91 203Z" fill="#46766a"/>
 <path d="M110 148L219 141L223 202Q225 214 215 218L102 225Q96 223 99 214Z" fill="#b1ad9e"/>
 <path d="M109 145L218 138L219 200Q221 211 211 214L99 221Q94 218 97 210Z" fill="url(#${id}-paper)"/>
 <path d="M111 160L200 154M110 173L201 167M108 186L183 181" stroke="#b4ad9e" stroke-width="1.7" stroke-linecap="round"/>
 <path d="M106 198L173 193" stroke="#9c4a63" stroke-width="4" stroke-linecap="round"/>
 <path d="M101 216L208 209" stroke="#fffdf3" stroke-width="1.1"/>
 <path d="M71 196L75 207Q79 212 90 209L91 196M251 181L253 194Q258 199 269 193L267 182" fill="#1b3737"/>
 <rect x="65" y="128" width="21" height="9" rx="3" fill="#244c47" transform="rotate(-4 65 128)"/>
 <circle cx="247" cy="122" r="5" fill="#183f3b"/><circle cx="246.5" cy="121.5" r="3.3" fill="#b9cf9e"/><circle cx="245.7" cy="120.7" r="1" fill="#f9ffdc"/>
 </g>`;}

function singleClock(id){return `${floor(id)}<path d="M106 204L97 220Q94 226 103 226L122 221L127 209M194 207L202 222Q205 227 214 224L220 219L211 202" fill="url(#${id}-ink)"/>${clock(id+'-single',157,122,92,false,id)}`;}

export function planningArt(name,id){
 switch(name){
  case 'calendar':return calendar(id);
  case 'week':return week(id);
  case 'planner':return planner(id);
  case 'timetable':return timetable(id);
  case 'school':return school(id);
  case 'alltools':return alltools(id);
  case 'calculator':return calculator(id);
  case 'shift':return shift(id);
  case 'work':return work(id);
  case 'pdf':return pdf(id);
  case 'image':case 'webp':return imageFile(id);
  case 'print':return printer(id);
  case 'clock':return singleClock(id);
  default:return null;
 }
}
