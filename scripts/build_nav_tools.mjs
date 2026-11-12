import fs from 'node:fs';
import crypto from 'node:crypto';

// Four original, tightly framed vector objects for the secondary navigation.
const out = 'assets/nav-tools';
const labels = {print:'PDF kalendāri', work:'Darba dienas', calculator:'Datumu kalkulators', tools:'Vairāk rīku'};
const n = x => Math.round(x*100)/100;
const point = (q,u,v) => [q[0][0]*(1-u)*(1-v)+q[1][0]*u*(1-v)+q[2][0]*u*v+q[3][0]*(1-u)*v, q[0][1]*(1-u)*(1-v)+q[1][1]*u*(1-v)+q[2][1]*u*v+q[3][1]*(1-u)*v];
const polygon = (q,u,v,w,h,fill,extra='') => {
  const p=[point(q,u,v),point(q,u+w,v),point(q,u+w,v+h),point(q,u,v+h)];
  return `<path d="M${p.map(a=>a.map(n).join(' ')).join('L')}Z" fill="${fill}" ${extra}/>`;
};
const surface = (id) => `<defs>
<linearGradient id="${id}-ivory" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#fffef7"/><stop offset=".48" stop-color="#f2eee1"/><stop offset="1" stop-color="#c7beaa"/></linearGradient>
<linearGradient id="${id}-paper" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#fffef9"/><stop offset=".7" stop-color="#f8f5e9"/><stop offset="1" stop-color="#dfd8c5"/></linearGradient>
<linearGradient id="${id}-jade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a9d6c7"/><stop offset=".2" stop-color="#6bb5a4"/><stop offset=".65" stop-color="#398377"/><stop offset="1" stop-color="#1e504b"/></linearGradient>
<linearGradient id="${id}-dark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#365b5b"/><stop offset="1" stop-color="#142f34"/></linearGradient>
<linearGradient id="${id}-wine" x1="0" y1="0" x2="1" y2=".85"><stop stop-color="#b7607b"/><stop offset=".35" stop-color="#923b57"/><stop offset="1" stop-color="#561b33"/></linearGradient>
<linearGradient id="${id}-brass" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="#fff2bf"/><stop offset=".24" stop-color="#c9a65b"/><stop offset=".42" stop-color="#f8e0a1"/><stop offset=".7" stop-color="#b28a47"/><stop offset="1" stop-color="#7a6036"/></linearGradient>
<linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fcffff"/><stop offset=".22" stop-color="#c0d1cc"/><stop offset=".45" stop-color="#f4fbf4"/><stop offset=".72" stop-color="#9eb4b1"/><stop offset="1" stop-color="#567675"/></linearGradient>
<linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4f3d9"/><stop offset=".45" stop-color="#a9c9b7"/><stop offset="1" stop-color="#739a88"/></linearGradient>
<radialGradient id="${id}-dial" cx="32%" cy="24%" r="80%"><stop stop-color="#fffef6"/><stop offset=".7" stop-color="#eaf0e6"/><stop offset="1" stop-color="#baccc2"/></radialGradient>
<filter id="${id}-shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#392d35" flood-opacity=".19"/></filter>
<filter id="${id}-blur" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>`;
const floor = id => `<ellipse cx="65" cy="119" rx="47" ry="4" fill="#493340" opacity=".18" filter="url(#${id}-blur)"/>`;

function printer(id) {
  const q=[[39,18],[84,25],[80,48],[35,41]];
  const days=[];
  for(let r=0;r<3;r++)for(let c=0;c<5;c++)days.push(polygon(q,c*.2+.025,r*.3+.13,.13,.19,r===1&&c===2?'#92344f':c>3?'#d6acb5':'#9db5a9'));
  return `${floor(id)}<g filter="url(#${id}-shadow)">
  <path d="M38 5L91 13L88 62L32 54Z" fill="#bfb9a9"/><path d="M36 5L88 12L85 59L30 52Z" fill="url(#${id}-paper)" stroke="#d2cbb9" stroke-width=".65"/>
  <path d="M38 12L85 19L84 26L37 19Z" fill="url(#${id}-wine)"/>${days.join('')}
  <path d="M18 44L37 34L103 43L114 60L111 97L91 108L19 96L14 83Z" fill="url(#${id}-dark)"/>
  <path d="M18 42Q20 37 27 38L91 46L111 60L39 54Z" fill="url(#${id}-ivory)"/>
  <path d="M91 46L111 60L110 98L91 108L92 70Z" fill="#2a625b"/>
  <path d="M19 43L39 54L38 98L20 89Q16 87 16 81V49Q16 44 19 43Z" fill="url(#${id}-jade)"/>
  <path d="M39 54L111 60L110 97Q110 101 104 102L43 95Q38 94 38 88Z" fill="url(#${id}-jade)"/>
  <path d="M42 58L106 64" fill="none" stroke="#d1eee0" stroke-width="1.2" opacity=".65"/>
  <path d="M39 76L107 83L106 96L39 89Z" fill="#153a3a"/>
  <path d="M44 78L104 84L97 92L39 86Z" fill="#0f2d31"/>
  <path d="M45 82L99 88L91 119L36 111Z" fill="#ccc6b5"/>
  <path d="M45 80L99 86L91 116L37 109Z" fill="url(#${id}-paper)" stroke="#ede9dc" stroke-width=".6"/>
  <path d="M49 88L90 93M47 94L87 99M45 101L76 106" fill="none" stroke="#c5c6b8" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M41 67L72 70" stroke="#25584e" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="96" cy="70" rx="3.8" ry="2.6" fill="url(#${id}-brass)"/><ellipse cx="96" cy="69.3" rx="2.1" ry="1" fill="#fff4c5"/>
  <circle cx="85" cy="69" r="1.5" fill="#d1efc6"/><path d="M21 50L21 80" stroke="#d4f1df" stroke-width="1.4" opacity=".5"/>
  </g>`;
}
function work(id) {
  const q=[[58,81],[81,84],[80,101],[57,98]],cells=[];
  for(let r=0;r<2;r++)for(let c=0;c<3;c++)cells.push(polygon(q,.08+c*.3,.27+r*.3,.17,.18,r===1&&c===1?'#913e55':'#abbcaf'));
  return `${floor(id)}<g filter="url(#${id}-shadow)">
  <path d="M44 35V24Q44 15 54 16L75 19Q84 20 84 29V40" fill="none" stroke="#284a44" stroke-width="8" stroke-linejoin="round"/>
  <path d="M44 33V24Q44 18 54 19L75 22Q81 23 81 29V37" fill="none" stroke="url(#${id}-brass)" stroke-width="4.8" stroke-linecap="round"/>
  <path d="M48 22Q51 20 55 21L74 24" fill="none" stroke="#fff0bb" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M21 39L38 30L108 39L111 99L91 112L19 102Z" fill="url(#${id}-dark)"/>
  <path d="M21 39L38 30L108 39L91 49Z" fill="url(#${id}-jade)"/>
  <path d="M91 49L108 39L111 99L91 112Z" fill="#285a54"/>
  <path d="M21 39L91 49L91 108Q90 113 85 112L25 103Q19 103 19 97V45Q19 39 21 39Z" fill="url(#${id}-jade)"/>
  <path d="M25 45L85 53L85 103L25 95Z" fill="none" stroke="#d0e4c8" stroke-width=".85" stroke-dasharray="1.5 2.2" opacity=".65"/>
  <path d="M21 40L91 50L90 63Q56 70 20 54Z" fill="url(#${id}-jade)"/>
  <path d="M21 55Q54 71 90 64" fill="none" stroke="#214e49" stroke-width="1.2"/>
  <path d="M25 43L85 52" stroke="#d0eee1" stroke-width="1.3" opacity=".7"/>
  <path d="M31 55L39 56L39 68Q35 71 31 67Z" fill="#785f35"/><path d="M32 55L38 56V65L32 64Z" fill="url(#${id}-brass)"/><path d="M33 57L37 58" stroke="#fff1bc" stroke-width=".9"/>
  <path d="M70 61L78 62L78 74Q74 77 70 73Z" fill="#785f35"/><path d="M71 61L77 62V71L71 70Z" fill="url(#${id}-brass)"/><path d="M72 63L76 64" stroke="#fff1bc" stroke-width=".9"/>
  <path d="M54 75L86 79L85 106L53 102Z" fill="#1c4c47" opacity=".4"/>
  <path d="M55 74L85 78L84 104L54 100Z" fill="url(#${id}-paper)"/><path d="M55 74L85 78L85 84L55 80Z" fill="url(#${id}-wine)"/>${cells.join('')}
  <path d="M22 49V95" stroke="#d2edde" stroke-width="1.4" opacity=".5"/>
  <path d="M98 52L100 99" stroke="#7ba88e" stroke-width="1" opacity=".5"/>
  </g>`;
}
function calculator(id) {
  const q=[[33,58],[96,68],[88,111],[25,99]],keys=[];
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    const u=c*.25+.025,v=r*.25+.025,fill=c===3?`url(#${id}-brass)`:r===3&&c===2?`url(#${id}-wine)`:`url(#${id}-ivory)`;
    keys.push(polygon(q,u,v+.045,.19,.17,'#0f2c31'));
    keys.push(polygon(q,u,v,.19,.17,fill,'stroke="#e9eddf" stroke-width=".35" stroke-opacity=".55"'));
    const p=point(q,u+.04,v+.035),e=point(q,u+.15,v+.035);
    keys.push(`<path d="M${p.map(n).join(' ')}L${e.map(n).join(' ')}" stroke="#fffef4" stroke-width=".65" opacity=".7"/>`);
  }
  return `${floor(id)}<g filter="url(#${id}-shadow)">
  <path d="M34 8L105 20Q112 22 110 30L96 117Q95 124 87 123L17 110Q11 109 13 101L26 16Q27 9 34 8Z" fill="url(#${id}-dark)"/>
  <path d="M33 6L103 18Q109 19 108 27L94 113Q93 120 86 119L16 106Q10 105 12 97L25 14Q26 7 33 6Z" fill="url(#${id}-brass)"/>
  <path d="M34 10L102 22Q105 23 104 29L91 111Q90 115 85 114L18 102Q15 101 16 96L29 16Q29 11 34 10Z" fill="url(#${id}-dark)"/>
  <path d="M35 15L99 26L95 56L30 45Z" fill="#102b31"/>
  <path d="M38 20L95 30L92 50L34 40Z" fill="url(#${id}-glass)" stroke="#c5dfc7" stroke-width=".6"/>
  <path d="M38 20L95 30L94 35L37 26Z" fill="#f4fff1" opacity=".3"/>
  <g fill="none" stroke="#2d584a" stroke-width="2.2" stroke-linecap="round" transform="matrix(1 .17 -.16 1 65 27)"><path d="M0 0H8V6H1M8 6V12H0M14 0V12"/></g>
  <path d="M34 50L94 60" stroke="#779a8b" stroke-width=".9" opacity=".8"/>
  ${keys.join('')}
  <path d="M29 14L16 97" stroke="#e6f0d8" stroke-width="1" opacity=".7"/>
  <path d="M100 24L87 110" stroke="#6b8c7d" stroke-width=".8"/>
  </g>`;
}
function tools(id) {
  const ticks=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r=i%3===0?15:16.5;return `<path d="M${n(90+Math.sin(a)*r)} ${n(91-Math.cos(a)*r)}L${n(90+Math.sin(a)*18)} ${n(91-Math.cos(a)*18)}" stroke="#788f82" stroke-width="${i%3===0?1.5:.85}"/>`;}).join('');
  return `${floor(id)}<g filter="url(#${id}-shadow)">
  <path d="M57 24L106 17L111 85L62 94Z" fill="#8a774e"/><path d="M55 20L104 13L109 81L60 89Z" fill="url(#${id}-brass)"/><path d="M59 24L101 18L105 78L63 84Z" fill="url(#${id}-paper)"/>
  <path d="M70 17L87 14L87 24L71 27Z" fill="url(#${id}-metal)" stroke="#769084" stroke-width=".5"/>
  <path d="M68 39L95 35M69 48L96 44M70 57L97 53M71 66L92 63" stroke="#c4bcaa" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M24 17L31 15L48 74L41 77Z" fill="url(#${id}-brass)"/><path d="M24 17L25 7L31 15Z" fill="#d7bd93"/><path d="M25 7L24.7 11L27 10Z" fill="#4a3e3f"/>
  <path d="M44 10L51 11L48 78L40 77Z" fill="url(#${id}-jade)"/><path d="M44 10L51 11L51 19L44 18Z" fill="url(#${id}-metal)"/>
  <path d="M21 64Q21 58 40 58Q59 58 59 64L55 108Q54 115 39 115Q24 114 24 107Z" fill="url(#${id}-wine)"/>
  <ellipse cx="40" cy="64" rx="19" ry="6" fill="#ba7890"/><ellipse cx="40" cy="64" rx="15" ry="3.5" fill="#572f40"/>
  <path d="M27 69L30 105Q30 109 35 110" fill="none" stroke="#d59aaf" stroke-width="2.8" opacity=".6"/>
  <path d="M54 69L50 108" stroke="#4c1931" stroke-width="2" opacity=".5"/>
  <path d="M65 111L72 108L78 116L69 119Z" fill="url(#${id}-brass)"/>
  <path d="M102 110L108 113L107 118L98 117Z" fill="url(#${id}-brass)"/>
  <circle cx="92" cy="93" r="25" fill="#345556"/><circle cx="90" cy="90" r="25" fill="url(#${id}-brass)"/><circle cx="90" cy="90" r="21.6" fill="url(#${id}-dial)" stroke="#f8f8e8" stroke-width=".8"/>
  ${ticks}<path d="M90 91L80 84M90 91L98 78" fill="none" stroke="#344e4e" stroke-width="2.4" stroke-linecap="round"/><path d="M85 82L98 103" stroke="#9c3e5a" stroke-width=".8"/><circle cx="90" cy="91" r="2.2" fill="url(#${id}-wine)"/>
  <path d="M73 79Q82 69 96 74" fill="none" stroke="#fff" stroke-width="2.3" opacity=".55" stroke-linecap="round"/>
  </g>`;
}

fs.mkdirSync(out,{recursive:true});
const manifest=[];
for(const [key,draw] of Object.entries({print:printer,work,calculator,tools})) {
  const id='nav-'+key;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${labels[key]}</title><desc id="${id}-desc">Kalendārs365 oriģināla telpiska vektoru ilustrācija ar slāņotām virsmām, materiālu atspīdumiem un ēnu.</desc>${surface(id)}${draw(id)}</svg>\n`;
  if(/<(?:image|foreignObject|script)\b|\b(?:NaN|Infinity|undefined)\b/.test(svg))throw Error('Invalid vector '+key);
  const file=`${out}/${key}.svg`;fs.writeFileSync(file,svg);
  manifest.push({id:key,label:labels[key],file:'/'+file,bytes:Buffer.byteLength(svg),sha256:crypto.createHash('sha256').update(svg).digest('hex'),kind:'original-layered-vector'});
}
fs.writeFileSync('_data/nav-tool-art.json',JSON.stringify({version:1,viewBox:[0,0,128,128],artworks:manifest},null,2)+'\n');
console.log(JSON.stringify({artworks:manifest.length,bytes:manifest.reduce((n,a)=>n+a.bytes,0)}));
