/* Original, entirely vector category illustrations. No pixels or external images. */
const esc=s=>String(s).replace(/[^a-zA-Z0-9_-]/g,'-');

export function earthDisc(key,cx,cy,r){
 const p=esc(key),k=r/110;
 const coasts=[
  // North America at the western limb: coastal inlets remain individually curved.
  'M-2 56Q7 43 18 39l5-5 8 1 6-5 7 4 7-2 5 5 9 1 5 5-3 4 4 5-5 5-2 6-7 3-4-3-5 4-1 7-5 3-5-1-1 7 5 6-2 7 6 5 5 3 2 8-4 3-6-5-3-8-8-3-3-7-7-2-4-7-7-1-3-5-7 1Z',
  'M46 121q5-6 13-1l8 4 7 2 3 7 8 1 8 6-2 8-7 7-2 9-7 5-1 8-6 9-2 10-5 9-2 9-5 5-4-4 1-7-3-5 1-7-3-6 1-8-4-5-3-8-5-6-2-8-4-4 1-6-4-5 1-6Z',
  'M60 16q10-8 20-3l7 4 4 8-3 8-7 10-5 2-7-4-2-8-5-7Z',
  // Scandinavia, western Europe, the Mediterranean and western Asia.
  'M116 44q1-9 8-13l6-6 7-1-2 5-4 4 1 5-4 5-1 6-5 5-2 4-5-3Z',
  'M120 62l3-5 4-2 3 3 5-2 4 2 4-1 2 4 6-1 5 3 5-1 5 2 8-1 8 4 8-2 7 4 9 2 4 6 8 1 7 7 6 7 8 3 6 9 1 7-9 2-4-5-6-1-3-6-6-2-4-6-7-1-6-5-6 1-3-5-6 1-5-3-4 2-5-2-3 2-4-1-2 5-4-1-2-5-4-2-2-4-5 1-2-4-4-1-2 3-4-1-2 5-7-2-1-4 3-3-2-3Z',
  'M127 79l4 2 1 5 4 5-2 4-3-3-2-7-4-3Z',
  'M143 83l5 2 2 5 4 2-1 3-4-2-2-6-4-1Z',
  'M153 89l3-2 2 3-1 3-3-1Z',
  'M161 98l9-4 9 4 4 7 2 7 6 5-1 7-5 4-4-4-3-8-4-3-2-6-5-2Z',
  // Africa with a broad Sahara, Gulf of Guinea, Cape, Horn and Madagascar.
  'M122 98q9-5 20-1l9 1 6 7 2 8 6 6 1 8 8 6-2 8-5 6-7 2-1 10-5 7-2 9-5 5-3 9-5 6-6-1-2-5-2-8-5-4-3-8-5-6-2-9-5-5-4-7 1-8-3-5 3-10 4-6 4-5Z',
  'M172 158l4 1 2 5-1 8-4 9-4 4-2-4 2-8 1-7Z',
  'M100 59l3-2 3 3-1 5-3 4-2-3Z','M106 66l4 1 1 4 3 4-2 4-4-2-1-5Z',
  'M74 101q5 0 7 3l-2 2-5-1Z','M84 109l4 1 2 3-4 1-3-2Z','M88 117l3 1-1 2-3-1Z'
 ];
 const terrain=[
  ['M122 104q14-6 26 0l8 8-1 9-10 3-9-2-13 3-7-9Z','#c6bd96','.86'],
  ['M129 130q10 3 20 0l9 5-4 11-8 6-9-3-8-9Z','#4c7465','.62'],
  ['M141 157l12 1-3 11-8 10-5-3Z','#a8aa83','.5'],
  ['M54 135q9-4 19 3l11 8-5 9-12 4-10-6Z','#416d57','.52'],
  ['M61 155l4 4-4 13 2 10-3 12-4 6 1-12-3-8 3-12Z','#b0b394','.45'],
  ['M140 66q17-7 35 3l7 7-16 4-14-4-11 1Z','#6f8d73','.42'],
  ['M189 79l13 4 7 8-4 6-9-4-5-8Z','#aeac87','.44']
 ];
 const cloudFilaments=[
  ['M14 68C24 60 32 59 43 63S62 68 73 59',2.1,.62],['M19 72C30 65 39 67 48 69S64 73 71 68',.8,.54],['M39 82C53 76 62 80 72 81S88 80 98 74',1.4,.58],['M46 86C62 82 70 86 82 84',.65,.5],
  ['M78 34C90 29 102 34 111 31S120 29 128 31',1.7,.69],['M83 38C98 35 105 38 115 35',.75,.51],
  ['M90 104C99 98 107 99 113 101S123 105 127 99',1.8,.67],['M93 108C103 102 112 108 119 106',.7,.5],
  ['M26 147C36 138 43 137 51 142S64 148 73 141',2.2,.58],['M31 151C42 143 51 151 60 150',.85,.47],
  ['M75 174C88 166 99 164 110 170S124 172 131 163',1.8,.67],['M79 179C90 171 101 173 111 176',.75,.48],
  ['M120 49C132 42 145 42 156 47S176 54 187 48',2.5,.64],['M127 53C142 47 154 53 163 55S180 56 188 53',.8,.59],
  ['M167 78C179 73 189 76 198 81S213 86 223 81',1.7,.66],['M174 83C188 81 196 89 207 88',.75,.45],
  ['M165 139C175 128 187 126 196 134C205 143 192 155 184 148C176 141 188 132 192 141',1.6,.72],['M169 142C179 133 189 132 194 137',.7,.54],
  ['M163 194C178 184 189 186 202 193',2,.58],['M169 199C183 192 194 195 203 198',.65,.47],
  ['M40 208C60 201 77 201 94 209S123 218 140 209',2.6,.72],['M49 214C69 208 81 211 97 216S121 220 130 216',.9,.57],
  ['M29 115C43 111 58 116 68 121',.8,.31],['M193 111C202 106 212 107 222 114',1,.4],['M60 184C69 179 76 181 83 185',.7,.36]
 ];
 return `<defs>
 <radialGradient id="${p}-ocean" cx="29%" cy="24%" r="83%"><stop stop-color="#88c1d3"/><stop offset=".25" stop-color="#397b9d"/><stop offset=".54" stop-color="#215778"/><stop offset=".79" stop-color="#173952"/><stop offset="1" stop-color="#0c1b31"/></radialGradient>
 <linearGradient id="${p}-land" x1=".2" y1=".1" x2=".85" y2=".95"><stop stop-color="#cbd0b0"/><stop offset=".3" stop-color="#9daf8d"/><stop offset=".67" stop-color="#6c8c72"/><stop offset="1" stop-color="#385c53"/></linearGradient>
 <radialGradient id="${p}-shade" cx="27%" cy="22%" r="80%"><stop stop-color="#f4fdff" stop-opacity=".18"/><stop offset=".42" stop-color="#daeff4" stop-opacity="0"/><stop offset=".72" stop-color="#12253a" stop-opacity=".06"/><stop offset="1" stop-color="#081428" stop-opacity=".81"/></radialGradient>
 <radialGradient id="${p}-air" cx="40%" cy="30%" r="70%"><stop offset=".83" stop-color="#75c1df" stop-opacity="0"/><stop offset=".97" stop-color="#b4e0f2" stop-opacity=".06"/><stop offset="1" stop-color="#bde9fa" stop-opacity=".6"/></radialGradient>
 <clipPath id="${p}-sphere"><circle cx="120" cy="120" r="110"/></clipPath></defs>
 <g transform="translate(${cx-r*120/110} ${cy-r*120/110}) scale(${k})"><circle cx="120" cy="120" r="110" fill="url(#${p}-ocean)"/><g clip-path="url(#${p}-sphere)">
 <g fill="url(#${p}-land)" stroke="#c6cfb3" stroke-opacity=".36" stroke-width=".48" stroke-linejoin="round">${coasts.map(d=>`<path d="${d}"/>`).join('')}</g>
 ${terrain.map(([d,c,o])=>`<path d="${d}" fill="${c}" opacity="${o}"/>`).join('')}
 <g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".36"><path d="m125 102 8-1 8 3 7-1 6 7m-15 24 9 5-1 6m-22-26 4 5-4 4m9 24 5 5-1 8m-69-30-5 6 2 7-5 10m102-89 10 2 6-2 6 4" stroke="#d6d4ae" stroke-width=".7"/><path d="m64 149 5 5-2 6m73-24 2 6-2 4m-16-74 5 3m27 9 5 2m-5-17 9 1" stroke="#345b50" stroke-width=".7"/></g>
 <path d="M32 20Q77-4 124 15l-6 5-12-2-13 5-14-3-15 5-19-1Z" fill="#e4ece6" opacity=".9"/>
 <g fill="none" stroke="#f9fcf8" stroke-linecap="round">${cloudFilaments.map(([d,w,o])=>`<path d="${d}" stroke-width="${w}" opacity="${o}"/>`).join('')}</g>
 <g fill="#f8fcf8" opacity=".45">${[[20,75,2],[37,64,1.3],[57,70,1.4],[76,81,1],[96,35,1.5],[114,33,1],[103,104,1.4],[34,148,1],[49,145,1.8],[88,174,1.2],[107,175,1],[137,49,1.5],[153,52,1],[181,53,1.3],[190,83,1.4],[208,87,1.1],[183,137,1],[199,141,1.2],[176,196,1.4],[195,198,1],[62,214,1.7],[91,215,1.4],[116,217,1.4]].map(([x,y,a])=>`<ellipse cx="${x}" cy="${y}" rx="${a*1.9}" ry="${a*.54}"/>`).join('')}</g>
 <circle cx="120" cy="120" r="110" fill="url(#${p}-shade)"/><circle cx="120" cy="120" r="110" fill="url(#${p}-air)"/></g><circle cx="120" cy="120" r="109.2" fill="none" stroke="#c9e6f3" stroke-opacity=".56" stroke-width="1.5"/><path d="M37 73A98 98 0 0 1 124 22" stroke="#eaf7fc" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".36"/></g>`;
}

export function moonDisc(key,cx,cy,r,phase='full'){
 const p=esc(key),k=r/110;
 const craters=[[38,98,4.1],[50,76,3.8],[65,47,4.3],[85,34,3],[110,48,4.5],[137,34,2.8],[164,47,3.4],[188,70,3.2],[199,98,3.4],[206,123,3],[199,147,4.2],[180,176,3.5],[154,194,4.5],[125,207,3.5],[95,201,4],[70,188,3.7],[46,163,3.6],[31,132,3.1],[72,112,7.4],[114,177,6.5],[141,151,4.2],[165,133,3.2],[155,101,4],[127,85,3.8],[106,111,3.1],[77,154,4.4],[95,139,2.4],[116,149,2.7],[180,117,2.4],[59,136,2.5],[156,66,2.3],[181,92,2.2],[98,60,2.1],[63,98,2.3],[134,119,2.6],[164,162,2.5],[92,174,2.8],[147,178,2.6],[56,181,2.3],[135,191,2.2],[112,132,2.3],[177,59,2],[38,116,1.8],[86,123,1.6],[137,62,1.7],[66,169,1.8],[188,150,1.8],[120,31,1.6],[102,188,1.7],[151,210,1.8]];
 let darkness='';
 if(phase==='new')darkness='<circle cx="120" cy="120" r="110" fill="#20272e" opacity=".94"/><path d="M167 21A110 110 0 0 1 165 220" fill="none" stroke="#afb9c2" stroke-width="1.1" opacity=".46"/>';
 if(phase==='first')darkness='<path d="M120 10A110 110 0 0 0 120 230Z" fill="#1e252d" opacity=".975"/><path d="M120 12V228" stroke="#c5cbd0" stroke-opacity=".16"/>';
 if(phase==='last')darkness='<path d="M120 10A110 110 0 0 1 120 230Z" fill="#1e252d" opacity=".975"/><path d="M120 12V228" stroke="#c5cbd0" stroke-opacity=".16"/>';
 const grainCount=r<50?38:125,visibleCraters=r<50?craters.filter((_,i)=>i%2===0):craters;
 const grain=Array.from({length:grainCount},(_,i)=>{const a=i*2.399963229728653,rr=Math.sqrt((i+.5)/grainCount)*107,x=120+Math.cos(a)*rr,y=120+Math.sin(a)*rr,rad=.35+(i%5)*.15;return `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${rad}" ry="${(rad*.7).toFixed(2)}" fill="${i%3===0?'#f1f1ee':'#59646c'}" opacity="${i%3===0?.24:.15}"/>`;}).join('');
 return `<defs><radialGradient id="${p}-rock" cx="29%" cy="23%" r="80%"><stop stop-color="#eeefed"/><stop offset=".35" stop-color="#c6c9c9"/><stop offset=".68" stop-color="#979eA3"/><stop offset=".89" stop-color="#69757f"/><stop offset="1" stop-color="#455360"/></radialGradient><radialGradient id="${p}-floor" cx="61%" cy="65%" r="80%"><stop stop-color="#bbc0c1"/><stop offset=".62" stop-color="#929ba0"/><stop offset="1" stop-color="#63717b"/></radialGradient><radialGradient id="${p}-shade" cx="27%" cy="21%" r="82%"><stop stop-color="#fff" stop-opacity=".13"/><stop offset=".63" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#182b3e" stop-opacity=".57"/></radialGradient><clipPath id="${p}-disc"><circle cx="120" cy="120" r="110"/></clipPath></defs>
 <g transform="translate(${cx-r*120/110} ${cy-r*120/110}) scale(${k})"><g clip-path="url(#${p}-disc)"><circle cx="120" cy="120" r="110" fill="url(#${p}-rock)"/>
 <!-- Broad, low-contrast basaltic maria are part of the surface, rather than raised plates. -->
 <g fill="#5f6a72" opacity=".27"><path d="M37 91C29 75 42 57 59 57C62 41 83 37 100 44C113 50 121 64 116 78C124 88 116 102 103 104C99 118 81 121 66 115C47 120 35 106 37 91Z"/><path d="M113 58C123 43 147 43 160 57C173 63 175 82 161 91C149 103 132 94 120 90C109 82 107 69 113 58Z"/><path d="M147 94C158 81 184 84 190 101C202 114 194 133 179 139C160 148 145 131 141 117C138 107 140 99 147 94Z"/><path d="M48 115C55 104 76 102 91 111C108 119 115 138 102 151C92 164 72 165 58 153C45 145 41 126 48 115Z"/><path d="M93 140C110 132 126 141 131 155C143 164 137 184 122 185C105 193 92 181 88 166C82 158 83 145 93 140Z"/><path d="M174 143C185 134 202 142 204 154C211 169 197 179 183 173C171 170 166 153 174 143Z"/></g>
 <g fill="#e7e8e4" opacity=".16"><path d="M21 111q10-21 24-16l6 21-10 18-16 9Z"/><path d="m127 153 20-15 18 14-1 25-21 11-16-14Z"/><path d="m62 171 14-9 14 12-2 16-15 7-12-13Z"/><path d="m171 182 15-10 12 15-12 20-14-5Z"/></g>
 ${grain}
 <g opacity=".82">${visibleCraters.map(([x,y,rad],i)=>{const z=Math.sqrt(Math.max(.1,1-((x-120)**2+(y-120)**2)/12100)),rx=rad*(.64+.36*z),ry=rad*.82;return `<g transform="translate(${x} ${y}) rotate(${(i%5-2)*9})"><ellipse rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="#6a7780" opacity=".35"/><ellipse cy=".7" rx="${(rx*.82).toFixed(2)}" ry="${(ry*.75).toFixed(2)}" fill="url(#${p}-floor)" opacity=".64"/><path d="M${(-rx*.94).toFixed(2)} .2A${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 1 ${(rx*.5).toFixed(2)} ${(-ry*.86).toFixed(2)}" fill="none" stroke="#eff0ed" stroke-opacity=".53" stroke-width=".65"/></g>`;}).join('')}</g>
 <g stroke="#edf0ed" fill="none" stroke-linecap="round" opacity=".19"><path d="m113 178-38 32m39-32 29 32m-30-33 6-37m-6 37 43-8m-44 9-5 33m6-34-33-17m34 17 23-27" stroke-width=".75"/><path d="M72 113 57 92m17 21 27-14m-27 15 18 20m-21-19-25 8" stroke-width=".55"/></g>
 <circle cx="120" cy="120" r="110" fill="url(#${p}-shade)"/>${darkness}</g><circle cx="120" cy="120" r="109.4" fill="none" stroke="#d9dfe1" stroke-opacity=".46" stroke-width="1.1"/></g>`;
}

function sunArt(id){
 const rays=Array.from({length:14},(_,i)=>{const a=i*360/14*Math.PI/180,inner=82,outer=i%2?98:105,x=160+Math.cos(a)*inner,y=119+Math.sin(a)*inner,x2=160+Math.cos(a)*outer,y2=119+Math.sin(a)*outer;return `<path d="M${x.toFixed(2)} ${y.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="url(#${id}-corona)" stroke-width="${i%2?2:3.5}" stroke-linecap="round" opacity="${i%2?.5:.8}"/>`;}).join('');
 return `<defs><radialGradient id="${id}-sun" cx="30%" cy="24%" r="82%"><stop stop-color="#fff8cb"/><stop offset=".28" stop-color="#f9dd87"/><stop offset=".58" stop-color="#e9b54e"/><stop offset=".82" stop-color="#c98b32"/><stop offset="1" stop-color="#9f6023"/></radialGradient><radialGradient id="${id}-glow"><stop offset=".45" stop-color="#efd391" stop-opacity=".48"/><stop offset="1" stop-color="#efd391" stop-opacity="0"/></radialGradient><linearGradient id="${id}-corona" x2=".4" y2="1"><stop stop-color="#e4bd63"/><stop offset="1" stop-color="#bd7d32"/></linearGradient></defs>
 <ellipse cx="162" cy="234" rx="65" ry="7" fill="#624634" opacity=".12" filter="url(#${id}-soft)"/><circle cx="160" cy="119" r="111" fill="url(#${id}-glow)"/>${rays}<g filter="url(#${id}-shadow)"><circle cx="160" cy="119" r="68" fill="url(#${id}-sun)"/><circle cx="160" cy="119" r="66.8" fill="none" stroke="#fff3bc" stroke-width="1.4" opacity=".7"/></g><path d="M113 97A51 51 0 0 1 160 65" stroke="#fffce0" stroke-width="3.3" fill="none" stroke-linecap="round" opacity=".63"/><path d="M173 170A51 51 0 0 0 210 132" stroke="#a66b29" stroke-width="2" fill="none" stroke-linecap="round" opacity=".22"/><g fill="#9b5e2c" opacity=".15"><circle cx="176" cy="104" r="2.3"/><circle cx="180" cy="108" r="1.1"/><circle cx="141" cy="145" r="1.5"/><circle cx="138" cy="142" r=".8"/><circle cx="193" cy="132" r="1.3"/></g>`;
}

function sunriseArt(id){
 return `<defs><linearGradient id="${id}-dawn" x1=".25" y1="0" x2=".6" y2="1"><stop stop-color="#fff3ba"/><stop offset=".42" stop-color="#f1c25d"/><stop offset="1" stop-color="#bd7836"/></linearGradient><radialGradient id="${id}-dawn-halo"><stop stop-color="#f2d58c" stop-opacity=".42"/><stop offset="1" stop-color="#f2d58c" stop-opacity="0"/></radialGradient><linearGradient id="${id}-water" x2=".1" y2="1"><stop stop-color="#8cb8b6"/><stop offset=".5" stop-color="#4a8e91"/><stop offset="1" stop-color="#33666f"/></linearGradient><linearGradient id="${id}-ripple" x2=".85" y2=".7"><stop stop-color="#cadbd1"/><stop offset=".5" stop-color="#679a99"/><stop offset="1" stop-color="#335e67"/></linearGradient><clipPath id="${id}-horizon"><path d="M25 20H295V151H25Z"/></clipPath></defs>
 <ellipse cx="161" cy="229" rx="101" ry="8" fill="#466262" opacity=".12" filter="url(#${id}-soft)"/><circle cx="160" cy="119" r="92" fill="url(#${id}-dawn-halo)"/><g clip-path="url(#${id}-horizon)"><circle cx="160" cy="128" r="56" fill="url(#${id}-dawn)"/><path d="M120 105A45 45 0 0 1 163 83" stroke="#fff6cd" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".75"/></g>
 <path d="M42 151Q102 145 160 149T279 151" fill="none" stroke="#c9d8cc" stroke-width="2" stroke-linecap="round"/>
 <path d="M49 159Q87 153 117 158T174 158Q206 154 265 160L252 168Q215 172 179 167T115 167Q77 170 49 164Z" fill="url(#${id}-water)"/>
 <path d="M30 179Q63 174 91 178T156 178Q195 173 220 179T290 179L274 185Q239 189 210 185T151 185Q112 190 82 184T30 185Z" fill="url(#${id}-ripple)"/>
 <path d="M62 199Q95 194 130 198T195 198Q224 194 259 198L247 204Q210 209 181 204T122 205Q89 209 62 204Z" fill="url(#${id}-water)"/>
 <path d="M103 215Q131 210 160 213T220 215L205 219Q175 221 155 218T112 220Z" fill="url(#${id}-ripple)"/>
 <g fill="none" stroke-linecap="round"><path d="M129 156q32-4 65 0" stroke="#fff0bc" stroke-width="2.3"/><path d="M122 166q37-3 68 1" stroke="#e8d79d" stroke-width="1.7"/><path d="M137 180q27-3 50 0" stroke="#f4deb1" stroke-width="2"/><path d="M147 199q15-2 31 0" stroke="#e6cf9c" stroke-width="1.4"/><path d="M72 158h28m121 1h29M42 178h26m167 0h31M83 198h26" stroke="#d5e0d8" stroke-width="1.2" opacity=".7"/></g>
 <path d="M66 87q11-10 24-1 9-3 18 4" fill="none" stroke="#b7c4bb" stroke-width="1.4" stroke-linecap="round"/><path d="M213 68q8-8 16-1 8-3 16 3" fill="none" stroke="#b7c4bb" stroke-width="1.2" stroke-linecap="round"/>`;
}

function seasonsArt(id){
 return `<defs><linearGradient id="${id}-bark" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="#b69973"/><stop offset=".35" stop-color="#927356"/><stop offset="1" stop-color="#5c4a3c"/></linearGradient><linearGradient id="${id}-leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b4c89b"/><stop offset=".45" stop-color="#658e69"/><stop offset="1" stop-color="#315c51"/></linearGradient><linearGradient id="${id}-autumn" x2=".85" y2=".9"><stop stop-color="#f2d38c"/><stop offset=".38" stop-color="#d6a455"/><stop offset=".78" stop-color="#b57143"/><stop offset="1" stop-color="#813f37"/></linearGradient><radialGradient id="${id}-petal" cx="30%" cy="22%"><stop stop-color="#fffbeb"/><stop offset=".65" stop-color="#f3dce0"/><stop offset="1" stop-color="#ce9fae"/></radialGradient><linearGradient id="${id}-frost" x2=".9" y2="1"><stop stop-color="#ffffff"/><stop offset=".4" stop-color="#d5e7e6"/><stop offset="1" stop-color="#89b2bd"/></linearGradient></defs>
 <ellipse cx="163" cy="235" rx="79" ry="7" fill="#6b5146" opacity=".12" filter="url(#${id}-soft)"/>
 <g filter="url(#${id}-shadow)"><path d="M117 223Q151 180 164 139Q178 88 208 39L213 40Q186 95 174 142Q160 190 123 225Z" fill="url(#${id}-bark)"/><path d="M166 147Q136 125 101 119L101 115Q139 118 170 140Z" fill="url(#${id}-bark)"/><path d="M179 111Q209 109 232 86L235 87Q216 116 177 118Z" fill="url(#${id}-bark)"/><path d="M151 182Q184 178 211 164L214 167Q187 187 146 190Z" fill="url(#${id}-bark)"/><path d="M188 80Q159 66 128 53L128 49Q166 62 193 74Z" fill="url(#${id}-bark)"/>
 <!-- Summer leaf: asymmetric cupped blade with a bright rolled edge. -->
 <path d="M203 105Q201 76 221 58Q237 44 260 42Q263 67 249 86Q232 109 203 105Z" fill="url(#${id}-leaf)"/><path d="M205 105Q232 75 256 47" fill="none" stroke="#c6d4a7" stroke-width="1.7"/><path d="m220 87 19 1m-9-14 15 1m-12-4-3-12m-13 30-3-12" fill="none" stroke="#c2d2ab" stroke-width=".9" opacity=".7"/><path d="M207 99Q206 77 225 59" fill="none" stroke="#d4dfb7" stroke-width="1.3" opacity=".75"/>
 <!-- Autumn maple-like leaf, bent along its central vein. -->
 <path d="m204 167-16-7 7-8-13-12 16 1-4-19 14 10 11-21 4 22 15-5-6 17 17 5-14 8 6 11-17-1-8 14Z" fill="url(#${id}-autumn)"/><path d="m207 166 12-47m-8 32-16-8m18-2 17-8m-15 23 18-3" fill="none" stroke="#f2d9a8" stroke-width="1.25" opacity=".7"/><path d="m207 166 12-47" stroke="#a05c43" stroke-width=".7"/>
 <!-- Spring blossom: five curved petals, softly rolled instead of flat circles. -->
 <g transform="translate(99 113)">${Array.from({length:5},(_,i)=>`<path transform="rotate(${i*72})" d="M0-3C-17-10-21-26-9-31 1-36 14-25 9-12 7-7 3-4 0-3Z" fill="url(#${id}-petal)" stroke="#d8b7bd" stroke-width=".55"/>`).join('')}<circle r="6" fill="#d9ae54"/><g fill="#f5dda1"><circle cx="-2" cy="-3" r="1.5"/><circle cx="3" cy="-1" r="1.3"/><circle cx="1" cy="3" r="1.2"/></g></g>
 <path d="M105 139Q83 139 76 158Q96 160 112 142Z" fill="url(#${id}-leaf)"/><path d="m80 155 29-14" stroke="#c7d7ad" stroke-width="1"/>
 <!-- Winter crystal has thickness from a second offset stroke. -->
 <g transform="translate(126 50)"><g stroke="#89aab3" stroke-width="4" stroke-linecap="round" opacity=".22" transform="translate(1.5 2)">${Array.from({length:3},(_,i)=>`<path transform="rotate(${i*60})" d="M0-25V25m-7-17 7 6 7-6m-14 34 7-6 7 6"/>`).join('')}</g><g stroke="url(#${id}-frost)" stroke-width="3" stroke-linecap="round" fill="none">${Array.from({length:3},(_,i)=>`<path transform="rotate(${i*60})" d="M0-25V25m-7-17 7 6 7-6m-14 34 7-6 7 6"/>`).join('')}</g><path d="m0-5 4 3v5l-4 3-4-3v-5Z" fill="#f2fbf8"/></g></g>`;
}

function gardenArt(id){
 return `<defs><linearGradient id="${id}-steel" x1=".15" y1=".2" x2=".9" y2=".7"><stop stop-color="#f0efdf"/><stop offset=".28" stop-color="#b9c7c5"/><stop offset=".49" stop-color="#e6ebe1"/><stop offset=".55" stop-color="#91a8ad"/><stop offset="1" stop-color="#4e737d"/></linearGradient><linearGradient id="${id}-wood" x2="1" y2=".5"><stop stop-color="#dabd88"/><stop offset=".45" stop-color="#b18b5e"/><stop offset="1" stop-color="#7a5c40"/></linearGradient><linearGradient id="${id}-carrot" x1="0" y1=".15" x2="1" y2=".75"><stop stop-color="#ffdc91"/><stop offset=".2" stop-color="#ecad58"/><stop offset=".55" stop-color="#d68237"/><stop offset="1" stop-color="#a8552e"/></linearGradient><linearGradient id="${id}-greens" x1=".1" y1="0" x2=".95" y2="1"><stop stop-color="#b5c795"/><stop offset=".45" stop-color="#648b63"/><stop offset="1" stop-color="#2e6354"/></linearGradient><radialGradient id="${id}-soil" cx="38%" cy="25%" r="80%"><stop stop-color="#a28a67"/><stop offset=".5" stop-color="#725d48"/><stop offset="1" stop-color="#3c3b32"/></radialGradient></defs>
 <ellipse cx="167" cy="234" rx="115" ry="7" fill="#594f3b" opacity=".15" filter="url(#${id}-soft)"/>
 <g filter="url(#${id}-shadow)">
 <!-- The plant grows from a small earth clod; it is not another pot icon. -->
 <path d="M183 188Q193 176 211 180Q225 174 239 183L248 197 242 211Q213 219 186 207L177 198Z" fill="url(#${id}-soil)"/>
 <g fill="#c3ab81" opacity=".55"><circle cx="191" cy="192" r="1.5"/><circle cx="231" cy="190" r="2"/><circle cx="205" cy="207" r="1.3"/><circle cx="237" cy="202" r="1.2"/><circle cx="215" cy="188" r="1"/></g>
 <path d="M214 187Q210 146 226 103" stroke="#557a51" stroke-width="5" fill="none" stroke-linecap="round"/>
 <path d="M217 152Q189 145 185 117Q211 115 222 137Z" fill="url(#${id}-greens)"/><path d="m192 124 25 25" fill="none" stroke="#bdcfa2" stroke-width="1.5"/>
 <path d="M221 139Q227 109 259 104Q260 132 227 143Z" fill="url(#${id}-greens)"/><path d="m226 139 26-28" fill="none" stroke="#c9d6a9" stroke-width="1.5"/>
 <path d="M226 112Q212 90 228 65Q250 82 235 107Z" fill="url(#${id}-greens)"/><path d="m229 75 1 32" fill="none" stroke="#d6dfb8" stroke-width="1.4"/>
 <!-- Steel trowel, rounded scoop and a fitted ferrule. -->
 <g transform="rotate(-18 91 139)"><path d="M83 104C54 110 50 139 61 168Q74 195 88 209Q108 193 119 169C132 139 124 112 100 104Z" fill="#4b6b73"/><path d="M84 101C59 107 57 134 65 160Q75 184 88 201Q105 184 114 163C125 136 122 110 99 102Z" fill="url(#${id}-steel)"/><path d="M91 111Q90 149 88 195" fill="none" stroke="#f0f3e7" stroke-width="2.2" opacity=".8"/><path d="M65 139Q71 160 87 181" fill="none" stroke="#708e94" stroke-width="1.3" opacity=".55"/><path d="M84 106 85 76 97 74 99 107Z" fill="url(#${id}-steel)"/><path d="M80 72 81 42Q90 33 102 40L105 70Q99 79 87 78Z" fill="url(#${id}-wood)"/><path d="m87 44 1 25" stroke="#f0d4a0" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="93" cy="46" rx="3" ry="4" fill="#705b44"/><path d="M84 76Q92 81 103 73" stroke="#d5d6bf" stroke-width="2" fill="none"/></g>
 <!-- Carrot with tapered shoulder and carved transverse root lines. -->
 <path d="M132 125Q146 117 157 132Q172 150 188 174L218 223Q209 224 198 217L154 182Q130 162 122 146Q118 132 132 125Z" fill="url(#${id}-carrot)"/><path d="M128 137Q139 145 154 166L194 206" fill="none" stroke="#ffdc9a" stroke-width="4" stroke-linecap="round" opacity=".58"/><path d="m152 145-11 3m27 14-12 4m27 18-10 3m26 19-7 2" fill="none" stroke="#a96231" stroke-width="2" stroke-linecap="round" opacity=".58"/>
 <g fill="url(#${id}-greens)"><path d="M137 130Q112 102 119 75L128 85 131 75 139 95 146 99 143 108 149 113Z"/><path d="M140 125Q142 95 163 76L164 89 177 83 169 100 174 105 158 116 156 128Z"/><path d="M130 129Q105 122 93 101L104 103 100 91 115 104 119 102 128 115 137 119Z"/></g><path d="m136 127-10-37m13 34 22-34m-27 35-27-20" fill="none" stroke="#c5d3a2" stroke-width="1.4"/>
 </g>`;
}

function zodiacArt(id){
 const glyphs=[
  'M10 18V8C9-1 1-1 2 6c0 3 4 4 5 2M10 8C11-1 19-1 18 6c0 3-4 4-5 2',
  'M5 2q0 6 5 7 5-1 5-7M10 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10',
  'M3 3q7 2 14 0M3 18q7-2 14 0M6 4v13m8-13v13',
  'M16 5C13 0 4 1 4 6a3 3 0 1 0 3-3M4 15c3 5 12 4 12-1a3 3 0 1 0-3 3',
  'M5 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6M7 9C6 4 9 1 13 2c7 2-3 10 1 14 2 2 4 1 5-1',
  'M2 17V5q2-4 4 0v12M6 6q2-5 4-1v12M10 6q2-5 4-1v11q1 3 4-1l-1-7-5 6',
  'M2 18h16M2 13h5c-6-7 12-7 6 0h5',
  'M2 17V5q2-4 4 0v12M6 6q2-5 4-1v12M10 6q2-5 4-1v9q0 4 5 2m-3-3 3 3-3 3',
  'M3 18 17 3M10 3h7v7M5 7l8 8',
  'M2 6q3-4 5 1v8M7 8q4-7 7-3l-3 10q1 5 5 2c5-4-1-9-5-4',
  'M1 7l4-3 5 3 5-3 4 3M1 15l4-3 5 3 5-3 4 3',
  'M4 2q8 8 0 16M16 2q-8 8 0 16M2 10h16'
 ];
 const ticks=Array.from({length:120},(_,n)=>{const a=n*Math.PI/60,l=n%10===0?7:n%5===0?4.5:2.4,r1=88-l;return `<path d="M${(160+Math.sin(a)*r1).toFixed(2)} ${(118-Math.cos(a)*r1).toFixed(2)}L${(160+Math.sin(a)*88).toFixed(2)} ${(118-Math.cos(a)*88).toFixed(2)}" stroke="#876c4f" stroke-width="${n%10===0?1.2:.65}" opacity="${n%10===0?.8:.47}"/>`;}).join('');
 const symbols=glyphs.map((d,n)=>{const a=(n*30+15)*Math.PI/180,x=160+Math.sin(a)*71.5-8,y=118-Math.cos(a)*71.5-8;return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(.8)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" transform="translate(0 .6)" stroke="#fffdf0" stroke-width="1.7" opacity=".8"/><path d="${d}" stroke="#7e6657" stroke-width="1.15"/></g>`;}).join('');
 const radial=Array.from({length:12},(_,n)=>{const a=n*Math.PI/6;return `<path d="M${(160+Math.sin(a)*58).toFixed(2)} ${(118-Math.cos(a)*58).toFixed(2)}L${(160+Math.sin(a)*79).toFixed(2)} ${(118-Math.cos(a)*79).toFixed(2)}" stroke="#baa88b" stroke-width=".65"/>`;}).join('');
 return `<defs><linearGradient id="${id}-rim" x1=".1" y1="0" x2=".85" y2="1"><stop stop-color="#f9edce"/><stop offset=".18" stop-color="#c9b18a"/><stop offset=".39" stop-color="#fff4d6"/><stop offset=".57" stop-color="#b29b78"/><stop offset=".79" stop-color="#8c785e"/><stop offset="1" stop-color="#d4bf96"/></linearGradient><radialGradient id="${id}-dial" cx="32%" cy="26%" r="80%"><stop stop-color="#fffef4"/><stop offset=".65" stop-color="#eee9d8"/><stop offset="1" stop-color="#c7c5b6"/></radialGradient><linearGradient id="${id}-needle" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#b36b80"/><stop offset=".5" stop-color="#8b2e4b"/><stop offset="1" stop-color="#562536"/></linearGradient><linearGradient id="${id}-glass-glint" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff" stop-opacity=".52"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
 <ellipse cx="162" cy="234" rx="83" ry="7" fill="#544b40" opacity=".14" filter="url(#${id}-soft)"/>
 <g filter="url(#${id}-shadow)"><circle cx="160" cy="126" r="98" fill="#6e6d62"/><circle cx="160" cy="122" r="98" fill="url(#${id}-rim)"/><circle cx="160" cy="118" r="96" fill="url(#${id}-rim)"/><circle cx="160" cy="118" r="92" fill="#d2bf9b"/><circle cx="160" cy="118" r="89.5" fill="url(#${id}-dial)"/><circle cx="160" cy="118" r="89" fill="none" stroke="#8e8068" stroke-width=".75"/>
 ${ticks}${radial}${symbols}<circle cx="160" cy="118" r="57" fill="none" stroke="#aa9a7f" stroke-width=".8"/><circle cx="160" cy="118" r="53.8" fill="none" stroke="#c7baa0" stroke-width=".45"/>
 <g fill="#bac7bf" stroke="#73847f" stroke-width=".4"><path d="m160 75 8 35 35 8-35 8-8 35-8-35-35-8 35-8Z"/><path d="m130 88 27 21 33-21-21 30 21 30-33-20-27 20 20-30Z" fill="#d3d3bf"/></g>
 <path d="M160 66 171 118 160 128 149 118Z" fill="url(#${id}-needle)"/><path d="M160 66v62l-11-10Z" fill="#b26e82" opacity=".6"/><path d="m160 170-11-52 11-10 11 10Z" fill="#6b9291"/><path d="M160 170v-62l11 10Z" fill="#406c73"/><path d="m108 118 52-11 10 11-10 11Z" fill="#d1b684"/><path d="m212 118-52 11-10-11 10-11Z" fill="#b3bcae"/>
 <circle cx="160" cy="118" r="8" fill="url(#${id}-rim)" stroke="#ab946b" stroke-width=".8"/><circle cx="160" cy="118" r="3" fill="#f9f3df"/><circle cx="158.7" cy="116.5" r="1.4" fill="#fffdf3"/>
 <path d="M84 87A84 84 0 0 1 177 35" fill="none" stroke="#fffdf0" stroke-width="2" stroke-linecap="round" opacity=".75"/><path d="M81 112Q104 42 178 34Q219 43 235 78Q163 65 104 144Z" fill="url(#${id}-glass-glint)" opacity=".25"/>
 </g>`;
}

export function natureArt(name,id){
 id=esc(id);
 switch(name){
  case 'astronomy':return `<ellipse cx="169" cy="234" rx="121" ry="7" fill="#52606a" opacity=".14" filter="url(#${id}-soft)"/><g filter="url(#${id}-shadow)">${earthDisc(id+'-earth',133,111,94)}${moonDisc(id+'-moon',252,185,43)}</g>`;
  case 'earth':return `<ellipse cx="162" cy="235" rx="91" ry="7" fill="#52606a" opacity=".13" filter="url(#${id}-soft)"/><g filter="url(#${id}-shadow)">${earthDisc(id+'-earth',160,123,104)}</g>`;
  case 'moon':return `<ellipse cx="161" cy="233" rx="81" ry="7" fill="#536266" opacity=".13" filter="url(#${id}-soft)"/><g filter="url(#${id}-shadow)">${moonDisc(id+'-moon',160,121,103)}</g>`;
  case 'phases':return `<path d="M31 161Q161 31 290 161" fill="none" stroke="#b5a985" stroke-width="1" opacity=".4"/><ellipse cx="162" cy="217" rx="118" ry="7" fill="#536266" opacity=".1" filter="url(#${id}-soft)"/><g filter="url(#${id}-shadow)">${moonDisc(id+'-new',47,142,30,'new')}${moonDisc(id+'-first',121,119,32,'first')}${moonDisc(id+'-full',198,119,34)}${moonDisc(id+'-last',274,142,30,'last')}</g>`;
  case 'sun':return sunArt(id);
  case 'sunrise':case 'sunset':return sunriseArt(id);
  case 'seasons':return seasonsArt(id);
  case 'garden':return gardenArt(id);
  case 'zodiac':return zodiacArt(id);
  default:return null;
 }
}
