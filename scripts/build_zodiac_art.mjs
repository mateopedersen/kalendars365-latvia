import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const profiles = JSON.parse(await readFile(join(root, '_data/horoscope/profiles.json'), 'utf8')).profiles;
const palettes = {
  fire: {light:'#ffd89b', mid:'#c85c42', deep:'#601d36', glow:'#ffe8b8'},
  earth:{light:'#e6e0a3', mid:'#7a8952', deep:'#2d4238', glow:'#f5ecc1'},
  air:  {light:'#d7eef1', mid:'#6e8da2', deep:'#293f5b', glow:'#e8f7f6'},
  water:{light:'#c8e9dc', mid:'#438a91', deep:'#234758', glow:'#e2fff1'},
};

// Individually drawn zodiac marks and star arrangements. No emoji or external icon font.
const drawings = {
  auns:       {path:'M39 49 C39 39 44 32 51 32 C58 32 62 43 64 52 C66 43 70 32 77 32 C84 32 89 39 89 49 M64 48 V88', stars:[[35,73],[45,63],[55,78],[80,69],[89,83]]},
  versis:     {path:'M42 49 C42 37 51 31 64 31 C77 31 86 37 86 49 M45 68 A19 19 0 1 0 83 68 A19 19 0 1 0 45 68 M64 49 V88', stars:[[36,65],[45,78],[53,55],[77,57],[90,70]]},
  dvini:      {path:'M43 35 V87 M85 35 V87 M43 43 H85 M43 79 H85', stars:[[35,58],[50,67],[58,50],[76,62],[92,49]]},
  vezis:      {path:'M43 42 C43 32 55 30 62 38 C69 46 62 54 54 59 C46 64 42 70 43 80 C44 90 57 91 63 83 C69 75 63 67 55 62 M85 42 C85 32 73 30 66 38 C59 46 66 54 74 59 C82 64 86 70 85 80 C84 90 71 91 65 83 C59 75 65 67 73 62', stars:[[36,45],[47,62],[60,73],[79,51],[88,70]]},
  lauva:      {path:'M52 50 A12 12 0 1 0 52 49 M52 61 C64 61 69 55 77 45 C83 38 91 41 89 49 C87 58 75 63 70 69 C64 77 67 86 77 86 C86 86 91 79 89 72', stars:[[36,58],[46,43],[57,71],[75,54],[89,78]]},
  jaunava:    {path:'M43 86 V37 L64 74 L85 37 V86 M85 86 C85 94 77 96 71 90', stars:[[36,49],[49,67],[64,50],[79,72],[91,54]]},
  svari:      {path:'M64 34 V81 M43 50 H85 M49 50 L40 68 H58 Z M79 50 L70 68 H88 Z M45 88 H83', stars:[[35,65],[52,45],[64,60],[78,44],[91,66]]},
  skorpions:  {path:'M40 38 V83 M40 58 C49 48 57 50 62 60 V83 M62 60 C70 49 78 50 83 60 V83 M83 83 C83 91 90 92 94 86 L88 80', stars:[[35,72],[48,43],[58,71],[73,45],[91,66]]},
  strelnieks: {path:'M39 82 L88 34 M62 34 H88 V60 M44 38 L84 78', stars:[[37,51],[53,69],[66,47],[78,61],[92,42]]},
  mezazis:    {path:'M41 48 C43 39 51 35 61 38 C73 42 77 54 73 68 C70 80 61 87 52 83 C44 80 44 68 51 63 C58 58 68 60 77 69 C84 77 85 87 78 90', stars:[[36,63],[48,47],[58,76],[74,51],[90,70]]},
  udensvirs:  {path:'M38 48 C46 39 54 57 62 48 C70 39 78 57 88 48 M38 73 C46 64 54 82 62 73 C70 64 78 82 88 73', stars:[[35,60],[48,45],[58,65],[76,53],[91,81]]},
  zivis:      {path:'M42 38 C53 46 53 78 42 86 M86 38 C75 46 75 78 86 86 M39 62 H89', stars:[[35,48],[49,60],[60,44],[78,66],[91,51]]},
};

const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const star = ([x,y],index) => `<g transform="translate(${x} ${y})" opacity="${index%2 ? '.72' : '.96'}"><path d="M0 -3.2V3.2M-3.2 0H3.2" stroke="#fff2cb" stroke-width=".8" stroke-linecap="round"/><circle r="1.35" fill="#fff8dc"/><circle r="3.7" fill="#fff8dc" opacity=".12"/></g>`;
const ticks = Array.from({length:48},(_,i)=>{
  const angle=(i*7.5-90)*Math.PI/180, r1=i%4===0?43:45, r2=47;
  const x1=(64+Math.cos(angle)*r1).toFixed(2),y1=(59+Math.sin(angle)*r1).toFixed(2);
  const x2=(64+Math.cos(angle)*r2).toFixed(2),y2=(59+Math.sin(angle)*r2).toFixed(2);
  return `<path d="M${x1} ${y1}L${x2} ${y2}"/>`;
}).join('');

function render(profile) {
  const palette=palettes[profile.element.key]||palettes.air;
  const drawing=drawings[profile.slug];
  if (!drawing) throw new Error(`Missing original vector drawing: ${profile.slug}`);
  const id=`seal-${profile.slug}`;
  const title=`${profile.name} — zīmes reljefs un zvaigžņu raksts`;
  const stars=drawing.stars.map(star).join('');
  const line=drawing.stars.map(([x,y])=>`${x},${y}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${escapeXml(title)}</title><desc id="${id}-desc">Ar rokām zīmēts zodiaka reljefs uz gaismota, metāliska debess medaljona.</desc><defs><radialGradient id="${id}-sky" cx=".28" cy=".17" r=".92"><stop stop-color="${palette.light}"/><stop offset=".38" stop-color="${palette.mid}"/><stop offset="1" stop-color="${palette.deep}"/></radialGradient><linearGradient id="${id}-rim" x1=".05" y1=".02" x2=".9" y2="1"><stop stop-color="#fff4d5"/><stop offset=".19" stop-color="#dfb873"/><stop offset=".42" stop-color="#fff0bf"/><stop offset=".67" stop-color="#9e704a"/><stop offset=".86" stop-color="#f4d99b"/><stop offset="1" stop-color="#704437"/></linearGradient><linearGradient id="${id}-glyph" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff9de"/><stop offset=".48" stop-color="#e4c783"/><stop offset="1" stop-color="#fff2c5"/></linearGradient><radialGradient id="${id}-shine" cx=".24" cy=".04" r=".92"><stop stop-color="#fff" stop-opacity=".55"/><stop offset=".52" stop-color="#fff" stop-opacity=".11"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="${id}-shadow" x="-.35" y="-.3" width="1.7" height="1.8"><feGaussianBlur stdDeviation="3.2"/></filter><clipPath id="${id}-clip"><circle cx="64" cy="59" r="39"/></clipPath></defs><ellipse cx="66" cy="119" rx="37" ry="5" fill="#1d1721" opacity=".3" filter="url(#${id}-shadow)"/><circle cx="64" cy="63" r="54" fill="#171721" opacity=".62"/><circle cx="64" cy="59" r="54" fill="url(#${id}-rim)"/><circle cx="64" cy="59" r="49.5" fill="${palette.deep}" stroke="#fff6db" stroke-opacity=".67" stroke-width="1.2"/><circle cx="64" cy="59" r="46" fill="url(#${id}-sky)" stroke="#f5d99a" stroke-width="1.25"/><circle cx="64" cy="59" r="41.5" fill="none" stroke="#fff3c9" stroke-opacity=".43" stroke-width=".7"/><g fill="none" stroke="#f4dca9" stroke-width=".7" stroke-opacity=".8" stroke-linecap="round">${ticks}</g><g clip-path="url(#${id}-clip)"><path d="M20 81 Q64 51 108 81" fill="none" stroke="#fff5d6" stroke-opacity=".18" stroke-width=".7"/><path d="M28 39 Q64 15 100 39" fill="none" stroke="#fff5d6" stroke-opacity=".15" stroke-width=".7"/><polyline points="${line}" fill="none" stroke="#fff0c5" stroke-opacity=".42" stroke-width=".8" stroke-dasharray="1.8 2.3"/>${stars}<path d="${drawing.path}" transform="translate(0 2.3)" fill="none" stroke="#3c2735" stroke-opacity=".8" stroke-width="7.3" stroke-linecap="round" stroke-linejoin="round"/><path d="${drawing.path}" fill="none" stroke="url(#${id}-glyph)" stroke-width="5.3" stroke-linecap="round" stroke-linejoin="round"/><path d="${drawing.path}" transform="translate(-.65 -1)" fill="none" stroke="#fffbe7" stroke-opacity=".76" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="59" r="43" fill="url(#${id}-shine)"/></g><path d="M25 44C32 20 56 10 78 13" fill="none" stroke="#fffdf1" stroke-opacity=".76" stroke-width="1.5" stroke-linecap="round"/><path d="M34 101C50 108 77 107 92 96" fill="none" stroke="#fff4ce" stroke-opacity=".56" stroke-width="1.2" stroke-linecap="round"/><circle cx="33" cy="33" r="1.3" fill="#fff7db"/><circle cx="94" cy="31" r="1" fill="#fff7db" opacity=".85"/><circle cx="99" cy="81" r="1.15" fill="#fff7db" opacity=".72"/></svg>`;
}

const output=join(root,'assets','zodiac');
await mkdir(output,{recursive:true});
const versions={};
for (const profile of profiles) {const svg=render(profile);await writeFile(join(output,`${profile.slug}.svg`),svg);versions[profile.slug]=createHash('sha256').update(svg).digest('hex').slice(0,16);}
await writeFile(join(root,'lib','zodiac-versions.mjs'),'export const zodiacVersions = '+JSON.stringify(versions)+';\n');
console.log(`Built ${profiles.length} original zodiac medallions.`);
