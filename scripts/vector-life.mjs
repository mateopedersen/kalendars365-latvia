/* Original smooth vector objects. No photographs, embedded rasters, fonts or external resources. */
const material=(id,name)=>`url(#${id}-${name})`;
const shade=(id,x=160,y=230,rx=88,ry=9)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#473039" opacity=".15" filter="${material(id,'soft')}"/>`;
const stroke=(d,color,width=1,opacity=1)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;

function gift(id){
 const wine=material(id,'wine'),gold=material(id,'gold');
 return shade(id,165,230,89,8)+`<g filter="${material(id,'shadow')}">
 <path d="M75 109 191 139 254 112V196L191 225 75 199Z" fill="#57162c"/>
 <path d="M75 109 191 139V225L83 201Q75 199 75 191Z" fill="${wine}"/>
 <path d="M191 139 254 112V192Q254 197 248 200L191 225Z" fill="#5e1d33"/>
 <path d="M121 121 143 127V212L121 207Z" fill="${gold}"/>
 <path d="M225 125 240 119V204L225 211Z" fill="#ae813b"/>
 <path d="M64 94 137 65 265 96 191 129Z" fill="${wine}"/>
 <path d="M64 94 191 129V145L64 111Z" fill="#8f3450"/>
 <path d="M191 129 265 96V111L191 145Z" fill="#551629"/>
 <path d="M112 75 134 67 262 98 241 108Z" fill="${gold}"/>
 <path d="M121 109 192 80 215 86 143 116V132L121 126Z" fill="${gold}"/>
 ${stroke('M65 95 191 130 264 97','#efb4c2',1,.5)}
 ${stroke('M76 116V192Q76 198 83 200L188 224','#e69bb1',1,.25)}
 <path d="M163 94C149 69 124 47 108 55 89 64 96 84 116 91 132 97 146 95 163 94ZM150 86C137 68 121 59 112 64 106 68 114 79 126 83 135 86 143 87 150 86Z" fill="${gold}" fill-rule="evenodd"/>
 <path d="M160 94C177 59 200 43 215 56 234 72 212 93 160 94ZM172 85C188 65 204 58 208 64 216 74 192 83 172 85Z" fill="${gold}" fill-rule="evenodd"/>
 <path d="M155 98C145 106 138 120 132 132L147 127 153 138C159 120 161 109 167 99Z" fill="${gold}"/>
 <path d="M166 98C182 105 191 121 193 135L181 130 175 140C174 118 167 111 160 103Z" fill="${gold}"/>
 <path d="M153 84Q163 79 173 86L174 99Q162 106 151 98Z" fill="${gold}"/>
 ${stroke('M110 58C122 53 141 70 156 90M174 88C189 66 204 55 213 61','#fff1b8',1.8,.75)}
 ${stroke('M156 88Q162 85 168 89','#fff8d7',2,.7)}
 </g>`;
}

function family(id){
 return `<defs><radialGradient id="${id}-skin" cx="32%" cy="25%" r="85%"><stop stop-color="#ffe2c2"/><stop offset=".48" stop-color="#edbb94"/><stop offset="1" stop-color="#b47d60"/></radialGradient><linearGradient id="${id}-hair" x2=".8" y2="1"><stop stop-color="#72604e"/><stop offset=".5" stop-color="#443a34"/><stop offset="1" stop-color="#27282b"/></linearGradient></defs>`+shade(id,161,230,102,9)+`<g filter="${material(id,'shadow')}">
 <path d="M76 136C76 119 91 110 107 109H124C142 111 151 125 153 143L152 198Q115 217 75 198Z" fill="${material(id,'wine')}"/>
 <path d="M171 136C171 119 187 108 201 108H216C235 111 245 127 246 145L244 198Q206 216 168 198Z" fill="${material(id,'teal')}"/>
 <path d="M105 96V116Q115 128 126 115V96Z" fill="${material(id,'skin')}"/>
 <path d="M198 95V116Q208 127 219 114V95Z" fill="${material(id,'skin')}"/>
 <ellipse cx="115" cy="77" rx="26" ry="32" fill="${material(id,'skin')}"/>
 <ellipse cx="208" cy="76" rx="26" ry="32" fill="${material(id,'skin')}"/>
 <path d="M90 82C80 56 94 36 114 37 139 36 148 56 138 79L133 66C122 66 109 58 105 52 104 67 98 76 90 82Z" fill="${material(id,'hair')}"/>
 <path d="M183 79C176 64 184 47 197 42 215 34 237 45 236 68L233 83 227 63C217 64 206 60 200 53 194 61 194 73 183 79Z" fill="${material(id,'hair')}"/>
 ${stroke('M97 61Q105 43 123 45M188 59Q203 40 224 52','#b4a18b',2,.43)}
 ${stroke('M103 81h3M123 81h3M196 80h3M216 80h3','#73514a',2,.67)}
 ${stroke('M109 94Q115 98 122 94M202 93Q209 97 215 93','#a7675a',1.4,.65)}
 <path d="M94 126Q113 139 132 125M189 126Q208 138 228 125" fill="none" stroke="#f0d7c4" stroke-width="2" opacity=".24"/>
 <path d="M79 154Q89 143 101 144L128 180 119 198Q87 186 79 169Z" fill="#a84f66"/>
 <path d="M242 150Q233 142 223 146L194 182 202 198Q229 187 242 169Z" fill="#2e6e67"/>
 <path d="M123 178C124 159 139 148 155 148H168C184 148 199 164 200 182L202 220Q160 240 119 218Z" fill="${material(id,'paper')}"/>
 <path d="M152 138V155Q160 164 170 154V138Z" fill="${material(id,'skin')}"/>
 <ellipse cx="161" cy="124" rx="23" ry="28" fill="${material(id,'skin')}"/>
 <path d="M139 128C129 109 140 92 159 92 181 91 189 110 183 126L177 112Q159 113 151 102 149 117 139 128Z" fill="${material(id,'hair')}"/>
 ${stroke('M146 111Q149 99 162 98','#a4937b',1.8,.5)}
 ${stroke('M150 128h2M169 128h2','#6d4b42',1.8,.65)}
 ${stroke('M155 140Q161 144 167 140','#a7675a',1.3,.7)}
 <path d="M141 159Q161 173 181 159" fill="none" stroke="#d2bfa1" stroke-width="2"/>
 ${stroke('M135 184 131 217M189 184 193 219','#d0c2aa',1.5,.6)}
 <circle cx="161" cy="180" r="3.5" fill="${material(id,'gold')}"/><circle cx="161" cy="197" r="3.5" fill="${material(id,'gold')}"/>
 </g>`;
}

function vacation(id){
 return shade(id,168,230,84,7)+`<g filter="${material(id,'shadow')}">
 <path d="M135 64V39Q135 29 146 29H188Q198 29 198 40V65H188V42Q188 39 184 39H149Q145 39 145 43V65Z" fill="${material(id,'metal')}"/>
 <path d="M111 203V220Q111 228 119 228 128 228 128 220V204M202 209V223Q202 231 210 230 218 230 218 221V207" fill="${material(id,'ink')}"/>
 <path d="M105 64 129 53 232 62 208 74Z" fill="#8cb2a4"/>
 <path d="M213 77 232 62Q242 62 242 76V188Q242 198 233 203L213 212Z" fill="#27564f"/>
 <path d="M105 64 205 72Q216 73 216 85V199Q216 212 204 212L106 203Q95 202 95 190V77Q95 64 105 64Z" fill="${material(id,'teal')}"/>
 <path d="M108 69 203 77Q210 78 210 89V197Q210 204 202 205L107 197Q101 196 101 188V80Q101 71 108 69Z" fill="none" stroke="#b4d2c5" stroke-width="1.2" opacity=".55"/>
 <path d="M215 85V198" stroke="#173e39" stroke-width="2"/>
 ${[116,135,154,173,192].map(x=>`<path d="M${x} 88V186" stroke="#133e39" stroke-width="6" opacity=".24" stroke-linecap="round"/><path d="M${x-2} 87V185" stroke="#cae0cc" stroke-width="1.3" opacity=".48" stroke-linecap="round"/>`).join('')}
 <path d="M235 111Q240 111 240 117V147Q240 152 235 154L231 153V115Z" fill="${material(id,'ink')}"/>
 <path d="M151 74V83H164V75" fill="${material(id,'gold')}"/>
 <path d="M180 80Q171 94 177 111" fill="none" stroke="#b69a6e" stroke-width="2.2"/>
 <g transform="rotate(8 181 133)"><rect x="167" y="110" width="32" height="45" rx="4" fill="${material(id,'paper')}" stroke="#c3b28e"/><circle cx="183" cy="117" r="2.8" fill="#667b66"/><path d="M174 132H192M174 138H186" stroke="#9c8a70" stroke-width="1.5"/>${[174,178,181,185,189,192].map((x,i)=>`<path d="M${x} 145V151" stroke="#7f796e" stroke-width="${i%2?1:1.6}"/>`).join('')}</g>
 <ellipse cx="119" cy="221" rx="3" ry="5" fill="#85918d"/><ellipse cx="210" cy="224" rx="3" ry="5" fill="#85918d"/>
 ${stroke('M130 57 228 65','#d5e4d4',1.6,.6)}
 </g>`;
}

function flower(id,x,y,r,color='rose'){
 const petals=Array.from({length:6},(_,i)=>`<path transform="rotate(${i*60} ${x} ${y})" d="M${x} ${y+2}C${x-r*.8} ${y-r*.1} ${x-r*.8} ${y-r*1.25} ${x} ${y-r*1.15}C${x+r*.8} ${y-r*1.25} ${x+r*.8} ${y-r*.1} ${x} ${y+2}Z" fill="${material(id,color)}" stroke="${color==='rose'?'#a85472':'#d8c490'}" stroke-width=".5"/>`).join('');
 return `<g>${petals}<circle cx="${x}" cy="${y}" r="${r*.25}" fill="${material(id,'gold')}"/><circle cx="${x-r*.07}" cy="${y-r*.08}" r="${r*.1}" fill="#fff1b3" opacity=".8"/></g>`;
}
function names(id){
 return `<defs><radialGradient id="${id}-rose" cx="25%" cy="20%"><stop stop-color="#f7ccd6"/><stop offset=".55" stop-color="#bc5b7b"/><stop offset="1" stop-color="#812b4a"/></radialGradient><radialGradient id="${id}-petal" cx="30%" cy="20%"><stop stop-color="#fffef3"/><stop offset=".65" stop-color="#eee2b7"/><stop offset="1" stop-color="#c7ac6e"/></radialGradient><linearGradient id="${id}-leaf" x2="1" y2=".7"><stop stop-color="#91a979"/><stop offset=".5" stop-color="#4b7c61"/><stop offset="1" stop-color="#255847"/></linearGradient></defs>`+shade(id,165,231,79,7)+`<g filter="${material(id,'shadow')}">
 ${stroke('M149 216C144 171 137 128 131 78','#507254',4)}
 ${stroke('M151 214C156 169 174 137 199 112','#527952',3.5)}
 ${stroke('M149 211C156 151 170 112 174 63','#638954',3.5)}
 <path d="M146 164C121 163 104 148 103 132 122 133 139 141 146 164Z" fill="${material(id,'leaf')}"/>
 <path d="M150 188C172 190 190 177 195 159 175 161 157 169 150 188Z" fill="${material(id,'leaf')}"/>
 <path d="M162 121C143 119 133 105 134 92 150 96 162 106 162 121Z" fill="${material(id,'leaf')}"/>
 <path d="M171 103C193 99 202 85 201 72 184 80 175 87 171 103Z" fill="${material(id,'leaf')}"/>
 ${stroke('M108 137 143 160M156 183 190 165M138 98 160 118M176 98 197 78','#c3cc9b',1,.65)}
 ${flower(id,131,77,27)}${flower(id,200,112,23,'petal')}
 <path d="M173 38C153 39 157 64 173 73 190 63 193 41 173 38Z" fill="${material(id,'rose')}"/>
 ${stroke('M171 43C164 53 168 64 174 69','#ffdfde',1.5,.65)}
 <path d="M143 199 155 202 159 213 149 222 139 211Z" fill="${material(id,'wine')}"/>
 <path d="M149 209C169 196 181 181 182 165" fill="none" stroke="#b19261" stroke-width="1.3"/>
 <g transform="rotate(13 191 179)"><path d="M172 151H204L213 160V201Q213 205 209 205H175Q171 205 171 201V157Z" fill="${material(id,'paper')}" stroke="#cbb594"/><circle cx="181" cy="160" r="3" fill="#b29b7a"/>${stroke('M181 178H204M181 184H200M181 190H196','#b39d82',1.4,.8)}<path d="M197 166C190 158 186 169 197 174 208 169 204 159 197 166Z" fill="#b56d82"/></g>
 </g>`;
}

function oak(id,x,y,angle,scale=1){
 return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale})"><path d="M0 10C-4 6-11 8-12 3-19 4-23-3-17-7-24-11-20-18-14-17-20-24-12-30-7-25-8-33-2-37 1-32 7-38 13-33 11-26 20-29 23-21 16-17 25-15 24-7 17-6 23 0 18 6 10 4 9 12 3 12 0 10Z" fill="${material(id,'oak')}" stroke="#3b6650" stroke-width=".6"/><path d="M0 12 1-28M1-20-8-25M1-11 12-18M1-2-12-9M0 5 12 0" fill="none" stroke="#b5bf85" stroke-width="1" opacity=".6" stroke-linecap="round"/></g>`;
}
function culture(id){
 const leaves=Array.from({length:18},(_,i)=>{const a=i*Math.PI*2/18;return oak(id,160+Math.cos(a)*76,129+Math.sin(a)*64,i*20+90,i%2?.84:1);}).join('');
 return `<defs><linearGradient id="${id}-oak" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="#c0bd79"/><stop offset=".38" stop-color="#8c9f5c"/><stop offset=".8" stop-color="#537a4f"/><stop offset="1" stop-color="#355d41"/></linearGradient><radialGradient id="${id}-petal" cx="30%" cy="20%"><stop stop-color="#fffef5"/><stop offset=".6" stop-color="#f3e9c8"/><stop offset="1" stop-color="#d3bc83"/></radialGradient></defs>`+shade(id,160,234,91,7)+`<g filter="${material(id,'shadow')}"><ellipse cx="160" cy="131" rx="79" ry="67" fill="none" stroke="#7a7351" stroke-width="8"/><ellipse cx="160" cy="130" rx="76" ry="64" fill="none" stroke="#b2a06c" stroke-width="2"/>${leaves}${flower(id,95,98,12,'petal')}${flower(id,228,99,12,'petal')}${flower(id,177,196,12,'petal')}
 <path d="M146 198 162 207 145 235 140 223 128 228Z" fill="${material(id,'wine')}"/><path d="M163 203 177 197 194 226 181 222 177 235Z" fill="${material(id,'wine')}"/>
 <path d="M148 195Q161 189 174 197L171 207Q160 211 147 205Z" fill="${material(id,'gold')}"/>
 ${stroke('M149 198Q160 194 171 199','#fff1c2',1,.7)}
 </g>`;
}

function latviaFlag(id){
 const band=(a,b)=>`M88 ${45+a}C127 ${28+a} 161 ${59+a} 194 ${45+a}C215 ${36+a} 237 ${38+a} 258 ${47+a}V${47+b}C237 ${38+b} 215 ${36+b} 194 ${45+b}C161 ${59+b} 127 ${28+b} 88 ${45+b}Z`;
 return `<defs><linearGradient id="${id}-flagfold" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".25"/><stop offset=".22" stop-color="#fff" stop-opacity=".05"/><stop offset=".47" stop-color="#180912" stop-opacity=".22"/><stop offset=".65" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#180912" stop-opacity=".12"/></linearGradient><clipPath id="${id}-flagclip"><path d="${band(0,100)}"/></clipPath></defs>`+shade(id,151,234,106,6)+`<g filter="${material(id,'shadow')}">
 <ellipse cx="86" cy="227" rx="32" ry="7" fill="${material(id,'metal')}"/><path d="M80 211H91L96 225Q86 230 76 225Z" fill="${material(id,'metal')}"/>
 <rect x="82" y="30" width="8" height="191" rx="4" fill="${material(id,'metal')}"/>
 <circle cx="86" cy="27" r="8" fill="${material(id,'gold')}"/>
 <path d="${band(0,40)}" fill="#8b2b40"/><path d="${band(40,60)}" fill="#fcf9f2"/><path d="${band(60,100)}" fill="#8b2b40"/>
 <rect x="88" y="23" width="172" height="140" fill="${material(id,'flagfold')}" clip-path="url(#${id}-flagclip)"/>
 ${stroke('M89 47C127 31 161 61 194 47C215 38 237 40 257 49','#d7a4ad',1,.7)}
 ${stroke('M89 143C127 127 161 157 194 143C215 134 237 136 257 145','#4a192a',1,.5)}
 <path d="M91 46V144" stroke="#ede0c7" stroke-width="2" opacity=".6"/>
 <circle cx="91" cy="52" r="2" fill="${material(id,'gold')}"/><circle cx="91" cy="137" r="2" fill="${material(id,'gold')}"/>
 ${stroke('M84 39V208','#fffef2',1,.8)}
 </g>`;
}

function memorial(id){
 return `<defs><radialGradient id="${id}-flame" cx="45%" cy="70%" r="75%"><stop stop-color="#fffbd0"/><stop offset=".36" stop-color="#fbd37a"/><stop offset=".8" stop-color="#e8a84a"/><stop offset="1" stop-color="#d27839"/></radialGradient><radialGradient id="${id}-glow"><stop stop-color="#f6c05e" stop-opacity=".2"/><stop offset="1" stop-color="#f6c05e" stop-opacity="0"/></radialGradient><linearGradient id="${id}-wax" x1="0" x2="1"><stop stop-color="#e4d4b7"/><stop offset=".2" stop-color="#fff9e7"/><stop offset=".5" stop-color="#f7ebce"/><stop offset="1" stop-color="#bba57f"/></linearGradient></defs>`+shade(id,162,234,84,6)+`<g filter="${material(id,'shadow')}"><ellipse cx="163" cy="222" rx="73" ry="13" fill="${material(id,'metal')}"/><ellipse cx="163" cy="218" rx="66" ry="10" fill="#cbbda6"/><path d="M128 108H194V205C194 218 128 218 128 205Z" fill="${material(id,'wax')}"/><ellipse cx="161" cy="108" rx="33" ry="11" fill="#fef8e5"/><ellipse cx="161" cy="108" rx="20" ry="5" fill="#dfcaa3"/><path d="M132 110Q137 111 137 123V134Q141 142 146 134V119Q151 113 156 115V121Q160 129 164 122V114Q174 113 178 118V129Q183 138 187 130V113" fill="#fff6db"/>
 ${stroke('M134 143V199','#fffaf0',2,.5)}
 <ellipse cx="162" cy="74" rx="40" ry="51" fill="${material(id,'glow')}"/>
 <path d="M161 108Q158 101 162 94" stroke="#4e3931" stroke-width="2.5" fill="none"/>
 <path d="M161 30C158 54 182 67 177 86C174 101 153 106 145 93C130 79 152 68 151 56C154 65 158 61 161 30Z" fill="${material(id,'flame')}"/>
 <path d="M160 66C174 83 165 99 155 96C147 90 152 84 160 66Z" fill="#fff9c6" opacity=".9"/>
 <path d="M81 198Q109 210 137 215" stroke="#647457" stroke-width="2" fill="none"/>
 <path d="M108 209C93 210 86 204 86 197C97 197 106 201 108 209ZM121 213C113 203 115 194 120 190C127 198 126 206 121 213ZM102 205C100 194 105 188 111 186C115 194 112 201 102 205Z" fill="${material(id,'teal')}" opacity=".9"/>
 ${stroke('M90 200 105 208M120 195 120 209','#bcc9a7',.8,.7)}
 </g>`;
}

function privacy(id){
 return shade(id,161,234,78,7)+`<g filter="${material(id,'shadow')}"><path d="M160 27C188 46 220 51 247 54L244 119C241 173 202 209 160 235C118 209 79 173 76 119L73 54C106 51 132 47 160 27Z" fill="${material(id,'metal')}"/>
 <path d="M160 42C185 59 211 63 231 66L228 122C225 165 192 198 160 219C128 198 95 165 92 122L89 66C114 63 135 59 160 42Z" fill="${material(id,'wine')}"/>
 <path d="M160 48C132 65 107 68 95 70L98 120C101 156 123 183 140 196" fill="none" stroke="#f7ced4" stroke-width="2" opacity=".35"/>
 <path d="M137 126V109C137 77 185 77 185 109V126" stroke="#543329" stroke-opacity=".2" stroke-width="15" fill="none"/>
 <path d="M137 123V107C137 78 185 78 185 107V123" stroke="${material(id,'metal')}" stroke-width="12" fill="none"/>
 <path d="M135 107Q135 84 156 84" stroke="#fffdf0" stroke-width="2" opacity=".8" fill="none"/>
 <rect x="124" y="119" width="75" height="65" rx="12" fill="#572736" opacity=".18" transform="translate(3 5)"/>
 <rect x="123" y="117" width="75" height="65" rx="12" fill="${material(id,'gold')}"/>
 <path d="M132 122H188Q193 122 193 128" fill="none" stroke="#fff6ca" stroke-width="1.5" opacity=".75"/>
 <path d="M161 139A7 7 0 1 0 161 153L157 166H166L162 153A7 7 0 0 0 161 139Z" fill="#72522c"/>
 <path d="M125 170Q124 179 134 180H187" fill="none" stroke="#8a632e" stroke-width="1" opacity=".45"/>
 </g>`;
}

function about(id){
 return shade(id,163,230,103,8)+`<g filter="${material(id,'shadow')}">
 <path d="M69 68 215 55Q224 54 225 63L238 203Q239 211 229 212L82 224Q73 225 72 216L60 80Q59 70 69 68Z" fill="${material(id,'wine')}"/>
 <path d="M79 75 212 64 223 197 89 209Z" fill="#d8c9ad"/>
 <path d="M75 72 209 62 220 194 86 207Z" fill="${material(id,'paper')}"/>
 ${stroke('M89 195 216 185M88 200 217 190','#bdac92',1,.65)}
 <g transform="rotate(-5 151 132)"><rect x="79" y="88" width="147" height="99" rx="10" fill="#c3b096" transform="translate(3 4)"/><rect x="79" y="88" width="147" height="99" rx="10" fill="${material(id,'paper')}" stroke="#dbc9af"/>
 <circle cx="119" cy="130" r="24" fill="${material(id,'teal')}"/><circle cx="119" cy="123" r="8" fill="${material(id,'paper')}"/><path d="M104 142C104 126 134 126 134 142Z" fill="${material(id,'paper')}"/>
 <path d="M157 112H209M157 123H199M157 144H208M157 154H191" stroke="#a08581" stroke-width="3" stroke-linecap="round"/>
 <rect x="95" y="168" width="42" height="4" rx="2" fill="#af7883"/>
 <circle cx="209" cy="169" r="5" fill="${material(id,'gold')}"/></g>
 <g transform="rotate(17 245 132)"><path d="M238 62Q246 58 252 63V190L245 218 238 190Z" fill="${material(id,'ink')}"/><path d="M238 185H252L245 216Z" fill="${material(id,'gold')}"/><path d="M243 203 245 217 247 203Z" fill="#323039"/><rect x="238" y="91" width="14" height="6" fill="${material(id,'gold')}"/><path d="M241 64V176" stroke="#b7b5ac" stroke-width="1.5" opacity=".65"/><path d="M251 68H256V111" fill="none" stroke="${material(id,'gold')}" stroke-width="3" stroke-linecap="round"/></g>
 </g>`;
}

function location(id){
 const outer='M160 25C115 25 80 58 80 101C80 155 122 198 160 228C198 198 240 155 240 101C240 58 205 25 160 25Z';
 return `<defs><mask id="${id}-pin-cut"><rect width="320" height="260" fill="white"/><circle cx="160" cy="99" r="32" fill="black"/></mask><linearGradient id="${id}-pin-edge" x1="0" x2="1"><stop stop-color="#c98a9d"/><stop offset=".35" stop-color="#91354e"/><stop offset="1" stop-color="#40182c"/></linearGradient></defs>`+shade(id,160,233,57,6)+`<g filter="${material(id,'shadow')}"><path d="${outer}" fill="${material(id,'pin-edge')}" transform="translate(6 2)" mask="url(#${id}-pin-cut)"/><path d="${outer}" fill="${material(id,'wine')}" mask="url(#${id}-pin-cut)"/><circle cx="160" cy="99" r="33" fill="none" stroke="#f2c9d1" stroke-width="2.3" opacity=".65"/>
 <path d="M105 57C120 37 144 33 158 33M91 106C94 146 118 177 147 204" fill="none" stroke="#f9cbd2" stroke-width="3" stroke-linecap="round" opacity=".6"/>
 <path d="M226 93C229 144 195 185 164 215" fill="none" stroke="#5b1d34" stroke-width="3" stroke-linecap="round" opacity=".4"/>
 <path d="M133 82C140 68 157 65 172 71" fill="none" stroke="#fff4ef" stroke-width="1" opacity=".75"/>
 </g>`;
}

export function lifeArt(name,id){
 switch(name){
  case 'holiday':case 'gift':return gift(id);
  case 'family':return family(id);
  case 'vacation':return vacation(id);
  case 'names':return names(id);
  case 'culture':return culture(id);
  case 'latvia-days':return latviaFlag(id);
  case 'memorial':return memorial(id);
  case 'privacy':return privacy(id);
  case 'about':return about(id);
  case 'city':case 'location':return location(id);
  default:return null;
 }
}

/* Twelve seasonal month objects. Calendar numerals are intentionally absent. */
function monthSnowflake(id){
 const arm='M-5-8-7-33-25-48-20-56-7-45-7-72 0-83 7-72 7-45 20-56 25-48 7-33 5-8Z';
 return `<defs><linearGradient id="${id}-ice" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset=".35" stop-color="#eaf3ee"/><stop offset=".67" stop-color="#b8d0cf"/><stop offset="1" stop-color="#779b9f"/></linearGradient></defs>`+shade(id,158,230,91,6)+`<g filter="${material(id,'shadow')}">
 <path d="M73 213Q150 218 246 196M108 214 91 198M138 214 151 200M183 209 189 190M215 202 228 183" fill="none" stroke="#968575" stroke-width="4" stroke-linecap="round"/>
 ${stroke('M76 209Q150 213 241 193','#f9fcf4',5,.94)}
 <g transform="translate(158 117)">${Array.from({length:6},(_,i)=>`<g transform="rotate(${i*60})"><path d="${arm}" transform="translate(1.5 2)" fill="#6f9297"/><path d="${arm}" fill="${material(id,'ice')}" stroke="#c1d7d6" stroke-width=".7"/>${stroke('M0-12V-70M0-34-20-50M0-34 20-50','#ffffff',1.3,.9)}</g>`).join('')}<path d="M0-18 16-9 16 9 0 18-16 9-16-9Z" fill="${material(id,'ice')}" stroke="#fafef9" stroke-width="1.7"/><circle r="5" fill="#ffffff" opacity=".75"/></g>
 <path d="M73 211Q87 207 99 213M178 206Q191 199 207 202M220 195Q232 188 244 192" fill="none" stroke="#fffef5" stroke-width="5" stroke-linecap="round"/>
 </g>`;
}
function monthMittens(id){
 const mitten=(x,y,angle,mirror=false)=>`<g transform="translate(${x} ${y}) rotate(${angle} 43 64)${mirror?' translate(86 0) scale(-1 1)':''}"><path d="M28 17C28 5 45 0 58 6 70 13 73 29 73 47L75 83C77 108 64 126 44 126 27 126 17 116 16 99L12 63C-3 54-1 40 8 37 16 33 24 47 28 54Z" fill="${material(id,'wine')}"/><path d="M31 21C31 8 47 6 56 12M31 62 26 91" fill="none" stroke="#f2b5c5" stroke-width="2.1" opacity=".5" stroke-linecap="round"/>${[45,61,77,93].map((cy,j)=>[34,47,60].map((cx,i)=>stroke(`M${cx-4} ${cy-3}Q${cx} ${cy+5} ${cx+4} ${cy-3}`,'#d486a0',1.15,(j+i)%2?.38:.55)).join('')).join('')}<path d="M19 101Q43 107 73 102L75 130Q44 139 21 131Z" fill="${material(id,'paper')}" stroke="#c9b99e" stroke-width=".8"/>${Array.from({length:8},(_,i)=>stroke(`M${26+i*6} 109V129`,'#c6b399',1,.65)).join('')}</g>`;
 return shade(id,163,230,94,7)+`<g filter="${material(id,'shadow')}">${stroke('M116 199C112 224 164 235 205 207','#cbb89b',3)}${stroke('M117 199C113 221 163 231 204 207','#f7ead1',1,.8)}${mitten(63,72,-14)}${mitten(174,59,13,true)}<path d="M159 57C147 44 135 62 159 75 183 62 171 44 159 57Z" fill="${material(id,'gold')}"/>${stroke('M150 56Q155 51 158 60','#fff5c2',1.1,.7)}</g>`;
}
function snowBell(id,x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0-16C-15-17-27-2-26 17-14 9-6-1 0-16Z" fill="${material(id,'paper')}" stroke="#d6cfb5" stroke-width=".6"/><path d="M0-16C15-17 27-2 26 17 14 9 6-1 0-16Z" fill="${material(id,'paper')}" stroke="#c5c8ac" stroke-width=".6"/><path d="M0-15C-10-3-12 16-5 28L0 23 5 28C12 16 10-3 0-15Z" fill="#f4f4dd"/><path d="M-5 11 0 15 5 11 4 20 0 17-4 20Z" fill="#7b9d6d"/><ellipse cy="-16" rx="6" ry="5" fill="${material(id,'teal')}"/>${stroke('M-2-7C-6 4-6 13-4 21','#ffffff',1.4,.8)}</g>`;}
function monthSnowdrop(id){
 return shade(id,158,230,78,6)+`<g filter="${material(id,'shadow')}"><path d="M94 220Q156 205 224 221L212 230H108Z" fill="${material(id,'paper')}"/>
 ${stroke('M152 221C144 165 138 115 155 76 168 44 189 55 184 82','#4f7d5b',4)}
 ${stroke('M151 221C144 183 116 165 113 120 112 102 128 102 133 114','#638860',3)}
 <path d="M153 222C122 199 109 166 112 135 136 156 154 181 153 222Z" fill="${material(id,'teal')}"/>
 <path d="M158 222C165 175 188 142 205 136 201 173 183 207 158 222Z" fill="${material(id,'teal')}"/>
 <path d="M159 222C155 169 166 145 174 127 182 170 171 199 159 222Z" fill="#75966c"/>
 ${stroke('M116 145Q125 181 150 217M198 146Q187 185 161 218','#c0cda1',1,.6)}
 ${snowBell(id,184,99,1.05)}${snowBell(id,133,129,.72)}
 ${stroke('M152 220C144 168 139 121 151 90','#9eb393',1,.6)}
 </g>`;
}
function rainDrop(id,x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0-13C3-5 11 2 8 9 4 17-10 14-9 4-8-1-2-7 0-13Z" fill="${material(id,'rain')}"/><path d="M-4-1Q-8 7-2 10" stroke="#ffffff" stroke-width="1.5" fill="none" opacity=".8"/></g>`;}
function monthUmbrella(id){
 const canopy='M44 130C59 79 97 42 160 39 223 42 261 79 276 130 253 113 235 113 218 132 200 115 180 115 160 133 139 115 119 115 101 132 83 113 65 114 44 130Z';
 return `<defs><linearGradient id="${id}-rain" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff9f1"/><stop offset=".45" stop-color="#b3d5d4"/><stop offset="1" stop-color="#508a94"/></linearGradient><clipPath id="${id}-canopy"><path d="${canopy}"/></clipPath></defs>`+shade(id,160,231,82,6)+`<g filter="${material(id,'shadow')}"><path d="M160 105V201C160 227 123 227 123 205" fill="none" stroke="${material(id,'gold')}" stroke-width="8" stroke-linecap="round"/><path d="M157 131V202" stroke="#fff4c7" stroke-width="1.3" opacity=".8"/>
 <path d="${canopy}" fill="${material(id,'wine')}"/>
 <g clip-path="url(#${id}-canopy)"><path d="M160 39C119 63 106 96 101 132L160 145Z" fill="#b45b77"/><path d="M160 39C176 64 182 96 160 144L218 132C207 84 188 55 160 39Z" fill="#9c3b5b"/><path d="M160 39C229 57 255 93 276 130L254 142C222 84 200 59 160 39Z" fill="#5d2038"/></g>
 ${stroke('M44 130C59 79 97 42 160 39 223 42 261 79 276 130','#d98fa6',1.5,.8)}
 ${stroke('M160 40C119 63 106 96 101 131M160 40C150 71 149 106 160 132M160 40C190 62 210 96 218 131','#e2a5b7',1,.55)}
 <rect x="157" y="29" width="6" height="13" rx="3" fill="${material(id,'gold')}"/>
 ${rainDrop(id,72,42,.8)}${rainDrop(id,247,50,.8)}${rainDrop(id,283,165,.75)}${rainDrop(id,47,169,.67)}
 </g>`;
}
function lilyBell(id,x,y,s=1,angle=0){return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})"><path d="M-9-10C-9-23 10-22 10-10L14 8Q8 16 4 8 0 17-4 8-9 15-14 8Z" fill="${material(id,'paper')}" stroke="#ccc8a7" stroke-width=".6"/><ellipse cy="-11" rx="8" ry="3.5" fill="#7b9b6d"/><path d="M-6-7V6" stroke="#fffef2" stroke-width="1.8" opacity=".85" stroke-linecap="round"/></g>`;}
function monthLily(id){
 return shade(id,158,230,83,6)+`<g filter="${material(id,'shadow')}">
 <path d="M164 221C132 178 106 117 119 61 158 85 177 156 164 221Z" fill="${material(id,'teal')}"/>
 <path d="M170 221C188 148 230 102 230 76 252 133 212 204 170 221Z" fill="${material(id,'teal')}"/>
 ${stroke('M124 69C134 117 157 177 163 215M230 87C224 137 193 192 173 216','#a4bf91',1.5,.6)}
 ${stroke('M167 221C176 165 191 114 179 68 173 44 157 40 144 48','#628859',3.8)}
 ${stroke('M177 89C164 77 152 71 148 72M181 112C164 100 150 99 143 100M179 135C164 126 151 126 147 128M176 155C166 145 159 147 156 150M183 91C199 81 203 91 203 99M184 121C204 111 215 119 212 128','#789760',2)}
 ${lilyBell(id,149,80,.9,-18)}${lilyBell(id,143,108,.93,-12)}${lilyBell(id,147,135,.88,-6)}${lilyBell(id,156,157,.78,-10)}${lilyBell(id,202,106,.84,17)}${lilyBell(id,211,135,.77,18)}
 <path d="M145 47C135 39 127 44 131 54 136 61 144 57 145 47Z" fill="#d6b8b4"/>
 </g>`;
}
function monthMidsummer(id){
 return `<defs><linearGradient id="${id}-oak" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="#c6c58a"/><stop offset=".4" stop-color="#8fa866"/><stop offset="1" stop-color="#3f6c47"/></linearGradient><radialGradient id="${id}-petal" cx="30%" cy="20%"><stop stop-color="#fffef6"/><stop offset=".6" stop-color="#f4eac8"/><stop offset="1" stop-color="#cbbb81"/></radialGradient></defs>`+shade(id,159,233,97,6)+`<g filter="${material(id,'shadow')}"><ellipse cx="159" cy="135" rx="82" ry="62" fill="none" stroke="#8c8555" stroke-width="9"/><ellipse cx="159" cy="135" rx="79" ry="60" fill="none" stroke="#b8ab6f" stroke-width="2"/>${Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return oak(id,159+Math.cos(a)*76,132+Math.sin(a)*59,i*22.5+90,.96);}).join('')}${flower(id,94,100,12,'petal')}${flower(id,224,91,14,'petal')}${flower(id,223,179,11,'petal')}${flower(id,108,186,11,'petal')}<path d="M149 199Q159 205 169 198L166 210 160 207 152 213Z" fill="${material(id,'gold')}"/>${stroke('M148 207 134 231M166 207 183 230','#a67148',4)}${stroke('M147 208 134 229M167 208 182 228','#e5c175',1.3,.7)}</g>`;
}
function berry(id,x,y,s=1,angle=0){
 const seeds=[[-23,-13],[-7,-15],[10,-14],[26,-7],[-31,5],[-15,5],[1,7],[18,7],[33,11],[-24,23],[-7,25],[11,25],[25,29],[-16,43],[1,44],[16,46],[-5,59],[7,59]];
 return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})"><path d="M0-37C-19-53-48-40-48-12-49 19-26 51 0 75 26 51 49 19 48-12 48-40 19-53 0-37Z" fill="${material(id,'berry')}" stroke="#a3354f" stroke-width=".7"/>${seeds.map(([cx,cy])=>`<ellipse cx="${cx}" cy="${cy}" rx="1.6" ry="2.8" fill="#f5d287" transform="rotate(${cx<0?-18:18} ${cx} ${cy})"/><path d="M${cx-1} ${cy-1}V${cy+1}" stroke="#a26746" stroke-width=".65"/>`).join('')}<path d="M-37-12C-36-27-28-35-18-36" fill="none" stroke="#f8a4b0" stroke-width="3" opacity=".5" stroke-linecap="round"/><path d="M0-36-28-53-16-29-35-24-10-21 0-3 9-23 32-23 18-33 28-48 6-39 1-56Z" fill="${material(id,'teal')}"/>${stroke('M0-48 0-27M-20-42-6-28M20-40 5-28','#a4b988',1,.65)}</g>`;
}
function monthStrawberries(id){
 return `<defs><radialGradient id="${id}-berry" cx="26%" cy="22%" r="90%"><stop stop-color="#ee8795"/><stop offset=".28" stop-color="#dc526d"/><stop offset=".65" stop-color="#bc304f"/><stop offset="1" stop-color="#78233d"/></radialGradient></defs>`+shade(id,161,232,92,6)+`<g filter="${material(id,'shadow')}"><path d="M101 160C89 125 94 92 122 75 133 111 127 145 101 160Z" fill="${material(id,'teal')}"/><path d="M112 148C131 112 155 95 178 98 166 130 139 151 112 148Z" fill="${material(id,'teal')}"/>${stroke('M117 85 106 147M168 104 120 144','#b5c695',1,.6)}${berry(id,211,145,.69,18)}${berry(id,143,144,1,-14)}</g>`;
}
function wheatEar(id,x,y,angle=0,s=1){
 return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})"><path d="M0 3V146" stroke="#af8c45" stroke-width="3"/>${Array.from({length:7},(_,i)=>{const yy=15+i*12;return `<path d="M0 ${yy+9}C-12 ${yy+7}-22 ${yy-2}-18 ${yy-11}-7 ${yy-10}-1 ${yy-2} 0 ${yy+9}Z" fill="${material(id,'gold')}"/><path d="M0 ${yy+12}C12 ${yy+9} 22 ${yy} 18 ${yy-9} 7 ${yy-8} 1 ${yy} 0 ${yy+12}Z" fill="${material(id,'gold')}"/>${stroke(`M-13 ${yy-6}-23 ${yy-20}M13 ${yy-3} 23 ${yy-17}`,'#c1a45e',.8,.8)}`;}).join('')}<path d="M0-13V8" stroke="#b5954e" stroke-width="1.2"/></g>`;
}
function monthWheatApple(id){
 return `<defs><radialGradient id="${id}-apple" cx="30%" cy="24%" r="85%"><stop stop-color="#eda09a"/><stop offset=".35" stop-color="#c65f6d"/><stop offset=".75" stop-color="#91364f"/><stop offset="1" stop-color="#60243b"/></radialGradient></defs>`+shade(id,164,232,96,6)+`<g filter="${material(id,'shadow')}">${wheatEar(id,97,60,-8,1)}${wheatEar(id,134,77,7,.9)}<path d="M191 107C168 85 138 104 137 138 134 176 157 208 182 207 194 203 198 203 209 207 234 209 252 184 250 143 249 111 226 90 199 106Z" fill="${material(id,'apple')}"/><ellipse cx="195" cy="108" rx="12" ry="4" fill="#7e4340" opacity=".5"/><path d="M195 109Q191 94 203 84" fill="none" stroke="#7d6346" stroke-width="6" stroke-linecap="round"/><path d="M199 94C211 76 236 84 239 95 221 107 207 105 199 94Z" fill="${material(id,'teal')}"/>${stroke('M203 95 231 92','#bbc695',1,.7)}<path d="M151 139C151 122 159 112 169 113" fill="none" stroke="#f7c2b6" stroke-width="4" stroke-linecap="round" opacity=".5"/><path d="M157 179Q167 199 181 200" fill="none" stroke="#cf7b83" stroke-width="1.3" opacity=".6"/></g>`;
}
function harvestLeaf(id,x,y,s=1,angle=0){return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})"><path d="M0 31-6 11-25 14-20 1-39-12-21-16-23-33-7-24 0-47 8-23 25-31 23-13 42-9 24 3 29 17 8 13 3 32Z" fill="${material(id,'harvest')}" stroke="#b47d3e" stroke-width=".6"/>${stroke('M1 38 0-34M0 0-28-11M1 2 30-7M1 14-17 7M2 14 22 10','#f9df9f',1,.8)}</g>`;}
function monthBooks(id){
 return `<defs><linearGradient id="${id}-harvest" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3d187"/><stop offset=".4" stop-color="#d6a155"/><stop offset="1" stop-color="#a86843"/></linearGradient></defs>`+shade(id,160,233,98,6)+`<g filter="${material(id,'shadow')}">
 <path d="M66 174 196 150 254 170 125 197Z" fill="#58857b"/><path d="M66 174 125 197V220L66 196Z" fill="#326a61"/><path d="M125 197 254 170V193L125 220Z" fill="${material(id,'paper')}"/>${stroke('M132 204 246 181M133 211 245 188','#c8b99c',1,.7)}
 <path d="M74 139 194 118 248 138 126 163Z" fill="#b76f84"/><path d="M74 139 126 163V185L74 163Z" fill="${material(id,'wine')}"/><path d="M126 163 248 138V160L126 185Z" fill="${material(id,'paper')}"/>${stroke('M133 170 241 148M134 177 241 155','#c8b99c',1,.7)}
 <path d="M91 88 189 70 233 92 133 112Z" fill="${material(id,'paper')}"/><path d="M91 88 133 112V141L91 116Z" fill="#c8b897"/><path d="M133 112 233 92V120L133 141Z" fill="#eee4ca"/>${stroke('M141 119 227 102M141 126 227 109M141 133 226 115','#c4b395',1,.65)}
 <path d="M90 84 189 66 235 88 133 109Z" fill="${material(id,'wine')}"/>${stroke('M99 85 188 70 226 88','#e9b5bf',1,.5)}
 <path d="M169 106 184 103V145L177 139 170 148Z" fill="${material(id,'gold')}"/>
 ${harvestLeaf(id,232,83,.91,31)}
 </g>`;
}
function monthPumpkin(id){
 return `<defs><radialGradient id="${id}-pumpkin" cx="28%" cy="25%" r="95%"><stop stop-color="#f5ce8d"/><stop offset=".3" stop-color="#e9ac5b"/><stop offset=".7" stop-color="#c78039"/><stop offset="1" stop-color="#966138"/></radialGradient><linearGradient id="${id}-harvest" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9bd75"/><stop offset=".5" stop-color="#ab9d5c"/><stop offset="1" stop-color="#6f804b"/></linearGradient></defs>`+shade(id,159,233,94,6)+`<g filter="${material(id,'shadow')}">
 <path d="M150 110C150 89 142 75 156 55L173 60C161 76 170 87 166 111Z" fill="${material(id,'teal')}"/>${stroke('M158 62C148 81 160 90 158 105','#b0b889',2,.7)}
 <ellipse cx="102" cy="159" rx="38" ry="55" fill="${material(id,'pumpkin')}"/><ellipse cx="128" cy="158" rx="40" ry="64" fill="${material(id,'pumpkin')}"/><ellipse cx="216" cy="160" rx="36" ry="55" fill="${material(id,'pumpkin')}"/><ellipse cx="190" cy="158" rx="39" ry="65" fill="${material(id,'pumpkin')}"/><ellipse cx="160" cy="158" rx="39" ry="67" fill="${material(id,'pumpkin')}"/>
 ${stroke('M128 108C111 140 115 193 130 212M191 107C208 142 204 194 189 214M157 101C143 135 144 188 155 215','#f9d69a',1.6,.56)}
 <path d="M169 97C195 80 215 74 222 56" fill="none" stroke="#6f8052" stroke-width="3"/>
 ${harvestLeaf(id,229,77,.7,43)}
 </g>`;
}
function monthNovember(id){
 return `<g transform="translate(157 87) scale(.46)">${latviaFlag(id)}</g>`+memorial(id);
}
function firSprig(id,x,y,angle=0,len=80){
 return `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M0 4V-${len}" stroke="#89704d" stroke-width="2.5" stroke-linecap="round"/>${Array.from({length:9},(_,i)=>{const y0=-i*(len/10),w=24-i*1.7;return `<path d="M0 ${y0+2}C${-w*.5} ${y0-1} ${-w} ${y0-8} ${-w} ${y0-18}C${-w*.35} ${y0-14} ${-3} ${y0-5} 0 ${y0+2}Z" fill="${material(id,'fir')}"/><path d="M0 ${y0+1}C${w*.5} ${y0-3} ${w} ${y0-10} ${w} ${y0-19}C${w*.35} ${y0-15} 3 ${y0-5} 0 ${y0+1}Z" fill="${material(id,'fir')}"/>`;}).join('')}</g>`;
}
function monthDecember(id){
 return `<defs><linearGradient id="${id}-fir" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a2b69b"/><stop offset=".35" stop-color="#5e896e"/><stop offset=".72" stop-color="#336856"/><stop offset="1" stop-color="#214b3e"/></linearGradient><radialGradient id="${id}-bauble" cx="28%" cy="22%" r="90%"><stop stop-color="#f1ccd0"/><stop offset=".2" stop-color="#c3758e"/><stop offset=".48" stop-color="#9b3d5b"/><stop offset=".8" stop-color="#69233e"/><stop offset="1" stop-color="#431b31"/></radialGradient></defs>`+shade(id,163,233,96,6)+`<g filter="${material(id,'shadow')}"><path d="M74 215 240 54" stroke="#806245" stroke-width="5" stroke-linecap="round"/>${firSprig(id,94,196,44,79)}${firSprig(id,142,149,44,86)}${firSprig(id,192,101,44,67)}${stroke('M173 116Q181 113 186 126','#cab17a',1.4)}<ellipse cx="185" cy="129" rx="7" ry="8" fill="none" stroke="${material(id,'gold')}" stroke-width="2.7"/><path d="M174 134H196L198 145H172Z" fill="${material(id,'gold')}"/>${stroke('M177 136V142M182 136V142M187 136V142M192 136V142','#fff0bb',1,.8)}<circle cx="185" cy="184" r="42" fill="${material(id,'bauble')}"/><path d="M153 175C156 157 171 148 184 150" fill="none" stroke="#fce7df" stroke-width="3" stroke-linecap="round" opacity=".66"/><path d="M149 194Q186 213 221 191" fill="none" stroke="${material(id,'gold')}" stroke-width="3.3" opacity=".85"/><path d="M155 207Q185 221 210 205" fill="none" stroke="#bd788a" stroke-width="1" opacity=".45"/></g>`;
}

export function monthArt(month,id){
 switch(Number(month)){
  case 1:return monthSnowflake(id);
  case 2:return monthMittens(id);
  case 3:return monthSnowdrop(id);
  case 4:return monthUmbrella(id);
  case 5:return monthLily(id);
  case 6:return monthMidsummer(id);
  case 7:return monthStrawberries(id);
  case 8:return monthWheatApple(id);
  case 9:return monthBooks(id);
  case 10:return monthPumpkin(id);
  case 11:return monthNovember(id);
  case 12:return monthDecember(id);
  default:return null;
 }
}
