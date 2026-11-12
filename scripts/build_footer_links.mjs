import fs from 'node:fs';
import crypto from 'node:crypto';

// Original, tightly framed vectors. Their silhouettes remain readable at 38 px.
const out='assets/footer-links';
const defs=`<defs>
<linearGradient id="paper" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="#fffef8"/><stop offset=".65" stop-color="#f5efdf"/><stop offset="1" stop-color="#d3c5ab"/></linearGradient>
<linearGradient id="wine" x1="0" y1="0" x2="1" y2=".9"><stop stop-color="#c2748c"/><stop offset=".3" stop-color="#a04c69"/><stop offset=".7" stop-color="#7e2d4a"/><stop offset="1" stop-color="#4f182f"/></linearGradient>
<linearGradient id="teal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b7e0cc"/><stop offset=".25" stop-color="#79baa9"/><stop offset=".7" stop-color="#388578"/><stop offset="1" stop-color="#20514c"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2=".65"><stop stop-color="#fff3c2"/><stop offset=".2" stop-color="#e3c382"/><stop offset=".48" stop-color="#f7e2aa"/><stop offset=".73" stop-color="#bc9353"/><stop offset="1" stop-color="#846238"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fbfff9"/><stop offset=".26" stop-color="#a6bcb4"/><stop offset=".48" stop-color="#eff7e8"/><stop offset="1" stop-color="#526f68"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffef7" stop-opacity=".88"/><stop offset=".48" stop-color="#c6e5db" stop-opacity=".3"/><stop offset="1" stop-color="#6baca7" stop-opacity=".65"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#9fc5cc"/><stop offset="1" stop-color="#dce6d4"/></linearGradient>
<radialGradient id="dial" cx=".3" cy=".2" r=".85"><stop stop-color="#fffff7"/><stop offset=".7" stop-color="#efe9d5"/><stop offset="1" stop-color="#bcb89d"/></radialGradient>
<filter id="shade" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.1" flood-color="#482739" flood-opacity=".21"/></filter>
<filter id="blur" x="-30%" y="-150%" width="160%" height="400%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>`;
const floor='<ellipse cx="64" cy="117" rx="46" ry="4" fill="#5a3441" opacity=".18" filter="url(#blur)"/>';
const art={
planning:`<g filter="url(#shade)">
  <path d="M24 23L88 14L98 100L33 111Z" fill="#49253a"/><path d="M20 20L85 11L95 97L30 108Z" fill="url(#gold)"/>
  <path d="M23 23L82 15L91 95L32 104Z" fill="url(#paper)"/><path d="M23 23L82 15L85 36L25 43Z" fill="url(#wine)"/>
  <path d="M28 25L78 18" stroke="#efb4c6" stroke-width="1.2" opacity=".75"/>
  <path d="M29 46L84 39M31 97L87 90" stroke="#c5b79d" stroke-width=".8"/>
  <g fill="#c5bdab"><path d="M33 52L42 51L43 60L34 61ZM49 50L58 49L59 58L50 59ZM65 48L74 47L75 56L66 57ZM35 68L44 67L45 76L36 77ZM67 64L76 63L77 72L68 73ZM37 84L46 83L47 92L38 93ZM53 82L62 81L63 90L54 91Z"/></g>
  <path d="M50 64L61 63L63 75L52 77Z" fill="url(#wine)"/><path d="m54 70 2 2 3-4" stroke="#fff4db" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <g stroke="#563840" stroke-width="6" fill="none" stroke-linecap="round"><path d="M36 29L35 16Q35 6 40 7Q44 8 44 16L45 22M67 24L66 12Q66 2 71 3Q75 4 75 12L76 17"/></g>
  <g stroke="url(#metal)" stroke-width="3.6" fill="none" stroke-linecap="round"><path d="M35 29L34 16Q34 6 39 7Q43 8 43 16L44 22M66 24L65 12Q65 2 70 3Q74 4 74 12L75 17"/></g>
  <circle cx="94" cy="91" r="27" fill="#482635"/><circle cx="92" cy="88" r="27" fill="url(#gold)"/><circle cx="92" cy="88" r="23" fill="url(#dial)"/>
  <path d="M92 67V71M92 105V109M71 88H75M109 88H113M77 73L80 76M104 100L107 103" stroke="#948965" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M92 88L82 80M92 88L103 76" stroke="#446f63" stroke-width="3" stroke-linecap="round"/><circle cx="92" cy="88" r="3.1" fill="url(#wine)"/>
  <path d="M76 77Q82 67 96 69" stroke="#fffef7" stroke-width="2" stroke-linecap="round" fill="none" opacity=".8"/>
</g>`,
about:`<g filter="url(#shade)">
  <path d="M25 16L95 8L106 105L34 117Z" fill="#4c2035"/><path d="M23 12L92 5L103 102L31 112Z" fill="url(#wine)"/>
  <path d="M32 15L89 9L99 96L41 104Z" fill="url(#paper)"/><path d="M38 102L97 94L98 102L39 111Z" fill="#b7aa91"/><path d="M40 104L96 97M40 108L96 101" stroke="#eee7d4" stroke-width="1.2"/>
  <path d="M24 12L79 6L89 95L32 104Z" fill="url(#wine)" stroke="#d095a5" stroke-width=".75"/>
  <path d="M32 18L72 14L80 86L41 93Z" fill="none" stroke="url(#gold)" stroke-width="1"/>
  <path d="M29 16L38 99M30 16L39 98" stroke="#e4a2b4" stroke-width=".65" opacity=".65"/>
  <path d="M45 35L68 33L71 60L48 63Z" fill="none" stroke="url(#gold)" stroke-width="2"/><path d="M45 43L69 40M51 31L52 37M62 30L63 36" stroke="url(#gold)" stroke-width="2" stroke-linecap="round"/>
  <path d="M51 49L55 48L55 52L52 53ZM60 48L64 47L64 51L60 52ZM53 57L57 56L57 60L53 61Z" fill="#eed7a0"/>
  <path d="M78 9L88 8L95 77L90 73L86 80Z" fill="url(#gold)"/>
</g>`,
blog:`<g filter="url(#shade)">
  <path d="M14 35L62 28L108 35L112 104L63 113L14 104Z" fill="#56253b"/><path d="M13 30L62 22L108 29L110 99L62 108L13 99Z" fill="url(#wine)"/>
  <path d="M17 21Q39 18 61 27Q83 15 105 18L108 94Q83 91 62 103Q41 94 16 95Z" fill="url(#paper)" stroke="#fffcef" stroke-width="1.2"/>
  <path d="M61 27Q83 15 105 18L108 94Q83 91 62 103Z" fill="#e4d9bf"/><path d="M61 27L62 103" stroke="#b6a68b"/>
  <path d="M24 39Q39 38 53 44M24 50Q40 50 54 55M24 61Q40 61 54 66M24 73Q40 73 54 78M72 40Q86 34 99 35M72 51Q86 45 99 46M72 62Q86 56 99 57" fill="none" stroke="#bdaf94" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M79 107L108 40Q110 35 115 37L121 40Q125 42 123 47L94 113L82 121Z" fill="#203f40"/><path d="M77 104L105 38Q108 33 113 35L119 38Q123 40 121 45L92 111L80 119Z" fill="url(#teal)"/>
  <path d="M105 38L121 45M102 45L118 52" stroke="url(#gold)" stroke-width="3"/><path d="M77 104L92 111L80 119Z" fill="url(#gold)"/><path d="M78 113L80 119L84 116Z" fill="#443b37"/>
  <path d="M108 43L83 103" stroke="#d0e9d6" stroke-width="1.1" opacity=".8"/>
</g>`,
sources:`<g filter="url(#shade)">
  <path d="M12 26L59 18L100 25L101 99L60 111L13 102Z" fill="#4e2337"/><path d="M10 22L58 14L98 21L99 95L59 107L11 98Z" fill="url(#wine)"/>
  <path d="M14 14Q37 12 57 22Q76 10 95 13L97 89Q77 87 58 101Q36 91 14 92Z" fill="url(#paper)" stroke="#fffdf3"/>
  <path d="M57 22Q76 10 95 13L97 89Q77 87 58 101Z" fill="#e7dbc1"/><path d="M57 22L58 101" stroke="#bda98a"/>
  <path d="M22 35L47 40M22 47L48 52M22 59L48 64M22 71L48 76M65 34L87 27M66 46L87 39" stroke="#b2a58b" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M91 93L116 118" stroke="#213f40" stroke-width="13" stroke-linecap="round"/><path d="M88 89L113 114" stroke="url(#teal)" stroke-width="12" stroke-linecap="round"/>
  <path d="M93 94L111 112" stroke="#9accb8" stroke-width="2" stroke-linecap="round"/>
  <circle cx="80" cy="76" r="27" fill="#80623f"/><circle cx="78" cy="73" r="27" fill="url(#gold)"/><circle cx="78" cy="73" r="21" fill="url(#glass)" stroke="#fff2cb"/>
  <path d="M66 63Q76 53 88 63M64 67L67 64" stroke="#ffffef" stroke-width="2.7" fill="none" stroke-linecap="round" opacity=".85"/>
  <path d="m68 75 7 7 14-19" stroke="#3c7867" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</g>`,
photos:`<g filter="url(#shade)">
  <path d="M27 8L116 26L99 108L12 90Z" fill="#6a3847"/><path d="M24 5L112 23L96 104L8 87Z" fill="url(#wine)"/>
  <path d="M14 24L108 15L117 105L23 116Z" fill="#c1ad8d"/><path d="M10 20L104 11L113 101L19 112Z" fill="url(#paper)" stroke="#fffdf4" stroke-width="1.2"/>
  <path d="M20 30L96 23L102 83L26 92Z" fill="url(#sky)"/><circle cx="77" cy="43" r="10" fill="url(#gold)"/>
  <path d="M24 73L46 45L70 69L81 55L101 80L102 83L26 92Z" fill="#467d73"/><path d="M46 45L36 58L45 55L50 59L53 54Z" fill="#f3f2de"/><path d="M51 68L67 51L101 80L102 83L26 92Z" fill="url(#teal)"/>
  <path d="M25 97L66 93" stroke="#baaa90" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="21" fill="#4b2539"/><circle cx="98" cy="97" r="21" fill="url(#gold)"/><circle cx="98" cy="97" r="16.3" fill="url(#wine)"/>
  <path d="M104 89a10 10 0 1 0 0 16" fill="none" stroke="#fff1cb" stroke-width="2.8" stroke-linecap="round"/>
</g>`,
faq:`<g filter="url(#shade)">
  <path d="M51 52H107Q120 52 120 65V96Q120 108 107 108H101L84 122V108H51Q39 108 39 96V65Q39 52 51 52Z" fill="#847654"/>
  <path d="M48 48H104Q117 48 117 61V92Q117 104 104 104H98L81 118V104H48Q36 104 36 92V61Q36 48 48 48Z" fill="url(#paper)" stroke="#fffcef"/>
  <path d="m71 83 10 9 18-24" fill="none" stroke="url(#teal)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M23 13H83Q97 13 97 27V67Q97 81 83 81H56L36 98V81H23Q9 81 9 67V27Q9 13 23 13Z" fill="#4b192e"/>
  <path d="M20 9H80Q94 9 94 23V63Q94 77 80 77H53L33 94V77H20Q6 77 6 63V23Q6 9 20 9Z" fill="url(#wine)" stroke="#c68299" stroke-width=".9"/>
  <path d="M20 14H78" stroke="#f0bdcc" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
  <path d="M39 34Q40 22 53 24Q66 25 65 36Q64 43 55 47Q50 49 50 56" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="66" r="3.5" fill="#f5dda3"/>
</g>`,
contact:`<g filter="url(#shade)">
  <path d="M12 48L65 15L118 48V105L65 116L12 105Z" fill="#4a1b31"/><path d="M9 44L62 11L115 44V101L62 112L9 101Z" fill="url(#wine)"/>
  <path d="M24 13L93 7L99 76L29 85Z" fill="url(#paper)" stroke="#fffdf0"/>
  <path d="M36 30L76 26M37 41L86 37M38 52L78 48" stroke="#baa98b" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M9 44L62 76L115 44V101L62 112L9 101Z" fill="url(#paper)" stroke="#f8efdf"/>
  <path d="M9 101L49 67L62 76L76 67L115 101L62 112Z" fill="url(#wine)"/>
  <path d="M9 101L49 67M76 67L115 101" stroke="#c48799" stroke-width="1.2"/><path d="M9 44L62 76L115 44" stroke="#c2af91" stroke-width="1.8" fill="none"/>
  <path d="M13 101L62 111L111 101" stroke="#e0a0af" stroke-width=".9" fill="none" opacity=".75"/>
  <circle cx="63" cy="91" r="14" fill="#5d273b"/><circle cx="62" cy="88" r="14" fill="url(#gold)"/><circle cx="62" cy="88" r="10.5" fill="url(#wine)"/>
  <path d="m57 88 3 3 6-7" stroke="#fff4cd" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</g>`
};
fs.mkdirSync(out,{recursive:true});
const manifest={kind:'original-layered-vector',viewBox:[0,0,128,128],icons:[]};
for(const [name,body] of Object.entries(art)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none">${defs}${floor}${body}</svg>\n`;
  const path=`${out}/${name}.svg`;fs.writeFileSync(path,svg);
  manifest.icons.push({name,path:`/${path}`,bytes:Buffer.byteLength(svg),sha256:crypto.createHash('sha256').update(svg).digest('hex')});
}
fs.writeFileSync('_data/footer-link-art.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({icons:manifest.icons.length,bytes:manifest.icons.reduce((sum,x)=>sum+x.bytes,0)}));
